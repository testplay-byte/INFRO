"use client";

import {
  Layers,
  Trophy,
  Percent,
  Clock,
  Cpu,
  Film,
  AudioLines,
  Locate,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  formatTime,
  formatDuration,
  formatPercent,
  formatBytes,
} from "@/lib/comparison/format";
import { cn } from "@/lib/utils";

export function StatsPanel() {
  const result = useStore((s) => s.result);
  const elapsed = useStore((s) => s.elapsedMs);
  if (!result) return null;
  const { stats, introOutro, streamA, streamB, mode } = result;

  const items = [
    {
      icon: <Layers className="h-3.5 w-3.5" />,
      label: "Total matches",
      value: stats.totalMatches.toString(),
    },
    {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: "Longest match",
      value: formatDuration(stats.longestMatchDuration),
    },
    {
      icon: <Percent className="h-3.5 w-3.5" />,
      label: "Avg confidence",
      value: stats.totalMatches ? formatPercent(stats.averageConfidence) : "—",
    },
    {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "Matched time",
      value: formatDuration(stats.totalMatchedDuration),
    },
    {
      icon: <Cpu className="h-3.5 w-3.5" />,
      label: "Processing time",
      value: formatDuration(stats.processingTimeMs / 1000),
      hint: `wall · ${formatDuration(elapsed / 1000)}`,
    },
    {
      icon: <Film className="h-3.5 w-3.5" />,
      label: "Frames analyzed",
      value: stats.framesAnalyzed.toLocaleString(),
    },
    {
      icon: <AudioLines className="h-3.5 w-3.5" />,
      label: "Audio samples",
      value: compactNumber(stats.audioSamplesAnalyzed),
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">Statistics</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {mode}
        </span>
      </div>

      {/* Intro / Outro highlight */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <IntroOutroCard
          kind="intro"
          title="Detected intro"
          match={introOutro.intro}
        />
        <IntroOutroCard
          kind="outro"
          title="Detected outro"
          match={introOutro.outro}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-lg border border-border/50 bg-background/40 p-2.5"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {it.icon}
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {it.label}
              </span>
            </div>
            <div className="mt-1 text-[15px] font-semibold tabular-nums">
              {it.value}
            </div>
            {it.hint && (
              <div className="text-[10px] text-muted-foreground/70">{it.hint}</div>
            )}
          </div>
        ))}
      </div>

      {/* Sources summary */}
      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
        <SourceRow label="A" meta={streamA} />
        <SourceRow label="B" meta={streamB} />
      </div>
    </div>
  );
}

function IntroOutroCard({
  kind,
  title,
  match,
}: {
  kind: "intro" | "outro";
  title: string;
  match: import("@/lib/comparison/types").Match | null;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        match
          ? kind === "intro"
            ? "border-sage/40 bg-sage/5"
            : "border-copper/40 bg-copper/5"
          : "border-border/50 bg-background/40",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Locate
          className={cn(
            "h-3 w-3",
            match
              ? kind === "intro"
                ? "text-sage"
                : "text-copper"
              : "text-muted-foreground",
          )}
        />
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      {match ? (
        <div className="mt-1 font-mono text-[11px] leading-relaxed">
          <div>
            <span className="text-primary/80">A</span> {formatTime(match.aStart)}–
            {formatTime(match.aEnd)}
          </div>
          <div>
            <span className="text-sage/90">B</span> {formatTime(match.bStart)}–
            {formatTime(match.bEnd)}
          </div>
          <div className="mt-0.5 text-muted-foreground">
            {formatDuration(match.aEnd - match.aStart)} ·{" "}
            {formatPercent(match.confidence)}
          </div>
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-muted-foreground/60">Not detected</div>
      )}
    </div>
  );
}

function SourceRow({
  label,
  meta,
}: {
  label: string;
  meta: import("@/lib/comparison/types").MediaMeta;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5">
      <span
        className={cn(
          "grid h-5 w-5 place-items-center rounded text-[10px] font-bold",
          label === "A" ? "bg-primary/15 text-primary" : "bg-sage/15 text-sage",
        )}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate" title={meta.fileName}>
        {meta.fileName}
      </span>
      <span className="shrink-0 font-mono text-muted-foreground">
        {formatDuration(meta.duration)}
      </span>
      <span className="shrink-0 font-mono text-muted-foreground/70">
        {formatBytes(meta.size)}
      </span>
    </div>
  );
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}
