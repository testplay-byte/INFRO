# Infro — Video & Audio Similarity Matcher

Detect repeated intros, outros, and shared clips between two videos — **entirely in your browser**. No uploads, no servers, no API calls. All decoding, fingerprinting, and matching happens locally on your device.

🔗 **Live site:** https://testplay-byte.github.io/INFRO/

## Features

- **Three comparison modes** — Audio, Video, or Combined (fuses both signals for best accuracy)
- **Multi-signal matching engine**
  - Video: perceptual difference hashing (dHash) + color histogram refinement
  - Audio: chroma features derived from FFT spectrograms
  - Diagonal cross-similarity scanning detects matches at any time offset
- **Automatic intro / outro detection** — inferred from match proximity to source start/end, no hardcoded durations
- **Interactive dual timeline** — zoom, pan, scrub, hover for details; clicking a match seeks both players
- **Synchronized video previews** — linked playback, speed control, frame stepping, fullscreen, volume
- **Fully client-side** — your media never leaves the browser. Built with Web Workers, Canvas, and the Web Audio API

## How it works

1. **Upload** two video or audio files (mp4, mov, webm, mkv, mp3, wav…)
2. **Choose a mode** — Audio, Video, or Combined
3. **Analyze** — frames are sampled and hashed; audio is decoded to PCM and transformed into chroma features; a diagonal cross-similarity scan finds matching regions at every possible time offset
4. **Inspect** — scrub the synced timeline, click matches to seek both players, review statistics

## Tech stack

- Next.js 16 (static export) · TypeScript · Tailwind CSS 4 · shadcn/ui
- Zustand for state · Web Workers for off-main-thread compute
- Pure-TS FFT / mel / chroma audio analysis · dHash perceptual video hashing

## Development

```bash
bun install
bun run dev        # local dev server on :3000
bun run build:static   # produce static export in out/ (for GitHub Pages)
```

## Deployment

The site is deployed to GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`). On every push to `main`, the workflow builds the static export and publishes it automatically.
