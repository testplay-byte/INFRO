"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Search,
  Columns,
  FileJson,
  Zap,
  Shield,
  Activity,
  Download,
  Check,
  X,
  Film,
  Music,
  Settings,
  ChevronRight,
  SkipBack,
  SkipForward,
  Link2,
  Volume2,
  VolumeX,
  Maximize,
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

const DURATION = 200;

export function AndroidAppPrototype() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("combined");
  const [hasVideoA, setHasVideoA] = useState(false);
  const [hasVideoB, setHasVideoB] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [hasDetectVideo, setHasDetectVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    similarityThreshold: 90,
    minMatchDuration: 10,
    maxGap: 1.0,
    matchDensity: 90,
    frameSampleRate: 2,
    audioSampleRate: 30,
  });

  const startAnalysis = (target: Screen) => {
    setScreen(target === "results-compare" ? "compare-progress" : "detect-progress");
    setProgress(0);
    setProgressStage(0);
    const stages = [
      { p: 0.15, s: 1 },
      { p: 0.35, s: 2 },
      { p: 0.55, s: 3 },
      { p: 0.75, s: 4 },
      { p: 0.92, s: 5 },
      { p: 1.0, s: 6 },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= stages.length) {
        clearInterval(interval);
        setTimeout(() => setScreen(target), 300);
        return;
      }
      setProgress(stages[i].p);
      setProgressStage(stages[i].s);
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
          onOpenSettings={() => setShowSettings(true)}
          settings={settings}
        />
      )}

      {showSettings && (
        <SettingsSheet
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {screen === "compare-progress" && (
        <ProgressScreen progress={progress} stage={progressStage} mode={mode} />
      )}

      {screen === "detect-setup" && (
        <DetectSetupScreen
          hasSignature={hasSignature}
          hasDetectVideo={hasDetectVideo}
          setHasSignature={setHasSignature}
          setHasDetectVideo={setHasDetectVideo}
          onBack={() => setScreen("home")}
          onDetect={() => startAnalysis("results-detect")}
          onOpenSettings={() => setShowSettings(true)}
          settings={settings}
        />
      )}

      {screen === "detect-progress" && (
        <ProgressScreen progress={progress} stage={progressStage} mode="audio" isDetect />
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
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-8 pb-8">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-auto mt-4">
        <div className="w-9 h-9 rounded-xl bg-[#B45309] flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-base">I</span>
        </div>
        <span className="text-lg font-bold tracking-tight">Infro</span>
      </div>

      {/* Center content */}
      <div className="py-8">
        <h1 className="text-[26px] font-bold leading-[1.2] mb-2">
          Find intros,<br />outros &amp; matches
        </h1>
        <p className="text-[14px] text-[#78716C] leading-relaxed mb-8">
          Compare two videos or detect from a signature.
        </p>

        {/* Two options */}
        <div className="space-y-3">
          <button
            onClick={onCompare}
            className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-4 active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#B45309]/10 flex items-center justify-center shrink-0">
              <Columns className="w-5 h-5 text-[#B45309]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold">Compare videos</h3>
              <p className="text-[12px] text-[#78716C] mt-0.5">Find shared segments between two videos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D6D3D1] shrink-0" />
          </button>

          <button
            onClick={onDetect}
            className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-4 active:scale-[0.98] transition-transform flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#4D7C0F]/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-[#4D7C0F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold">Detect from signature</h3>
              <p className="text-[12px] text-[#78716C] mt-0.5">Find intro/outro in a new video</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D6D3D1] shrink-0" />
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#A8A29E]">
        <Shield className="w-3 h-3 text-[#4D7C0F]" />
        <span>All processing happens on your device</span>
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
  onOpenSettings,
  settings,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  hasVideoA: boolean;
  hasVideoB: boolean;
  setHasVideoA: (v: boolean) => void;
  setHasVideoB: (v: boolean) => void;
  onBack: () => void;
  onAnalyze: () => void;
  onOpenSettings: () => void;
  settings: typeof DEFAULT_SETTINGS;
}) {
  const canAnalyze = hasVideoA && hasVideoB;

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-6 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold">Compare Videos</h1>
        <button onClick={onOpenSettings} className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center active:bg-neutral-100">
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Mode selector — segmented control */}
      <div className="bg-[#F5F5F0] rounded-xl p-1 flex gap-1 mb-6">
        {(["audio", "video", "combined"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-[13px] font-semibold capitalize transition-all",
              mode === m
                ? "bg-white text-[#B45309] shadow-sm"
                : "text-[#78716C]",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <div className="bg-[#B45309]/5 border border-[#B45309]/15 rounded-xl p-3 mb-6">
        <p className="text-[12px] text-[#78716C] leading-relaxed">
          {mode === "audio" && "🎵 Matches audio fingerprints only — fastest, best for reused music"}
          {mode === "video" && "🎬 Matches visual frames — best when audio differs"}
          {mode === "combined" && "🎯 Fuses audio + video — most accurate, recommended"}
        </p>
      </div>

      {/* Video A */}
      <VideoPicker
        label="Video A"
        selected={hasVideoA}
        onSelect={() => setHasVideoA(true)}
        fileName="episode_01.mp4"
        duration="24:30"
      />

      {/* Video B */}
      <VideoPicker
        label="Video B"
        selected={hasVideoB}
        onSelect={() => setHasVideoB(true)}
        fileName="episode_02.mp4"
        duration="23:45"
      />

      <div className="mt-auto pt-6">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={cn(
            "w-full py-3.5 rounded-xl text-[15px] font-bold transition-all",
            canAnalyze
              ? "bg-[#B45309] text-white active:scale-[0.98]"
              : "bg-[#E7E5E4] text-[#A8A29E]",
          )}
        >
          Analyze Similarity
        </button>
      </div>
    </div>
  );
}

function VideoPicker({
  label,
  selected,
  onSelect,
  fileName,
  duration,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  fileName: string;
  duration: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">{label.toUpperCase()}</p>
      <button
        onClick={onSelect}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all flex items-center gap-3 p-4",
          selected
            ? "border-[#4D7C0F]/40 bg-[#4D7C0F]/5"
            : "border-[#E7E5E4] bg-white active:scale-[0.99]",
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            selected ? "bg-[#4D7C0F]/15" : "bg-[#F5F5F0]",
          )}
        >
          {selected ? (
            <Check className="w-5 h-5 text-[#4D7C0F]" />
          ) : (
            <Upload className="w-4 h-4 text-[#78716C]" />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          {selected ? (
            <>
              <p className="text-[14px] font-semibold truncate">{fileName}</p>
              <p className="text-[12px] text-[#78716C]">{duration} · ready</p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-[#1C1917]">Tap to select</p>
              <p className="text-[12px] text-[#78716C]">mp4, mov, webm, mkv</p>
            </>
          )}
        </div>
      </button>
    </div>
  );
}

// ===================== SETTINGS SHEET =====================

const DEFAULT_SETTINGS = {
  similarityThreshold: 90,
  minMatchDuration: 10,
  maxGap: 1.0,
  matchDensity: 90,
  frameSampleRate: 2,
  audioSampleRate: 30,
};

function SettingsSheet({
  settings,
  setSettings,
  onClose,
}: {
  settings: typeof DEFAULT_SETTINGS;
  setSettings: (s: typeof DEFAULT_SETTINGS) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full bg-white rounded-t-3xl p-6 pb-8 max-h-[80%] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Analysis Settings</h3>
          <button onClick={onClose} className="text-[#78716C] text-sm font-medium">Done</button>
        </div>

        <div className="space-y-5">
          <SettingSlider
            label="Similarity threshold"
            value={settings.similarityThreshold}
            min={70}
            max={98}
            step={1}
            unit="%"
            onChange={(v) => setSettings({ ...settings, similarityThreshold: v })}
          />
          <SettingSlider
            label="Min match duration"
            value={settings.minMatchDuration}
            min={2}
            max={30}
            step={1}
            unit="s"
            onChange={(v) => setSettings({ ...settings, minMatchDuration: v })}
          />
          <SettingSlider
            label="Max gap within match"
            value={settings.maxGap}
            min={0.3}
            max={3}
            step={0.1}
            unit="s"
            onChange={(v) => setSettings({ ...settings, maxGap: v })}
          />
          <SettingSlider
            label="Match density"
            value={settings.matchDensity}
            min={30}
            max={95}
            step={5}
            unit="%"
            onChange={(v) => setSettings({ ...settings, matchDensity: v })}
          />
          <SettingSlider
            label="Frame sample rate"
            value={settings.frameSampleRate}
            min={1}
            max={6}
            step={1}
            unit=" fps"
            onChange={(v) => setSettings({ ...settings, frameSampleRate: v })}
          />
          <SettingSlider
            label="Audio sample rate"
            value={settings.audioSampleRate}
            min={8}
            max={48}
            step={2}
            unit=" kHz"
            onChange={(v) => setSettings({ ...settings, audioSampleRate: v })}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 rounded-xl bg-[#B45309] text-white font-bold text-sm"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-medium text-[#1C1917]">{label}</span>
        <span className="text-[13px] font-mono font-semibold text-[#B45309]">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-[#F5F5F0] rounded-full">
        <div
          className="absolute h-full bg-[#B45309] rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#B45309] rounded-full shadow-sm"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
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
  onOpenSettings,
  settings: _settings,
}: {
  hasSignature: boolean;
  hasDetectVideo: boolean;
  setHasSignature: (v: boolean) => void;
  setHasDetectVideo: (v: boolean) => void;
  onBack: () => void;
  onDetect: () => void;
  onOpenSettings: () => void;
  settings: typeof DEFAULT_SETTINGS;
}) {
  const canDetect = hasSignature && hasDetectVideo;

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-6 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold">Detect</h1>
        <button onClick={onOpenSettings} className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center active:bg-neutral-100">
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </div>

      <p className="text-[14px] text-[#78716C] leading-relaxed mb-6">
        Select a signature JSON and a video. Infro will detect where the intro and outro appear.
      </p>

      {/* Signature picker */}
      <div className="mb-4">
        <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">SIGNATURE FILE</p>
        <button
          onClick={() => setHasSignature(true)}
          className={cn(
            "w-full rounded-xl border-2 border-dashed transition-all flex items-center gap-3 p-4",
            hasSignature
              ? "border-[#4D7C0F]/40 bg-[#4D7C0F]/5"
              : "border-[#E7E5E4] bg-white active:scale-[0.99]",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              hasSignature ? "bg-[#4D7C0F]/15" : "bg-[#F5F5F0]",
            )}
          >
            {hasSignature ? (
              <Check className="w-5 h-5 text-[#4D7C0F]" />
            ) : (
              <FileJson className="w-4 h-4 text-[#78716C]" />
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            {hasSignature ? (
              <>
                <p className="text-[14px] font-semibold truncate">infro-signature.json</p>
                <p className="text-[12px] text-[#78716C]">2 segments · ready</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium">Tap to select</p>
                <p className="text-[12px] text-[#78716C]">JSON file from Compare mode</p>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Video picker */}
      <VideoPicker
        label="Video"
        selected={hasDetectVideo}
        onSelect={() => setHasDetectVideo(true)}
        fileName="episode_03.mp4"
        duration="25:12"
      />

      <div className="mt-auto pt-6">
        <button
          onClick={onDetect}
          disabled={!canDetect}
          className={cn(
            "w-full py-3.5 rounded-xl text-[15px] font-bold transition-all",
            canDetect
              ? "bg-[#B45309] text-white active:scale-[0.98]"
              : "bg-[#E7E5E4] text-[#A8A29E]",
          )}
        >
          Detect Intro &amp; Outro
        </button>
      </div>
    </div>
  );
}

// ===================== PROGRESS =====================

function ProgressScreen({
  progress,
  stage,
  mode,
  isDetect = false,
}: {
  progress: number;
  stage: number;
  mode: Mode;
  isDetect?: boolean;
}) {
  const stages = [
    { id: 1, label: "Decoding media", icon: "🎬", desc: "Reading video and audio tracks" },
    { id: 2, label: "Extracting audio", icon: "🎵", desc: "Decoding audio to PCM samples" },
    { id: 3, label: "Generating fingerprints", icon: "🔐", desc: "Computing chroma + hash features" },
    { id: 4, label: "Matching", icon: "🔍", desc: "Scanning for matching segments" },
    { id: 5, label: "Inferring intro/outro", icon: "✨", desc: "Identifying intro and outro" },
    { id: 6, label: "Complete", icon: "✅", desc: "Results ready" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-12 pb-8">
      {/* Animated visual */}
      <div className="flex justify-center mb-8">
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F5F5F0" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#B45309"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
              className="transition-all duration-500"
            />
          </svg>
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold font-mono">{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>

      <h2 className="text-center text-xl font-bold mb-1">
        {isDetect ? "Detecting..." : "Analyzing..."}
      </h2>
      <p className="text-center text-[13px] text-[#78716C] mb-8">
        {isDetect ? "Matching against signature" : `Mode: ${mode}`}
      </p>

      {/* Stage list */}
      <div className="space-y-1.5">
        {stages.map((s) => {
          const isDone = stage > s.id;
          const isActive = stage === s.id;
          const isPending = stage < s.id;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                isActive && "bg-[#B45309]/5",
              )}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-[#4D7C0F] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full border-2 border-[#B45309] border-t-transparent animate-spin" />
                ) : (
                  <span className="text-base opacity-30">{s.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[13px] font-semibold",
                    isPending && "text-[#D6D3D1]",
                  )}
                >
                  {s.label}
                </p>
                {isActive && (
                  <p className="text-[11px] text-[#78716C] mt-0.5">{s.desc}</p>
                )}
              </div>
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
  const [playing, setPlaying] = useState(false);
  const [linked, setLinked] = useState(true);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const intro = matches.find((m) => m.isIntro);
  const outro = matches.find((m) => m.isOutro);
  const [timeA, setTimeA] = useState(5.0);
  const [timeB, setTimeB] = useState(8.2);

  const seekBoth = (frac: number) => {
    setTimeA(frac * DURATION);
    setTimeB(frac * DURATION + 3.2);
  };

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 sticky top-0 bg-[#FAFAF7] z-10 border-b border-[#E7E5E4]">
        <button onClick={onBack} className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold flex-1">Results</h1>
        <button
          onClick={() => setShowExportSheet(true)}
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E5E4] flex items-center gap-1 text-[11px] font-medium"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Dual video previews */}
        <div className="grid grid-cols-2 gap-2.5">
          <VideoPreview label="A" time={timeA} duration={DURATION} matches={matches} slot="A" />
          <VideoPreview label="B" time={timeB} duration={DURATION} matches={matches} slot="B" />
        </div>

        {/* Per-video seek bars */}
        <div className="grid grid-cols-2 gap-2.5">
          <SeekBar time={timeA} duration={DURATION} matches={matches} slot="A" onSeek={(f) => setTimeA(f * DURATION)} />
          <SeekBar time={timeB} duration={DURATION} matches={matches} slot="B" onSeek={(f) => setTimeB(f * DURATION)} />
        </div>

        {/* Shared seek bar */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Link2 className={cn("w-3.5 h-3.5", linked ? "text-[#4D7C0F]" : "text-[#D6D3D1]")} />
              <span className="text-[11px] font-medium text-[#78716C]">
                {linked ? "Linked seek" : "Independent"}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#78716C]">
              {fmt(timeA)} · {fmt(timeB)}
            </span>
          </div>
          {/* Combined seek bar with both tracks */}
          <CombinedSeekBar
            timeA={timeA}
            timeB={timeB}
            duration={DURATION}
            matches={matches}
            onSeek={seekBoth}
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-3 bg-white border border-[#E7E5E4] rounded-xl py-2.5">
          <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
            <SkipBack className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-medium text-[#78716C]">10s</span>
          <button
            onClick={() => setPlaying(!playing)}
            className="w-12 h-12 rounded-full bg-[#B45309] flex items-center justify-center active:scale-95 transition-transform mx-2"
          >
            {playing ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white translate-x-0.5" />
            )}
          </button>
          <span className="text-[10px] font-medium text-[#78716C]">10s</span>
          <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-neutral-100">
            <SkipForward className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[#E7E5E4] mx-1" />
          <button
            onClick={() => setLinked(!linked)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              linked ? "bg-[#4D7C0F]/10" : "active:bg-neutral-100",
            )}
          >
            <Link2 className={cn("w-4 h-4", linked ? "text-[#4D7C0F]" : "text-[#78716C]")} />
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#78716C] tracking-wider mb-2">TIMELINE</p>
          <DualTimeline matches={matches} duration={DURATION} timeA={timeA} timeB={timeB} />
        </div>

        {/* Intro/Outro summary */}
        {(intro || outro) && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-3 space-y-2">
            {intro && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#4D7C0F] bg-[#4D7C0F]/10 px-1.5 py-0.5 rounded">
                  Intro
                </span>
                <span className="text-[12px] font-mono">
                  A {fmt(intro.aStart)}–{fmt(intro.aEnd)} · B {fmt(intro.bStart)}–{fmt(intro.bEnd)}
                </span>
                <span className="ml-auto text-[11px] font-bold text-[#4D7C0F]">
                  {Math.round(intro.confidence * 100)}%
                </span>
              </div>
            )}
            {outro && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#C2410C] bg-[#C2410C]/10 px-1.5 py-0.5 rounded">
                  Outro
                </span>
                <span className="text-[12px] font-mono">
                  A {fmt(outro.aStart)}–{fmt(outro.aEnd)} · B {fmt(outro.bStart)}–{fmt(outro.bEnd)}
                </span>
                <span className="ml-auto text-[11px] font-bold text-[#C2410C]">
                  {Math.round(outro.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Matches" value={matches.length.toString()} />
          <StatCard label="Avg confidence" value="94%" />
          <StatCard label="Longest match" value="12.5s" />
          <StatCard label="Processing" value="8.3s" />
        </div>

        {/* Match list */}
        <div>
          <p className="text-[10px] font-bold text-[#78716C] tracking-wider mb-2">MATCHES ({matches.length})</p>
          <div className="space-y-2">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>

        {/* New analysis button */}
        <button
          onClick={onNew}
          className="w-full py-3 rounded-xl bg-[#B45309] text-white font-bold text-[14px] active:scale-[0.98] transition-transform"
        >
          New Analysis
        </button>
      </div>

      {showExportSheet && <ExportSheet onClose={() => setShowExportSheet(false)} />}
    </div>
  );
}

function VideoPreview({
  label,
  time,
  duration,
  matches,
  slot,
}: {
  label: string;
  time: number;
  duration: number;
  matches: MatchItem[];
  slot: "A" | "B";
}) {
  const inMatch = matches.some((m) =>
    slot === "A" ? time >= m.aStart && time <= m.aEnd : time >= m.bStart && time <= m.bEnd,
  );
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* Placeholder gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
      {/* Label */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <span className="text-[10px] font-bold bg-[#B45309] text-white px-1.5 py-0.5 rounded">
          {label}
        </span>
        {inMatch && (
          <span className="text-[9px] font-bold bg-white/90 text-[#4D7C0F] px-1.5 py-0.5 rounded">
            MATCH
          </span>
        )}
      </div>
      {/* Time */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between">
        <span className="text-[9px] font-mono text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
          {fmt(time)}
        </span>
        <span className="text-[9px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded">
          {fmt(duration)}
        </span>
      </div>
      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play className="w-3.5 h-3.5 text-white translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}

function SeekBar({
  time,
  duration,
  matches,
  slot,
  onSeek,
}: {
  time: number;
  duration: number;
  matches: MatchItem[];
  slot: "A" | "B";
  onSeek: (frac: number) => void;
}) {
  const pct = (time / duration) * 100;
  return (
    <div
      className="relative h-6 bg-white border border-[#E7E5E4] rounded-lg cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
    >
      {/* Match regions */}
      {matches.map((m) => {
        const start = slot === "A" ? m.aStart : m.bStart;
        const end = slot === "A" ? m.aEnd : m.bEnd;
        const left = (start / duration) * 100;
        const width = ((end - start) / duration) * 100;
        const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
        return (
          <div
            key={m.id}
            className="absolute top-0.5 bottom-0.5 rounded"
            style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}60` }}
          />
        );
      })}
      {/* Progress */}
      <div
        className="absolute top-0 left-0 h-full bg-[#B45309]/20 rounded-l-lg"
        style={{ width: `${pct}%` }}
      />
      {/* Playhead */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#B45309] rounded-full border-2 border-white shadow-sm"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}

function CombinedSeekBar({
  timeA,
  timeB,
  duration,
  matches,
  onSeek,
}: {
  timeA: number;
  timeB: number;
  duration: number;
  matches: MatchItem[];
  onSeek: (frac: number) => void;
}) {
  const pctA = (timeA / duration) * 100;
  const pctB = (timeB / duration) * 100;
  return (
    <div
      className="relative h-8 bg-[#F5F5F0] rounded-lg cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
    >
      {/* Match regions */}
      {matches.map((m) => {
        const leftA = (m.aStart / duration) * 100;
        const widthA = ((m.aEnd - m.aStart) / duration) * 100;
        const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
        return (
          <div
            key={m.id}
            className="absolute top-0.5 bottom-0.5 rounded"
            style={{ left: `${leftA}%`, width: `${widthA}%`, backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
          />
        );
      })}
      {/* A playhead */}
      <div
        className="absolute top-0.5 bottom-0.5 w-0.5 bg-[#B45309]"
        style={{ left: `${pctA}%` }}
      >
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#B45309] rounded-full border border-white" />
      </div>
      {/* B playhead */}
      <div
        className="absolute top-0.5 bottom-0.5 w-0.5 bg-[#4D7C0F]"
        style={{ left: `${pctB}%` }}
      >
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#4D7C0F] rounded-full border border-white" />
      </div>
    </div>
  );
}

function DualTimeline({
  matches,
  duration,
  timeA,
  timeB,
}: {
  matches: MatchItem[];
  duration: number;
  timeA: number;
  timeB: number;
}) {
  return (
    <div className="space-y-2">
      {/* Track A */}
      <div>
        <div className="flex justify-between text-[9px] text-[#78716C] mb-1">
          <span className="font-bold">A</span>
          <span className="font-mono">{fmt(duration)}</span>
        </div>
        <div className="relative h-5 bg-[#F5F5F0] rounded-md overflow-hidden">
          {matches.map((m) => {
            const left = (m.aStart / duration) * 100;
            const width = ((m.aEnd - m.aStart) / duration) * 100;
            const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
            return (
              <div
                key={m.id}
                className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center"
                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}` }}
              >
                {(m.isIntro || m.isOutro) && width > 8 && (
                  <span className="text-[7px] font-bold" style={{ color }}>{m.isIntro ? "INTRO" : "OUTRO"}</span>
                )}
              </div>
            );
          })}
          {/* Playhead A */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#B45309]"
            style={{ left: `${(timeA / duration) * 100}%` }}
          />
        </div>
      </div>
      {/* Track B */}
      <div>
        <div className="flex justify-between text-[9px] text-[#78716C] mb-1">
          <span className="font-bold">B</span>
          <span className="font-mono">{fmt(duration)}</span>
        </div>
        <div className="relative h-5 bg-[#F5F5F0] rounded-md overflow-hidden">
          {matches.map((m) => {
            const left = (m.bStart / duration) * 100;
            const width = ((m.bEnd - m.bStart) / duration) * 100;
            const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
            return (
              <div
                key={m.id}
                className="absolute top-0.5 bottom-0.5 rounded"
                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}` }}
              />
            );
          })}
          {/* Playhead B */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#4D7C0F]"
            style={{ left: `${(timeB / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
      <p className="text-[9px] font-medium uppercase tracking-wider text-[#78716C]">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function MatchCard({ match }: { match: MatchItem }) {
  const color = match.isIntro ? "#4D7C0F" : match.isOutro ? "#C2410C" : "#B45309";
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {match.label}
        </span>
        <span className="text-[13px] font-bold font-mono" style={{ color }}>
          {Math.round(match.confidence * 100)}%
        </span>
      </div>
      <div className="flex gap-3 text-[12px] font-mono">
        <span>A {fmt(match.aStart)}–{fmt(match.aEnd)}</span>
        <span className="text-[#D6D3D1]">·</span>
        <span>B {fmt(match.bStart)}–{fmt(match.bEnd)}</span>
      </div>
      <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[#E7E5E4]">
        {match.method.map((m, i) => (
          <span key={i} className="flex items-center gap-1 text-[9px] text-[#78716C] font-mono">
            {m.startsWith("audio") ? <Music className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
            {m}
          </span>
        ))}
      </div>
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
    { label: "intro", found: true, start: 2.1, end: 14.6, confidence: 0.92, method: ["audio-chroma"] },
    { label: "outro", found: true, start: 171.3, end: 185.0, confidence: 0.88, method: ["audio-chroma"] },
  ];

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)]">
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 sticky top-0 bg-[#FAFAF7] z-10 border-b border-[#E7E5E4]">
        <button onClick={onBack} className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center active:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold flex-1">Detection</h1>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-[#B45309]" />
            <span className="text-[14px] font-semibold">
              {detections.filter((d) => d.found).length} of {detections.length} found
            </span>
          </div>
          <p className="text-[11px] text-[#78716C]">Processed in 6.1s · audio only</p>
        </div>

        {detections.map((d, i) => (
          <DetectionCard key={i} detection={d} />
        ))}

        <button
          onClick={onNew}
          className="w-full py-3 rounded-xl bg-[#B45309] text-white font-bold text-[14px] active:scale-[0.98] transition-transform"
        >
          New Detection
        </button>
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
      className="bg-white border rounded-xl p-4"
      style={{ borderColor: detection.found ? `${color}40` : "#E7E5E4" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {detection.label}
        </span>
        {detection.found ? (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#4D7C0F]">
            <Check className="w-3 h-3" />
            {Math.round(detection.confidence * 100)}%
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#78716C]">
            <X className="w-3 h-3" />
            Not found
          </span>
        )}
      </div>
      {detection.found ? (
        <>
          <p className="text-[18px] font-bold font-mono mb-1">
            {fmt(detection.start)} → {fmt(detection.end)}
          </p>
          <p className="text-[11px] text-[#78716C]">
            Duration: {fmt(detection.end - detection.start)}
          </p>
        </>
      ) : (
        <p className="text-[13px] text-[#78716C]">This segment was not found in the video.</p>
      )}
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
        <p className="text-[13px] text-[#78716C] mb-5 leading-relaxed">
          Save a JSON file with intro/outro fingerprints. Use it in Detect mode to find the same segments in other videos.
        </p>
        <button
          onClick={() => setExported(true)}
          className={cn(
            "w-full py-3.5 rounded-xl font-bold text-sm transition-all",
            exported ? "bg-[#4D7C0F] text-white" : "bg-[#B45309] text-white active:scale-[0.98]",
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
        <button onClick={onClose} className="w-full py-3 mt-2 text-[13px] font-medium text-[#78716C]">
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
