/**
 * Global application state for Infro.
 *
 * Holds the two uploaded files, the user's analysis settings, the live
 * processing progress, and the final comparison result. The heavy lifting
 * (extraction + matching) is orchestrated by `useComparison`, which drives
 * this store.
 */

import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  type AnalysisSettings,
  type ComparisonResult,
  type MediaMeta,
  type StageProgress,
} from "@/lib/comparison/types";

export type AppStatus = "idle" | "processing" | "done" | "error";

interface FileSlot {
  file: File | null;
  meta: MediaMeta | null;
  previewUrl: string | null;
  audioAvailable: boolean | null;
}

interface AppState {
  slotA: FileSlot;
  slotB: FileSlot;
  settings: AnalysisSettings;
  status: AppStatus;
  stages: StageProgress[];
  currentStage: StageProgress | null;
  result: ComparisonResult | null;
  selectedMatchId: string | null;
  error: string | null;
  /** wall-clock processing time once complete */
  elapsedMs: number;

  // actions
  setFile: (slot: "A" | "B", file: File | null, meta: MediaMeta | null) => void;
  setAudioAvailability: (slot: "A" | "B", available: boolean) => void;
  updateSettings: (patch: Partial<AnalysisSettings>) => void;
  resetSettings: () => void;
  setStatus: (s: AppStatus, error?: string) => void;
  pushStage: (stage: StageProgress) => void;
  updateStage: (stage: StageProgress) => void;
  setResult: (r: ComparisonResult, elapsedMs: number) => void;
  selectMatch: (id: string | null) => void;
  reset: () => void;
  canStart: () => boolean;
}

const emptySlot: FileSlot = {
  file: null,
  meta: null,
  previewUrl: null,
  audioAvailable: null,
};

export const useStore = create<AppState>((set, get) => ({
  slotA: { ...emptySlot },
  slotB: { ...emptySlot },
  settings: { ...DEFAULT_SETTINGS },
  status: "idle",
  stages: [],
  currentStage: null,
  result: null,
  selectedMatchId: null,
  error: null,
  elapsedMs: 0,

  setFile: (slot, file, meta) => {
    const prev = get()[slot === "A" ? "slotA" : "slotB"];
    if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    const next: FileSlot = {
      file,
      meta,
      previewUrl,
      audioAvailable: null,
    };
    set({
      [slot === "A" ? "slotA" : "slotB"]: next,
      status: "idle",
      result: null,
      selectedMatchId: null,
      stages: [],
      currentStage: null,
      error: null,
    } as Partial<AppState>);
  },

  setAudioAvailability: (slot, available) => {
    const key = slot === "A" ? "slotA" : "slotB";
    set((s) => ({ [key]: { ...s[key], audioAvailable: available } } as Partial<AppState>));
  },

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

  setStatus: (st, error) =>
    set({ status: st, error: error ?? null }),

  pushStage: (stage) =>
    set((s) => ({
      stages: [...s.stages.filter((x) => x.stage !== stage.stage), stage],
      currentStage: stage,
    })),

  updateStage: (stage) =>
    set((s) => ({
      stages: s.stages.map((x) => (x.stage === stage.stage ? stage : x)),
      currentStage: stage,
    })),

  setResult: (r, elapsedMs) =>
    set({ result: r, status: "done", elapsedMs, currentStage: null }),

  selectMatch: (id) => set({ selectedMatchId: id }),

  reset: () => {
    const { slotA, slotB } = get();
    if (slotA.previewUrl) URL.revokeObjectURL(slotA.previewUrl);
    if (slotB.previewUrl) URL.revokeObjectURL(slotB.previewUrl);
    set({
      slotA: { ...emptySlot },
      slotB: { ...emptySlot },
      status: "idle",
      result: null,
      selectedMatchId: null,
      stages: [],
      currentStage: null,
      error: null,
      elapsedMs: 0,
    });
  },

  canStart: () => {
    const { slotA, slotB, settings, status } = get();
    if (status === "processing") return false;
    if (!slotA.file || !slotB.file) return false;
    if (settings.mode === "audio") {
      return slotA.audioAvailable !== false && slotB.audioAvailable !== false;
    }
    return true;
  },
}));
