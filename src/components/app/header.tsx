"use client";

import { Settings, Github, RotateCcw, Sparkles, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ComparisonMode } from "@/lib/comparison/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const MODES: { value: ComparisonMode; label: string; hint: string }[] = [
  { value: "audio", label: "Audio", hint: "Match reused audio beds & music" },
  { value: "video", label: "Video", hint: "Match reused visual footage" },
  {
    value: "combined",
    label: "Combined",
    hint: "Fuse audio + video for best accuracy",
  },
];

export function Header({
  onOpenSettings,
  onRetry,
}: {
  onOpenSettings: () => void;
  onRetry?: () => void;
}) {
  const mode = useStore((s) => s.settings.mode);
  const updateSettings = useStore((s) => s.updateSettings);
  const hasResult = useStore((s) => s.status === "done");
  const reset = useStore((s) => s.reset);
  const status = useStore((s) => s.status);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight">
                Infro
              </span>
              <span className="hidden rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline">
                intro · outro
              </span>
            </div>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Video &amp; audio similarity matcher
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <TooltipProvider delayDuration={250}>
          <div className="mx-auto hidden items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 md:flex">
            {MODES.map((m) => (
              <Tooltip key={m.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={status === "processing"}
                    onClick={() => updateSettings({ mode: m.value })}
                    className={cn(
                      "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      mode === m.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
                      status === "processing" && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {m.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{m.hint}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {hasResult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New analysis</span>
            </Button>
          )}
          {hasResult && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Re-analyze</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <a
            href="https://github.com/testplay-byte/INFRO"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Mobile mode selector */}
      <div className="flex items-center gap-1 border-t border-border/50 px-3 py-2 md:hidden">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={status === "processing"}
            onClick={() => updateSettings({ mode: m.value })}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
              mode === m.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-copper shadow-md shadow-primary/20">
      <Sparkles className="h-5 w-5 text-primary-foreground" />
    </div>
  );
}
