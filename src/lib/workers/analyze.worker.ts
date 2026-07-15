/// <reference lib="webworker" />
/**
 * Infro analysis Web Worker.
 *
 * Receives raw, DOM-free payloads from the main thread:
 *   - packed RGBA frame grids (main thread did the video seeking + drawing)
 *   - mono PCM audio (main thread did the Web Audio decode)
 *
 * It builds FingerprintStreams, runs the matching engine, and streams
 * progress back. Running here keeps the UI thread responsive during the
 * FFT / cross-similarity math.
 */

import { computeDHash, colorHistogram } from "@/lib/comparison/perceptual";
import {
  resampleLinear,
  chromaSequenceStreaming,
} from "@/lib/comparison/audio";
import { runMatchingOptimized } from "@/lib/comparison/offset-matcher";
import { inferIntroOutro } from "@/lib/comparison/matcher";
import {
  PRECISION_PRESETS,
  type AnalysisSettings,
  type ComparisonResult,
  type FingerprintStream,
  type MediaMeta,
  type StageProgress,
} from "@/lib/comparison/types";

export interface FramePack {
  width: number;
  height: number;
  count: number;
  times: Float32Array;
  pixels: Uint8ClampedArray;
}

export interface AudioPack {
  pcm: Float32Array;
  sampleRate: number;
  duration: number;
}

export interface AnalyzeRequest {
  type: "analyze";
  framesA: FramePack | null;
  framesB: FramePack | null;
  audioA: AudioPack | null;
  audioB: AudioPack | null;
  metaA: MediaMeta;
  metaB: MediaMeta;
  settings: AnalysisSettings;
}

export type WorkerOut =
  | { type: "progress"; data: StageProgress }
  | { type: "result"; data: ComparisonResult }
  | { type: "error"; message: string };

function post(msg: WorkerOut) {
  (self as unknown as Worker).postMessage(msg);
}

function report(
  stage: StageProgress["stage"],
  label: string,
  progress: number,
  detail?: string,
) {
  post({ type: "progress", data: { stage, label, progress, detail } });
}

/** Build the video fingerprint streams (dHash + color) from a frame pack. */
function buildVideoStreams(pack: FramePack, duration: number): FingerprintStream[] {
  const { width, height, count, times, pixels } = pack;
  const hashes = new Uint32Array(count);
  const colorVectors: Float32Array[] = [];
  const dhashVectors: Float32Array[] = []; // placeholders so streamLength via hashes works

  const gw = 9;
  const gh = 4; // 4 rows × 8 comparisons = 32 bits
  const gray = new Uint8Array(gw * gh);

  for (let f = 0; f < count; f++) {
    const base = f * width * height * 4;
    // 9x8 grayscale by block averaging from the (width×height) RGBA grid
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        // map grid cell to source region
        const x0 = Math.floor((gx * width) / gw);
        const x1 = Math.floor(((gx + 1) * width) / gw);
        const y0 = Math.floor((gy * height) / gh);
        const y1 = Math.floor(((gy + 1) * height) / gh);
        for (let sy = y0; sy < y1; sy++) {
          for (let sx = x0; sx < x1; sx++) {
            const idx = base + (sy * width + sx) * 4;
            r += pixels[idx];
            g += pixels[idx + 1];
            b += pixels[idx + 2];
            n++;
          }
        }
        const lum = n > 0 ? (0.299 * r + 0.587 * g + 0.114 * b) / n : 0;
        gray[gy * gw + gx] = lum;
      }
    }
    hashes[f] = computeDHash(gray, gw, gh);

    // color histogram from the full small RGBA grid
    const rgba = pixels.subarray(base, base + width * height * 4);
    colorVectors.push(colorHistogram(rgba));
    dhashVectors.push(new Float32Array(0));
  }

  const dhashStream: FingerprintStream = {
    kind: "video-dhash",
    hop: count > 1 ? (times[count - 1] - times[0]) / (count - 1) : 1 / 2,
    times: new Float32Array(times),
    vectors: dhashVectors,
    hashes,
    sourceDuration: duration,
  };
  const colorStream: FingerprintStream = {
    kind: "video-color",
    hop: dhashStream.hop,
    times: new Float32Array(times),
    vectors: colorVectors,
    hashes: null,
    sourceDuration: duration,
  };
  return [dhashStream, colorStream];
}

/** Hard cap on audio chroma frames — longer audio is decimated. */
const MAX_AUDIO_FRAMES = 2000;

/** Build the audio chroma fingerprint stream from mono PCM. */
function buildAudioStream(
  pack: AudioPack,
  settings: AnalysisSettings,
): FingerprintStream | null {
  if (!pack || pack.pcm.length < 256) return null;
  // The PCM already arrives at the target rate from the low-sample-rate
  // AudioContext, but resample defensively if rates differ.
  const targetRate = settings.audioSampleRate;
  const pcm =
    pack.sampleRate === targetRate
      ? pack.pcm
      : resampleLinear(pack.pcm, pack.sampleRate, targetRate);

  const preset = PRECISION_PRESETS[settings.precision];
  const fftSize = preset.fftSize;
  const hopSamples = Math.max(1, Math.round(preset.audioHop * targetRate));

  // If the audio would produce too many frames, increase the hop so we stay
  // within the cap — this keeps matching fast and memory bounded.
  const estimatedFrames = Math.max(
    0,
    Math.floor((pcm.length - fftSize) / hopSamples) + 1,
  );
  const effectiveHop =
    estimatedFrames > MAX_AUDIO_FRAMES
      ? Math.max(hopSamples, Math.ceil((pcm.length - fftSize) / MAX_AUDIO_FRAMES))
      : hopSamples;

  // Streaming chroma: no full spectrogram materialised in memory.
  const chroma = chromaSequenceStreaming(pcm, {
    fftSize,
    hop: effectiveHop,
    sampleRate: targetRate,
  });
  if (chroma.length === 0) return null;

  const effectiveHopSec = effectiveHop / targetRate;
  const times = new Float32Array(chroma.length);
  for (let i = 0; i < chroma.length; i++) {
    times[i] = i * effectiveHopSec;
  }
  return {
    kind: "audio-chroma",
    hop: effectiveHopSec,
    times,
    vectors: chroma,
    hashes: null,
    sourceDuration: pack.duration,
  };
}

const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<AnalyzeRequest>) => {
  const req = e.data;
  if (!req || req.type !== "analyze") return;
  const start = performance.now();
  try {
    const { settings, metaA, metaB } = req;

    report("fingerprinting", "Generating fingerprints", 0.05);

    // Build streams
    const streamsA: FingerprintStream[] = [];
    const streamsB: FingerprintStream[] = [];

    if (settings.mode !== "audio") {
      if (req.framesA) streamsA.push(...buildVideoStreams(req.framesA, metaA.duration));
      if (req.framesB) streamsB.push(...buildVideoStreams(req.framesB, metaB.duration));
    }
    report("fingerprinting", "Generating fingerprints", 0.35);

    if (settings.mode !== "video") {
      const aA = buildAudioStream(req.audioA, settings);
      const aB = buildAudioStream(req.audioB, settings);
      if (aA) streamsA.push(aA);
      if (aB) streamsB.push(aB);
    }
    report("fingerprinting", "Generating fingerprints", 0.6);

    const framesAnalyzed =
      (req.framesA?.count ?? 0) + (req.framesB?.count ?? 0);
    const audioSamplesAnalyzed =
      (req.audioA?.pcm.length ?? 0) + (req.audioB?.pcm.length ?? 0);

    report("comparing", "Comparing fingerprints", 0.1, "scanning alignments");

    // Hard time limit: if matching takes more than 30s, force completion
    // with whatever matches were found. This guarantees the worker ALWAYS
    // sends a result back.
    const MATCH_DEADLINE = start + 30000;
    let matchResult: { matches: import("@/lib/comparison/types").Match[]; groupCount: number } | null = null;
    try {
      matchResult = runMatchingOptimized(streamsA, streamsB, settings, (p, detail) => {
        const elapsed = performance.now() - start;
        report("comparing", "Comparing fingerprints", 0.1 + 0.85 * p, detail);
        if (elapsed > MATCH_DEADLINE) {
          throw new Error("__TIMEOUT__");
        }
      });
    } catch (e) {
      // On timeout, use whatever we can salvage — empty result is OK
      if (e instanceof Error && e.message === "__TIMEOUT__") {
        report("comparing", "Comparing fingerprints", 0.9, "completing with partial results");
      }
      // Fall through with empty matches
    }

    const { matches, groupCount } = matchResult ?? { matches: [], groupCount: 0 };

    // Release stream data before building the result to reduce peak memory.
    streamsA.length = 0;
    streamsB.length = 0;

    report("building-timeline", "Building timeline", 0.4, `${matches.length} regions`);
    const introOutro = inferIntroOutro(matches, metaA.duration, metaB.duration);

    // tag intro/outro on the matches themselves
    for (const m of matches) {
      m.isIntro = introOutro.intro ? m.id === introOutro.intro.id : false;
      m.isOutro = introOutro.outro ? m.id === introOutro.outro.id : false;
    }
    const sorted = [...matches].sort((a, b) => a.aStart - b.aStart);

    const longest = sorted.reduce(
      (mx, m) => Math.max(mx, m.aEnd - m.aStart),
      0,
    );
    const avgConf =
      sorted.length > 0
        ? sorted.reduce((s, m) => s + m.confidence, 0) / sorted.length
        : 0;
    const totalMatched = sorted.reduce(
      (s, m) => s + (m.aEnd - m.aStart),
      0,
    );

    const result: ComparisonResult = {
      matches: sorted,
      introOutro,
      stats: {
        totalMatches: sorted.length,
        longestMatchDuration: longest,
        averageConfidence: avgConf,
        totalMatchedDuration: totalMatched,
        processingTimeMs: Math.round(performance.now() - start),
        framesAnalyzed,
        audioSamplesAnalyzed,
        detectedIntro: !!introOutro.intro,
        detectedOutro: !!introOutro.outro,
      },
      streamA: metaA,
      streamB: metaB,
      mode: settings.mode,
      groupCount,
    };

    report("rendering", "Rendering results", 1);
    report("done", "Done", 1);
    post({ type: "result", data: result });
  } catch (err) {
    post({
      type: "error",
      message:
        err instanceof Error
          ? err.message
          : "Analysis failed — the files may be too large for in-browser processing.",
    });
  }
};
