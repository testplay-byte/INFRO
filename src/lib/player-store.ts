/**
 * Player store — coordinates synchronized seeking & playhead position
 * between the two video previews and the interactive timeline.
 *
 * Kept separate from the main analysis store so high-frequency timeupdate
 * events don't re-render analysis-related components.
 */

import { create } from "zustand";
import type { Match } from "@/lib/comparison/types";

interface PlayerState {
  currentTimeA: number;
  currentTimeB: number;
  playingA: boolean;
  playingB: boolean;
  durationA: number;
  durationB: number;
  /** Monotonically increasing nonce; bumping it triggers a seek. */
  seekNonce: number;
  seekA: number;
  seekB: number;

  setTime: (slot: "A" | "B", t: number) => void;
  setPlaying: (slot: "A" | "B", p: boolean) => void;
  setDuration: (slot: "A" | "B", d: number) => void;
  seekBoth: (a: number, b: number) => void;
  seekOne: (slot: "A" | "B", t: number) => void;
}

export const usePlayer = create<PlayerState>((set) => ({
  currentTimeA: 0,
  currentTimeB: 0,
  playingA: false,
  playingB: false,
  durationA: 0,
  durationB: 0,
  seekNonce: 0,
  seekA: 0,
  seekB: 0,

  setTime: (slot, t) =>
    set((s) =>
      slot === "A" ? { currentTimeA: t } : { currentTimeB: t },
    ),
  setPlaying: (slot, p) =>
    set((s) => (slot === "A" ? { playingA: p } : { playingB: p })),
  setDuration: (slot, d) =>
    set((s) => (slot === "A" ? { durationA: d } : { durationB: d })),
  seekBoth: (a, b) =>
    set((s) => ({
      seekA: a,
      seekB: b,
      seekNonce: s.seekNonce + 1,
      currentTimeA: a,
      currentTimeB: b,
    })),
  seekOne: (slot, t) =>
    set((s) => ({
      seekA: slot === "A" ? t : s.seekA,
      seekB: slot === "B" ? t : s.seekB,
      seekNonce: s.seekNonce + 1,
      ...(slot === "A" ? { currentTimeA: t } : { currentTimeB: t }),
    })),
}));

/**
 * Map a time in one video to the corresponding time in the other, using
 * the detected matches. When `t` falls inside a match, the matched time is
 * interpolated linearly across the matched region. Otherwise the time is
 * returned unchanged (the caller may choose to seek only one player).
 */
export function mapTimeAcrossMatches(
  t: number,
  fromSlot: "A" | "B",
  matches: Match[],
): { a: number; b: number; inMatch: boolean; match?: Match } {
  for (const m of matches) {
    if (fromSlot === "A" && t >= m.aStart && t <= m.aEnd) {
      const frac =
        m.aEnd > m.aStart ? (t - m.aStart) / (m.aEnd - m.aStart) : 0;
      return { a: t, b: m.bStart + frac * (m.bEnd - m.bStart), inMatch: true, match: m };
    }
    if (fromSlot === "B" && t >= m.bStart && t <= m.bEnd) {
      const frac =
        m.bEnd > m.bStart ? (t - m.bStart) / (m.bEnd - m.bStart) : 0;
      return { a: m.aStart + frac * (m.aEnd - m.aStart), b: t, inMatch: true, match: m };
    }
  }
  return { a: t, b: t, inMatch: false };
}
