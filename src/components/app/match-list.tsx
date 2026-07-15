"use client";

import { ChevronRight, Music2, Film, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePlayer } from "@/lib/player-store";
import { formatTime, formatDuration, confidenceLabel } from "@/lib/comparison/format";
import type { Match } from "@/lib/comparison/types";
import { groupColor } from "./match-colors";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MatchList() {
  const result = useStore((s) => s.result);
  const selectedId = useStore((s) => s.selectedMatchId);
  const selectMatch = useStore((s) => s.selectMatch);
  const matches = result?.matches ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/40">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <h3 className="text-[13px] font-semibold">
          Matches
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {matches.length}
          </span>
        </h3>
      </div>
      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <Layers className="h-6 w-6 opacity-50" />
          <p>No matches above the current threshold.</p>
          <p className="text-xs">Try lowering the similarity threshold in settings.</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[420px] flex-1">
          <ul className="divide-y divide-border/50">
            {matches.map((m, i) => (
              <MatchRow
                key={m.id}
                match={m}
                index={i}
                selected={m.id === selectedId}
                onSelect={() => {
                  selectMatch(m.id);
                  usePlayer.getState().seekBoth(m.aStart, m.bStart);
                }}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function MatchRow({
  match,
  index,
  selected,
  onSelect,
}: {
  match: Match;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const color = groupColor(match.group ?? 0);
  const aLen = match.aEnd - match.aStart;
  const hasVideo = match.method.includes("video-dhash") || match.method.includes("video-color") || match.method.includes("video");
  const hasAudio = match.method.some((mm) => mm.startsWith("audio"));

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-stretch gap-3 px-3 py-2.5 text-left transition-colors",
          selected ? "bg-accent/60" : "hover:bg-accent/30",
        )}
      >
        {/* color stripe */}
        <span
          className="mt-0.5 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: color.base }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              #{(index + 1).toString().padStart(2, "0")}
            </span>
            <span className="text-[13px] font-medium">
              {match.isIntro && "Intro"}
              {match.isOutro && "Outro"}
              {!match.isIntro && !match.isOutro && "Match"}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {hasVideo && <Film className="h-3 w-3 text-muted-foreground" />}
              {hasAudio && <Music2 className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>

          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
            <span>
              <span className="text-primary/80">A</span>{" "}
              {formatTime(match.aStart)}–{formatTime(match.aEnd)}
            </span>
            <span>
              <span className="text-sage/90">B</span>{" "}
              {formatTime(match.bStart)}–{formatTime(match.bEnd)}
            </span>
            <span className="col-span-2 flex items-center gap-2">
              <span>{formatDuration(aLen)}</span>
              <span className="opacity-40">·</span>
              <span>{confidenceLabel(match.confidence)}</span>
            </span>
          </div>

          {/* confidence bar */}
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(match.confidence * 100)}%`,
                backgroundColor: color.base,
              }}
            />
          </div>
        </div>
        <ChevronRight className="my-auto h-4 w-4 shrink-0 text-muted-foreground/50" />
      </button>
    </li>
  );
}
