/**
 * Perceptual hashing for video frames.
 *
 * Pure, DOM-free functions so they can run inside a Web Worker. The main
 * thread extracts raw grayscale pixel grids (downscaled) and passes them
 * here; we compute a compact difference hash (dHash) plus a coarse color
 * signature.
 */

/**
 * Compute a 64-bit difference hash (dHash) from a grayscale grid.
 * The grid is expected to be 9 wide × 8 tall (72 pixels → 64 comparison
 * bits). If a different size is supplied we just compare horizontally
 * adjacent pixels and pack the bits.
 *
 * Returns a BigInt64Array of length 1 (kept as array for symmetry with
 * batch helpers).
 */
export function computeDHash(
  gray: Uint8Array,
  width: number,
  height: number,
): bigint {
  let hash = 0n;
  let bit = 0n;
  // Compare left vs right neighbour on each row — produces width-1 bits
  // per row. We cap at 64 bits.
  for (let y = 0; y < height && bit < 64n; y++) {
    for (let x = 0; x < width - 1 && bit < 64n; x++) {
      const left = gray[y * width + x];
      const right = gray[y * width + x + 1];
      if (left > right) hash |= 1n << bit;
      bit++;
    }
  }
  return hash;
}

/** Number of differing bits between two 64-bit hashes. */
export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x) {
    x &= x - 1n;
    count++;
  }
  return count;
}

/** Normalized similarity in [0,1] from two 64-bit hashes (1 = identical). */
export function hashSimilarity(a: bigint, b: bigint): number {
  return 1 - hammingDistance(a, b) / 64;
}

/**
 * Compute a coarse color histogram (8 bins per channel) from RGBA pixel
 * data. Used as a secondary signal: two frames with similar structure but
 * very different colors are less likely to be the same footage.
 *
 * Returns a Float32Array of length 24 (8 r + 8 g + 8 b), L1-normalized.
 */
export function colorHistogram(
  rgba: Uint8ClampedArray | Uint8Array,
): Float32Array {
  const bins = 8;
  const hist = new Float32Array(bins * 3);
  let pixels = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    hist[(r * bins) >> 8]++;
    hist[bins + ((g * bins) >> 8)]++;
    hist[bins * 2 + ((b * bins) >> 8)]++;
    pixels++;
  }
  if (pixels > 0) {
    for (let i = 0; i < hist.length; i++) hist[i] /= pixels;
  }
  return hist;
}

/**
 * Cosine similarity between two equal-length Float32Array vectors.
 * Returns 0 for zero-norm vectors.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/** Mean of a Float32Array slice. */
export function mean(arr: Float32Array | number[]): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return arr.length ? s / arr.length : 0;
}
