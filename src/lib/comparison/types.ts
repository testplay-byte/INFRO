/**
 * Core type definitions for the Infro similarity engine.
 *
 * The engine is deliberately modular: each analysis technique produces a
 * standardized `FingerprintStream`, and every detector produces a
 * standardized `Match` object. This lets us combine / swap techniques
 * without touching the UI or the matching orchestration.
 */

/** The three user-selectable comparison modes. */
export type ComparisonMode = "audio" | "video" | "combined";

/** Granular processing stage, surfaced to the UI for progress reporting. */
export type StageId =
  | "loading"
  | "decoding"
  | "extracting-audio"
  | "extracting-frames"
  | "fingerprinting"
  | "comparing"
  | "building-timeline"
  | "rendering"
  | "done"
  | "error";

export interface StageProgress {
  stage: StageId;
  /** Human readable label shown in the progress panel. */
  label: string;
  /** 0..1 progress for the current stage. */
  progress: number;
  /** Optional sub-detail (e.g. "frame 124 / 600"). */
  detail?: string;
}

/**
 * A time-stamped sequence of feature vectors produced by one analysis
 * technique. The matching engine consumes these generically.
 */
export interface FingerprintStream {
  /** Which modality / technique produced this stream. */
  kind: "video-dhash" | "video-color" | "audio-chroma" | "audio-mel";
  /** Seconds between consecutive samples. */
  hop: number;
  /** Sample timestamps in seconds (length === vectors.length). */
  times: Float32Array;
  /** Feature vectors — interpretation depends on `kind`. */
  vectors: Float32Array[];
  /** For hash streams: packed 32-bit hashes as Uint32Array (else null). */
  hashes: Uint32Array | null;
  /** Original length of the source media this stream was derived from. */
  sourceDuration: number;
}

export interface Match {
  id: string;
  /** Inclusive start / exclusive end in video A (seconds). */
  aStart: number;
  aEnd: number;
  /** Inclusive start / exclusive end in video B (seconds). */
  bStart: number;
  bEnd: number;
  /** 0..1 confidence. */
  confidence: number;
  /** Which technique(s) detected this match. */
  method: string[];
  /** Mean per-frame similarity inside the matched region. */
  similarity: number;
  /** Whether this region was classified as the intro. */
  isIntro?: boolean;
  /** Whether this region was classified as the outro. */
  isOutro?: boolean;
  /** Color-group index (derived from time offset) for timeline linking. */
  group?: number;
}

export interface IntroOutroResult {
  intro: Match | null;
  outro: Match | null;
  /** Short, human-readable rationale for the inference. */
  rationale: string;
}

export interface MediaMeta {
  fileName: string;
  fileType: string;
  /** seconds */
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
  /** bytes */
  size: number;
}

export interface ComparisonStats {
  totalMatches: number;
  longestMatchDuration: number;
  averageConfidence: number;
  totalMatchedDuration: number;
  processingTimeMs: number;
  framesAnalyzed: number;
  audioSamplesAnalyzed: number;
  detectedIntro: boolean;
  detectedOutro: boolean;
}

export interface ComparisonResult {
  matches: Match[];
  introOutro: IntroOutroResult;
  stats: ComparisonStats;
  streamA: MediaMeta;
  streamB: MediaMeta;
  mode: ComparisonMode;
  /** Match groups keyed by a shared offset-cluster id, used for coloring. */
  groupCount: number;
  /** Robust signature containing actual fingerprints for export. */
  signature?: SignatureData;
  /** Per-frame audio similarity curve for detailed visualization. */
  audioSimilarityCurve?: SimilarityPoint[];
  /** Per-frame video similarity curve for detailed visualization. */
  videoSimilarityCurve?: SimilarityPoint[];
  /** Diagnostics log from the analysis worker. */
  diagnostics?: string[];
}

/** A point in the similarity curve — one per analyzed frame. */
export interface SimilarityPoint {
  /** Time in video A (seconds). */
  timeA: number;
  /** Time in video B (seconds) at the matched offset. */
  timeB: number;
  /** Similarity score 0..1. */
  similarity: number;
  /** Whether this point is inside a detected match. */
  inMatch: boolean;
}

/**
 * A robust, portable signature containing the actual fingerprint data for
 * detected intro/outro segments. This can be saved as JSON and later loaded
 * to detect the same intro/outro in a NEW video via fingerprint matching.
 */
export interface SignatureData {
  version: "1.0";
  generatedAt: string;
  mode: ComparisonMode;
  frameSampleRate: number;
  audioSampleRate: number;
  sources: {
    a: { fileName: string; duration: number };
    b: { fileName: string; duration: number };
  };
  segments: SignatureSegment[];
}

export interface SignatureSegment {
  label: "intro" | "outro" | "match";
  /** Time range in source A. */
  aStart: number;
  aEnd: number;
  /** Time range in source B. */
  bStart: number;
  bEnd: number;
  confidence: number;
  method: string[];
  /** Video dHash fingerprints (32-bit) for the segment frames. */
  videoHashes: number[];
  /** Timestamps (seconds) for each video frame. */
  videoTimes: number[];
  /** Hop (seconds) between video frames. */
  videoHop: number;
  /** Audio chroma feature vectors (12-dim) for the segment. */
  audioChroma: number[][];
  /** Timestamps (seconds) for each audio frame. */
  audioTimes: number[];
  /** Hop (seconds) between audio frames. */
  audioHop: number;
}

/** Result of detecting intro/outro in a new video using a signature. */
export interface DetectionResult {
  /** Where each signature segment was found in the new video. */
  detections: SegmentDetection[];
  /** Metadata of the analyzed video. */
  videoMeta: MediaMeta;
  /** Processing stats. */
  processingTimeMs: number;
  framesAnalyzed: number;
  audioSamplesAnalyzed: number;
}

export interface SegmentDetection {
  label: "intro" | "outro" | "match";
  /** Time range in the NEW video where this segment was found. */
  start: number;
  end: number;
  /** Original time range from the signature. */
  signatureStart: number;
  signatureEnd: number;
  confidence: number;
  method: string[];
  found: boolean;
}

/** User-tunable advanced settings. */
export interface AnalysisSettings {
  mode: ComparisonMode;
  /** Frames extracted per second of video. */
  frameSampleRate: number; // fps
  /** Target sample rate for audio analysis (Hz). */
  audioSampleRate: number;
  /** 0..1 — minimum normalized similarity for a frame pair to count. */
  similarityThreshold: number;
  /** Minimum length (seconds) for a region to be reported as a match. */
  minMatchDuration: number;
  /** Max gap (seconds) allowed inside a single matching region. */
  maxGap: number;
  /** 0..1 — portion of frames that must match within a window. */
  matchDensity: number;
  /** "fast" downsamples/aggressively; "accurate" uses denser sampling. */
  precision: "fast" | "balanced" | "accurate";
  /** Use WebCodecs / OffscreenCanvas paths when available. */
  gpuAcceleration: boolean;
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  mode: "combined",
  frameSampleRate: 2,
  audioSampleRate: 8000,
  similarityThreshold: 0.9,
  minMatchDuration: 10,
  maxGap: 1.0,
  matchDensity: 0.9,
  precision: "balanced",
  gpuAcceleration: true,
};

/** Precision presets — applied on top of explicit settings. */
export const PRECISION_PRESETS: Record<
  AnalysisSettings["precision"],
  { frameSampleRate: number; audioHop: number; fftSize: number }
> = {
  fast: { frameSampleRate: 1, audioHop: 0.1, fftSize: 1024 },
  balanced: { frameSampleRate: 2, audioHop: 0.05, fftSize: 2048 },
  accurate: { frameSampleRate: 4, audioHop: 0.025, fftSize: 4096 },
};
