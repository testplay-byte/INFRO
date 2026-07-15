"use client";

import { useState } from "react";
import { ShieldCheck, Play, ArrowRight, Zap, Lock, Cpu } from "lucide-react";
import { Header } from "@/components/app/header";
import { UploadCard } from "@/components/app/upload-card";
import { ProgressPanel } from "@/components/app/progress-panel";
import { ResultsView } from "@/components/app/results-view";
import { SettingsDialog } from "@/components/app/settings-dialog";
import { useStore } from "@/lib/store";
import { useComparison } from "@/hooks/use-comparison";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const canStart = useStore((s) => s.canStart());
  const slotA = useStore((s) => s.slotA);
  const slotB = useStore((s) => s.slotB);
  const { run } = useComparison();

  return (
    <div className="flex min-h-screen flex-col bg-grain">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {status === "processing" ? (
          <ProgressPanel />
        ) : status === "done" && result ? (
          <ResultsView />
        ) : (
          <IdleView
            canStart={canStart}
            hasA={!!slotA.file}
            hasB={!!slotB.file}
            onRun={run}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function IdleView({
  canStart,
  hasA,
  hasB,
  onRun,
}: {
  canStart: boolean;
  hasA: boolean;
  hasB: boolean;
  onRun: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3 text-sage" />
          100% in-browser · no uploads · no servers
        </div>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Find repeated intros, outros &amp; clips between two videos
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-muted-foreground">
          Infro compares audio and visual fingerprints entirely on your device
          to surface matching segments — even when they&apos;re offset, partial,
          or scattered across the timeline.
        </p>
      </section>

      {/* Upload */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UploadCard slot="A" label="Video A" accent="amber" />
        <UploadCard slot="B" label="Video B" accent="sage" />
      </section>

      {/* Action */}
      <section className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={onRun}
          className={cn(
            "h-12 gap-2 rounded-xl px-8 text-sm font-medium shadow-sm transition-all",
            canStart && "shadow-primary/20",
          )}
        >
          <Play className="h-4 w-4" />
          {hasA && hasB ? "Analyze similarity" : "Add both videos to begin"}
          {canStart && <ArrowRight className="h-4 w-4" />}
        </Button>
        {!canStart && hasA && hasB && (
          <p className="text-[11px] text-muted-foreground">
            Tip: switch to Video or Combined mode in the header.
          </p>
        )}
      </section>

      {/* Feature row */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Feature
          icon={<Zap className="h-4 w-4" />}
          title="Multi-signal matching"
          body="Perceptual frame hashing, color histograms and chroma audio fingerprints are fused for robust detection."
        />
        <Feature
          icon={<Cpu className="h-4 w-4" />}
          title="WebWorker-powered"
          body="Frame extraction, FFT and cross-similarity run off the main thread so the UI never freezes."
        />
        <Feature
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Private by design"
          body="Your media never leaves the browser. Everything — decode, fingerprint, compare — is local."
        />
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ol className="mt-3 grid grid-cols-1 gap-3 text-[13px] text-muted-foreground sm:grid-cols-4">
          <Step n={1} title="Upload" body="Drop two videos or audio files. They stay on your device." />
          <Step n={2} title="Choose a mode" body="Audio, Video, or Combined for the strongest signal." />
          <Step n={3} title="Analyze" body="Frames & audio are fingerprinted, then cross-correlated." />
          <Step n={4} title="Inspect" body="Scrub the synced timeline and preview both sources." />
        </ol>
      </section>
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
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-2.5 text-[13px] font-semibold">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
        {n}
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{body}</p>
      </div>
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
          <span className="font-mono">v1.0.0</span>
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
