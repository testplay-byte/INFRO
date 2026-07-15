"use client";

import { useState } from "react";
import { Activity, Terminal, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/comparison/format";
import type { SimilarityPoint } from "@/lib/comparison/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AudioAnalysisPanel() {
  const result = useStore((s) => s.result);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; point: SimilarityPoint } | null>(null);

  if (!result) return null;

  const audioCurve = result.audioSimilarityCurve ?? [];
  const videoCurve = result.videoSimilarityCurve ?? [];
  const diag = result.diagnostics ?? [];

  // Find peak similarity and stats
  const audioPeaks = audioCurve.length > 0
    ? {
        max: Math.max(...audioCurve.map((p) => p.similarity)),
        avg: audioCurve.reduce((s, p) => s + p.similarity, 0) / audioCurve.length,
        matched: audioCurve.filter((p) => p.inMatch).length,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Audio similarity curve */}
      {audioCurve.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Audio similarity curve</h3>
            </div>
            {audioPeaks && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>peak: <span className="font-semibold text-foreground">{(audioPeaks.max * 100).toFixed(0)}%</span></span>
                <span>avg: <span className="font-semibold text-foreground">{(audioPeaks.avg * 100).toFixed(0)}%</span></span>
                <span>in match: <span className="font-semibold text-foreground">{audioPeaks.matched}/{audioCurve.length}</span></span>
              </div>
            )}
          </div>
          <SimilarityCurve
            points={audioCurve}
            duration={result.streamA.duration}
            threshold={0.9}
            onHover={setHoverPoint}
            color="oklch(0.55 0.16 55)"
          />
          {hoverPoint && (
            <div className="mt-2 flex gap-4 text-xs font-mono text-muted-foreground">
              <span>A: {formatTime(hoverPoint.point.timeA, true)}</span>
              <span>B: {formatTime(hoverPoint.point.timeB, true)}</span>
              <span className={cn(
                "font-semibold",
                hoverPoint.point.similarity >= 0.9 ? "text-sage" : "text-muted-foreground",
              )}>
                {(hoverPoint.point.similarity * 100).toFixed(1)}%
              </span>
              {hoverPoint.point.inMatch && <span className="text-sage">in match</span>}
            </div>
          )}
        </div>
      )}

      {/* Video similarity curve */}
      {videoCurve.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage" />
            <h3 className="text-sm font-bold">Video similarity curve</h3>
          </div>
          <SimilarityCurve
            points={videoCurve}
            duration={result.streamA.duration}
            threshold={0.9}
            onHover={() => {}}
            color="oklch(0.5 0.11 150)"
          />
        </div>
      )}

      {/* Diagnostics panel */}
      {diag.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDiagnostics((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold">Diagnostics</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {diag.length} lines
              </span>
            </div>
            {showDiagnostics ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showDiagnostics && (
            <ScrollArea className="max-h-80 border-t border-border">
              <pre className="p-4 text-[11px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap">
                {diag.join("\n")}
              </pre>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

function SimilarityCurve({
  points,
  duration,
  threshold,
  onHover,
  color,
}: {
  points: SimilarityPoint[];
  duration: number;
  threshold: number;
  onHover: (h: { x: number; y: number; point: SimilarityPoint } | null) => void;
  color: string;
}) {
  const W = 1000;
  const H = 120;
  const PAD = 4;

  if (points.length === 0) return null;

  // Downsample if too many points
  const step = Math.max(1, Math.floor(points.length / W));
  const sampled: SimilarityPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }

  const xOf = (t: number) => PAD + (t / duration) * (W - 2 * PAD);
  const yOf = (sim: number) => PAD + (1 - sim) * (H - 2 * PAD);
  const thresholdY = yOf(threshold);

  // Build the area path
  let pathD = `M ${xOf(sampled[0].timeA).toFixed(1)} ${H - PAD}`;
  for (const p of sampled) {
    pathD += ` L ${xOf(p.timeA).toFixed(1)} ${yOf(p.similarity).toFixed(1)}`;
  }
  pathD += ` L ${xOf(sampled[sampled.length - 1].timeA).toFixed(1)} ${H - PAD} Z`;

  // Build the line path
  let lineD = "";
  for (let i = 0; i < sampled.length; i++) {
    const cmd = i === 0 ? "M" : "L";
    lineD += ` ${cmd} ${xOf(sampled[i].timeA).toFixed(1)} ${yOf(sampled[i].similarity).toFixed(1)}`;
  }

  return (
    <div
      className="relative w-full"
      onMouseLeave={() => onHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        style={{ height: H }}
        preserveAspectRatio="none"
      >
        {/* Threshold line */}
        <line
          x1={PAD}
          y1={thresholdY}
          x2={W - PAD}
          y2={thresholdY}
          stroke="oklch(0.55 0.16 55 / 40%)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text x={W - PAD - 4} y={thresholdY - 4} textAnchor="end" className="fill-muted-foreground font-mono" fontSize={9}>
          threshold {(threshold * 100).toFixed(0)}%
        </text>

        {/* Match regions (background bands) */}
        {points.filter((p) => p.inMatch).map((p, i) => (
          <rect
            key={i}
            x={xOf(p.timeA) - 1}
            y={PAD}
            width={2}
            height={H - 2 * PAD}
            fill="oklch(0.5 0.11 150 / 12%)"
          />
        ))}

        {/* Area fill */}
        <path d={pathD} fill={`${color.replace(")", " / 15%)")}`} />

        {/* Line */}
        <path d={lineD} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Hover overlay */}
      <div
        className="absolute inset-0"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const t = ((x / rect.width) * (W - 2 * PAD) - PAD) / (W - 2 * PAD) * duration;
          const nearest = points.reduce((best, p) =>
            Math.abs(p.timeA - t) < Math.abs(best.timeA - t) ? p : best,
          );
          onHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, point: nearest });
        }}
      />
    </div>
  );
}
