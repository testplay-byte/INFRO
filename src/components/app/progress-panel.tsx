"use client";

import { Check, Loader2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { StageId } from "@/lib/comparison/types";
import { Button } from "@/components/ui/button";
import { useComparison } from "@/hooks/use-comparison";
import { cn } from "@/lib/utils";

const STAGE_ORDER: { id: StageId; label: string }[] = [
  { id: "loading", label: "Preparing files" },
  { id: "decoding", label: "Decoding media" },
  { id: "extracting-audio", label: "Extracting audio" },
  { id: "extracting-frames", label: "Extracting frames" },
  { id: "fingerprinting", label: "Generating fingerprints" },
  { id: "comparing", label: "Comparing fingerprints" },
  { id: "building-timeline", label: "Building timeline" },
  { id: "rendering", label: "Rendering results" },
];

export function ProgressPanel() {
  const stages = useStore((s) => s.stages);
  const current = useStore((s) => s.currentStage);
  const { abort } = useComparison();

  const stageMap = new Map(stages.map((s) => [s.stage, s]));
  const currentIndex = current ? STAGE_ORDER.findIndex((s) => s.id === current.stage) : -1;

  // Overall progress: average across stages that have started, weighted by position
  let overall = 0;
  let counted = 0;
  for (const s of STAGE_ORDER) {
    const p = stageMap.get(s.id);
    if (p) {
      overall += p.progress;
      counted++;
    }
  }
  const overallPct = counted > 0 ? (overall / counted) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Analyzing media</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              All processing happens locally in your browser.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={abort} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>

        {/* Overall bar */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              {current?.label ?? "Working…"}
            </span>
            <span className="font-mono text-muted-foreground">
              {Math.round(overallPct)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-copper transition-all duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {current?.detail && (
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">
              {current.detail}
            </p>
          )}
        </div>

        {/* Stage list */}
        <ol className="space-y-1">
          {STAGE_ORDER.map((s, i) => {
            const p = stageMap.get(s.id);
            const isActive = current?.stage === s.id;
            const isDone = currentIndex > i || p?.progress === 1;
            const skipped = !p && i > currentIndex && currentIndex >= 0;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                  isActive && "bg-accent/50",
                )}
              >
                <div className="grid h-5 w-5 place-items-center">
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-sage" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        skipped ? "bg-muted-foreground/20" : "bg-muted-foreground/40",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    isActive
                      ? "font-medium text-foreground"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {s.label}
                </span>
                {isActive && p && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {Math.round(p.progress * 100)}%
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
