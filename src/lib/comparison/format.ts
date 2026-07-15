/** UI-facing formatting helpers. */

export { formatTime } from "./matcher";

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPercent(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function confidenceLabel(c: number): string {
  if (c >= 0.9) return "Very high";
  if (c >= 0.8) return "High";
  if (c >= 0.7) return "Moderate";
  if (c >= 0.55) return "Low";
  return "Weak";
}
