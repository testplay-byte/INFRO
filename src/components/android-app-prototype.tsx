"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Search,
  Columns,
  FileJson,
  Shield,
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
  Link2Off,
  Maximize,
  Volume2,
  VolumeX,
  Waves,
  Cpu,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Activity,
  BarChart3,
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
  { id: 1, label: "Intro", aStart: 0, aEnd: 12.5, bStart: 3.2, bEnd: 15.7, confidence: 0.96, method: ["audio-chroma", "video-dhash"], isIntro: true, isOutro: false },
  { id: 2, label: "Match #2", aStart: 45.3, aEnd: 52.1, bStart: 48.1, bEnd: 54.9, confidence: 0.91, method: ["audio-chroma"], isIntro: false, isOutro: false },
  { id: 3, label: "Outro", aStart: 178.4, aEnd: 192.0, bStart: 175.2, bEnd: 188.8, confidence: 0.94, method: ["audio-chroma", "video-dhash"], isIntro: false, isOutro: true },
];

const DURATION = 200;

const DEFAULT_SETTINGS = {
  similarityThreshold: 90,
  minMatchDuration: 10,
  maxGap: 1.0,
  matchDensity: 90,
  frameSampleRate: 2,
  audioSampleRate: 30,
};

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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [prevScreen, setPrevScreen] = useState<Screen>("home");

  // ===== Native bridge (Android WebView) =====
  const [isNative, setIsNative] = useState(false);
  const [nativeResult, setNativeResult] = useState<unknown>(null);

  useEffect(() => {
    // Detect if running inside Android WebView
    if (typeof window !== "undefined" && (window as unknown as { infroNative?: unknown }).infroNative) {
      setIsNative(true);
      // Set up global callbacks for native bridge
      (window as unknown as Record<string, unknown>).infroCallbacks = {
        onFileSelected: (slot: string, fileName: string, _type: string) => {
          if (slot === "videoA") setHasVideoA(true);
          if (slot === "videoB") setHasVideoB(true);
          if (slot === "detectVideo") setHasDetectVideo(true);
          if (slot === "signature") setHasSignature(true);
        },
        onProgress: (stage: string, progress: number, detail: string) => {
          setProgress(progress);
          setProgressStage(Math.min(6, Math.floor(progress * 6) + 1));
        },
        onAnalysisComplete: (result: unknown) => {
          setNativeResult(result);
          setScreen("results-compare");
        },
        onDetectionComplete: (result: unknown) => {
          setNativeResult(result);
          setScreen("results-detect");
        },
        onError: (message: string) => {
          console.error("Native error:", message);
          setScreen("compare-setup"); // or detect-setup
        },
        onExportComplete: () => {
          // Export done
        },
      };
    }
  }, []);

  const goTo = (s: Screen) => {
    setPrevScreen(screen);
    setScreen(s);
  };

  const startAnalysis = (target: Screen) => {
    // If running natively, call the native bridge instead of simulating
    if (isNative) {
      const native = (window as unknown as { infroNative?: { analyze?: (s: string) => void; detect?: (s: string) => void } }).infroNative;
      if (native) {
        const settingsJson = JSON.stringify({
          mode: mode,
          frameSampleRate: settings.frameSampleRate,
          audioSampleRate: settings.audioSampleRate,
          similarityThreshold: settings.similarityThreshold / 100,
          minMatchDuration: settings.minMatchDuration,
          maxGap: settings.maxGap,
          matchDensity: settings.matchDensity / 100,
        });
        setScreen(target === "results-compare" ? "compare-progress" : "detect-progress");
        setProgress(0);
        setProgressStage(0);
        if (target === "results-compare") {
          native.analyze?.(settingsJson);
        } else {
          native.detect?.(settingsJson);
        }
        return;
      }
    }

    // Mock simulation for web browser
    setScreen(target === "results-compare" ? "compare-progress" : "detect-progress");
    setProgress(0);
    setProgressStage(0);
    const stages = [
      { p: 0.15, s: 1 }, { p: 0.35, s: 2 }, { p: 0.55, s: 3 },
      { p: 0.75, s: 4 }, { p: 0.92, s: 5 }, { p: 1.0, s: 6 },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= stages.length) {
        clearInterval(interval);
        setTimeout(() => setScreen(target), 400);
        return;
      }
      setProgress(stages[i].p);
      setProgressStage(stages[i].s);
      i++;
    }, 700);
  };

  return (
    <div className="relative min-h-[calc(800px-36px)] bg-[#FAFAF7] text-[#1C1917] font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {screen === "home" && (
            <HomeScreen onCompare={() => goTo("compare-setup")} onDetect={() => goTo("detect-setup")} />
          )}

          {screen === "compare-setup" && (
            <CompareSetupScreen
              mode={mode} setMode={setMode}
              hasVideoA={hasVideoA} hasVideoB={hasVideoB}
              setHasVideoA={setHasVideoA} setHasVideoB={setHasVideoB}
              onBack={() => goTo("home")}
              onAnalyze={() => startAnalysis("results-compare")}
              onOpenSettings={() => setShowSettings(true)}
              isNative={isNative}
            />
          )}

          {screen === "compare-progress" && (
            <ProgressScreen progress={progress} stage={progressStage} mode={mode} />
          )}

          {screen === "detect-setup" && (
            <DetectSetupScreen
              hasSignature={hasSignature} hasDetectVideo={hasDetectVideo}
              setHasSignature={setHasSignature} setHasDetectVideo={setHasDetectVideo}
              onBack={() => goTo("home")}
              onDetect={() => startAnalysis("results-detect")}
              onOpenSettings={() => setShowSettings(true)}
              isNative={isNative}
            />
          )}

          {screen === "detect-progress" && (
            <ProgressScreen progress={progress} stage={progressStage} mode="audio" isDetect />
          )}

          {screen === "results-compare" && (
            <ResultsScreen
              matches={nativeResult && isNative ? ((nativeResult as { matches: typeof SAMPLE_MATCHES }).matches) : SAMPLE_MATCHES}
              mode={mode}
              onNew={() => { setHasVideoA(false); setHasVideoB(false); setNativeResult(null); goTo("home"); }}
              onBack={() => goTo("compare-setup")}
              isNative={isNative}
              nativeResult={nativeResult}
            />
          )}

          {screen === "results-detect" && (
            <DetectResultsScreen
              onNew={() => { setHasSignature(false); setHasDetectVideo(false); setNativeResult(null); goTo("home"); }}
              onBack={() => goTo("detect-setup")}
              isNative={isNative}
              nativeResult={nativeResult}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Settings sheet — positioned inside the phone frame (absolute, not fixed) */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================== HOME =====================

function HomeScreen({ onCompare, onDetect }: { onCompare: () => void; onDetect: () => void; }) {
  return (
    <div className="relative flex flex-col min-h-[calc(800px-36px)] px-6 pb-8 overflow-hidden">
      {/* Animated geometric shapes filling the top area */}
      <GeometricShapes />

      {/* Logo — top center, pushed down to avoid shapes */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative flex items-center justify-center gap-2.5 mt-10 z-10"
      >
        <div className="w-9 h-9 rounded-xl bg-[#B45309] flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-base">I</span>
        </div>
        <span className="text-lg font-bold tracking-tight">Infro</span>
      </motion.div>

      {/* Center content — centered vertically */}
      <div className="relative flex-1 flex flex-col justify-center z-10 py-4">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-[28px] font-bold leading-[1.15] mb-2 text-center"
        >
          Find intros,<br />outros &amp; matches
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-[14px] text-[#78716C] leading-relaxed mb-8 text-center"
        >
          Compare two videos or detect from a signature.
        </motion.p>

        {/* Two options */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCompare}
            className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-[#B45309]/10 flex items-center justify-center shrink-0">
              <Columns className="w-5 h-5 text-[#B45309]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold">Compare videos</h3>
              <p className="text-[12px] text-[#78716C] mt-0.5">Find shared segments between two videos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D6D3D1] shrink-0" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDetect}
            className="w-full text-left bg-white border border-[#E7E5E4] rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-[#4D7C0F]/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-[#4D7C0F]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold">Detect from signature</h3>
              <p className="text-[12px] text-[#78716C] mt-0.5">Find intro/outro in a new video</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#D6D3D1] shrink-0" />
          </motion.button>
        </div>
      </div>

      {/* Bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="relative flex items-center justify-center gap-1.5 text-[11px] text-[#A8A29E] z-10"
      >
        <Shield className="w-3 h-3 text-[#4D7C0F]" />
        <span>All processing happens on your device</span>
      </motion.div>
    </div>
  );
}

/** Rich animated geometric shapes — scattered, organic, not grid-organized */
function GeometricShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large soft gradient blobs for depth */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-[-60px] w-52 h-52 rounded-full bg-[#B45309]/8 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-[-50px] w-44 h-44 rounded-full bg-[#4D7C0F]/8 blur-3xl"
      />

      {/* Triangle — spinning, top right area */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-12"
      >
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <path d="M16 4 L28 26 L4 26 Z" fill="#B45309" fillOpacity="0.12" stroke="#B45309" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Rectangle — bouncing, left side */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-28 left-10"
      >
        <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="22" height="22" rx="4" fill="#4D7C0F" fillOpacity="0.12" stroke="#4D7C0F" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Pentagon — spinning, left area */}
      <motion.div
        animate={{ rotate: [0, -360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-16 left-20"
      >
        <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
          <path d="M15 3 L27 12 L22 27 L8 27 L3 12 Z" fill="#C2410C" fillOpacity="0.12" stroke="#C2410C" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Hexagon — bouncing, right side */}
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-36 right-8"
      >
        <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
          <path d="M13 2 L23 8 L23 18 L13 24 L3 18 L3 8 Z" fill="#B45309" fillOpacity="0.1" stroke="#B45309" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Circle — pulsing, scattered left */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 left-32 w-4 h-4 rounded-full bg-[#4D7C0F]/40"
      />

      {/* Circle — pulsing, scattered right */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-32 right-24 w-3.5 h-3.5 rounded-full bg-[#B45309]/40"
      />

      {/* Diamond — spinning, lower left */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-44 left-6"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="#C2410C" fillOpacity="0.1" stroke="#C2410C" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Small triangle — bouncing, lower right */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute top-48 right-16"
      >
        <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
          <path d="M10 2 L18 17 L2 17 Z" fill="#4D7C0F" fillOpacity="0.15" stroke="#4D7C0F" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Center plus sign — pulsing */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[170px] left-1/2 -translate-x-1/2"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M8 1 V15 M1 8 H15" stroke="#4D7C0F" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      </motion.div>

      {/* Floating square — scattered, center-left */}
      <motion.div
        animate={{ y: [0, -8, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-[190px] left-16 w-3 h-3 rounded-sm bg-[#C2410C]/30 rotate-12"
      />

      {/* Ring outline — floating, center-right */}
      <motion.div
        animate={{ y: [0, 10, 0], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute top-[180px] right-20 w-3 h-3 rounded-full border border-[#4D7C0F]/40"
      />

      {/* Dotted line decoration — top left */}
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-8 left-8 flex gap-1.5"
      >
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#B45309]/40" />
        ))}
      </motion.div>

      {/* Dotted line decoration — top right */}
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-8 right-8 flex gap-1.5"
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#4D7C0F]/40" />
        ))}
      </motion.div>

      {/* Cross/plus decoration — bottom right */}
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 right-16"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M8 1 V15 M1 8 H15" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
        </svg>
      </motion.div>

      {/* Small square — drifting, center */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        className="absolute top-[155px] left-[40%] w-2.5 h-2.5 rounded-sm bg-[#B45309]/30 rotate-45"
      />

      {/* Tiny circle — pulsing, scattered */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="absolute top-[140px] left-[55%] w-1.5 h-1.5 rounded-full bg-[#B45309]/50"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
        className="absolute bottom-40 left-24 w-2 h-2 rounded-full bg-[#4D7C0F]/40"
      />

      {/* Small diamond — drifting, center-right */}
      <motion.div
        animate={{ y: [0, 7, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        className="absolute top-[200px] right-[30%]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="#C2410C" fillOpacity="0.15" stroke="#C2410C" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Outline triangle — drifting, center-left */}
      <motion.div
        animate={{ y: [0, -9, 0], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
        className="absolute top-[130px] left-[25%]"
      >
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <path d="M16 4 L28 26 L4 26 Z" fill="none" stroke="#4D7C0F" strokeWidth="1.5" strokeOpacity="0.5" />
        </svg>
      </motion.div>
    </div>
  );
}

// ===================== COMPARE SETUP =====================

function CompareSetupScreen({
  mode, setMode, hasVideoA, hasVideoB, setHasVideoA, setHasVideoB,
  onBack, onAnalyze, onOpenSettings, isNative = false,
}: {
  mode: Mode; setMode: (m: Mode) => void;
  hasVideoA: boolean; hasVideoB: boolean;
  setHasVideoA: (v: boolean) => void; setHasVideoB: (v: boolean) => void;
  onBack: () => void; onAnalyze: () => void; onOpenSettings: () => void;
  isNative?: boolean;
}) {
  const canAnalyze = hasVideoA && hasVideoB;

  const pickFile = (slot: "A" | "B") => {
    if (isNative) {
      const native = (window as unknown as { infroNative?: { pickFile?: (s: string) => void } }).infroNative;
      native?.pickFile?.(slot === "A" ? "videoA" : "videoB");
    }
    if (slot === "A") setHasVideoA(true);
    else setHasVideoB(true);
  };
  const modeInfo: Record<Mode, { icon: React.ReactNode; desc: string }> = {
    audio: { icon: <Music className="w-3.5 h-3.5" />, desc: "Audio fingerprints only — fastest, best for reused music" },
    video: { icon: <Film className="w-3.5 h-3.5" />, desc: "Visual frame hashes — best when audio differs" },
    combined: { icon: <Sparkles className="w-3.5 h-3.5" />, desc: "Audio + video fused — most accurate, recommended" },
  };

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-6 pb-8">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="h-9 px-3 rounded-xl bg-[#F5F5F0] flex items-center gap-1.5 text-[12px] font-bold text-[#1C1917]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </motion.button>
        <h1 className="text-[17px] font-bold">Compare Videos</h1>
        <motion.button
          whileTap={{ scale: 0.9, rotate: 90 }}
          onClick={onOpenSettings}
          className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center active:bg-neutral-100"
        >
          <Settings className="w-[18px] h-[18px]" />
        </motion.button>
      </motion.div>

      {/* Mode selector — segmented control */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#F5F5F0] rounded-xl p-1 flex gap-1 mb-3"
      >
        {(["audio", "video", "combined"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative flex-1 py-2.5 rounded-lg text-[13px] font-semibold capitalize transition-colors",
              mode === m ? "text-[#B45309]" : "text-[#78716C]",
            )}
          >
            {mode === m && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{m}</span>
          </button>
        ))}
      </motion.div>

      {/* Mode description — one line, vector icon, no emoji */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2 bg-[#B45309]/5 border border-[#B45309]/15 rounded-xl px-3 py-2.5 mb-6"
      >
        <span className="text-[#B45309] shrink-0">{modeInfo[mode].icon}</span>
        <p className="text-[12px] text-[#78716C] leading-tight">{modeInfo[mode].desc}</p>
      </motion.div>

      {/* Video pickers */}
      <VideoPicker label="Video A" selected={hasVideoA} onSelect={() => pickFile("A")} fileName="episode_01.mp4" duration="24:30" />
      <VideoPicker label="Video B" selected={hasVideoB} onSelect={() => pickFile("B")} fileName="episode_02.mp4" duration="23:45" />

      <div className="mt-auto pt-6">
        <motion.button
          whileTap={canAnalyze ? { scale: 0.98 } : {}}
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={cn(
            "w-full py-3.5 rounded-xl text-[15px] font-bold transition-all",
            canAnalyze ? "bg-[#B45309] text-white" : "bg-[#E7E5E4] text-[#A8A29E]",
          )}
        >
          Analyze Similarity
        </motion.button>
      </div>
    </div>
  );
}

function VideoPicker({
  label, selected, onSelect, fileName, duration,
}: {
  label: string; selected: boolean; onSelect: () => void; fileName: string; duration: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: label.includes("B") ? 0.25 : 0.2 }}
      className="mb-4"
    >
      <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">{label.toUpperCase()}</p>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={onSelect}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all flex items-center gap-3 p-4",
          selected ? "border-[#4D7C0F]/40 bg-[#4D7C0F]/5" : "border-[#E7E5E4] bg-white",
        )}
      >
        <motion.div
          animate={selected ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", selected ? "bg-[#4D7C0F]/15" : "bg-[#F5F5F0]")}
        >
          {selected ? <Check className="w-5 h-5 text-[#4D7C0F]" /> : <Upload className="w-4 h-4 text-[#78716C]" />}
        </motion.div>
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
      </motion.button>
    </motion.div>
  );
}

// ===================== SETTINGS SHEET (absolute, inside phone frame) =====================

function SettingsSheet({
  settings, setSettings, onClose,
}: {
  settings: typeof DEFAULT_SETTINGS; setSettings: (s: typeof DEFAULT_SETTINGS) => void; onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop — absolute within the phone frame container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 z-50"
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 max-h-[80%] overflow-y-auto no-scrollbar z-50"
      >
        <div className="w-10 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Analysis Settings</h3>
          <button onClick={onClose} className="text-[#78716C] text-sm font-medium">Done</button>
        </div>
        <div className="space-y-5">
          <SettingSlider label="Similarity threshold" value={settings.similarityThreshold} min={70} max={98} step={1} unit="%" onChange={(v) => setSettings({ ...settings, similarityThreshold: v })} />
          <SettingSlider label="Min match duration" value={settings.minMatchDuration} min={2} max={30} step={1} unit="s" onChange={(v) => setSettings({ ...settings, minMatchDuration: v })} />
          <SettingSlider label="Max gap within match" value={settings.maxGap} min={0.3} max={3} step={0.1} unit="s" onChange={(v) => setSettings({ ...settings, maxGap: v })} />
          <SettingSlider label="Match density" value={settings.matchDensity} min={30} max={95} step={5} unit="%" onChange={(v) => setSettings({ ...settings, matchDensity: v })} />
          <SettingSlider label="Frame sample rate" value={settings.frameSampleRate} min={1} max={6} step={1} unit=" fps" onChange={(v) => setSettings({ ...settings, frameSampleRate: v })} />
          <SettingSlider label="Audio sample rate" value={settings.audioSampleRate} min={8} max={48} step={2} unit=" kHz" onChange={(v) => setSettings({ ...settings, audioSampleRate: v })} />
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3.5 rounded-xl bg-[#B45309] text-white font-bold text-sm">
          Apply Settings
        </button>
      </motion.div>
    </>
  );
}

function SettingSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-medium text-[#1C1917]">{label}</span>
        <span className="text-[13px] font-mono font-semibold text-[#B45309]">{value}{unit}</span>
      </div>
      <div className="relative h-1.5 bg-[#F5F5F0] rounded-full">
        <div className="absolute h-full bg-[#B45309] rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#B45309] rounded-full shadow-sm" style={{ left: `calc(${pct}% - 8px)` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
      </div>
    </div>
  );
}

// ===================== DETECT SETUP =====================

function DetectSetupScreen({
  hasSignature, hasDetectVideo, setHasSignature, setHasDetectVideo,
  onBack, onDetect, onOpenSettings, isNative = false,
}: {
  hasSignature: boolean; hasDetectVideo: boolean;
  setHasSignature: (v: boolean) => void; setHasDetectVideo: (v: boolean) => void;
  onBack: () => void; onDetect: () => void; onOpenSettings: () => void;
  isNative?: boolean;
}) {
  const canDetect = hasSignature && hasDetectVideo;

  const pickSignature = () => {
    if (isNative) {
      const native = (window as unknown as { infroNative?: { pickFile?: (s: string) => void } }).infroNative;
      native?.pickFile?.("signature");
    }
    setHasSignature(true);
  };

  const pickVideo = () => {
    if (isNative) {
      const native = (window as unknown as { infroNative?: { pickFile?: (s: string) => void } }).infroNative;
      native?.pickFile?.("detectVideo");
    }
    setHasDetectVideo(true);
  };
  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="h-9 px-3 rounded-xl bg-[#F5F5F0] flex items-center gap-1.5 text-[12px] font-bold text-[#1C1917]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </motion.button>
        <h1 className="text-[17px] font-bold">Detect</h1>
        <motion.button
          whileTap={{ scale: 0.9, rotate: 90 }}
          onClick={onOpenSettings}
          className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center active:bg-neutral-100"
        >
          <Settings className="w-[18px] h-[18px]" />
        </motion.button>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-[14px] text-[#78716C] leading-relaxed mb-6"
      >
        Select a signature JSON and a video. Infro will detect where the intro and outro appear.
      </motion.p>
      {/* Signature picker */}
      <div className="mb-4">
        <p className="text-[11px] font-bold text-[#78716C] tracking-wider mb-2">SIGNATURE FILE</p>
        <button
          onClick={pickSignature}
          className={cn(
            "w-full rounded-xl border-2 border-dashed transition-all flex items-center gap-3 p-4",
            hasSignature ? "border-[#4D7C0F]/40 bg-[#4D7C0F]/5" : "border-[#E7E5E4] bg-white",
          )}
        >
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", hasSignature ? "bg-[#4D7C0F]/15" : "bg-[#F5F5F0]")}>
            {hasSignature ? <Check className="w-5 h-5 text-[#4D7C0F]" /> : <FileJson className="w-4 h-4 text-[#78716C]" />}
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
      <VideoPicker label="Video" selected={hasDetectVideo} onSelect={pickVideo} fileName="episode_03.mp4" duration="25:12" />
      <div className="mt-auto pt-6">
        <motion.button
          whileTap={canDetect ? { scale: 0.98 } : {}}
          onClick={onDetect}
          disabled={!canDetect}
          className={cn(
            "w-full py-3.5 rounded-xl text-[15px] font-bold transition-all",
            canDetect ? "bg-[#B45309] text-white" : "bg-[#E7E5E4] text-[#A8A29E]",
          )}
        >
          Detect Intro &amp; Outro
        </motion.button>
      </div>
    </div>
  );
}

// ===================== PROGRESS (no emojis, vector icons, per-stage data) =====================

function ProgressScreen({
  progress, stage, mode, isDetect = false,
}: {
  progress: number; stage: number; mode: Mode; isDetect?: boolean;
}) {
  const stages = [
    { id: 1, label: "Decoding media", icon: Film, desc: "Reading video and audio tracks", detail: "120 frames · 48kHz audio" },
    { id: 2, label: "Extracting audio", icon: Waves, desc: "Decoding audio to PCM samples", detail: "240,000 samples · 30kHz" },
    { id: 3, label: "Generating fingerprints", icon: Cpu, desc: "Computing chroma + spectral hashes", detail: "420 chroma vectors · 420 peak hashes" },
    { id: 4, label: "Matching", icon: Search, desc: "Scanning for matching segments", detail: "Checking 8 offset candidates" },
    { id: 5, label: "Inferring intro/outro", icon: Target, desc: "Identifying intro and outro regions", detail: "3 matches found" },
    { id: 6, label: "Complete", icon: Check, desc: "Results ready", detail: "Done in 8.3s" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] px-6 pt-12 pb-8">
      {/* Animated circular progress */}
      <div className="flex justify-center mb-8">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F5F5F0" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke="#B45309" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress) }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <motion.span
              key={Math.round(progress * 100)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold font-mono"
            >
              {Math.round(progress * 100)}%
            </motion.span>
          </div>
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xl font-bold mb-1"
      >
        {isDetect ? "Detecting..." : "Analyzing..."}
      </motion.h2>
      <p className="text-center text-[13px] text-[#78716C] mb-8">
        {isDetect ? "Matching against signature" : `Mode: ${mode}`}
      </p>

      {/* Stage list with vector icons + per-stage data */}
      <div className="space-y-1.5">
        {stages.map((s) => {
          const isDone = stage > s.id;
          const isActive = stage === s.id;
          const isPending = stage < s.id;
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              animate={{
                backgroundColor: isActive ? "rgba(180, 83, 9, 0.05)" : "rgba(0,0,0,0)",
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-[#4D7C0F] flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-[#B45309] border-t-transparent"
                  />
                ) : (
                  <Icon className="w-4 h-4 text-[#D6D3D1]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-semibold", isPending && "text-[#D6D3D1]")}>{s.label}</p>
                <AnimatePresence>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[11px] text-[#78716C] mt-0.5"
                    >
                      {s.desc}
                    </motion.p>
                  )}
                  {isDone && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-mono text-[#4D7C0F] mt-0.5"
                    >
                      {s.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== RESULTS (COMPARE) — redesigned =====================

function ResultsScreen({
  matches, mode, onNew, onBack, isNative = false, nativeResult = null,
}: {
  matches: MatchItem[]; mode: Mode; onNew: () => void; onBack: () => void;
  isNative?: boolean; nativeResult?: unknown;
}) {
  const [playing, setPlaying] = useState(false);
  const [linked, setLinked] = useState(true);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [timeA, setTimeA] = useState(5.0);
  const [timeB, setTimeB] = useState(8.2);
  const intro = matches.find((m) => m.isIntro);
  const outro = matches.find((m) => m.isOutro);

  const seekBoth = (frac: number) => {
    setTimeA(frac * DURATION);
    setTimeB(frac * DURATION + 3.2);
  };

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] pb-8">
      {/* Floating top nav bar */}
      <div className="sticky top-2 z-20 px-3 pt-2">
        <div className="bg-white/90 backdrop-blur-xl border border-[#E7E5E4] rounded-2xl shadow-sm flex items-center gap-2 px-2 py-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="h-9 px-3 rounded-xl bg-[#F5F5F0] flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#1C1917]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>
          <h1 className="text-[15px] font-bold flex-1 text-center">Results</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportSheet(true)}
            className="h-9 px-3 rounded-xl bg-[#B45309] flex items-center gap-1.5 text-[12px] font-bold text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </motion.button>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-4">
        {/* Dual video previews with sticker labels */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative">
            <VideoPreview time={timeA} duration={DURATION} matches={matches} slot="A" />
            {/* Sticker label A — rounded rectangle */}
            <div className="absolute -top-2 -left-2 h-7 px-2 rounded-lg bg-[#B45309] border-2 border-white shadow-md flex items-center justify-center z-10">
              <span className="text-white font-bold text-xs">A</span>
            </div>
          </div>
          <div className="relative">
            <VideoPreview time={timeB} duration={DURATION} matches={matches} slot="B" />
            {/* Sticker label B — rounded rectangle */}
            <div className="absolute -top-2 -right-2 h-7 px-2 rounded-lg bg-[#4D7C0F] border-2 border-white shadow-md flex items-center justify-center z-10">
              <span className="text-white font-bold text-xs">B</span>
            </div>
          </div>
        </div>

        {/* Timestamps row with mute buttons — below videos */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[12px] font-mono text-[#78716C] bg-white border border-[#E7E5E4] rounded-lg px-2.5 py-1">
              {fmt(timeA)} / {fmt(DURATION)}
            </span>
            <MuteButton slot="A" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[12px] font-mono text-[#78716C] bg-white border border-[#E7E5E4] rounded-lg px-2.5 py-1">
              {fmt(timeB)} / {fmt(DURATION)}
            </span>
            <MuteButton slot="B" />
          </div>
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
              {linked ? <Link2 className="w-3.5 h-3.5 text-[#4D7C0F]" /> : <Link2Off className="w-3.5 h-3.5 text-[#D6D3D1]" />}
              <span className="text-[11px] font-medium text-[#78716C]">{linked ? "Linked seek" : "Independent"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#B45309]" />
              <span className="text-[10px] font-mono text-[#78716C]">A</span>
              <span className="w-2 h-2 rounded-full bg-[#4D7C0F] ml-1.5" />
              <span className="text-[10px] font-mono text-[#78716C]">B</span>
            </div>
          </div>
          <CombinedSeekBar timeA={timeA} timeB={timeB} duration={DURATION} matches={matches} onSeek={seekBoth} />
        </div>

        {/* Playback controls — seek buttons with text inside */}
        <div className="flex items-center justify-center gap-2 bg-white border border-[#E7E5E4] rounded-xl py-2.5 px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="h-9 px-2.5 rounded-lg bg-[#F5F5F0] flex items-center gap-1.5 text-[11px] font-bold text-[#78716C]"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>-10s</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPlaying(!playing)}
            className="w-12 h-12 rounded-full bg-[#B45309] flex items-center justify-center mx-2 shadow-sm"
          >
            {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white translate-x-0.5" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="h-9 px-2.5 rounded-lg bg-[#F5F5F0] flex items-center gap-1.5 text-[11px] font-bold text-[#78716C]"
          >
            <span>+10s</span>
            <SkipForward className="w-3.5 h-3.5" />
          </motion.button>
          <div className="w-px h-8 bg-[#E7E5E4] mx-1" />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLinked(!linked)}
            className={cn("h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold transition-colors", linked ? "bg-[#4D7C0F]/10 text-[#4D7C0F]" : "bg-[#F5F5F0] text-[#78716C]")}
          >
            {linked ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
            <span>{linked ? "Linked" : "Free"}</span>
          </motion.button>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#78716C] tracking-wider mb-2">TIMELINE</p>
          <DualTimeline matches={matches} duration={DURATION} timeA={timeA} timeB={timeB} />
        </div>

        {/* Intro/Outro — separated, highlighted, table-like */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E7E5E4]">
            <Target className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">Detected Segments</span>
          </div>
          {/* Intro row */}
          <div className="flex items-center px-3 py-3 border-b border-[#E7E5E4]">
            <div className="w-1 h-8 rounded-full bg-[#4D7C0F] mr-3" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-bold text-[#4D7C0F]">Intro</span>
                <span className="text-[10px] font-mono bg-[#4D7C0F]/10 text-[#4D7C0F] px-1.5 py-0.5 rounded">{Math.round(intro!.confidence * 100)}%</span>
              </div>
              <div className="flex gap-3 text-[11px] font-mono text-[#78716C]">
                <span>A: {fmt(intro!.aStart)}–{fmt(intro!.aEnd)}</span>
                <span>B: {fmt(intro!.bStart)}–{fmt(intro!.bEnd)}</span>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#B45309] bg-[#B45309]/10 px-2 py-1 rounded">Jump</button>
          </div>
          {/* Outro row */}
          <div className="flex items-center px-3 py-3">
            <div className="w-1 h-8 rounded-full bg-[#C2410C] mr-3" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-bold text-[#C2410C]">Outro</span>
                <span className="text-[10px] font-mono bg-[#C2410C]/10 text-[#C2410C] px-1.5 py-0.5 rounded">{Math.round(outro!.confidence * 100)}%</span>
              </div>
              <div className="flex gap-3 text-[11px] font-mono text-[#78716C]">
                <span>A: {fmt(outro!.aStart)}–{fmt(outro!.aEnd)}</span>
                <span>B: {fmt(outro!.bStart)}–{fmt(outro!.bEnd)}</span>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#B45309] bg-[#B45309]/10 px-2 py-1 rounded">Jump</button>
          </div>
        </div>

        {/* Stats — dedicated section with card grid */}
        <div className="bg-[#F5F5F0] border border-[#E7E5E4] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Matches" value={matches.length.toString()} />
            <StatCard label="Avg confidence" value="94%" />
            <StatCard label="Longest match" value="12.5s" />
            <StatCard label="Processing" value="8.3s" />
            <StatCard label="Frames analyzed" value="120" />
            <StatCard label="Audio samples" value="240k" />
          </div>
        </div>

        {/* Match list */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#B45309]" />
            <p className="text-[11px] font-bold text-[#78716C] tracking-wider">MATCHES ({matches.length})</p>
          </div>
          <div className="space-y-2">
            {matches.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNew}
          className="w-full py-3 rounded-xl bg-[#B45309] text-white font-bold text-[14px]"
        >
          New Analysis
        </motion.button>
      </div>

      <AnimatePresence>
        {showExportSheet && (
          <ExportSheet
            onClose={() => setShowExportSheet(false)}
            isNative={isNative}
            nativeResult={nativeResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VideoPreview({
  time, duration, matches, slot,
}: {
  time: number; duration: number; matches: MatchItem[]; slot: "A" | "B";
}) {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
      {/* Play icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play className="w-3.5 h-3.5 text-white translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}

/** Mute button — different icon shape, theme color when active */
function MuteButton({ slot }: { slot: "A" | "B" }) {
  const [muted, setMuted] = useState(slot === "B");
  const themeColor = slot === "A" ? "#B45309" : "#4D7C0F";
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setMuted(!muted)}
      className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors"
      style={{
        backgroundColor: muted ? "transparent" : `${themeColor}15`,
        borderColor: muted ? "#E7E5E4" : `${themeColor}40`,
      }}
    >
      {muted ? (
        <VolumeX className="w-3.5 h-3.5 text-[#78716C]" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" style={{ color: themeColor }} />
      )}
    </motion.button>
  );
}

function SeekBar({
  time, duration, matches, slot, onSeek,
}: {
  time: number; duration: number; matches: MatchItem[]; slot: "A" | "B"; onSeek: (f: number) => void;
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
      {matches.map((m) => {
        const start = slot === "A" ? m.aStart : m.bStart;
        const end = slot === "A" ? m.aEnd : m.bEnd;
        const left = (start / duration) * 100;
        const width = ((end - start) / duration) * 100;
        const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
        return (
          <div key={m.id} className="absolute top-0.5 bottom-0.5 rounded" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}60` }} />
        );
      })}
      <div className="absolute top-0 left-0 h-full bg-[#B45309]/20 rounded-l-lg" style={{ width: `${pct}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#B45309] rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
  );
}

function CombinedSeekBar({
  timeA, timeB, duration, matches, onSeek,
}: {
  timeA: number; timeB: number; duration: number; matches: MatchItem[]; onSeek: (frac: number) => void;
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
      {matches.map((m) => {
        const leftA = (m.aStart / duration) * 100;
        const widthA = ((m.aEnd - m.aStart) / duration) * 100;
        const color = m.isIntro ? "#4D7C0F" : m.isOutro ? "#C2410C" : "#B45309";
        return (
          <div key={m.id} className="absolute top-0.5 bottom-0.5 rounded" style={{ left: `${leftA}%`, width: `${widthA}%`, backgroundColor: `${color}25`, border: `1px solid ${color}40` }} />
        );
      })}
      <div className="absolute top-0.5 bottom-0.5 w-0.5 bg-[#B45309]" style={{ left: `${pctA}%` }}>
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#B45309] rounded-full border border-white" />
      </div>
      <div className="absolute top-0.5 bottom-0.5 w-0.5 bg-[#4D7C0F]" style={{ left: `${pctB}%` }}>
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#4D7C0F] rounded-full border border-white" />
      </div>
    </div>
  );
}

function DualTimeline({
  matches, duration, timeA, timeB,
}: {
  matches: MatchItem[]; duration: number; timeA: number; timeB: number;
}) {
  return (
    <div className="space-y-2">
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
              <div key={m.id} className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}` }}>
                {(m.isIntro || m.isOutro) && width > 8 && (
                  <span className="text-[7px] font-bold" style={{ color }}>{m.isIntro ? "INTRO" : "OUTRO"}</span>
                )}
              </div>
            );
          })}
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#B45309]" style={{ left: `${(timeA / duration) * 100}%` }} />
        </div>
      </div>
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
              <div key={m.id} className="absolute top-0.5 bottom-0.5 rounded" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}` }} />
            );
          })}
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#4D7C0F]" style={{ left: `${(timeB / duration) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl p-2.5">
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
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}15` }}>
          {match.label}
        </span>
        <span className="text-[13px] font-bold font-mono" style={{ color }}>{Math.round(match.confidence * 100)}%</span>
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

// ===================== RESULTS (DETECT) — with video player + jump buttons =====================

function DetectResultsScreen({
  onNew, onBack, isNative = false, nativeResult = null,
}: {
  onNew: () => void; onBack: () => void;
  isNative?: boolean; nativeResult?: unknown;
}) {
  const [time, setTime] = useState(5.0);
  const [playing, setPlaying] = useState(false);
  // Use native result if available, otherwise mock data
  const detections = isNative && nativeResult
    ? (nativeResult as { detections: Array<{ label: string; found: boolean; start: number; end: number; confidence: number; method: string[] }> }).detections
    : [
      { label: "intro", found: true, start: 2.1, end: 14.6, confidence: 0.92, method: ["audio-chroma"] },
      { label: "outro", found: true, start: 171.3, end: 185.0, confidence: 0.88, method: ["audio-chroma"] },
    ];
  const vidDuration = 200;

  const seekTo = (t: number) => setTime(t);

  return (
    <div className="flex flex-col min-h-[calc(800px-36px)] pb-8">
      {/* Floating top nav */}
      <div className="sticky top-2 z-20 px-3 pt-2">
        <div className="bg-white/90 backdrop-blur-xl border border-[#E7E5E4] rounded-2xl shadow-sm flex items-center gap-2 px-2 py-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F5F5F0] flex items-center justify-center">
            <ArrowLeft className="w-[18px] h-[18px]" />
          </motion.button>
          <h1 className="text-[15px] font-bold flex-1 text-center">Detection</h1>
          <div className="w-9 h-9" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-[#B45309]" />
            <span className="text-[14px] font-semibold">{detections.filter((d) => d.found).length} of {detections.length} found</span>
          </div>
          <p className="text-[11px] text-[#78716C]">Processed in 6.1s · audio only</p>
        </div>

        {/* Video player */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlaying(!playing)} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white translate-x-0.5" />}
            </motion.button>
          </div>
          {/* Time */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            <span className="text-[10px] font-mono text-white/90 bg-black/50 px-1.5 py-0.5 rounded">{fmt(time)}</span>
            <span className="text-[10px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded">{fmt(vidDuration)}</span>
          </div>
        </div>

        {/* Seek bar with intro/outro regions */}
        <div
          className="relative h-7 bg-white border border-[#E7E5E4] rounded-lg cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - rect.left) / rect.width) * vidDuration);
          }}
        >
          {detections.filter((d) => d.found).map((d, i) => {
            const left = (d.start / vidDuration) * 100;
            const width = ((d.end - d.start) / vidDuration) * 100;
            const color = d.label === "intro" ? "#4D7C0F" : "#C2410C";
            return (
              <div key={i} className="absolute top-0.5 bottom-0.5 rounded" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: `${color}30`, border: `1px solid ${color}60` }} />
            );
          })}
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#B45309] rounded-full border-2 border-white shadow-sm" style={{ left: `calc(${(time / vidDuration) * 100}% - 6px)` }} />
        </div>

        {/* Jump to intro/outro buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {detections.map((d, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => seekTo(d.start)}
              className="bg-white border border-[#E7E5E4] rounded-xl p-3 text-left"
              style={{ borderColor: d.found ? `${d.label === "intro" ? "#4D7C0F" : "#C2410C"}40` : "#E7E5E4" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: d.label === "intro" ? "#4D7C0F" : "#C2410C", backgroundColor: `${d.label === "intro" ? "#4D7C0F" : "#C2410C"}15` }}>
                  {d.label}
                </span>
                {d.found && <span className="text-[11px] font-bold text-[#4D7C0F]">{Math.round(d.confidence * 100)}%</span>}
              </div>
              <p className="text-[14px] font-bold font-mono">{d.found ? `${fmt(d.start)} → ${fmt(d.end)}` : "Not found"}</p>
              <p className="text-[10px] text-[#78716C] mt-0.5">{d.found ? `Duration: ${fmt(d.end - d.start)}` : ""}</p>
              {d.found && <p className="text-[10px] font-bold text-[#B45309] mt-1.5">Tap to jump →</p>}
            </motion.button>
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.98 }} onClick={onNew} className="w-full py-3 rounded-xl bg-[#B45309] text-white font-bold text-[14px]">
          New Detection
        </motion.button>
      </div>
    </div>
  );
}

function ExportSheet({ onClose, isNative = false, nativeResult = null }: { onClose: () => void; isNative?: boolean; nativeResult?: unknown }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (isNative) {
      const native = (window as unknown as { infroNative?: { exportSignature?: (json: string) => void } }).infroNative;
      // Extract signature from native result
      const result = nativeResult as { signature?: unknown };
      if (native?.exportSignature && result?.signature) {
        native.exportSignature(JSON.stringify(result.signature));
      }
    }
    setExported(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 z-50" />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 z-50"
      >
        <div className="w-10 h-1 bg-[#E7E5E4] rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold mb-2">Export Signature</h3>
        <p className="text-[13px] text-[#78716C] mb-5 leading-relaxed">
          Save a JSON file with intro/outro fingerprints. Use it in Detect mode to find the same segments in other videos.
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className={cn("w-full py-3.5 rounded-xl font-bold text-sm transition-all", exported ? "bg-[#4D7C0F] text-white" : "bg-[#B45309] text-white")}
        >
          {exported ? (
            <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Saved to Downloads</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Save to Downloads</span>
          )}
        </motion.button>
        <button onClick={onClose} className="w-full py-3 mt-2 text-[13px] font-medium text-[#78716C]">Close</button>
      </motion.div>
    </>
  );
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
