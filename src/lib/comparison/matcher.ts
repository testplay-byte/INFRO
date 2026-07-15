/**
 * The Infro matching engine.
 *
 * Approach: every analysis technique is reduced to a `FingerprintStream`
 * — a time-stamped sequence of either 64-bit hashes (video) or feature
 * vectors (audio). Matching then becomes a generic "find diagonal runs of
 * high cross-similarity" problem:
 *
 *   For each time offset d (frame i in A aligns with frame i+d in B),
 *   walk the diagonal and compute per-frame similarity. A frame is
 *   considered "in match" when a trailing ~1s window exceeds the density
 *   threshold. Contiguous in-match frames (allowing small gaps) become a
 *   candidate `Match`, filtered by minimum duration.
 *
 * This naturally handles:
 *   - offset matches         (different diagonals d)
 *   - partial matches        (a run shorter than the source segment)
 *   - multiple matches       (several runs / diagonals)
 *   - long & short matches   (duration filter only removes too-short ones)
 *   - overlapping matches    (kept as separate matches, merged only when
 *                             they overlap heavily in BOTH videos)
 *
 * The engine is modular: new techniques only need to emit a
 * FingerprintStream to plug in.
 */

import type {
  FingerprintStream,
  Match,
  AnalysisSettings,
  IntroOutroResult,
} from "./types";
import { hashSimilarity, cosineSimilarity } from "./perceptual";

/** Hard cap on per-stream frame count — longer media is decimated. */
const MAX_FRAMES = 3600;

/** Frame count of a stream regardless of hash vs vector representation. */
export function streamLength(s: FingerprintStream): number {
  return s.hashes ? s.hashes.length : s.vectors.length;
}

/** Decimate a stream (and adjust hop) when it exceeds MAX_FRAMES. */
function maybeDecimate(stream: FingerprintStream): FingerprintStream {
  const n = streamLength(stream);
  if (n <= MAX_FRAMES) return stream;
  const step = Math.ceil(n / MAX_FRAMES);
  const vectors: Float32Array[] = [];
  const times: number[] = [];
  let hashes: BigInt64Array | null = null;
  if (stream.hashes) {
    const arr: bigint[] = [];
    for (let i = 0; i < n; i += step) {
      vectors.push(stream.vectors[i]);
      times.push(stream.times[i]);
      arr.push(stream.hashes[i]);
    }
    hashes = BigInt64Array.from(arr);
  } else {
    for (let i = 0; i < n; i += step) {
      vectors.push(stream.vectors[i]);
      times.push(stream.times[i]);
    }
  }
  return {
    ...stream,
    hop: stream.hop * step,
    times: new Float32Array(times),
    vectors,
    hashes,
  };
}

/** Per-frame similarity dispatch based on stream kind. */
function pairSimilarity(
  A: FingerprintStream,
  i: number,
  B: FingerprintStream,
  j: number,
): number {
  if (A.hashes && B.hashes) {
    return hashSimilarity(A.hashes[i], B.hashes[j]);
  }
  return cosineSimilarity(A.vectors[i], B.vectors[j]);
}

interface RawMatch {
  aStartIdx: number;
  aEndIdx: number; // inclusive
  offset: number;
  similarity: number;
  method: string;
}

/** Match a single pair of streams. */
export function matchStream(
  A: FingerprintStream,
  B: FingerprintStream,
  settings: AnalysisSettings,
  method: string,
  onProgress?: (p: number, detail: string) => void,
): RawMatch[] {
  const a = maybeDecimate(A);
  const b = maybeDecimate(B);
  const N = streamLength(a);
  const M = streamLength(b);
  if (N < 2 || M < 2) return [];

  const hop = a.hop;
  const threshold = settings.similarityThreshold;
  // ~1s smoothing window, at least 3 frames
  const windowFrames = Math.max(3, Math.round(1.0 / hop));
  const minFrames = Math.max(1, Math.round(settings.minMatchDuration / hop));
  const gapFrames = Math.max(1, Math.round(settings.maxGap / hop));

  const raw: RawMatch[] = [];

  const totalDiagonals = N + M - 1;
  let diagonalDone = 0;
  let lastReport = 0;

  for (let d = -(N - 1); d <= M - 1; d++) {
    if (onProgress && d - lastReport >= 25) {
      lastReport = d;
      onProgress(diagonalDone / totalDiagonals, `${method} · offset ${d}`);
    }
    diagonalDone++;
    const iStart = Math.max(0, -d);
    const iEnd = Math.min(N - 1, M - 1 - d);
    if (iEnd - iStart + 1 < minFrames) continue;

    const len = iEnd - iStart + 1;
    const sims = new Float32Array(len);
    for (let k = 0; k < len; k++) {
      sims[k] = pairSimilarity(a, iStart + k, b, iStart + k + d);
    }

    // Density-based in-match flags via a trailing window.
    const flags = new Uint8Array(len);
    let lo = 0;
    let hit = 0;
    for (let hi = 0; hi < len; hi++) {
      if (sims[hi] >= threshold) hit++;
      while (hi - lo + 1 > windowFrames) {
        if (sims[lo] >= threshold) hit--;
        lo++;
      }
      if (hi - lo + 1 === windowFrames) {
        if (hit / windowFrames >= settings.matchDensity) {
          // mark the whole window center region as in-match
          flags[hi] = 1;
        }
      } else if (hi - lo + 1 < windowFrames && hi === len - 1) {
        // tail shorter than window: accept if all-high
        if (hit / (hi - lo + 1) >= settings.matchDensity) {
          flags[hi] = 1;
        }
      }
    }

    // Extract runs, merging gaps <= gapFrames.
    let k = 0;
    while (k < len) {
      if (!flags[k]) {
        k++;
        continue;
      }
      const runStart = k;
      let runEnd = k;
      let m = k + 1;
      while (m < len) {
        if (flags[m]) {
          runEnd = m;
          m++;
        } else {
          // look ahead within gap tolerance
          let gap = 0;
          let p = m;
          while (p < len && !flags[p] && gap < gapFrames) {
            gap++;
            p++;
          }
          if (p < len && flags[p] && gap <= gapFrames) {
            runEnd = p;
            m = p + 1;
          } else {
            break;
          }
        }
      }
      const runLen = runEnd - runStart + 1;
      if (runLen >= minFrames) {
        let sum = 0;
        let cnt = 0;
        for (let q = runStart; q <= runEnd; q++) {
          if (sims[q] >= threshold) {
            sum += sims[q];
            cnt++;
          }
        }
        const similarity = cnt > 0 ? sum / cnt : 0;
        raw.push({
          aStartIdx: iStart + runStart,
          aEndIdx: iStart + runEnd,
          offset: d,
          similarity,
          method,
        });
      }
      k = m;
    }
  }

  if (onProgress) onProgress(1, `${method} · done`);
  return raw;
}

/** Convert raw matches to final Match objects with real timestamps. */
function rawToMatches(
  raw: RawMatch[],
  A: FingerprintStream,
  B: FingerprintStream,
): Match[] {
  return raw.map((r, idx) => {
    const aStart = A.times[r.aStartIdx];
    const aEnd = A.times[r.aEndIdx] + A.hop;
    const bStart = B.times[r.aStartIdx + r.offset];
    const bEnd = B.times[r.aEndIdx + r.offset] + B.hop;
    const duration = Math.max(aEnd - aStart, bEnd - bStart);
    // Confidence blends raw similarity with a mild length bonus so that a
    // 30s match at 0.85 is ranked above a 3s match at 0.86.
    const lengthBonus = Math.min(0.12, duration / 240);
    const confidence = Math.min(1, r.similarity * 0.9 + lengthBonus + 0.04);
    return {
      id: `${r.method}-${idx}`,
      aStart,
      aEnd,
      bStart,
      bEnd,
      confidence,
      method: [r.method],
      similarity: r.similarity,
    };
  });
}

/** Overlap fraction (in A) between two matches. */
function overlapFraction(a: Match, b: Match): number {
  const start = Math.max(a.aStart, b.aStart);
  const end = Math.min(a.aEnd, b.aEnd);
  if (end <= start) return 0;
  const overlap = end - start;
  const minLen = Math.min(a.aEnd - a.aStart, b.aEnd - b.aStart);
  return minLen > 0 ? overlap / minLen : 0;
}

/** Merge two overlapping matches (in both videos). */
function mergeTwo(a: Match, b: Match): Match {
  return {
    id: a.id,
    aStart: Math.min(a.aStart, b.aStart),
    aEnd: Math.max(a.aEnd, b.aEnd),
    bStart: Math.min(a.bStart, b.bStart),
    bEnd: Math.max(a.bEnd, b.bEnd),
    confidence: Math.max(a.confidence, b.confidence),
    method: Array.from(new Set([...a.method, ...b.method])),
    similarity: Math.max(a.similarity, b.similarity),
  };
}

/**
 * Merge matches that overlap heavily (>=70%) in BOTH videos — these are
 * duplicate detections of the same region.
 */
export function dedupeMatches(matches: Match[]): Match[] {
  const sorted = [...matches].sort((a, b) => a.aStart - b.aStart);
  const result: Match[] = [];
  for (const m of sorted) {
    const last = result[result.length - 1];
    if (
      last &&
      overlapFraction(last, m) >= 0.7 &&
      overlapFraction(
        { ...last, aStart: last.bStart, aEnd: last.bEnd } as Match,
        { ...m, aStart: m.bStart, aEnd: m.bEnd } as Match,
      ) >= 0.6
    ) {
      result[result.length - 1] = mergeTwo(last, m);
    } else {
      result.push({ ...m });
    }
  }
  return result;
}

/**
 * Fuse video + audio matches for combined mode. Matches that overlap in
 * both videos are merged (boosting confidence); the rest are kept.
 */
export function fuseMatches(video: Match[], audio: Match[]): Match[] {
  const fused: Match[] = [];
  const usedAudio = new Set<number>();

  for (const v of video) {
    let bestIdx = -1;
    let bestOverlap = 0;
    for (let i = 0; i < audio.length; i++) {
      if (usedAudio.has(i)) continue;
      const ov = overlapFraction(v, audio[i]);
      const ovB = overlapFraction(
        { ...v, aStart: v.bStart, aEnd: v.bEnd } as Match,
        { ...audio[i], aStart: audio[i].bStart, aEnd: audio[i].bEnd } as Match,
      );
      const score = Math.min(ov, ovB);
      if (score > bestOverlap && score > 0.3) {
        bestOverlap = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      usedAudio.add(bestIdx);
      const a = audio[bestIdx];
      fused.push({
        id: `combined-${fused.length}`,
        aStart: (v.aStart + a.aStart) / 2,
        aEnd: (v.aEnd + a.aEnd) / 2,
        bStart: (v.bStart + a.bStart) / 2,
        bEnd: (v.bEnd + a.bEnd) / 2,
        confidence: Math.min(1, Math.max(v.confidence, a.confidence) + 0.06),
        method: ["video", "audio"],
        similarity: Math.max(v.similarity, a.similarity),
      });
    } else {
      fused.push({ ...v, id: `combined-${fused.length}` });
    }
  }
  for (let i = 0; i < audio.length; i++) {
    if (!usedAudio.has(i)) {
      fused.push({ ...audio[i], id: `combined-${fused.length}` });
    }
  }
  return dedupeMatches(fused);
}

/** Assign color groups by time-offset buckets (bStart - aStart). */
export function assignGroups(matches: Match[], hop: number): {
  matches: Match[];
  groupCount: number;
} {
  const bucket = Math.max(0.5, hop * 2);
  const groups = new Map<number, number>();
  let next = 0;
  const out = matches.map((m) => {
    const off = m.bStart - m.aStart;
    const key = Math.round(off / bucket);
    if (!groups.has(key)) groups.set(key, next++);
    return { ...m, group: groups.get(key)! };
  });
  return { matches: out, groupCount: next };
}

/** Format seconds as m:ss(.ddd). */
export function formatTime(seconds: number, withMs = false): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (!withMs) return `${m}:${s.toString().padStart(2, "0")}`;
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m}:${s.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Infer intro & outro from the detected matches — fully data-driven, no
 * hardcoded durations.
 *
 *   - Intro: the match whose earliest boundary (across both videos) is
 *     closest to the start of its source. We prefer longer / higher
 *     confidence matches when several touch the start.
 *   - Outro: symmetric — the match whose latest boundary is closest to the
 *     end of its source.
 */
export function inferIntroOutro(
  matches: Match[],
  durationA: number,
  durationB: number,
): IntroOutroResult {
  if (matches.length === 0) {
    return {
      intro: null,
      outro: null,
      rationale: "No matching regions were detected.",
    };
  }

  // Intro: minimize min(startA, startB), weighted by confidence & length.
  let intro: Match | null = null;
  let introScore = -Infinity;
  for (const m of matches) {
    const nearStart = Math.min(m.aStart, m.bStart);
    // closer to 0 → larger score; reward length & confidence
    const proximity = 1 / (1 + nearStart);
    const length = m.aEnd - m.aStart;
    const score = proximity * 0.6 + m.confidence * 0.25 + Math.min(length, 60) / 60 * 0.15;
    if (score > introScore) {
      introScore = score;
      intro = m;
    }
  }

  // Outro: maximize max(endA, endB) closeness to respective durations.
  let outro: Match | null = null;
  let outroScore = -Infinity;
  for (const m of matches) {
    const distToEnd = Math.min(
      durationA - m.aEnd,
      durationB - m.bEnd,
    );
    const proximity = 1 / (1 + Math.max(0, distToEnd));
    const length = m.aEnd - m.aStart;
    const score = proximity * 0.6 + m.confidence * 0.25 + Math.min(length, 60) / 60 * 0.15;
    if (score > outroScore) {
      outroScore = score;
      outro = m;
    }
  }

  // Avoid labeling the same region as both intro and outro unless it truly
  // spans near both ends.
  if (intro && outro && intro.id === outro.id) {
    outro = null;
  }

  const rationale = intro
    ? `Intro inferred from the match closest to the start (begins at ${formatTime(
        Math.min(intro.aStart, intro.bStart),
      )}).`
    : "No clear intro detected.";

  return { intro, outro, rationale };
}

/**
 * Full pipeline: run all relevant stream comparisons for the active mode
 * and return finalized matches.
 */
export function runMatching(
  streamsA: FingerprintStream[],
  streamsB: FingerprintStream[],
  settings: AnalysisSettings,
  onProgress?: (p: number, detail: string) => void,
): { matches: Match[]; groupCount: number } {
  const videoA = streamsA.filter((s) => s.kind === "video-dhash");
  const videoB = streamsB.filter((s) => s.kind === "video-dhash");
  const colorA = streamsA.filter((s) => s.kind === "video-color");
  const colorB = streamsB.filter((s) => s.kind === "video-color");
  const audioA = streamsA.filter((s) => s.kind.startsWith("audio"));
  const audioB = streamsB.filter((s) => s.kind.startsWith("audio"));

  const wantVideo = settings.mode === "video" || settings.mode === "combined";
  const wantAudio = settings.mode === "audio" || settings.mode === "combined";

  let videoMatches: Match[] = [];
  let audioMatches: Match[] = [];

  if (wantVideo && videoA.length && videoB.length) {
    const raw = matchStream(videoA[0], videoB[0], settings, "video-dhash", (p, d) =>
      onProgress?.(0.5 * p, d),
    );
    videoMatches = dedupeMatches(rawToMatches(raw, videoA[0], videoB[0]));
    // Refine with color histogram overlap where available (penalize matches
    // whose color signatures disagree).
    if (colorA.length && colorB.length) {
      videoMatches = videoMatches.map((m) => {
        const cs = colorSimilarityFor(colorA[0], colorB[0], m);
        return {
          ...m,
          confidence: m.confidence * (0.7 + 0.3 * cs),
          method: [...m.method, "video-color"],
        };
      });
    }
  }

  if (wantAudio && audioA.length && audioB.length) {
    const raw = matchStream(audioA[0], audioB[0], settings, "audio-chroma", (p, d) =>
      onProgress?.(0.5 + 0.5 * p, d),
    );
    audioMatches = dedupeMatches(rawToMatches(raw, audioA[0], audioB[0]));
  }

  let matches: Match[];
  if (settings.mode === "combined") {
    matches = fuseMatches(videoMatches, audioMatches);
  } else if (settings.mode === "video") {
    matches = videoMatches;
  } else {
    matches = audioMatches;
  }

  matches = dedupeMatches(matches);
  const hop = (videoA[0] || audioA[0] || { hop: 0.5 }).hop;
  const grouped = assignGroups(matches, hop);
  onProgress?.(1, "done");
  return grouped;
}

/** Mean color-similarity across the frames inside a match region. */
function colorSimilarityFor(
  colorA: FingerprintStream,
  colorB: FingerprintStream,
  m: Match,
): number {
  const aIdx0 = findIndexAt(colorA.times, m.aStart);
  const aIdx1 = findIndexAt(colorA.times, m.aEnd);
  const bIdx0 = findIndexAt(colorB.times, m.bStart);
  const bIdx1 = findIndexAt(colorB.times, m.bEnd);
  if (aIdx0 < 0 || bIdx0 < 0) return 0.5;
  let sum = 0;
  let cnt = 0;
  let ai = aIdx0;
  let bi = bIdx0;
  while (ai <= aIdx1 && bi <= bIdx1) {
    sum += cosineSimilarity(colorA.vectors[ai], colorB.vectors[bi]);
    cnt++;
    ai++;
    bi++;
  }
  return cnt > 0 ? sum / cnt : 0.5;
}

function findIndexAt(times: Float32Array, t: number): number {
  // nearest index
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(times[i] - t);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}
