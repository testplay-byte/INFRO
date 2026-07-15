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
  Gauge,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { usePlayer, mapTimeAcrossMatches } from "@/lib/player-store";
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
import { Slider } from "@/components/ui/slider";

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

  const step = useCallback(
    (dir: number) => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (a) {
        const t = Math.max(
          0,
          Math.min(a.currentTime + dir * FRAME_STEP, a.duration || 0),
        );
        a.currentTime = t;
        const mapped = mapTimeAcrossMatches(t, "A", matches);
        if (b && mapped.inMatch) b.currentTime = mapped.b;
      }
    },
    [matches],
  );

  const setSpeed = useCallback((sp: number) => {
    speedRef.current = sp;
    if (videoARef.current) videoARef.current.playbackRate = sp;
    if (videoBRef.current) videoBRef.current.playbackRate = sp;
  }, []);

  const linked = playingA && playingB;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <VideoPane
          slot="A"
          label="Video A"
          accent="amber"
          previewUrl={slotA.previewUrl}
          videoRef={videoARef}
          matches={matches}
          fileName={slotA.meta?.fileName}
        />
        <VideoPane
          slot="B"
          label="Video B"
          accent="sage"
          previewUrl={slotB.previewUrl}
          videoRef={videoBRef}
          matches={matches}
          fileName={slotB.meta?.fileName}
        />
      </div>

      {/* Shared transport */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => step(-1)}
          aria-label="Step back"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={playBoth}
          aria-label={linked ? "Pause both" : "Play both"}
        >
          {linked ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => step(1)}
          aria-label="Step forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <Select defaultValue="1" onValueChange={(v) => setSpeed(parseFloat(v))}>
            <SelectTrigger className="h-8 w-[78px] text-xs">
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

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Link2
            className={cn("h-3.5 w-3.5", linked ? "text-sage" : "opacity-50")}
          />
          <span className="text-[11px]">
            {linked ? "Linked playback" : "Independent"}
          </span>
        </div>
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
}: {
  slot: "A" | "B";
  label: string;
  accent: "amber" | "sage";
  previewUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  matches: Match[];
  fileName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const currentTime = usePlayer((s) =>
    slot === "A" ? s.currentTimeA : s.currentTimeB,
  );
  const duration = usePlayer((s) =>
    slot === "A" ? s.durationA : s.durationB,
  );

  const inMatch = matches.some((m) =>
    slot === "A"
      ? currentTime >= m.aStart && currentTime <= m.aEnd
      : currentTime >= m.bStart && currentTime <= m.bEnd,
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl border border-border bg-black/50"
    >
      <video
        ref={videoRef}
        src={previewUrl ?? undefined}
        className="aspect-video w-full bg-black object-contain"
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
        onClick={() => {
          const v = videoRef.current;
          if (!v) return;
          if (v.paused) void v.play();
          else v.pause();
        }}
      />

      {/* Label + match badge */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex h-5 items-center rounded-md px-2 text-[11px] font-semibold backdrop-blur",
            accent === "sage"
              ? "bg-sage/25 text-sage"
              : "bg-primary/25 text-primary",
          )}
        >
          {label}
        </span>
        {inMatch && (
          <span className="inline-flex h-5 items-center rounded-md bg-foreground/20 px-1.5 text-[10px] font-medium text-foreground backdrop-blur">
            in match
          </span>
        )}
      </div>

      {/* Time */}
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[11px] text-foreground backdrop-blur">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Per-pane controls */}
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          className="grid h-7 w-7 place-items-center rounded-md bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background/90"
          aria-label="Toggle mute"
        >
          {muted || volume === 0 ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : volume < 0.5 ? (
            <Volume1 className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
        <div className="hidden h-7 w-20 items-center rounded-md bg-background/70 px-2 backdrop-blur sm:flex">
          <Slider
            value={[muted ? 0 : volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => {
              const nv = v[0] / 100;
              setVolume(nv);
              setMuted(nv === 0);
              if (videoRef.current) {
                videoRef.current.volume = nv;
                videoRef.current.muted = nv === 0;
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el.requestFullscreen?.();
          }}
          className="grid h-7 w-7 place-items-center rounded-md bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background/90"
          aria-label="Fullscreen"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>

      {fileName && (
        <div className="pointer-events-none absolute right-2.5 top-2.5 max-w-[55%] truncate rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur">
          {fileName}
        </div>
      )}
    </div>
  );
}
