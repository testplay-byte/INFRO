/**
 * Main-thread media extraction.
 *
 * All decoding happens in the browser — nothing is uploaded. These
 * functions are heavily optimized for memory: the audio path decodes at a
 * low sample rate (so the browser resamples internally) and caps duration,
 * while the video path uses small downsampled frame grids.
 */

import type { MediaMeta } from "./types";
import type { FramePack, AudioPack } from "@/lib/workers/analyze.worker";
import { mixToMono } from "./audio";

export const SUPPORTED_EXTENSIONS = [
  "mp4",
  "mov",
  "webm",
  "mkv",
  "m4v",
  "avi",
  "ogv",
  "ogg",
  "mp3",
  "wav",
  "m4a",
  "aac",
  "flac",
];

/** Maximum audio duration (seconds) we attempt to fully analyze. */
const MAX_AUDIO_DURATION = 1200; // 20 minutes
/** Hard cap on PCM samples sent to the worker (~10 MB at 8 kHz × 20 min). */
const MAX_PCM_SAMPLES = 8000 * MAX_AUDIO_DURATION;

/** Validate an uploaded file. Returns an error string or null when OK. */
export function validateFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  if (!SUPPORTED_EXTENSIONS.includes(ext) && !isVideo && !isAudio) {
    return `Unsupported format ".${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(
      ", ",
    )}.`;
  }
  if (file.size > 500 * 1024 * 1024) {
    return "File is larger than 500 MB. Please use a smaller file for in-browser analysis.";
  }
  return null;
}

/** Read duration + dimensions via a hidden video element. */
export function probeMedia(file: File): Promise<MediaMeta> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    const onMeta = () => {
      const meta: MediaMeta = {
        fileName: file.name,
        fileType: file.type || file.name.split(".").pop() || "unknown",
        duration: isFinite(video.duration) ? video.duration : 0,
        width: video.videoWidth,
        height: video.videoHeight,
        hasAudio: true,
        size: file.size,
      };
      cleanup();
      resolve(meta);
    };
    const onErr = () => {
      cleanup();
      reject(
        new Error(
          "Could not read this file. The browser may not support its codec.",
        ),
      );
    };
    video.onloadedmetadata = onMeta;
    video.onerror = onErr;
    setTimeout(() => {
      if (video.readyState === 0) onErr();
    }, 8000);
  });
}

/** Wait for the next 'seeked' event (with a timeout fallback). */
function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    try {
      video.currentTime = Math.max(0, Math.min(t, video.duration || t));
    } catch {
      finish();
    }
    setTimeout(finish, 2500);
  });
}

/**
 * Extract downsampled RGBA frame grids from a video at a target sample rate.
 * Returns null if the media has no video track. Memory-bounded: frames are
 * stored as a single packed Uint8ClampedArray (32×32×4 bytes each).
 */
export async function extractFrames(
  file: File,
  fps: number,
  onProgress: (done: number, total: number) => void,
  signal?: { aborted: boolean },
): Promise<FramePack | null> {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
  const url = URL.createObjectURL(file);
  video.src = url;

  const W = 32;
  const H = 32;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Attach the video to the DOM (hidden) so browsers reliably paint frames
  // to the canvas during seeking.
  video.style.cssText =
    "position:fixed;left:-99999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
  video.muted = true;
  document.body.appendChild(video);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video frames."));
      setTimeout(() => {
        if (video.readyState < 2) resolve();
      }, 10000);
    });

    const duration = isFinite(video.duration) ? video.duration : 0;
    if (!duration || duration <= 0 || !video.videoWidth) return null;
    if (duration > 7200) {
      throw new Error("Video is longer than 2 hours. Please use a shorter clip.");
    }

    const MAX_FRAMES = 300;
    let count = Math.max(2, Math.floor(duration * fps));
    if (count > MAX_FRAMES) count = MAX_FRAMES;
    const effFps = (count - 1) / duration;
    const times = new Float32Array(count);
    const pixels = new Uint8ClampedArray(count * W * H * 4);

    for (let i = 0; i < count; i++) {
      if (signal?.aborted) throw new Error("aborted");
      const t = i / effFps;
      times[i] = t;
      await seekTo(video, t);
      // Small delay to let the browser paint the frame — use setTimeout
      // instead of requestAnimationFrame because RAF stops firing when the
      // tab loses focus, which would hang extraction forever.
      await new Promise((r) => setTimeout(r, 10));
      ctx?.clearRect(0, 0, W, H);
      ctx?.drawImage(video, 0, 0, W, H);
      const img = ctx?.getImageData(0, 0, W, H);
      if (img) pixels.set(img.data, i * W * H * 4);
      onProgress(i + 1, count);
    }

    return { width: W, height: H, count, times, pixels };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
    if (video.parentNode) video.parentNode.removeChild(video);
  }
}

/**
 * Decode a file's audio track to mono PCM at a low sample rate via the Web
 * Audio API.
 *
 * Memory-critical: we create the AudioContext with a low target sample rate
 * (default 8 kHz) so the browser performs decode + resample internally in
 * one pass — avoiding the ~10× memory blow-up of decoding at 48 kHz and
 * then manually resampling. The encoded file buffer is released as soon as
 * decode returns, and the PCM is capped to MAX_PCM_SAMPLES.
 *
 * Returns null when the browser cannot decode audio from the container.
 */
export async function extractAudio(
  file: File,
  _onProgress: (p: number) => void,
  targetRate = 8000,
): Promise<AudioPack | null> {
  let arrayBuffer: ArrayBuffer | null = null;
  let audioCtx: AudioContext | null = null;
  try {
    arrayBuffer = await file.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    // Create the context at the target sample rate so decodeAudioData
    // resamples for us — this is the single biggest memory saving.
    audioCtx = new AudioCtx({ sampleRate: targetRate });

    let audioBuffer: AudioBuffer;
    try {
      // Pass the buffer directly; most engines copy internally. If it
      // throws due to detachment we fall back to a copy.
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        // Buffer was detached — re-read and retry with an explicit copy.
        arrayBuffer = await file.arrayBuffer();
      }
      try {
        audioBuffer = await audioCtx.decodeAudioData(
          (arrayBuffer as ArrayBuffer).slice(0),
        );
      } catch {
        await audioCtx.close();
        audioCtx = null;
        return null;
      }
    }

    // Release the encoded bytes immediately — we have the decoded PCM now.
    arrayBuffer = null;

    // Mix to mono (at the low sample rate — tiny).
    const channels: Float32Array[] = [];
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      channels.push(audioBuffer.getChannelData(c) as Float32Array);
    }
    const fullMono = mixToMono(channels);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // We can close the context now — we have the raw PCM.
    await audioCtx.close();
    audioCtx = null;

    // Cap the PCM length to bound memory.
    let pcm = fullMono;
    if (pcm.length > MAX_PCM_SAMPLES) {
      pcm = fullMono.subarray(0, MAX_PCM_SAMPLES);
    }

    return { pcm, sampleRate, duration };
  } catch {
    if (audioCtx) {
      try {
        await audioCtx.close();
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}
