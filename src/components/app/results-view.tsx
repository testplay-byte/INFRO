"use client";

import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { VideoPreview } from "./video-preview";
import { Timeline } from "./timeline";
import { MatchList } from "./match-list";
import { StatsPanel } from "./stats-panel";

export function ResultsView() {
  const result = useStore((s) => s.result);
  if (!result) return null;
  const { introOutro, stats, mode } = result;

  return (
    <div className="space-y-4">
      {/* Intro/outro summary banner */}
      {(introOutro.intro || introOutro.outro) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Info className="h-3.5 w-3.5 text-primary" />
            Inferred from {stats.totalMatches} detected region
            {stats.totalMatches === 1 ? "" : "s"}
          </span>
          {introOutro.intro && (
            <span className="text-muted-foreground">
              <span className="font-semibold text-sage">Intro</span> A{" "}
              {fmt(introOutro.intro.aStart)}–{fmt(introOutro.intro.aEnd)} · B{" "}
              {fmt(introOutro.intro.bStart)}–{fmt(introOutro.intro.bEnd)}
            </span>
          )}
          {introOutro.outro && (
            <span className="text-muted-foreground">
              <span className="font-semibold text-copper">Outro</span> A{" "}
              {fmt(introOutro.outro.aStart)}–{fmt(introOutro.outro.aEnd)} · B{" "}
              {fmt(introOutro.outro.bStart)}–{fmt(introOutro.outro.bEnd)}
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground/70">
            mode: {mode}
          </span>
        </div>
      )}

      <VideoPreview />

      <Timeline />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MatchList />
        </div>
        <div className="lg:col-span-2">
          <StatsPanel />
        </div>
      </div>
    </div>
  );
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
