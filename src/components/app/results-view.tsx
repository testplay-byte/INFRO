"use client";

import { Info, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { VideoPreview } from "./video-preview";
import { Timeline } from "./timeline";
import { MatchList } from "./match-list";
import { StatsPanel } from "./stats-panel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ResultsView() {
  const result = useStore((s) => s.result);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  if (!result) return null;
  const { introOutro, stats, mode, streamA, streamB } = result;

  // Build the exportable signature — this is the "predefined intro values"
  // payload that a playback app can load to detect intro/outro in real-time.
  const signature = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    mode,
    sources: {
      a: { fileName: streamA.fileName, duration: streamA.duration },
      b: { fileName: streamB.fileName, duration: streamB.duration },
    },
    intro: introOutro.intro
      ? {
          aStart: introOutro.intro.aStart,
          aEnd: introOutro.intro.aEnd,
          bStart: introOutro.intro.bStart,
          bEnd: introOutro.intro.bEnd,
          confidence: introOutro.intro.confidence,
          method: introOutro.intro.method,
        }
      : null,
    outro: introOutro.outro
      ? {
          aStart: introOutro.outro.aStart,
          aEnd: introOutro.outro.aEnd,
          bStart: introOutro.outro.bStart,
          bEnd: introOutro.outro.bEnd,
          confidence: introOutro.outro.confidence,
          method: introOutro.outro.method,
        }
      : null,
    allMatches: result.matches.map((m) => ({
      aStart: m.aStart,
      aEnd: m.aEnd,
      bStart: m.bStart,
      bEnd: m.bEnd,
      confidence: m.confidence,
      method: m.method,
    })),
  };

  const downloadSignature = () => {
    const blob = new Blob([JSON.stringify(signature, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infro-signature-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Signature exported", description: "JSON file downloaded." });
  };

  const copySignature = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(signature, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Intro/outro summary banner */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Info className="h-4 w-4 text-primary" />
            Inferred from {stats.totalMatches} detected region
            {stats.totalMatches === 1 ? "" : "s"}
          </span>
          {introOutro.intro && (
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-sage">Intro</span> A{" "}
              {fmt(introOutro.intro.aStart)}–{fmt(introOutro.intro.aEnd)} · B{" "}
              {fmt(introOutro.intro.bStart)}–{fmt(introOutro.intro.bEnd)}
            </span>
          )}
          {introOutro.outro && (
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-copper">Outro</span> A{" "}
              {fmt(introOutro.outro.aStart)}–{fmt(introOutro.outro.aEnd)} · B{" "}
              {fmt(introOutro.outro.bStart)}–{fmt(introOutro.outro.bEnd)}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground/70">
            mode: {mode}
          </span>
        </div>

        {/* Export signature */}
        <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
          <span className="text-xs text-muted-foreground">
            Export signature for playback detection:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadSignature}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copySignature}
            className="gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-sage" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <VideoPreview />

      <Timeline />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MatchList />
        </div>
        <div className="lg:col-span-2">
          <StatsPanel />
        </div>
      </div>
    </div>
  );
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
