"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  Play,
  Search,
  Columns,
  FileJson,
  Zap,
  Shield,
  Activity,
  Download,
  Check,
  X,
  Clock,
  Film,
  Music,
  ChevronRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Screen =
  | "home"
  | "compare-setup"
  | "compare-progress"
  | "detect-setup"
  | "detect-progress"
  | "results-compare"
  | "results-detect";

type Mode = "audio" | "video" | "combined";

interface MatchItem {
  id: number;
  label: string;
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
  confidence: number;
  method: string[];
  isIntro: boolean;
  isOutro: boolean;
}

const SAMPLE_MATCHES: MatchItem[] = [
  {
    id: 1,
    label: "Intro",
    aStart: 0,
    aEnd: 12.5,
    bStart: 3.2,
    bEnd: 15.7,
    confidence: 0.96,
    method: ["audio-chroma", "video-dhash"],
    isIntro: true,
    isOutro: false,
  },
  {
    id: 2,
    label: "Match #2",
    aStart: 45.3,
    aEnd: 52.1,
    bStart: 48.1,
    bEnd: 54.9,
    confidence: 0.91,
    method: ["audio-chroma"],
    isIntro: false,
    isOutro: false,
  },
  {
    id: 3,
    label: "Outro",
    aStart: 178.4,
    aEnd: 192.0,
    bStart: 175.2,
    bEnd: 188.8,
    confidence: 0.94,
    method: ["audio-chroma", "video-dhash"],
    isIntro: false,
    isOutro: true,
  },
];

export function AndroidAppPrototype() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("combined");
  const [hasVideoA, setHasVideoA] = useState(false);
  const [hasVideoB, setHasVideoB] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [hasDetectVideo, setHasDetectVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState("");

  // Simulate progress
  const startAnalysis = (target: Screen) => {
    setScreen(target === "results-compare" ? "compare-progress" : "detect-progress");
    setProgress(0);
    const stages = [
      { p: 0.15, d: "Decoding audio..." },
      { p: 0.35, d: "Generating fingerprints..." },
      { p: 0.55, d: "Extracting video frames..." },
      { p: 0.75, d: "Matching fingerprints..." },
      { p: 0.9, d: "Inferring intro/outro..." },
      { p: 1.0, d: "Complete" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= stages.length) {
        clearInterval(interval);
        setScreen(target);
        return;
      }
      setProgress(stages[i].p);
      setProgressDetail(stages[i].d);
      i++;
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1C1917] font-sans">
      {screen === "home" && (
        <HomeScreen
          onCompare={() => setScreen("compare-setup")}
          onDetect={() => setScreen("detect-setup")}
        />
      )}

      {screen === "compare-setup" && (
        <CompareSetupScreen
          mode={mode}
          setMode={setMode}
          hasVideoA={hasVideoA}
          hasVideoB={hasVideoB}
          setHasVideoA={setHasVideoA}
          setHasVideoB={setHasVideoB}
          onBack={() => setScreen("home")}
          onAnalyze={() => startAnalysis("results-compare")}
        />
      )}

      {screen === "compare-progress" && (
        <ProgressScreen
          progress={progress}
          detail={progressDetail}
          mode={mode}
        />
      )}

      {screen === "detect-setup" && (
        <DetectSetupScreen
          hasSignature={hasSignature}
          hasDetectVideo={hasDetectVideo}
          setHasSignature={setHasSignature}
          setHasDetectVideo={setHasDetectVideo}
          onBack={() => setScreen("home")}
          onDetect={() => startAnalysis("results-detect")}
        />
      )}

      {screen === "detect-progress" && (
        <ProgressScreen
          progress={progress}
          detail={progressDetail}
          mode="audio"
          isDetect
        />
      )}

      {screen === "results-compare" && (
        <ResultsScreen
          matches={SAMPLE_MATCHES}
          mode={mode}
          onNew={() => {
            setHasVideoA(false);
            setHasVideoB(false);
            setScreen("home");
          }}
          onBack={() => setScreen("compare-setup")}
        />
      )}

      {screen === "results-detect" && (
        <DetectResultsScreen
          onNew={() => {
            setHasSignature(false);
            setHasDetectVideo(false);
            setScreen("home");
          }}
          onBack={() => setScreen("detect-setup")}
        />
      )}
    </div>
  );
}

// ===================== HOME =====================

function HomeScreen({
  onCompare,
  onDetect,
}: {
  onCompare: () => void;
  onDetect: () => void;
}) {
  return (
    <div className="p-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10 pt-4">
        <div className="w-11 h-11 rounded-xl bg-[#B45309] flex items-center justify-center">
          <span className="text-white font-bold text-lg">I</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Infro</h1>
          <p className="text-xs text-[#78716C]">Intro &amp; Outro Detector</p>
        </div>
      </div>

      <h2 className="text-[28px] font-bold leading-tight mb-2">What do you want to do?</h2>
      <p className="text-[15px] text-[#78716C] leading-relaxed mb-8">
        Compare two videos to find shared segments, or detect intro/outro in a new video using a saved signature.
      </p>

      {/* Compare card */}
      <button
        onClick={onCompare}
        className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-5 mb-4 active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-xl bg-[#B45309] flex items-center justify-center mb-4">
          <Columns className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-1">Compare two videos</h3>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Upload two videos and find matching intro, outro, and shared clips. Export a signature for later use.
        </p>
      </button>

      {/* Detect card */}
      <button
        onClick={onDetect}
        className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-5 active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-xl bg-[#4D7C0F] flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-1">Detect from signature</h3>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Upload a signature JSON and a new video. Infro will find where the intro and outro appear.
        </p>
      </button>

      {/* Info */}
      <div className="mt-8 flex items-start gap-2 text-xs text-[#78716C]">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-[#4D7C0F]" />
        <p className="leading-relaxed">
          All processing happens on your device. Your videos never leave your phone.
        </p>
      </div>
    </div>
  );
}

// ===================== COMPARE SETUP =====================

function CompareSetupScreen({
  mode,
  setMode,
  hasVideoA,
  hasVideoB,
  setHasVideoA,
  setHasVideoB,
  onBack,
  onAnalyze,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  hasVideoA: boolean;
  hasVideoB: boolean;
  setHasVideoA: (v: boolean) => void;
  setHasVideoB: (v: boolean) => void;
  onBack: () => void;
  onAnalyze: () => void;
}) {
  const canAnalyze = hasVideoA && hasVideoB;

  return (
    <div className="p-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Compare Videos</h1>
      </div>

      {/* Mode selector */}
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-3">COMPARISON MODE</p>
      <div className="flex gap-2 mb-7">
        {(["audio", "video", "combined"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all",
              mode === m
                ? "bg-[#B45309] text-white"
                : "bg-white text-[#1C1917] border border-[#E7E5E4]",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Video A */}
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">VIDEO A</p>
      <button
        onClick={() => setHasVideoA(true)}
        className={cn(
          "w-full py-4 rounded-xl text-sm font-medium mb-6 border transition-all flex items-center justify-center gap-2",
          hasVideoA
            ? "bg-[#4D7C0F]/10 border-[#4D7C0F]/30 text-[#4D7C0F]"
            : "bg-white border-[#E7E5E4] text-[#1C1917]",
        )}
      >
        {hasVideoA ? (
          <>
            <Check className="w-4 h-4" />
            <span>episode_01.mp4 · 24:30</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-[#78716C]" />
            <span>Select video A</span>
          </>
        )}
      </button>

      {/* Video B */}
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">VIDEO B</p>
      <button
        onClick={() => setHasVideoB(true)}
        className={cn(
          "w-full py-4 rounded-xl text-sm font-medium mb-8 border transition-all flex items-center justify-center gap-2",
          hasVideoB
            ? "bg-[#4D7C0F]/10 border-[#4D7C0F]/30 text-[#4D7C0F]"
            : "bg-white border-[#E7E5E4] text-[#1C1917]",
        )}
      >
        {hasVideoB ? (
          <>
            <Check className="w-4 h-4" />
            <span>episode_02.mp4 · 23:45</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-[#78716C]" />
            <span>Select video B</span>
          </>
        )}
      </button>

      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        className={cn(
          "w-full py-4 rounded-xl text-base font-bold transition-all",
          canAnalyze
            ? "bg-[#B45309] text-white active:scale-[0.98]"
            : "bg-[#E7E5E4] text-[#78716C]",
        )}
      >
        Analyze Similarity
      </button>

      {/* Mode description */}
      <div className="mt-6 bg-white border border-[#E7E5E4] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-[#B45309]" />
          <span className="text-sm font-semibold">
            {mode === "audio" && "Audio mode — fastest"}
            {mode === "video" && "Video mode — visual matching"}
            {mode === "combined" && "Combined mode — most accurate"}
          </span>
        </div>
        <p className="text-xs text-[#78716C] leading-relaxed">
          {mode === "audio" && "Matches using audio fingerprints only. Best for intros/outros with reused music. ~10× faster than video."}
          {mode === "video" && "Matches using visual frame hashes. Best when audio was replaced but visuals are identical."}
          {mode === "combined" && "Fuses both audio and video signals. Catches matches that either mode alone would miss."}
        </p>
      </div>
    </div>
  );
}

// ===================== DETECT SETUP =====================

function DetectSetupScreen({
  hasSignature,
  hasDetectVideo,
  setHasSignature,
  setHasDetectVideo,
  onBack,
  onDetect,
}: {
  hasSignature: boolean;
  hasDetectVideo: boolean;
  setHasSignature: (v: boolean) => void;
  setHasDetectVideo: (v: boolean) => void;
  onBack: () => void;
  onDetect: () => void;
}) {
  const canDetect = hasSignature && hasDetectVideo;

  return (
    <div className="p-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Detect from Signature</h1>
      </div>

      <p className="text-sm text-[#78716C] leading-relaxed mb-7">
        Upload a signature JSON exported from Compare mode, then select a new video.
      </p>

      {/* Signature */}
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">SIGNATURE FILE</p>
      <button
        onClick={() => setHasSignature(true)}
        className={cn(
          "w-full py-4 rounded-xl text-sm font-medium mb-6 border transition-all flex items-center justify-center gap-2",
          hasSignature
            ? "bg-[#4D7C0F]/10 border-[#4D7C0F]/30 text-[#4D7C0F]"
            : "bg-white border-[#E7E5E4] text-[#1C1917]",
        )}
      >
        {hasSignature ? (
          <>
            <Check className="w-4 h-4" />
            <span>infro-signature.json · 2 segments</span>
          </>
        ) : (
          <>
            <FileJson className="w-4 h-4 text-[#78716C]" />
            <span>Select signature JSON</span>
          </>
        )}
      </button>

      {/* Video */}
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">VIDEO FILE</p>
      <button
        onClick={() => setHasDetectVideo(true)}
        className={cn(
          "w-full py-4 rounded-xl text-sm font-medium mb-8 border transition-all flex items-center justify-center gap-2",
          hasDetectVideo
            ? "bg-[#4D7C0F]/10 border-[#4D7C0F]/30 text-[#4D7C0F]"
            : "bg-white border-[#E7E5E4] text-[#1C1917]",
        )}
      >
        {hasDetectVideo ? (
          <>
            <Check className="w-4 h-4" />
            <span>episode_03.mp4 · 25:12</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-[#78716C]" />
            <span>Select video</span>
          </>
        )}
      </button>

      {/* Detect button */}
      <button
        onClick={onDetect}
        disabled={!canDetect}
        className={cn(
          "w-full py-4 rounded-xl text-base font-bold transition-all",
          canDetect
            ? "bg-[#B45309] text-white active:scale-[0.98]"
            : "bg-[#E7E5E4] text-[#78716C]",
        )}
      >
        Detect Intro &amp; Outro
      </button>
    </div>
  );
}

// ===================== PROGRESS =====================

function ProgressScreen({
  progress,
  detail,
  mode,
  isDetect = false,
}: {
  progress: number;
  detail: string;
  mode: Mode;
  isDetect?: boolean;
}) {
  const stages = [
    { id: "decode", label: "Decoding media" },
    { id: "fingerprint", label: "Generating fingerprints" },
    { id: "extract", label: "Extracting frames" },
    { id: "match", label: "Matching fingerprints" },
    { id: "infer", label: "Inferring intro/outro" },
  ];

  const currentStageIdx = Math.min(
    stages.length - 1,
    Math.floor(progress * stages.length),
  );

  return (
    <div className="p-6 pt-16">
      <h1 className="text-2xl font-bold mb-2">{isDetect ? "Detecting..." : "Analyzing..."}</h1>
      <p className="text-sm text-[#78716C] mb-8">
        {isDetect ? "Matching against signature" : `Mode: ${mode}`}
      </p>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-medium text-[#78716C]">{detail || "Working..."}</span>
          <span className="font-mono text-[#78716C]">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 bg-[#E7E5E4] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#B45309] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-1">
        {stages.map((s, i) => {
          const isDone = i < currentStageIdx;
          const isActive = i === currentStageIdx;
          const isPending = i > currentStageIdx;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive && "bg-[#B45309]/5",
              )}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <Check className="w-4 h-4 text-[#4D7C0F]" />
                ) : isActive ? (
                  <div className="w-4 h-4 border-2 border-[#B45309] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D6D3D1]" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isActive ? "font-semibold" : isDone ? "text-[#78716C]" : "text-[#D6D3D1]",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== RESULTS (COMPARE) =====================

function ResultsScreen({
  matches,
  mode,
  onNew,
  onBack,
}: {
  matches: MatchItem[];
  mode: Mode;
  onNew: () => void;
  onBack: () => void;
}) {
  const [showExportSheet, setShowExportSheet] = useState(false);
  const intro = matches.find((m) => m.isIntro);
  const outro = matches.find((m) => m.isOutro);

  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-4 sticky top-0 bg-[#FAFAF7] z-10 border-b border-[#E7E5E4]">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Results</h1>
        <button
          onClick={() => setShowExportSheet(true)}
          className="ml-auto px-3 py-1.5 rounded-lg bg-white border border-[#E7E5E4] flex items-center gap-1.5 text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div className="p-6">
        {/* Intro/Outro banner */}
        {(intro || outro) && (
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#B45309]" />
              <span className="text-sm font-semibold">
                {matches.length} matches found
              </span>
            </div>
            {intro && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4D7C0F] bg-[#4D7C0F]/10 px-2 py-0.5 rounded">
                  Intro
                </span>
                <span className="text-sm font-mono">
                  A {fmt(intro.aStart)}–{fmt(intro.aEnd)} · B {fmt(intro.bStart)}–{fmt(intro.bEnd)}
                </span>
              </div>
            )}
            {outro && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2410C] bg-[#C2410C]/10 px-2 py-0.5 rounded">
                  Outro
                </span>
                <span className="text-sm font-mono">
                  A {fmt(outro.aStart)}–{fmt(outro.aEnd)} · B {fmt(outro.bStart)}–{fmt(outro.bEnd)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">TIMELINE</p>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 mb-5">
          <MiniTimeline matches={matches} duration={200} />
        </div>

        {/* Stats */}
        <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">STATISTICS</p>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Matches" value={matches.length.toString()} />
            <Stat label="Avg confidence" value="94%" />
            <Stat label="Longest" value="12.5s" />
            <Stat label="Processing" value="8.3s" />
          </div>
        </div>

        {/* Match list */}
        <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">MATCHES</p>
        <div className="space-y-3 mb-6">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onNew}
            className="flex-1 py-3.5 rounded-xl bg-[#B45309] text-white font-bold text-sm active:scale-[0.98] transition-transform"
          >
            New Analysis
          </button>
        </div>
      </div>

      {/* Export sheet */}
      {showExportSheet && (
        <ExportSheet onClose={() => setShowExportSheet(false)} />
      )}
    </div>
  );
}

// ===================== RESULTS (DETECT) =====================

function DetectResultsScreen({
  onNew,
  onBack,
}: {
  onNew: () => void;
  onBack: () => void;
}) {
  const detections = [
    {
      label: "intro",
      found: true,
      start: 2.1,
      end: 14.6,
      confidence: 0.92,
      method: ["audio-chroma"],
    },
    {
      label: "outro",
      found: true,
      start: 171.3,
      end: 185.0,
      confidence: 0.88,
      method: ["audio-chroma"],
    },
  ];

  return (
    <div className="pb-8">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-4 sticky top-0 bg-[#FAFAF7] z-10 border-b border-[#E7E5E4]">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Detection Results</h1>
      </div>

      <div className="p-6">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-[#B45309]" />
            <span className="text-sm font-semibold">
              {detections.filter((d) => d.found).length} of {detections.length} segments found
            </span>
          </div>
          <p className="text-xs text-[#78716C]">Processed in 6.1s · audio only</p>
        </div>

        {/* Detections */}
        <div className="space-y-3 mb-6">
          {detections.map((d, i) => (
            <DetectionCard key={i} detection={d} />
          ))}
        </div>

        <button
          onClick={onNew}
          className="w-full py-3.5 rounded-xl bg-[#B45309] text-white font-bold text-sm active:scale-[0.98] transition-transform"
        >
          New Detection
        </button>
      </div>
    </div>
  );
}

// ===================== SHARED COMPONENTS =====================

function MatchCard({ match }: { match: MatchItem }) {
  const color = match.isIntro ? "#4D7C0F" : match.isOutro ? "#C2410C" : "#B45309";
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {match.label}
        </span>
        <span className="text-sm font-bold font-mono" style={{ color }}>
          {Math.round(match.confidence * 100)}%
        </span>
      </div>
      <p className="text-[15px] font-bold font-mono mb-1">
        A {fmt(match.aStart)}–{fmt(match.aEnd)}
      </p>
      <p className="text-[15px] font-bold font-mono mb-3">
        B {fmt(match.bStart)}–{fmt(match.bEnd)}
      </p>
      <div className="flex items-center gap-2 pt-3 border-t border-[#E7E5E4]">
        {match.method.map((m, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-[#78716C] font-mono">
            {m.startsWith("audio") ? <Music className="w-3 h-3" /> : <Film className="w-3 h-3" />}
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetectionCard({
  detection,
}: {
  detection: {
    label: string;
    found: boolean;
    start: number;
    end: number;
    confidence: number;
    method: string[];
  };
}) {
  const color = detection.label === "intro" ? "#4D7C0F" : "#C2410C";
  return (
    <div
      className="bg-white border rounded-2xl p-4"
      style={{ borderColor: detection.found ? `${color}40` : "#E7E5E4" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {detection.label}
        </span>
        {detection.found ? (
          <span className="flex items-center gap-1 text-xs font-medium text-[#4D7C0F]">
            <Check className="w-3.5 h-3.5" />
            Found · {Math.round(detection.confidence * 100)}%
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-[#78716C]">
            <X className="w-3.5 h-3.5" />
            Not found
          </span>
        )}
      </div>
      {detection.found ? (
        <>
          <p className="text-[20px] font-bold font-mono mb-2">
            {fmt(detection.start)} → {fmt(detection.end)}
          </p>
          <p className="text-xs text-[#78716C]">
            Duration: {fmt(detection.end - detection.start)}
          </p>
        </>
      ) : (
        <p className="text-sm text-[#78716C]">
          This segment was not found in the video.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#78716C]">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function MiniTimeline({ matches, duration }: { matches: MatchItem[]; duration: number }) {
  return (
    <div className="space-y-4">
      {/* Track A */}
      <div>
        <div className="flex justify-between text-[10px] text-[#78716C] mb-1">
          <span className="font-bold">A</span>
          <span className="font-mono">{fmt(duration)}</span>
        </div>
        <div className="relative h-7 bg-[#F5F5F0] rounded-lg overflow-hidden">
          {matches.map((m) => {
            const left = (m.aStart / duration) * 100;
            const width = ((m.aEnd - m.aStart) / duration) * 100;
            const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
            return (
              <div
                key={m.id}
                className="absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: `${color}30`,
                  border: `1px solid ${color}`,
                }}
              >
                {(m.isIntro || m.isOutro) && width > 8 && (
                  <span className="text-[8px] font-bold" style={{ color }}>
                    {m.isIntro ? "INTRO" : "OUTRO"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Track B */}
      <div>
        <div className="flex justify-between text-[10px] text-[#78716C] mb-1">
          <span className="font-bold">B</span>
          <span className="font-mono">{fmt(duration)}</span>
        </div>
        <div className="relative h-7 bg-[#F5F5F0] rounded-lg overflow-hidden">
          {matches.map((m) => {
            const left = (m.bStart / duration) * 100;
            const width = ((m.bEnd - m.bStart) / duration) * 100;
            const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
            return (
              <div
                key={m.id}
                className="absolute top-0.5 bottom-0.5 rounded-md"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: `${color}30`,
                  border: `1px solid ${color}`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExportSheet({ onClose }: { onClose: () => void }) {
  const [exported, setExported] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full bg-white rounded-t-3xl p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold mb-2">Export Signature</h3>
        <p className="text-sm text-[#78716C] mb-5">
          Save a JSON file containing the detected intro/outro fingerprints. Use it in Detect mode to find the same intro/outro in other videos.
        </p>
        <button
          onClick={() => setExported(true)}
          className={cn(
            "w-full py-3.5 rounded-xl font-bold text-sm transition-all",
            exported
              ? "bg-[#4D7C0F] text-white"
              : "bg-[#B45309] text-white active:scale-[0.98]",
          )}
        >
          {exported ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Saved to Downloads
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Save to Downloads
            </span>
          )}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 mt-2 text-sm font-medium text-[#78716C]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
