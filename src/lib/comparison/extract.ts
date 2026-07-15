/**
 * Main-thread media extraction.
 *
 * These functions use the HTML video element + canvas for frame sampling
 * and the Web Audio API for audio decode. The raw pixel/PCM payloads are
 * then handed to the analysis Web Worker. Nothing here touches a server —
 * all decoding happens in the browser.
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
  // 2 GB safety cap — browser memory limits would bite first.
  if (file.size > 2 * 1024 * 1024 * 1024) {
    return "File is larger than 2 GB. Please use a smaller file.";
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
    // Safety timeout
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
 * Returns null if the media has no video track.
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
  // to the canvas during seeking. Off-DOM drawImage can yield blank frames
  // in some engines.
  video.style.position = "fixed";
  video.style.left = "-99999px";
  video.style.top = "0";
  video.style.width = "2px";
  video.style.height = "2px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  video.muted = true;
  document.body.appendChild(video);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video frames."));
      setTimeout(() => {
        if (video.readyState < 2) resolve(); // proceed best-effort
      }, 10000);
    });

    const duration = isFinite(video.duration) ? video.duration : 0;
    if (!duration || duration <= 0 || !video.videoWidth) return null;
    if (duration > 7200) {
      throw new Error(
        "Video is longer than 2 hours. Please use a shorter clip.",
      );
    }

    const MAX_FRAMES = 600;
    let count = Math.max(2, Math.floor(duration * fps));
    if (count > MAX_FRAMES) {
      count = MAX_FRAMES; // effective fps drops; bounded for responsiveness
    }
    const effFps = (count - 1) / duration;
    const times = new Float32Array(count);
    const pixels = new Uint8ClampedArray(count * W * H * 4);

    for (let i = 0; i < count; i++) {
      if (signal?.aborted) throw new Error("aborted");
      const t = i / effFps;
      times[i] = t;
      await seekTo(video, t);
      // give the compositor a tick to paint the new frame
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      ctx?.clearRect(0, 0, W, H);
      ctx?.drawImage(video, 0, 0, W, H);
      const img = ctx?.getImageData(0, 0, W, H);
      if (img) {
        pixels.set(img.data, i * W * H * 4);
      }
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
 * Decode a file's audio track to mono PCM via the Web Audio API.
 * Returns null when the browser cannot decode audio from the container.
 */
export async function extractAudio(
  file: File,
  _onProgress: (p: number) => void,
): Promise<AudioPack | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    const audioCtx = new AudioCtx();
    let audioBuffer: AudioBuffer;
    try {
      // slice(0) — decodeAudioData detaches the source buffer
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      await audioCtx.close();
      return null;
    }
    await audioCtx.close();

    const channels: Float32Array[] = [];
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      channels.push(audioBuffer.getChannelData(c).slice() as Float32Array);
    }
    const mono = mixToMono(channels);
    return {
      pcm: mono,
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration,
    };
  } catch {
    return null;
  }
}
