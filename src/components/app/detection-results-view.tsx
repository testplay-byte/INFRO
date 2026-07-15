"use client";

import { useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Volume2,
  VolumeX,
  Volume1,
  Check,
  X,
  Clock,
  Music2,
  Film,
  Search,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { usePlayer } from "@/lib/player-store";
import { formatTime, formatDuration } from "@/lib/comparison/format";
import type { SegmentDetection } from "@/lib/comparison/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DetectionResultsView() {
  const result = useStore((s) => s.detectionResult);
  if (!result) return null;

  const { detections, videoMeta, processingTimeMs, framesAnalyzed } = result;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Search className="h-4 w-4 text-primary" />
            Detection Results
          </span>
          <span className="text-sm text-muted-foreground">
            {detections.filter((d) => d.found).length} of {detections.length}{" "}
            segment{detections.length === 1 ? "" : "s"} found
          </span>
          <span className="ml-auto text-xs text-muted-foreground/70">
            processed in {(processingTimeMs / 1000).toFixed(1)}s ·{" "}
            {framesAnalyzed} frames
          </span>
        </div>
      </div>

      {/* Video preview with detected regions */}
      <SingleVideoPreview detections={detections} />

      {/* Detection cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {detections.map((d, i) => (
          <DetectionCard key={i} detection={d} />
        ))}
      </div>
    </div>
  );
}

function DetectionCard({ detection: d }: { detection: SegmentDetection }) {
  const accent =
    d.label === "intro"
      ? "sage"
      : d.label === "outro"
        ? "copper"
        : "primary";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        d.found
          ? accent === "sage"
            ? "border-sage/40 bg-sage/5"
            : accent === "copper"
              ? "border-copper/40 bg-copper/5"
              : "border-primary/40 bg-primary/5"
          : "border-border/50 bg-card/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-md px-2.5 text-xs font-bold uppercase",
              accent === "sage" && "bg-sage/20 text-sage",
              accent === "copper" && "bg-copper/20 text-copper",
              accent === "primary" && "bg-primary/20 text-primary",
            )}
          >
            {d.label}
          </span>
          {d.found ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-sage">
              <Check className="h-3.5 w-3.5" />
              Found
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Not found
            </span>
          )}
        </div>
        {d.found && (
          <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
            {Math.round(d.confidence * 100)}%
          </span>
        )}
      </div>

      {d.found ? (
        <div className="mt-3 space-y-2 font-mono text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">In new video</span>
            <span className="font-semibold text-foreground">
              {formatTime(d.start)} → {formatTime(d.end)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="text-foreground">
              {formatDuration(d.end - d.start)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Original</span>
            <span className="text-muted-foreground">
              {formatTime(d.signatureStart)} → {formatTime(d.signatureEnd)}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {d.method.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {m.startsWith("audio") ? (
                  <Music2 className="h-2.5 w-2.5" />
                ) : (
                  <Film className="h-2.5 w-2.5" />
                )}
                {m}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          This segment was not detected in the new video. It may not be present,
          or the visual/audio content may differ too much from the signature.
        </p>
      )}
    </div>
  );
}

function SingleVideoPreview({
  detections,
}: {
  detections: SegmentDetection[];
}) {
  const slotB = useStore((s) => s.slotB);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [playing, setPlaying] = useState(false);

  const currentTime = usePlayer((s) => s.currentTimeB);
  const duration = usePlayer((s) => s.durationB);

  const seek = useCallback(
    (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }, []);

  const step = useCallback(
    (dir: number) => {
      const v = videoRef.current;
      if (!v) return;
      seek(v.currentTime + dir * (1 / 30));
    },
    [seek],
  );

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <div ref={containerRef} className="relative aspect-video w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={slotB.previewUrl ?? undefined}
          className="h-full w-full bg-black object-contain"
          playsInline
          onTimeUpdate={(e) => usePlayer.getState().setTime("B", e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            usePlayer.getState().setDuration("B", e.currentTarget.duration);
            e.currentTarget.volume = volume;
            e.currentTarget.muted = muted;
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
        />

        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 grid place-items-center bg-black/20 transition-opacity hover:bg-black/30"
            aria-label="Play"
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-background/80 backdrop-blur transition-transform hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 text-foreground" />
            </div>
          </button>
        )}

        {/* Detected region badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {detections.filter((d) => d.found).map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => seek(d.start)}
              className={cn(
                "pointer-events-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold backdrop-blur transition-transform hover:scale-105",
                d.label === "intro"
                  ? "bg-sage/25 text-sage"
                  : d.label === "outro"
                    ? "bg-copper/25 text-copper"
                    : "bg-primary/25 text-primary",
              )}
            >
              {d.label}: {formatTime(d.start)}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (videoRef.current) videoRef.current.muted = next;
            }}
            className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background/90"
            aria-label="Toggle mute"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : volume < 0.5 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const el = containerRef.current;
              if (!el) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void el.requestFullscreen?.();
            }}
            className="grid h-8 w-8 place-items-center rounded-md bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background/90"
            aria-label="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/70 px-2 py-0.5 font-mono text-xs text-foreground backdrop-blur">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Seek bar */}
      <div className="border-t border-border/60 px-3 py-2.5">
        <div
          className="group relative h-2.5 cursor-pointer rounded-full bg-muted"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * (duration || 0));
          }}
        >
          {/* Detected regions */}
          {detections.filter((d) => d.found).map((d, i) => {
            if (duration <= 0) return null;
            const leftPct = (d.start / duration) * 100;
            const widthPct = Math.max(0.5, ((d.end - d.start) / duration) * 100);
            return (
              <div
                key={i}
                className={cn(
                  "absolute top-0 h-full rounded-full",
                  d.label === "intro"
                    ? "bg-sage/40"
                    : d.label === "outro"
                      ? "bg-copper/40"
                      : "bg-primary/40",
                )}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
            );
          })}
          <div
            className="absolute top-0 h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md transition-[left] duration-100"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Step back"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Step forward"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <div className="ml-1 flex-1" />
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume * 100}
            onChange={(e) => {
              const nv = Number(e.target.value) / 100;
              setVolume(nv);
              setMuted(nv === 0);
              if (videoRef.current) {
                videoRef.current.volume = nv;
                videoRef.current.muted = nv === 0;
              }
            }}
            className="timeline-range h-1 w-20"
          />
          <div className="rounded-md bg-muted/60 px-2 py-1 font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
