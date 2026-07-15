"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Film, Music2, AlertCircle, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { validateFile, probeMedia } from "@/lib/comparison/extract";
import { formatBytes, formatDuration } from "@/lib/comparison/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  slot: "A" | "B";
  label: string;
  accent?: "amber" | "sage";
}

export function UploadCard({ slot, label, accent = "amber" }: Props) {
  const fileSlot = useStore((s) => (slot === "A" ? s.slotA : s.slotB));
  const setFile = useStore((s) => s.setFile);
  const status = useStore((s) => s.status);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const err = validateFile(file);
      if (err) {
        toast({ title: "Unsupported file", description: err, variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const meta = await probeMedia(file);
        if (!meta.duration || meta.duration < 0.2) {
          toast({
            title: "File too short",
            description: "Please choose a media file longer than 0.2 seconds.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setFile(slot, file, meta);
      } catch (e) {
        toast({
          title: "Could not read file",
          description:
            e instanceof Error ? e.message : "The browser could not decode this file.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [slot, setFile, toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const accentRing =
    accent === "sage"
      ? "hover:border-sage/50 hover:bg-sage/5"
      : "hover:border-primary/50 hover:bg-primary/5";

  if (fileSlot.file && fileSlot.meta) {
    return (
      <FilledCard
        slot={slot}
        label={label}
        fileSlot={fileSlot}
        onRemove={() => setFile(slot, null, null)}
        disabled={status === "processing"}
      />
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center transition-all",
        accentRing,
        dragging && "border-primary bg-primary/10 scale-[1.01]",
        loading && "pointer-events-none opacity-70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.mov,.webm,.mkv,.m4v,.avi,.ogv,.ogg,.mp3,.wav,.m4a,.aac,.flac"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl border border-border/60 bg-background/60 transition-colors",
          accent === "sage" ? "text-sage" : "text-primary",
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
      </div>

      <div>
        <p className="text-sm font-medium">
          Drop {label} here
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          or click to browse · mp4, mov, webm, mkv, mp3…
        </p>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
        {["mp4", "mov", "webm", "mkv", "mp3", "wav"].map((ext) => (
          <span
            key={ext}
            className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            .{ext}
          </span>
        ))}
      </div>

      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex h-5 items-center rounded-md px-2 text-[11px] font-semibold",
            accent === "sage"
              ? "bg-sage/15 text-sage"
              : "bg-primary/15 text-primary",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function FilledCard({
  slot,
  label,
  fileSlot,
  onRemove,
  disabled,
}: {
  slot: "A" | "B";
  label: string;
  fileSlot: ReturnType<typeof useStore.getState>["slotA"];
  onRemove: () => void;
  disabled: boolean;
}) {
  const meta = fileSlot.meta!;
  const isAudio = !meta.width || !meta.height;
  return (
    <div className="relative flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60">
      {/* Preview */}
      <div className="relative flex-1 overflow-hidden bg-black/40">
        {fileSlot.previewUrl && !isAudio ? (
          <video
            src={fileSlot.previewUrl}
            className="h-full w-full object-contain"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Music2 className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="inline-flex h-5 items-center rounded-md bg-background/80 px-2 text-[11px] font-semibold backdrop-blur">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onRemove();
          }}
          disabled={disabled}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:opacity-40"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium" title={meta.fileName}>
            {meta.fileName}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Film className="h-3 w-3" />
            {isAudio
              ? "audio"
              : `${meta.width}×${meta.height}`}
            <span className="opacity-40">·</span>
            {formatDuration(meta.duration)}
            <span className="opacity-40">·</span>
            {formatBytes(meta.size)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {fileSlot.audioAvailable === false && (
            <Badge variant="outline" className="border-destructive/40 text-destructive gap-1 text-[10px]">
              <AlertCircle className="h-2.5 w-2.5" />no audio
            </Badge>
          )}
          <span className="font-mono text-[11px] uppercase text-muted-foreground">
            {meta.fileType.split("/")[0] || "media"}
          </span>
        </div>
      </div>
    </div>
  );
}
