/**
 * Audio analysis primitives — FFT, mel filterbank, chroma features.
 *
 * Everything here is pure TypeScript (no DOM / Web Audio dependency) so it
 * can execute inside a Web Worker. The main thread decodes the media to
 * mono PCM (via the Web Audio API) and hands the Float32Array here.
 */

/** In-place radix-2 FFT. `re`/`im` length must be a power of two. */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1) return;
  // Bit reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  // Cooley-Tukey
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < half; k++) {
        const tRe = curRe * re[i + k + half] - curIm * im[i + k + half];
        const tIm = curRe * im[i + k + half] + curIm * re[i + k + half];
        re[i + k + half] = re[i + k] - tRe;
        im[i + k + half] = im[i + k] - tIm;
        re[i + k] += tRe;
        im[i + k] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

/**
 * Linear-interpolation resample of mono PCM to a target sample rate.
 */
export function resampleLinear(
  pcm: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return pcm;
  const ratio = toRate / fromRate;
  const outLen = Math.floor(pcm.length * ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i / ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, pcm.length - 1);
    const frac = srcPos - i0;
    out[i] = pcm[i0] * (1 - frac) + pcm[i1] * frac;
  }
  return out;
}

/** Mix multichannel PCM down to mono by averaging channels. */
export function mixToMono(
  channels: Float32Array[],
): Float32Array {
  if (channels.length === 1) return channels[0];
  const len = channels[0].length;
  const out = new Float32Array(len);
  for (let c = 0; c < channels.length; c++) {
    const ch = channels[c];
    for (let i = 0; i < len; i++) out[i] += ch[i];
  }
  const inv = 1 / channels.length;
  for (let i = 0; i < len; i++) out[i] *= inv;
  return out;
}

/** Pre-compute a mel triangular filterbank (numFilters × fftBins). */
export function createMelFilterbank(
  numFilters: number,
  fftSize: number,
  sampleRate: number,
  lowFreq = 0,
  highFreq?: number,
): Float32Array[] {
  const high = highFreq ?? sampleRate / 2;
  const minMel = mel(lowFreq);
  const maxMel = mel(high);
  const melPoints = new Float32Array(numFilters + 2);
  for (let i = 0; i < melPoints.length; i++) {
    melPoints[i] = minMel + ((maxMel - minMel) * i) / (numFilters + 1);
  }
  const hzPoints = new Float32Array(melPoints.length);
  for (let i = 0; i < melPoints.length; i++) hzPoints[i] = melInv(melPoints[i]);
  const binPoints = new Float32Array(hzPoints.length);
  const bins = fftSize / 2 + 1;
  for (let i = 0; i < hzPoints.length; i++) {
    binPoints[i] = Math.floor(((fftSize + 1) * hzPoints[i]) / sampleRate);
  }
  const bank: Float32Array[] = [];
  for (let f = 0; f < numFilters; f++) {
    const filter = new Float32Array(bins);
    for (let k = binPoints[f]; k < binPoints[f + 1]; k++) {
      if (k < 0 || k >= bins) continue;
      filter[k] =
        (k - binPoints[f]) / (binPoints[f + 1] - binPoints[f] || 1);
    }
    for (let k = binPoints[f + 1]; k < binPoints[f + 2]; k++) {
      if (k < 0 || k >= bins) continue;
      filter[k] =
        (binPoints[f + 2] - k) / (binPoints[f + 2] - binPoints[f + 1] || 1);
    }
    bank.push(filter);
  }
  return bank;
}

function mel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}
function melInv(m: number): number {
  return 700 * (Math.pow(10, m / 2595) - 1);
}

export interface SpectrogramOptions {
  fftSize: number;
  hop: number; // samples between frames
  sampleRate: number;
}

/**
 * Compute a magnitude spectrogram (linear) from mono PCM. Returns one
 * Float32Array (length fftSize/2+1) per time frame.
 */
export function magnitudeSpectrogram(
  pcm: Float32Array,
  opts: SpectrogramOptions,
): Float32Array[] {
  const { fftSize, hop, sampleRate } = opts;
  const bins = fftSize / 2 + 1;
  const numFrames = Math.max(0, Math.floor((pcm.length - fftSize) / hop) + 1);
  const frames: Float32Array[] = [];
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const window = hannWindow(fftSize);
  for (let f = 0; f < numFrames; f++) {
    const start = f * hop;
    for (let i = 0; i < fftSize; i++) {
      const s = start + i < pcm.length ? pcm[start + i] : 0;
      re[i] = s * window[i];
      im[i] = 0;
    }
    fft(re, im);
    const mag = new Float32Array(bins);
    for (let k = 0; k < bins; k++) {
      mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    }
    frames.push(mag);
  }
  return frames;
}

function hannWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return w;
}

/**
 * Compute mel-spectrogram frames (log-scaled). Each frame is a
 * numFilters-length Float32Array.
 */
export function melSpectrogram(
  pcm: Float32Array,
  opts: SpectrogramOptions,
  numFilters = 32,
): Float32Array[] {
  const { sampleRate, fftSize } = opts;
  const mag = magnitudeSpectrogram(pcm, opts);
  const bank = createMelFilterbank(numFilters, fftSize, sampleRate);
  const bins = fftSize / 2 + 1;
  return mag.map((frame) => {
    const mel = new Float32Array(numFilters);
    for (let f = 0; f < numFilters; f++) {
      const filter = bank[f];
      let e = 0;
      for (let k = 0; k < bins; k++) e += filter[k] * frame[k];
      // log with floor to avoid log(0)
      mel[f] = Math.log10(e + 1e-6);
    }
    return mel;
  });
}

/**
 * Compute chroma features (12-dim) from a magnitude spectrogram frame.
 * Chroma bins aggregate spectral energy across octave-equivalent pitch
 * classes — robust for detecting reused music / audio beds even when the
 * key or instrumentation differs slightly.
 */
export function chromaFromSpectrum(
  mag: Float32Array,
  fftSize: number,
  sampleRate: number,
): Float32Array {
  const chroma = new Float32Array(12);
  const bins = mag.length;
  for (let k = 1; k < bins; k++) {
    const freq = (k * sampleRate) / fftSize;
    if (freq < 55 || freq > 5000) continue; // restrict to a useful band
    const midi = 69 + 12 * Math.log2(freq / 440);
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    chroma[pc] += mag[k];
  }
  // Normalize
  let max = 0;
  for (let i = 0; i < 12; i++) if (chroma[i] > max) max = chroma[i];
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

/** Build a chroma feature sequence from mono PCM. */
export function chromaSequence(
  pcm: Float32Array,
  opts: SpectrogramOptions,
): Float32Array[] {
  const { fftSize, sampleRate } = opts;
  const mag = magnitudeSpectrogram(pcm, opts);
  return mag.map((frame) => chromaFromSpectrum(frame, fftSize, sampleRate));
}

/**
 * Memory-efficient streaming chroma: computes FFT + chroma per frame without
 * materialising the full magnitude spectrogram. This cuts peak memory from
 * O(frames × bins) down to O(1) scratch buffers + O(frames × 12) output.
 */
export function chromaSequenceStreaming(
  pcm: Float32Array,
  opts: SpectrogramOptions,
): Float32Array[] {
  const { fftSize, hop, sampleRate } = opts;
  const numFrames = Math.max(
    0,
    Math.floor((pcm.length - fftSize) / hop) + 1,
  );
  if (numFrames === 0) return [];

  const bins = fftSize / 2 + 1;
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const window = hannWindow(fftSize);
  const out: Float32Array[] = new Array(numFrames);

  for (let f = 0; f < numFrames; f++) {
    const start = f * hop;
    // Window into re[], clear im[]
    for (let i = 0; i < fftSize; i++) {
      re[i] = (start + i < pcm.length ? pcm[start + i] : 0) * window[i];
      im[i] = 0;
    }
    fft(re, im);
    // Compute chroma directly from the magnitude spectrum
    const chroma = new Float32Array(12);
    for (let k = 1; k < bins; k++) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      const freq = (k * sampleRate) / fftSize;
      if (freq < 55 || freq > 5000) continue;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      chroma[pc] += mag;
    }
    let max = 0;
    for (let i = 0; i < 12; i++) if (chroma[i] > max) max = chroma[i];
    if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
    out[f] = chroma;
  }
  return out;
}

/** Per-frame energy (RMS) of mono PCM — used to skip silence. */
export function energyEnvelope(
  pcm: Float32Array,
  hop: number,
  windowSize: number,
): Float32Array {
  const numFrames = Math.max(0, Math.floor((pcm.length - windowSize) / hop) + 1);
  const env = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const start = f * hop;
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const s = start + i < pcm.length ? pcm[start + i] : 0;
      sum += s * s;
    }
    env[f] = Math.sqrt(sum / windowSize);
  }
  return env;
}
