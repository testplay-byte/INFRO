"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Volume2,
  VolumeX,
  Volume1,
  Link2,
  Link2Off,
  Gauge,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { usePlayer, mapTimeLinked } from "@/lib/player-store";
import { formatTime } from "@/lib/comparison/format";
import type { Match } from "@/lib/comparison/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FRAME_STEP = 1 / 30;
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPreview() {
  const slotA = useStore((s) => s.slotA);
  const slotB = useStore((s) => s.slotB);
  const result = useStore((s) => s.result);
  const matches = result?.matches ?? [];

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const speedRef = useRef(1);
  const [linked, setLinked] = useState(true);

  const playingA = usePlayer((s) => s.playingA);
  const playingB = usePlayer((s) => s.playingB);
  const seekNonce = usePlayer((s) => s.seekNonce);

  // Apply seeks coming from the timeline / match selection.
  useEffect(() => {
    const { seekA, seekB } = usePlayer.getState();
    if (videoARef.current && isFinite(seekA)) {
      try {
        videoARef.current.currentTime = seekA;
      } catch {
        /* ignore */
      }
    }
    if (videoBRef.current && isFinite(seekB)) {
      try {
        videoBRef.current.currentTime = seekB;
      } catch {
        /* ignore */
      }
    }
  }, [seekNonce]);

  const playBoth = useCallback(() => {
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;
    if (playingA || playingB) {
      a.pause();
      b.pause();
    } else {
      a.playbackRate = speedRef.current;
      b.playbackRate = speedRef.current;
      void a.play().catch(() => {});
      void b.play().catch(() => {});
    }
  }, [playingA, playingB]);

  const stepBoth = useCallback(
    (dir: number) => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (a) {
        const t = Math.max(
          0,
          Math.min(a.currentTime + dir * FRAME_STEP, a.duration || 0),
        );
        a.currentTime = t;
        if (b && linked) {
          const mapped = mapTimeLinked(t, "A", matches);
          b.currentTime = Math.max(0, Math.min(mapped.b, b.duration || 0));
        }
      }
    },
    [matches, linked],
  );

  const setSpeed = useCallback((sp: number) => {
    speedRef.current = sp;
    if (videoARef.current) videoARef.current.playbackRate = sp;
    if (videoBRef.current) videoBRef.current.playbackRate = sp;
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VideoPane
          slot="A"
          label="Video A"
          accent="amber"
          previewUrl={slotA.previewUrl}
          videoRef={videoARef}
          matches={matches}
          fileName={slotA.meta?.fileName}
          linked={linked}
          otherVideoRef={videoBRef}
        />
        <VideoPane
          slot="B"
          label="Video B"
          accent="sage"
          previewUrl={slotB.previewUrl}
          videoRef={videoBRef}
          matches={matches}
          fileName={slotB.meta?.fileName}
          linked={linked}
          otherVideoRef={videoARef}
        />
      </div>

      {/* Shared transport */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => stepBoth(-1)}
          aria-label="Step both back"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={playBoth}
          aria-label={playingA || playingB ? "Pause both" : "Play both"}
        >
          {playingA || playingB ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => stepBoth(1)}
          aria-label="Step both forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="mx-2 h-6 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <Select defaultValue="1" onValueChange={(v) => setSpeed(parseFloat(v))}>
            <SelectTrigger className="h-9 w-[80px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map((s) => (
                <SelectItem key={s} value={s.toString()}>
                  {s}×
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mx-2 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={() => setLinked((l) => !l)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            linked
              ? "bg-sage/15 text-sage"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {linked ? (
            <Link2 className="h-3.5 w-3.5" />
          ) : (
            <Link2Off className="h-3.5 w-3.5" />
          )}
          {linked ? "Linked" : "Independent"}
        </button>
      </div>
    </div>
  );
}

function VideoPane({
  slot,
  label,
  accent,
  previewUrl,
  videoRef,
  matches,
  fileName,
  linked,
  otherVideoRef,
}: {
  slot: "A" | "B";
  label: string;
  accent: "amber" | "sage";
  previewUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  matches: Match[];
  fileName?: string;
  linked: boolean;
  otherVideoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(slot === "B"); // A audible by default
  const [volume, setVolume] = useState(1);
  const currentTime = usePlayer((s) =>
    slot === "A" ? s.currentTimeA : s.currentTimeB,
  );
  const duration = usePlayer((s) =>
    slot === "A" ? s.durationA : s.durationB,
  );
  const playing = usePlayer((s) =>
    slot === "A" ? s.playingA : s.playingB,
  );

  const inMatch = matches.some((m) =>
    slot === "A"
      ? currentTime >= m.aStart && currentTime <= m.aEnd
      : currentTime >= m.bStart && currentTime <= m.bEnd,
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.playbackRate = 1;
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [videoRef]);

  const seek = useCallback(
    (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      const clamped = Math.max(0, Math.min(t, v.duration || t));
      v.currentTime = clamped;
      // If linked, sync the other video using the dominant offset + match mapping
      if (linked && otherVideoRef.current) {
        const mapped = mapTimeLinked(clamped, slot, matches);
        const otherTime = slot === "A" ? mapped.b : mapped.a;
        otherVideoRef.current.currentTime = Math.max(
          0,
          Math.min(otherTime, otherVideoRef.current.duration || otherTime),
        );
      }
    },
    [videoRef, otherVideoRef, linked, slot, matches],
  );

  const step = useCallback(
    (dir: number) => {
      const v = videoRef.current;
      if (!v) return;
      const t = Math.max(0, Math.min(v.currentTime + dir * FRAME_STEP, v.duration || 0));
      seek(t);
    },
    [videoRef, seek],
  );

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      {/* Video area */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden bg-black"
      >
        <video
          ref={videoRef}
          src={previewUrl ?? undefined}
          className="h-full w-full bg-black object-contain"
          playsInline
          onTimeUpdate={(e) =>
            usePlayer.getState().setTime(slot, e.currentTarget.currentTime)
          }
          onLoadedMetadata={(e) => {
            usePlayer.getState().setDuration(slot, e.currentTarget.duration);
            e.currentTarget.volume = volume;
            e.currentTarget.muted = muted;
          }}
          onPlay={() => usePlayer.getState().setPlaying(slot, true)}
          onPause={() => usePlayer.getState().setPlaying(slot, false)}
          onClick={togglePlay}
        />

        {/* Center play/pause overlay (independent) */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 grid place-items-center bg-black/20 transition-opacity hover:bg-black/30"
            aria-label={`Play ${label}`}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-background/80 backdrop-blur transition-transform hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 text-foreground" />
            </div>
          </button>
        )}

        {/* Label + match badge */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-md px-2.5 text-xs font-bold backdrop-blur",
              accent === "sage"
                ? "bg-sage/25 text-sage"
                : "bg-primary/25 text-primary",
            )}
          >
            {label}
          </span>
          {inMatch && (
            <span className="inline-flex h-6 items-center rounded-md bg-foreground/20 px-2 text-[11px] font-semibold text-foreground backdrop-blur">
              in match
            </span>
          )}
        </div>

        {fileName && (
          <div className="pointer-events-none absolute right-3 top-3 max-w-[55%] truncate rounded-md bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground backdrop-blur">
            {fileName}
          </div>
        )}

        {/* Per-pane controls (top-right) */}
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
      </div>

      {/* Seek bar + independent controls */}
      <div className="border-t border-border/60 px-3 py-2.5">
        {/* Clickable progress bar */}
        <div
          className="group relative h-2.5 cursor-pointer rounded-full bg-muted"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * (duration || 0));
          }}
        >
          {/* Match regions on the seek bar */}
          {matches.map((m) => {
            const start = slot === "A" ? m.aStart : m.bStart;
            const end = slot === "A" ? m.aEnd : m.bEnd;
            if (duration <= 0) return null;
            const leftPct = (start / duration) * 100;
            const widthPct = Math.max(0.5, ((end - start) / duration) * 100);
            return (
              <div
                key={m.id + slot}
                className="absolute top-0 h-full rounded-full bg-primary/30"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
            );
          })}
          {/* Progress fill */}
          <div
            className="absolute top-0 h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          {/* Playhead */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md transition-[left] duration-100"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Time + independent controls */}
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

          {/* Volume slider */}
          <div className="hidden items-center gap-1.5 sm:flex">
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
          </div>

          <div className="rounded-md bg-muted/60 px-2 py-1 font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
