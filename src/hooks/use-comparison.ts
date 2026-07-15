"use client";

/**
 * useComparison — orchestrates the full client-side pipeline:
 *
 *   probe → decode audio → extract frames → worker(fingerprint + match)
 *           → result
 *
 * All file decoding happens on the main thread (DOM-bound APIs); all
 * fingerprinting + matching happens in the analyze Web Worker.
 */

import { useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  extractAudio,
  extractFrames,
  probeMedia,
  validateFile,
} from "@/lib/comparison/extract";
import type {
  AnalyzeRequest,
  WorkerOut,
  FramePack,
  AudioPack,
  DetectRequest,
} from "@/lib/workers/analyze.worker";
import type {
  ComparisonResult,
  DetectionResult,
  StageProgress,
  SignatureData,
} from "@/lib/comparison/types";

export function useComparison() {
  const workerRef = useRef<Worker | null>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const { toast } = useToast();

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const run = useCallback(async () => {
    const state = useStore.getState();
    const { slotA, slotB, settings } = state;
    if (!slotA.file || !slotB.file) return;

    abortRef.current = { aborted: false };
    useStore.getState().setStatus("processing");
    useStore.getState().pushStage({
      stage: "loading",
      label: "Preparing files",
      progress: 0.1,
    });

    const startWall = performance.now();

    try {
      // Re-probe to be safe (meta may already exist from upload).
      let metaA = slotA.meta;
      let metaB = slotB.meta;
      if (!metaA) {
        metaA = await probeMedia(slotA.file);
        useStore.getState().setFile("A", slotA.file, metaA);
      }
      if (!metaB) {
        metaB = await probeMedia(slotB.file);
        useStore.getState().setFile("B", slotB.file, metaB);
      }

      useStore.getState().updateStage({
        stage: "decoding",
        label: "Decoding media",
        progress: 0.15,
      });

      // --- Audio (skip for pure video mode) ---
      let audioA: AudioPack | null = null;
      let audioB: AudioPack | null = null;
      if (settings.mode !== "video") {
        useStore.getState().pushStage({
          stage: "extracting-audio",
          label: "Extracting audio",
          progress: 0.05,
        });
        audioA = await extractAudio(slotA.file, () => {});
        audioB = await extractAudio(slotB.file, () => {});
        useStore.getState().setAudioAvailability("A", !!audioA);
        useStore.getState().setAudioAvailability("B", !!audioB);
        if (settings.mode === "audio" && (!audioA || !audioB)) {
          throw new Error(
            "Audio could not be decoded from one of the files. Try Video or Combined mode, or a different file format (mp4/m4a often work best).",
          );
        }
        if ((settings.mode === "combined") && (!audioA || !audioB)) {
          toast({
            title: "Audio unavailable — using video only",
            description:
              "One file's audio track couldn't be decoded in-browser. Falling back to visual comparison.",
          });
        }
        useStore.getState().updateStage({
          stage: "extracting-audio",
          label: "Extracting audio",
          progress: 0.9,
        });
      }

      // --- Frames (skip for pure audio mode) ---
      let framesA: FramePack | null = null;
      let framesB: FramePack | null = null;
      if (settings.mode !== "audio") {
        useStore.getState().pushStage({
          stage: "extracting-frames",
          label: "Extracting frames — Video A",
          progress: 0.05,
          detail: "Video A",
        });
        framesA = await extractFrames(
          slotA.file,
          settings.frameSampleRate,
          (done, total) => {
            useStore.getState().updateStage({
              stage: "extracting-frames",
              label: "Extracting frames — Video A",
              progress: 0.5 * (done / total),
              detail: `frame ${done} / ${total}`,
            });
          },
          abortRef.current,
        );
        useStore.getState().updateStage({
          stage: "extracting-frames",
          label: "Extracting frames — Video B",
          progress: 0.5,
          detail: "Video B",
        });
        framesB = await extractFrames(
          slotB.file,
          settings.frameSampleRate,
          (done, total) => {
            useStore.getState().updateStage({
              stage: "extracting-frames",
              label: "Extracting frames — Video B",
              progress: 0.5 + 0.5 * (done / total),
              detail: `frame ${done} / ${total}`,
            });
          },
          abortRef.current,
        );
        if (!framesA || !framesB) {
          throw new Error(
            "Could not extract video frames. The browser may not support this codec. Try Audio mode.",
          );
        }
      }

      if (abortRef.current.aborted) return;

      // Cache extraction data for retry
      useStore.getState().setCachedExtraction({
        framesA,
        framesB,
        audioA,
        audioB,
      });

      // --- Worker: fingerprint + match ---
      useStore.getState().pushStage({
        stage: "fingerprinting",
        label: "Generating fingerprints",
        progress: 0.05,
      });

      terminateWorker();
      const worker = new Worker(
        new URL("../lib/workers/analyze.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      const result = await new Promise<ComparisonResult>((resolve, reject) => {
        let settled = false;
        // Single watchdog timer — resets on every progress message. If no
        // progress for 45s, reject with a clear error.
        let watchdogId: ReturnType<typeof setTimeout>;
        const armWatchdog = () => {
          if (watchdogId) clearTimeout(watchdogId);
          watchdogId = setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(
                new Error(
                  "Analysis stalled — no progress for 45 seconds. The files may be too large for in-browser processing. Try shorter clips, 'fast' precision, or a single mode (Audio or Video only).",
                ),
              );
            }
          }, 45000);
        };
        armWatchdog();

        // Absolute deadline — no matter what, after 3 minutes we bail.
        const absoluteDeadline = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(
              new Error(
                "Analysis exceeded the 3-minute time limit. Please use shorter clips or the 'fast' precision preset.",
              ),
            );
          }
        }, 180000);

        const cleanup = () => {
          if (watchdogId) clearTimeout(watchdogId);
          clearTimeout(absoluteDeadline);
          worker.removeEventListener("message", onMsg);
        };

        const onMsg = (e: MessageEvent<WorkerOut>) => {
          if (settled) return;
          const msg = e.data;
          if (msg.type === "progress") {
            armWatchdog(); // worker is alive — reset the inactivity timer
            useStore.getState().updateStage(msg.data as StageProgress);
          } else if (msg.type === "result") {
            settled = true;
            cleanup();
            resolve(msg.data);
          } else if (msg.type === "error") {
            settled = true;
            cleanup();
            reject(new Error(msg.message));
          }
        };
        worker.addEventListener("message", onMsg);
        worker.addEventListener("error", (err) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(
            new Error(
              err.message ||
                "The analysis worker crashed. This is often an out-of-memory error — try shorter clips or a single mode.",
            ),
          );
        });

        const req: AnalyzeRequest = {
          type: "analyze",
          framesA,
          framesB,
          audioA,
          audioB,
          metaA: metaA!,
          metaB: metaB!,
          settings,
        };
        // Transfer underlying ArrayBuffers to avoid cloning large payloads.
        const transferList: Transferable[] = [];
        if (framesA?.pixels?.buffer) transferList.push(framesA.pixels.buffer);
        if (framesB?.pixels?.buffer) transferList.push(framesB.pixels.buffer);
        if (audioA?.pcm?.buffer) transferList.push(audioA.pcm.buffer);
        if (audioB?.pcm?.buffer) transferList.push(audioB.pcm.buffer);
        worker.postMessage(req, transferList);
      });

      terminateWorker();
      if (abortRef.current.aborted) return;
      useStore.getState().setResult(result, performance.now() - startWall);
      toast({
        title: "Analysis complete",
        description: `${result.stats.totalMatches} matching region${
          result.stats.totalMatches === 1 ? "" : "s"
        } detected.`,
      });
    } catch (err) {
      terminateWorker();
      if (abortRef.current.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      useStore.getState().setStatus("error", message);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [terminateWorker, toast]);

  const runDetect = useCallback(async () => {
    const state = useStore.getState();
    const { signatureData, slotB, slotA, settings } = state;
    if (!signatureData) return;

    // In detect mode, the video can be in slot B (preferred) or slot A
    const videoSlot = slotB.file ? slotB : slotA.file ? slotA : null;
    if (!videoSlot?.file) return;

    abortRef.current = { aborted: false };
    useStore.getState().setStatus("processing");
    useStore.getState().pushStage({
      stage: "loading",
      label: "Preparing detection",
      progress: 0.1,
    });

    const startWall = performance.now();

    try {
      let meta = videoSlot.meta;
      if (!meta) {
        meta = await probeMedia(videoSlot.file!);
        useStore.getState().setFile(slotB.file ? "B" : "A", videoSlot.file!, meta);
      }

      useStore.getState().updateStage({
        stage: "decoding",
        label: "Decoding media",
        progress: 0.15,
      });

      let audio: AudioPack | null = null;
      let frames: FramePack | null = null;

      // Extract audio (for audio-based segments)
      useStore.getState().pushStage({
        stage: "extracting-audio",
        label: "Extracting audio",
        progress: 0.05,
      });
      audio = await extractAudio(videoSlot.file!, () => {});
      useStore.getState().setAudioAvailability(slotB.file ? "B" : "A", !!audio);

      // Extract frames (for video-based segments)
      if (meta.width && meta.height) {
        useStore.getState().pushStage({
          stage: "extracting-frames",
          label: "Extracting frames",
          progress: 0.05,
        });
        frames = await extractFrames(
          videoSlot.file!,
          settings.frameSampleRate,
          (done, total) => {
            useStore.getState().updateStage({
              stage: "extracting-frames",
              label: "Extracting frames",
              progress: done / total,
              detail: `frame ${done} / ${total}`,
            });
          },
          abortRef.current,
        );
      }

      if (abortRef.current.aborted) return;

      useStore.getState().pushStage({
        stage: "fingerprinting",
        label: "Generating fingerprints",
        progress: 0.1,
      });

      terminateWorker();
      const worker = new Worker(
        new URL("../lib/workers/analyze.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      const result = await new Promise<DetectionResult>((resolve, reject) => {
        let settled = false;
        let watchdogId: ReturnType<typeof setTimeout>;
        const armWatchdog = () => {
          if (watchdogId) clearTimeout(watchdogId);
          watchdogId = setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(new Error("Detection stalled — no progress for 45 seconds."));
            }
          }, 45000);
        };
        armWatchdog();

        const absoluteDeadline = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Detection exceeded the 3-minute time limit."));
          }
        }, 180000);

        const cleanup = () => {
          if (watchdogId) clearTimeout(watchdogId);
          clearTimeout(absoluteDeadline);
          worker.removeEventListener("message", onMsg);
        };

        const onMsg = (e: MessageEvent<WorkerOut>) => {
          if (settled) return;
          const msg = e.data;
          if (msg.type === "progress") {
            armWatchdog();
            useStore.getState().updateStage(msg.data as StageProgress);
          } else if (msg.type === "detect-result") {
            settled = true;
            cleanup();
            resolve(msg.data);
          } else if (msg.type === "error") {
            settled = true;
            cleanup();
            reject(new Error(msg.message));
          }
        };
        worker.addEventListener("message", onMsg);
        worker.addEventListener("error", (err) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error(err.message || "Detection worker crashed."));
        });

        const req: DetectRequest = {
          type: "detect",
          signature: signatureData,
          frames,
          audio,
          meta: meta!,
          settings,
        };
        const transferList: Transferable[] = [];
        if (frames?.pixels?.buffer) transferList.push(frames.pixels.buffer);
        if (audio?.pcm?.buffer) transferList.push(audio.pcm.buffer);
        worker.postMessage(req, transferList);
      });

      terminateWorker();
      if (abortRef.current.aborted) return;
      useStore.getState().setDetectionResult(result, performance.now() - startWall);

      const foundCount = result.detections.filter((d) => d.found).length;
      toast({
        title: "Detection complete",
        description: `${foundCount} of ${result.detections.length} segment${
          result.detections.length === 1 ? "" : "s"
        } found in the new video.`,
      });
    } catch (err) {
      terminateWorker();
      if (abortRef.current.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      useStore.getState().setStatus("error", message);
      toast({
        title: "Detection failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [terminateWorker, toast]);

  const abort = useCallback(() => {
    abortRef.current.aborted = true;
    terminateWorker();
    useStore.getState().setStatus("idle");
  }, [terminateWorker]);

  const reset = useCallback(() => {
    abortRef.current.aborted = true;
    terminateWorker();
    useStore.getState().reset();
  }, [terminateWorker]);

  /**
   * Retry analysis using cached extraction data. Skips the slow frame/audio
   * extraction and re-runs only the worker matching with the current
   * (potentially updated) settings.
   */
  const retry = useCallback(async () => {
    const state = useStore.getState();
    const { cachedExtraction, slotA, slotB, settings } = state;
    if (!cachedExtraction || !slotA.meta || !slotB.meta) {
      // No cached data — fall back to full run
      return run();
    }

    abortRef.current = { aborted: false };
    useStore.getState().setStatus("processing");
    useStore.getState().pushStage({
      stage: "fingerprinting",
      label: "Re-analyzing with new settings",
      progress: 0.1,
    });

    const startWall = performance.now();

    try {
      terminateWorker();
      const worker = new Worker(
        new URL("../lib/workers/analyze.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      const result = await new Promise<ComparisonResult>((resolve, reject) => {
        let settled = false;
        let watchdogId: ReturnType<typeof setTimeout>;
        const armWatchdog = () => {
          if (watchdogId) clearTimeout(watchdogId);
          watchdogId = setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(new Error("Analysis stalled — no progress for 45 seconds."));
            }
          }, 45000);
        };
        armWatchdog();

        const absoluteDeadline = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Analysis exceeded the 3-minute time limit."));
          }
        }, 180000);

        const cleanup = () => {
          if (watchdogId) clearTimeout(watchdogId);
          clearTimeout(absoluteDeadline);
          worker.removeEventListener("message", onMsg);
        };

        const onMsg = (e: MessageEvent<WorkerOut>) => {
          if (settled) return;
          const msg = e.data;
          if (msg.type === "progress") {
            armWatchdog();
            useStore.getState().updateStage(msg.data as StageProgress);
          } else if (msg.type === "result") {
            settled = true;
            cleanup();
            resolve(msg.data);
          } else if (msg.type === "error") {
            settled = true;
            cleanup();
            reject(new Error(msg.message));
          }
        };
        worker.addEventListener("message", onMsg);
        worker.addEventListener("error", (err) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error(err.message || "Worker crashed during retry."));
        });

        const req: AnalyzeRequest = {
          type: "analyze",
          framesA: cachedExtraction.framesA as FramePack | null,
          framesB: cachedExtraction.framesB as FramePack | null,
          audioA: cachedExtraction.audioA as AudioPack | null,
          audioB: cachedExtraction.audioB as AudioPack | null,
          metaA: slotA.meta!,
          metaB: slotB.meta!,
          settings,
        };
        worker.postMessage(req);
      });

      terminateWorker();
      if (abortRef.current.aborted) return;
      useStore.getState().setResult(result, performance.now() - startWall);
      toast({
        title: "Re-analysis complete",
        description: `${result.stats.totalMatches} matching region${
          result.stats.totalMatches === 1 ? "" : "s"
        } detected.`,
      });
    } catch (err) {
      terminateWorker();
      if (abortRef.current.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      useStore.getState().setStatus("error", message);
      toast({
        title: "Re-analysis failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [terminateWorker, toast, run]);

  return { run, runDetect, retry, abort, reset };
}

/** Parse a signature JSON file. Returns null on invalid JSON. */
export async function parseSignatureFile(file: File): Promise<SignatureData | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.version || !data.segments || !Array.isArray(data.segments)) {
      return null;
    }
    return data as SignatureData;
  } catch {
    return null;
  }
}

/** Re-export for components that need to validate uploads. */
export { validateFile };
