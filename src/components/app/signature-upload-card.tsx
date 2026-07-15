"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileJson, Check, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { parseSignatureFile } from "@/hooks/use-comparison";
import { cn } from "@/lib/utils";

export function SignatureUploadCard() {
  const signatureFile = useStore((s) => s.signatureFile);
  const signatureData = useStore((s) => s.signatureData);
  const setSignature = useStore((s) => s.setSignature);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".json")) {
        toast({
          title: "Invalid file",
          description: "Please upload a .json signature file.",
          variant: "destructive",
        });
        return;
      }
      setLoading(true);
      try {
        const data = await parseSignatureFile(file);
        if (!data) {
          toast({
            title: "Invalid signature",
            description:
              "This JSON file is not a valid Infro signature. Export one from Compare mode first.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setSignature(file, data);
        toast({
          title: "Signature loaded",
          description: `${data.segments.length} segment${data.segments.length === 1 ? "" : "s"} ready for detection.`,
        });
      } catch {
        toast({
          title: "Could not read file",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [setSignature, toast],
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

  if (signatureFile && signatureData) {
    return (
      <div className="relative flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="relative flex-1 overflow-hidden bg-black/40">
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-sage/15 text-sage">
              <FileJson className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {signatureFile.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {signatureData.segments.length} segment
                {signatureData.segments.length === 1 ? "" : "s"} · mode:{" "}
                {signatureData.mode}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {signatureData.segments.map((seg, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium",
                    seg.label === "intro"
                      ? "bg-sage/15 text-sage"
                      : "bg-copper/15 text-copper",
                  )}
                >
                  <Check className="h-2.5 w-2.5" />
                  {seg.label} ({seg.videoHashes.length}v /{" "}
                  {seg.audioChroma.length}a)
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSignature(null, null)}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="Remove signature"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
          <p className="text-[13px] font-medium">Signature</p>
          <span className="font-mono text-[11px] uppercase text-muted-foreground">
            v{signatureData.version}
          </span>
        </div>
      </div>
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
        "hover:border-sage/50 hover:bg-sage/5",
        dragging && "border-sage bg-sage/10 scale-[1.01]",
        loading && "pointer-events-none opacity-70",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-border/60 bg-background/60 text-sage transition-colors">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">Drop signature JSON here</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          or click to browse · .json file
        </p>
      </div>
      <div className="absolute left-3 top-3">
        <span className="inline-flex h-5 items-center rounded-md bg-sage/15 px-2 text-[11px] font-semibold text-sage">
          Signature
        </span>
      </div>
    </div>
  );
}
