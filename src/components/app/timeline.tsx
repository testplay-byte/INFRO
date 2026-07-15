"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Locate } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePlayer, mapTimeAcrossMatches } from "@/lib/player-store";
import type { Match } from "@/lib/comparison/types";
import { formatTime, formatDuration } from "@/lib/comparison/format";
import { groupColor } from "./match-colors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TRACK_H = 46;
const RULER_H = 22;
const GAP = 10;

export function Timeline() {
  const result = useStore((s) => s.result);
  const matches = result?.matches ?? [];
  const selectedId = useStore((s) => s.selectedMatchId);
  const selectMatch = useStore((s) => s.selectMatch);

  const durationA = usePlayer((s) => s.durationA) || result?.streamA.duration || 0;
  const durationB = usePlayer((s) => s.durationB) || result?.streamB.duration || 0;
  const currentTimeA = usePlayer((s) => s.currentTimeA);
  const currentTimeB = usePlayer((s) => s.currentTimeB);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const maxDuration = Math.max(durationA, durationB, 1);
  const fitScale = Math.max(1, width / maxDuration);

  const [scale, setScale] = useState(fitScale);
  const [startSec, setStartSec] = useState(0);
  const [hover, setHover] = useState<{
    match: Match;
    x: number;
    y: number;
    slot: "A" | "B";
  } | null>(null);

  // Reset the view whenever a new analysis result arrives. We track the
  // previous result reference and adjust state during render — the pattern
  // recommended by React for "adjust state when a prop/store value changes".
  const [prevResult, setPrevResult] = useState(result);
  if (result !== prevResult) {
    setPrevResult(result);
    setScale(fitScale);
    setStartSec(0);
  }

  // Observe container width.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleSpan = width / scale;
  const clampStart = useCallback(
    (s: number) => Math.max(0, Math.min(s, Math.max(0, maxDuration - visibleSpan))),
    [maxDuration, visibleSpan],
  );

  // Native wheel listener so we can preventDefault (passive:false).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setScale((prev) => {
        const next = Math.max(fitScale, Math.min(prev * factor, fitScale * 60));
        const tCursor = startSec + cursorX / prev;
        const newStart = tCursor - cursorX / next;
        setStartSec(clampStart(newStart));
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [startSec, fitScale, clampStart]);

  const zoomBy = (factor: number) => {
    setScale((prev) => {
      const next = Math.max(fitScale, Math.min(prev * factor, fitScale * 60));
      const center = startSec + visibleSpan / 2;
      setStartSec(clampStart(center - width / next / 2));
      return next;
    });
  };
  const fit = () => {
    setScale(fitScale);
    setStartSec(0);
  };

  const xOf = (t: number) => (t - startSec) * scale;
  const seekOnTrack = (slot: "A" | "B", t: number) => {
    const dur = slot === "A" ? durationA : durationB;
    const clamped = Math.max(0, Math.min(t, dur));
    const mapped = mapTimeAcrossMatches(clamped, slot, matches);
    if (mapped.inMatch) usePlayer.getState().seekBoth(mapped.a, mapped.b);
    else usePlayer.getState().seekOne(slot, clamped);
  };

  // Scrubbing state
  const dragRef = useRef<{
    slot: "A" | "B";
    moved: boolean;
  } | null>(null);

  const onTrackPointerDown = (slot: "A" | "B") => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = startSec + (e.clientX - rect.left) / scale;
    dragRef.current = { slot, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekOnTrack(slot, t);
  };
  const onTrackPointerMove = (slot: "A" | "B") => (e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.slot !== slot) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = startSec + (e.clientX - rect.left) / scale;
    dragRef.current.moved = true;
    seekOnTrack(slot, t);
  };
  const onTrackPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  // Pan via ruler drag
  const panRef = useRef<{ x: number; start: number } | null>(null);
  const onRulerPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    panRef.current = { x: e.clientX, start: startSec };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onRulerPointerMove = (e: React.PointerEvent) => {
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.x;
    const dSec = -dx / scale;
    setStartSec(clampStart(panRef.current.start + dSec));
  };
  const onRulerPointerUp = (e: React.PointerEvent) => {
    panRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  // Center on a match when selected (view-offset adjustment — analogous to
  // scrolling a list to the selected item, which is an accepted effect use).
  useEffect(() => {
    if (!selectedId) return;
    const m = matches.find((x) => x.id === selectedId);
    if (!m) return;
    const t = m.aStart;
    if (t < startSec || t > startSec + visibleSpan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStartSec(clampStart(t - visibleSpan * 0.3));
    }
  }, [selectedId]);

  const ticks = buildTicks(startSec, startSec + visibleSpan);

  const totalH = RULER_H + GAP + TRACK_H + GAP + TRACK_H + 8;
  const introOutro = result?.introOutro;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold">Timeline</h3>
          <span className="text-[11px] text-muted-foreground">
            click / drag to scrub · scroll to zoom · drag ruler to pan
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1.3)} aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fit} aria-label="Fit to view">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-lg bg-background/40"
        style={{ height: totalH }}
      >
        <svg
          width={width}
          height={totalH}
          className="block"
          style={{ touchAction: "none" }}
        >
          {/* Ruler */}
          <rect
            x={0}
            y={0}
            width={width}
            height={RULER_H}
            fill="transparent"
            onPointerDown={onRulerPointerDown}
            onPointerMove={onRulerPointerMove}
            onPointerUp={onRulerPointerUp}
            style={{ cursor: "grab" }}
          />
          {ticks.map((t) => {
            const x = xOf(t);
            if (x < 0 || x > width) return null;
            return (
              <g key={t}>
                <line x1={x} y1={0} x2={x} y2={totalH} stroke="currentColor" className="text-foreground/8" strokeWidth={1} />
                <text x={x + 3} y={13} className="fill-muted-foreground font-mono" fontSize={10}>
                  {formatTime(t)}
                </text>
              </g>
            );
          })}

          {/* Track A */}
          <TimelineTrack
            slot="A"
            y={RULER_H + GAP}
            duration={durationA}
            matches={matches}
            selectedId={selectedId}
            xOf={xOf}
            width={width}
            playhead={currentTimeA}
            onMatchPointerDown={(m, e) => {
              selectMatch(m.id);
              usePlayer.getState().seekBoth(m.aStart, m.bStart);
              e.stopPropagation();
            }}
            onMatchHover={(m, e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              setHover({
                match: m,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                slot: "A",
              });
            }}
            onMatchLeave={() => setHover(null)}
            onTrackPointerDown={onTrackPointerDown("A")}
            onTrackPointerMove={onTrackPointerMove("A")}
            onTrackPointerUp={onTrackPointerUp}
            introOutro={introOutro}
          />

          {/* Track B */}
          <TimelineTrack
            slot="B"
            y={RULER_H + GAP + TRACK_H + GAP}
            duration={durationB}
            matches={matches}
            selectedId={selectedId}
            xOf={xOf}
            width={width}
            playhead={currentTimeB}
            onMatchPointerDown={(m, e) => {
              selectMatch(m.id);
              usePlayer.getState().seekBoth(m.aStart, m.bStart);
              e.stopPropagation();
            }}
            onMatchHover={(m, e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              setHover({
                match: m,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                slot: "B",
              });
            }}
            onMatchLeave={() => setHover(null)}
            onTrackPointerDown={onTrackPointerDown("B")}
            onTrackPointerMove={onTrackPointerMove("B")}
            onTrackPointerUp={onTrackPointerUp}
            introOutro={introOutro}
          />

          {/* Track labels */}
          <text x={6} y={RULER_H + GAP + 14} className="fill-muted-foreground font-semibold" fontSize={11}>
            A
          </text>
          <text x={6} y={RULER_H + GAP + TRACK_H + GAP + 14} className="fill-muted-foreground font-semibold" fontSize={11}>
            B
          </text>
        </svg>

        {hover && (
          <MatchTooltip match={hover.match} x={hover.x} y={hover.y} slot={hover.slot} />
        )}
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> match
        </span>
        {introOutro?.intro && (
          <span className="inline-flex items-center gap-1.5">
            <Locate className="h-3 w-3 text-sage" /> intro
          </span>
        )}
        {introOutro?.outro && (
          <span className="inline-flex items-center gap-1.5">
            <Locate className="h-3 w-3 text-copper" /> outro
          </span>
        )}
        <span className="ml-auto font-mono">
          {formatTime(startSec)} – {formatTime(Math.min(maxDuration, startSec + visibleSpan))}
          {" · "}
          {Math.round((scale / fitScale) * 100)}%
        </span>
      </div>
    </div>
  );
}

function TimelineTrack({
  slot,
  y,
  duration,
  matches,
  selectedId,
  xOf,
  width,
  playhead,
  onMatchPointerDown,
  onMatchHover,
  onMatchLeave,
  onTrackPointerDown,
  onTrackPointerMove,
  onTrackPointerUp,
  introOutro,
}: {
  slot: "A" | "B";
  y: number;
  duration: number;
  matches: Match[];
  selectedId: string | null;
  xOf: (t: number) => number;
  width: number;
  playhead: number;
  onMatchPointerDown: (m: Match, e: React.PointerEvent) => void;
  onMatchHover: (m: Match, e: React.PointerEvent) => void;
  onMatchLeave: () => void;
  onTrackPointerDown: (e: React.PointerEvent) => void;
  onTrackPointerMove: (e: React.PointerEvent) => void;
  onTrackPointerUp: (e: React.PointerEvent) => void;
  introOutro?: { intro: Match | null; outro: Match | null };
}) {
  const durX = xOf(duration);
  return (
    <g>
      {/* Track background (clickable scrub area) */}
      <rect
        x={0}
        y={y}
        width={width}
        height={TRACK_H}
        rx={6}
        className="fill-muted/30"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        style={{ cursor: "text" }}
      />
      {/* Duration bar outline */}
      <rect
        x={Math.max(0, xOf(0))}
        y={y + 2}
        width={Math.max(0, durX - xOf(0))}
        height={TRACK_H - 4}
        rx={5}
        className="fill-background/60 stroke-border/60"
        strokeWidth={1}
      />

      {/* Match regions for this slot */}
      {matches.map((m) => {
        const start = slot === "A" ? m.aStart : m.bStart;
        const end = slot === "A" ? m.aEnd : m.bEnd;
        const x1 = xOf(start);
        const x2 = xOf(end);
        if (x2 < 0 || x1 > width) return null;
        const w = Math.max(3, x2 - x1);
        const color = groupColor(m.group ?? 0);
        const selected = m.id === selectedId;
        const isIntro = introOutro?.intro?.id === m.id;
        const isOutro = introOutro?.outro?.id === m.id;
        return (
          <g key={m.id + slot}>
            <rect
              x={x1}
              y={y + 3}
              width={w}
              height={TRACK_H - 6}
              rx={4}
              fill={color.soft}
              stroke={color.base}
              strokeWidth={selected ? 2 : 1}
              className={cn(selected && "drop-shadow")}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => onMatchPointerDown(m, e)}
              onPointerEnter={(e) => onMatchHover(m, e)}
              onPointerMove={(e) => onMatchHover(m, e)}
              onPointerLeave={onMatchLeave}
            />
            {(isIntro || isOutro) && (
              <text
                x={x1 + w / 2}
                y={y + TRACK_H / 2 + 3}
                textAnchor="middle"
                className="fill-foreground font-semibold"
                fontSize={9}
                style={{ pointerEvents: "none" }}
              >
                {isIntro ? "INTRO" : "OUTRO"}
              </text>
            )}
          </g>
        );
      })}

      {/* Playhead */}
      {playhead >= 0 && (
        <line
          x1={xOf(playhead)}
          y1={y - 2}
          x2={xOf(playhead)}
          y2={y + TRACK_H + 2}
          className="stroke-primary"
          strokeWidth={2}
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}

function MatchTooltip({
  match,
  x,
  y,
  slot,
}: {
  match: Match;
  x: number;
  y: number;
  slot: "A" | "B";
}) {
  const aLen = match.aEnd - match.aStart;
  const bLen = match.bEnd - match.bStart;
  // Position tooltip, flip if near right edge
  const flip = x > 260;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 w-[230px] rounded-lg border border-border bg-popover/95 p-2.5 text-[11px] shadow-xl backdrop-blur",
        flip ? "right-2" : "left-2",
      )}
      style={{ top: Math.max(8, y - 30) }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-semibold text-foreground">Match</span>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-primary">
          {Math.round(match.confidence * 100)}%
        </span>
      </div>
      <div className="space-y-1 font-mono text-muted-foreground">
        <Row label="A" value={`${formatTime(match.aStart)} → ${formatTime(match.aEnd)}`} />
        <Row label="B" value={`${formatTime(match.bStart)} → ${formatTime(match.bEnd)}`} />
        <Row label="len A" value={formatDuration(aLen)} />
        <Row label="len B" value={formatDuration(bLen)} />
        <Row label="method" value={match.method.join(" + ")} />
      </div>
      <div className="mt-1.5 text-[10px] text-muted-foreground">
        viewing {slot} · click to inspect
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/** Choose "nice" tick positions for the visible window. */
function buildTicks(start: number, end: number): number[] {
  const span = end - start;
  const target = 6; // ~6 ticks
  const rawStep = span / target;
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
  let step = steps[steps.length - 1];
  for (const s of steps) {
    if (s >= rawStep) {
      step = s;
      break;
    }
  }
  const first = Math.ceil(start / step) * step;
  const ticks: number[] = [];
  for (let t = first; t <= end; t += step) ticks.push(t);
  return ticks;
}
