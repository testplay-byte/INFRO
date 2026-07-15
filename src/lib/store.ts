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
  type DetectionResult,
  type MediaMeta,
  type SignatureData,
  type StageProgress,
} from "@/lib/comparison/types";

export type AppStatus = "idle" | "processing" | "done" | "error";
export type ViewMode = "compare" | "detect";

interface FileSlot {
  file: File | null;
  meta: MediaMeta | null;
  previewUrl: string | null;
  audioAvailable: boolean | null;
}

interface AppState {
  viewMode: ViewMode;
  slotA: FileSlot;
  slotB: FileSlot;
  /** Signature file for detect mode. */
  signatureFile: File | null;
  signatureData: SignatureData | null;
  settings: AnalysisSettings;
  status: AppStatus;
  stages: StageProgress[];
  currentStage: StageProgress | null;
  result: ComparisonResult | null;
  /** Detection result for detect mode. */
  detectionResult: DetectionResult | null;
  selectedMatchId: string | null;
  error: string | null;
  /** wall-clock processing time once complete */
  elapsedMs: number;

  // actions
  setViewMode: (mode: ViewMode) => void;
  setFile: (slot: "A" | "B", file: File | null, meta: MediaMeta | null) => void;
  setAudioAvailability: (slot: "A" | "B", available: boolean) => void;
  setSignature: (file: File | null, data: SignatureData | null) => void;
  updateSettings: (patch: Partial<AnalysisSettings>) => void;
  resetSettings: () => void;
  setStatus: (s: AppStatus, error?: string) => void;
  pushStage: (stage: StageProgress) => void;
  updateStage: (stage: StageProgress) => void;
  setResult: (r: ComparisonResult, elapsedMs: number) => void;
  setDetectionResult: (r: DetectionResult, elapsedMs: number) => void;
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
  viewMode: "compare",
  slotA: { ...emptySlot },
  slotB: { ...emptySlot },
  signatureFile: null,
  signatureData: null,
  settings: { ...DEFAULT_SETTINGS },
  status: "idle",
  stages: [],
  currentStage: null,
  result: null,
  detectionResult: null,
  selectedMatchId: null,
  error: null,
  elapsedMs: 0,

  setViewMode: (mode) =>
    set({
      viewMode: mode,
      status: "idle",
      result: null,
      detectionResult: null,
      selectedMatchId: null,
      stages: [],
      currentStage: null,
      error: null,
    }),

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
      detectionResult: null,
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

  setSignature: (file, data) =>
    set({
      signatureFile: file,
      signatureData: data,
      status: "idle",
      detectionResult: null,
      stages: [],
      currentStage: null,
      error: null,
    }),

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

  setDetectionResult: (r, elapsedMs) =>
    set({ detectionResult: r, status: "done", elapsedMs, currentStage: null }),

  selectMatch: (id) => set({ selectedMatchId: id }),

  reset: () => {
    const { slotA, slotB } = get();
    if (slotA.previewUrl) URL.revokeObjectURL(slotA.previewUrl);
    if (slotB.previewUrl) URL.revokeObjectURL(slotB.previewUrl);
    set({
      slotA: { ...emptySlot },
      slotB: { ...emptySlot },
      signatureFile: null,
      signatureData: null,
      status: "idle",
      result: null,
      detectionResult: null,
      selectedMatchId: null,
      stages: [],
      currentStage: null,
      error: null,
      elapsedMs: 0,
    });
  },

  canStart: () => {
    const { viewMode, slotA, slotB, signatureData, settings, status } = get();
    if (status === "processing") return false;
    if (viewMode === "detect") {
      return !!signatureData && (!!slotB.file || !!slotA.file);
    }
    if (!slotA.file || !slotB.file) return false;
    if (settings.mode === "audio") {
      return slotA.audioAvailable !== false && slotB.audioAvailable !== false;
    }
    return true;
  },
}));
