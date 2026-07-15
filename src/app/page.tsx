"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Zap,
  Lock,
  Cpu,
  AlertTriangle,
  RotateCcw,
  FileJson,
  Search,
  Columns,
} from "lucide-react";
import { Header } from "@/components/app/header";
import { UploadCard } from "@/components/app/upload-card";
import { ProgressPanel } from "@/components/app/progress-panel";
import { ResultsView } from "@/components/app/results-view";
import { DetectionResultsView } from "@/components/app/detection-results-view";
import { SettingsDialog } from "@/components/app/settings-dialog";
import { SignatureUploadCard } from "@/components/app/signature-upload-card";
import { useStore } from "@/lib/store";
import { useComparison, parseSignatureFile } from "@/hooks/use-comparison";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const detectionResult = useStore((s) => s.detectionResult);
  const error = useStore((s) => s.error);
  const viewMode = useStore((s) => s.viewMode);
  const canStart = useStore((s) => s.canStart());
  const slotA = useStore((s) => s.slotA);
  const slotB = useStore((s) => s.slotB);
  const signatureData = useStore((s) => s.signatureData);
  const setStatus = useStore((s) => s.setStatus);
  const { run, runDetect, retry } = useComparison();

  return (
    <div className="flex min-h-screen flex-col bg-grain">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onRetry={viewMode === "compare" ? retry : undefined}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {status === "processing" ? (
          <ProgressPanel />
        ) : status === "done" && result && viewMode === "compare" ? (
          <ResultsView />
        ) : status === "done" && detectionResult && viewMode === "detect" ? (
          <DetectionResultsView />
        ) : status === "error" ? (
          <ErrorView
            message={error ?? "An unknown error occurred."}
            onRetry={() => {
              setStatus("idle");
              if (viewMode === "detect") runDetect();
              else run();
            }}
            onDismiss={() => setStatus("idle")}
          />
        ) : (
          <IdleView
            viewMode={viewMode}
            canStart={canStart}
            hasA={!!slotA.file}
            hasB={!!slotB.file}
            hasSignature={!!signatureData}
            onRun={() => (viewMode === "detect" ? runDetect() : run())}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function IdleView({
  viewMode,
  canStart,
  hasA,
  hasB,
  hasSignature,
  onRun,
}: {
  viewMode: "compare" | "detect";
  canStart: boolean;
  hasA: boolean;
  hasB: boolean;
  hasSignature: boolean;
  onRun: () => void;
}) {
  return (
    <div className="space-y-10">
      {/* Mode toggle */}
      <ModeToggle />

      {/* Hero */}
      {viewMode === "compare" ? (
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Lock className="h-3.5 w-3.5" />
            100% in-browser · no uploads · no servers
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Find repeated{" "}
            <span className="bg-gradient-to-r from-primary to-copper bg-clip-text text-transparent">
              intros, outros
            </span>{" "}
            &amp; clips between two videos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground">
            Infro compares audio and visual fingerprints entirely on your device
            to surface matching segments — even when they&apos;re offset, partial,
            or scattered across the timeline.
          </p>
        </section>
      ) : (
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-4 py-1.5 text-xs font-medium text-sage">
            <Search className="h-3.5 w-3.5" />
            Detect intro &amp; outro using a saved signature
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Detect{" "}
            <span className="bg-gradient-to-r from-sage to-primary bg-clip-text text-transparent">
              intro &amp; outro
            </span>{" "}
            in a new video
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground">
            Upload a previously exported signature JSON and a new video. Infro
            will fingerprint the video and match it against the signature to
            find where the intro and outro appear.
          </p>
        </section>
      )}

      {/* Upload area */}
      {viewMode === "compare" ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <UploadCard slot="A" label="Video A" accent="amber" />
          <UploadCard slot="B" label="Video B" accent="sage" />
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SignatureUploadCard />
          <UploadCard slot="B" label="Video to analyze" accent="sage" />
        </section>
      )}

      {/* Action */}
      <section className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={onRun}
          className={cn(
            "h-14 gap-2.5 rounded-xl px-10 text-base font-bold shadow-lg transition-all",
            canStart && "shadow-primary/30 hover:scale-[1.02]",
          )}
        >
          <Play className="h-5 w-5" />
          {viewMode === "detect"
            ? hasSignature
              ? "Detect intro & outro"
              : "Upload signature to begin"
            : hasA && hasB
              ? "Analyze similarity"
              : "Add both videos to begin"}
          {canStart && <ArrowRight className="h-5 w-5" />}
        </Button>
      </section>

      {/* Feature row */}
      {viewMode === "compare" && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Multi-signal matching"
            body="Perceptual frame hashing, color histograms and chroma audio fingerprints are fused for robust detection."
          />
          <Feature
            icon={<Cpu className="h-5 w-5" />}
            title="WebWorker-powered"
            body="Frame extraction, FFT and cross-similarity run off the main thread so the UI never freezes."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Private by design"
            body="Your media never leaves the browser. Everything — decode, fingerprint, compare — is local."
          />
        </section>
      )}

      {viewMode === "detect" && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature
            icon={<FileJson className="h-5 w-5" />}
            title="Robust signatures"
            body="Signatures contain actual fingerprint data — video hashes and audio chroma vectors — not just timecodes."
          />
          <Feature
            icon={<Search className="h-5 w-5" />}
            title="Fingerprint matching"
            body="The new video is fingerprinted and matched against the signature using the same offset-histogram engine."
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Real-time ready"
            body="Exported signatures are designed for playback apps that need to skip intros/outros in real time."
          />
        </section>
      )}
    </div>
  );
}

function ModeToggle() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const status = useStore((s) => s.status);
  const disabled = status === "processing";

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setViewMode("compare")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
            viewMode === "compare"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <Columns className="h-4 w-4" />
          Compare
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setViewMode("detect")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
            viewMode === "detect"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <Search className="h-4 w-4" />
          Detect
        </button>
      </div>
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Analysis failed</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDismiss} className="gap-1.5">
          Back
        </Button>
        <Button onClick={onRetry} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:border-primary/30">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-sage" />
          <span>All processing happens locally in your browser.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono">v1.1.0</span>
          <span className="opacity-40">·</span>
          <a
            href="https://github.com/testplay-byte/INFRO"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
