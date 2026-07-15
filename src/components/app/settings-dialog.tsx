"use client";

import { Gauge, Sliders, Cpu, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRECISION_PRESETS, type AnalysisSettings } from "@/lib/comparison/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetSettings = useStore((s) => s.resetSettings);

  const set = (patch: Partial<AnalysisSettings>) => updateSettings(patch);

  const setPrecision = (precision: AnalysisSettings["precision"]) => {
    const preset = PRECISION_PRESETS[precision];
    updateSettings({ precision, frameSampleRate: preset.frameSampleRate });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analysis settings</DialogTitle>
          <DialogDescription>
            Tune sampling, matching sensitivity and performance. Defaults are
            balanced for typical web video.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Precision */}
          <Section icon={<Gauge className="h-3.5 w-3.5" />} title="Precision">
            <div className="grid grid-cols-3 gap-2">
              {(["fast", "balanced", "accurate"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrecision(p)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                    settings.precision === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {settings.precision === "fast" &&
                "1 fps · coarse audio · fastest"}
              {settings.precision === "balanced" &&
                "2 fps · standard audio · recommended"}
              {settings.precision === "accurate" &&
                "4 fps · dense audio · slowest, most thorough"}
            </p>
          </Section>

          {/* Sampling */}
          <Section icon={<Sliders className="h-3.5 w-3.5" />} title="Sampling">
            <Field
              label="Frame sample rate"
              value={`${settings.frameSampleRate} fps`}
            >
              <Slider
                value={[settings.frameSampleRate]}
                min={1}
                max={6}
                step={1}
                onValueChange={(v) => set({ frameSampleRate: v[0] })}
              />
            </Field>
            <Field
              label="Audio sample rate"
              value={`${(settings.audioSampleRate / 1000).toFixed(1)} kHz`}
            >
              <Slider
                value={[settings.audioSampleRate]}
                min={6000}
                max={16000}
                step={1000}
                onValueChange={(v) => set({ audioSampleRate: v[0] })}
              />
            </Field>
          </Section>

          {/* Matching */}
          <Section icon={<Gauge className="h-3.5 w-3.5" />} title="Matching">
            <Field
              label="Similarity threshold"
              value={`${Math.round(settings.similarityThreshold * 100)}%`}
            >
              <Slider
                value={[settings.similarityThreshold]}
                min={0.7}
                max={0.98}
                step={0.01}
                onValueChange={(v) => set({ similarityThreshold: v[0] })}
              />
            </Field>
            <Field
              label="Minimum match duration"
              value={`${settings.minMatchDuration.toFixed(1)} s`}
            >
              <Slider
                value={[settings.minMatchDuration]}
                min={2}
                max={30}
                step={1}
                onValueChange={(v) => set({ minMatchDuration: v[0] })}
              />
            </Field>
            <Field
              label="Maximum gap within a match"
              value={`${settings.maxGap.toFixed(1)} s`}
            >
              <Slider
                value={[settings.maxGap]}
                min={0.3}
                max={3}
                step={0.1}
                onValueChange={(v) => set({ maxGap: v[0] })}
              />
            </Field>
            <Field
              label="Match density"
              value={`${Math.round(settings.matchDensity * 100)}%`}
            >
              <Slider
                value={[settings.matchDensity]}
                min={0.3}
                max={0.95}
                step={0.05}
                onValueChange={(v) => set({ matchDensity: v[0] })}
              />
            </Field>
          </Section>

          {/* Performance */}
          <Section icon={<Cpu className="h-3.5 w-3.5" />} title="Performance">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium">GPU acceleration</p>
                <p className="text-[11px] text-muted-foreground">
                  Use OffscreenCanvas / WebCodecs when available
                </p>
              </div>
              <Switch
                checked={settings.gpuAcceleration}
                onCheckedChange={(c) => set({ gpuAcceleration: c })}
              />
            </div>
          </Section>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-[13px] text-foreground/90">{label}</Label>
        <span className="font-mono text-[11px] text-muted-foreground">
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}
