# Infro Android App

A companion Android app that detects intro/outro in a video using a signature exported from the [Infro web app](https://testplay-byte.github.io/INFRO/).

## How it works

1. Export a signature JSON from the web app (Compare mode → Analyze → Download JSON)
2. Open the Android app, select the signature file
3. Select a video from your device
4. Tap "Detect Intro & Outro"

The app decodes the video's audio track using `MediaCodec`, generates chroma fingerprints (same algorithm as the web app), and matches them against the signature's audio fingerprints using offset-histogram matching.

## Building

APKs are built automatically by GitHub Actions on every push. Download them from the [Actions tab](https://github.com/testplay-byte/INFRO/actions) → latest run → Artifacts.

### Manual build

```bash
cd android-app
gradle wrapper --gradle-version 8.5
gradle assembleDebug
# APK at app/build/outputs/apk/debug/app-debug.apk
```

## Architecture

- **MainActivity** — UI: file pickers, progress, results display
- **AudioExtractor** — MediaCodec-based audio decoding + mono downmix + resampling
- **AudioMatcher** — Chroma fingerprinting (FFT → chroma → offset-histogram matching)
- **SignatureData** — Gson models matching the web app's JSON format

The chroma fingerprinting is identical to the web app, so signatures are cross-compatible.
