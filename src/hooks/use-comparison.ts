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
} from "@/lib/workers/analyze.worker";
import type { ComparisonResult, StageProgress } from "@/lib/comparison/types";

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
        const onMsg = (e: MessageEvent<WorkerOut>) => {
          const msg = e.data;
          if (msg.type === "progress") {
            const sp = msg.data as StageProgress;
            // map worker-stage progress into a reasonable overall range
            useStore.getState().updateStage(sp);
          } else if (msg.type === "result") {
            worker.removeEventListener("message", onMsg);
            resolve(msg.data);
          } else if (msg.type === "error") {
            worker.removeEventListener("message", onMsg);
            reject(new Error(msg.message));
          }
        };
        worker.addEventListener("message", onMsg);
        worker.addEventListener("error", (err) => reject(err));

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
        worker.postMessage(req);
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

  return { run, abort, reset };
}

/** Re-export for components that need to validate uploads. */
export { validateFile };
