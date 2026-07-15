/**
 * Offset-histogram matcher — a Shazam-style approach to detecting repeated
 * segments between two fingerprint streams.
 *
 * ALGORITHM (O(N) instead of O(N×M) diagonal scanning):
 *
 * 1. BUILD a hash table from stream B: hash → [frame indices in B]
 *    - For hash streams (video dHash): use the raw 32-bit hash directly
 *    - For vector streams (audio chroma): quantize each 12-dim vector to a
 *      compact signature (1 bit per bin: above/below mean → 12-bit key)
 *
 * 2. LOOKUP each frame in A against the hash table. Every hit (i, j)
 *    produces a candidate offset d = j − i. Record (i, d) pairs.
 *
 * 3. CLUSTER by offset. Real matches produce many hits at the SAME offset
 *    (because the shared segment is time-shifted by a constant amount).
 *    Random noise produces scattered offsets with 1-2 hits each.
 *
 * 4. VERIFY only the top-K candidate offsets by walking the diagonal,
 *    computing actual per-frame similarity, and extracting contiguous
 *    runs above the density threshold.
 *
 * This is dramatically faster than scanning every diagonal: instead of
 * N+M−1 diagonals × up-to-min(N,M) comparisons, we do N lookups (O(1)
 * each) plus K diagonal verifications (K is typically 5-50).
 */

import type {
  FingerprintStream,
  Match,
  AnalysisSettings,
} from "./types";
import { hashSimilarity, cosineSimilarity } from "./perceptual";
import {
  streamLength,
  rawToMatches,
  dedupeMatches,
  assignGroups,
  fuseMatches,
  type RawMatch,
} from "./matcher";

/** Quantize a chroma vector to a compact integer key for hash lookup. */
function quantizeVector(v: Float32Array): number {
  const mean =
    v.reduce((s, x) => s + x, 0) / Math.max(1, v.length);
  let key = 0;
  for (let i = 0; i < v.length && i < 16; i++) {
    if (v[i] >= mean) key |= 1 << i;
  }
  return key;
}

/** Per-frame similarity dispatch based on stream kind. */
function pairSimilarity(
  A: FingerprintStream,
  i: number,
  B: FingerprintStream,
  j: number,
): number {
  if (A.hashes && B.hashes) {
    return hashSimilarity(A.hashes[i], B.hashes[j]);
  }
  return cosineSimilarity(A.vectors[i], B.vectors[j]);
}

/** Build a hash table from stream B: key → [frame indices]. */
function buildHashTable(stream: FingerprintStream): Map<number, number[]> {
  const n = streamLength(stream);
  const table = new Map<number, number[]>();
  if (stream.hashes) {
    for (let j = 0; j < n; j++) {
      const key = stream.hashes[j];
      let arr = table.get(key);
      if (!arr) {
        arr = [];
        table.set(key, arr);
      }
      arr.push(j);
    }
  } else {
    for (let j = 0; j < n; j++) {
      const key = quantizeVector(stream.vectors[j]);
      let arr = table.get(key);
      if (!arr) {
        arr = [];
        table.set(key, arr);
      }
      arr.push(j);
    }
  }
  return table;
}

interface OffsetCandidate {
  offset: number;
  aFrames: number[]; // sorted A-frame indices that matched at this offset
}

/**
 * Match a single pair of streams using the offset-histogram approach.
 */
export function matchByOffsetHistogram(
  A: FingerprintStream,
  B: FingerprintStream,
  settings: AnalysisSettings,
  method: string,
  onProgress?: (p: number, detail: string) => void,
): RawMatch[] {
  const N = streamLength(A);
  const M = streamLength(B);
  if (N < 2 || M < 2) return [];

  const hop = A.hop;
  const threshold = settings.similarityThreshold;
  const windowFrames = Math.max(3, Math.round(1.0 / hop));
  const minFrames = Math.max(1, Math.round(settings.minMatchDuration / hop));
  const gapFrames = Math.max(1, Math.round(settings.maxGap / hop));

  // ---- Step 1: Build hash table from B ----
  if (onProgress) onProgress(0.1, `${method} · building index`);
  const bTable = buildHashTable(B);

  // ---- Step 2: Lookup each A frame, collect offset hits ----
  if (onProgress) onProgress(0.2, `${method} · scanning`);
  const offsetMap = new Map<number, number[]>(); // offset → [a-frames]

  for (let i = 0; i < N; i++) {
    if (onProgress && i % Math.max(1, Math.floor(N / 10)) === 0) {
      onProgress(0.2 + 0.4 * (i / N), `${method} · scanning ${i}/${N}`);
    }

    let key: number;
    if (A.hashes) {
      key = A.hashes[i];
    } else {
      key = quantizeVector(A.vectors[i]);
    }

    const bMatches = bTable.get(key);
    if (bMatches) {
      for (const j of bMatches) {
        const offset = j - i;
        let arr = offsetMap.get(offset);
        if (!arr) {
          arr = [];
          offsetMap.set(offset, arr);
        }
        arr.push(i);
      }
    }
  }

  // ---- Step 3: Filter to candidate offsets with enough hits ----
  if (onProgress) onProgress(0.6, `${method} · clustering`);
  const candidates: OffsetCandidate[] = [];
  for (const [offset, aFrames] of offsetMap) {
    if (aFrames.length >= minFrames) {
      aFrames.sort((a, b) => a - b);
      candidates.push({ offset, aFrames });
    }
  }
  // Sort by hit count descending — verify most promising first
  candidates.sort((a, b) => b.aFrames.length - a.aFrames.length);

  // Cap the number of offsets we verify to bound computation
  const MAX_OFFSETS = 100;
  const toVerify = candidates.slice(0, MAX_OFFSETS);

  // ---- Step 4: Verify each candidate offset by walking the diagonal ----
  if (onProgress) onProgress(0.7, `${method} · verifying ${toVerify.length} alignments`);
  const raw: RawMatch[] = [];
  const maxLen = Math.min(N, M);
  const simsBuf = new Float32Array(maxLen);
  const flagsBuf = new Uint8Array(maxLen);

  for (let c = 0; c < toVerify.length; c++) {
    const { offset, aFrames } = toVerify[c];
    if (onProgress && c % 10 === 0) {
      onProgress(
        0.7 + 0.3 * (c / Math.max(1, toVerify.length)),
        `${method} · verifying ${c + 1}/${toVerify.length}`,
      );
    }

    // The aFrames tell us where matches were found. But we need to verify
    // the FULL diagonal to find precise boundaries and filter false positives.
    const d = offset;
    const iStart = Math.max(0, -d);
    const iEnd = Math.min(N - 1, M - 1 - d);
    if (iEnd - iStart + 1 < minFrames) continue;

    const len = iEnd - iStart + 1;
    const sims = simsBuf.subarray(0, len);
    const flags = flagsBuf.subarray(0, len);

    // Only compute similarity where we have hits, to save time. But we also
    // need the surrounding context for run extraction. So compute similarity
    // for the full diagonal — it's cheap with the reusable buffer.
    for (let k = 0; k < len; k++) {
      sims[k] = pairSimilarity(A, iStart + k, B, iStart + k + d);
      flags[k] = 0;
    }

    // Density-based in-match flags via sliding window
    let lo = 0;
    let hit = 0;
    for (let hi = 0; hi < len; hi++) {
      if (sims[hi] >= threshold) hit++;
      while (hi - lo + 1 > windowFrames) {
        if (sims[lo] >= threshold) hit--;
        lo++;
      }
      if (hi - lo + 1 === windowFrames) {
        if (hit / windowFrames >= settings.matchDensity) {
          flags[hi] = 1;
        }
      } else if (hi - lo + 1 < windowFrames && hi === len - 1) {
        if (hit / (hi - lo + 1) >= settings.matchDensity) {
          flags[hi] = 1;
        }
      }
    }

    // Extract runs, merging gaps <= gapFrames
    let k = 0;
    while (k < len) {
      if (!flags[k]) {
        k++;
        continue;
      }
      const runStart = k;
      let runEnd = k;
      let m = k + 1;
      while (m < len) {
        if (flags[m]) {
          runEnd = m;
          m++;
        } else {
          let gap = 0;
          let p = m;
          while (p < len && !flags[p] && gap < gapFrames) {
            gap++;
            p++;
          }
          if (p < len && flags[p] && gap <= gapFrames) {
            runEnd = p;
            m = p + 1;
          } else {
            break;
          }
        }
      }
      const runLen = runEnd - runStart + 1;
      if (runLen >= minFrames) {
        let sum = 0;
        let cnt = 0;
        for (let q = runStart; q <= runEnd; q++) {
          if (sims[q] >= threshold) {
            sum += sims[q];
            cnt++;
          }
        }
        const similarity = cnt > 0 ? sum / cnt : 0;
        // Only accept if similarity is reasonable (filters false positives
        // from hash collisions)
        if (similarity >= threshold * 0.8) {
          raw.push({
            aStartIdx: iStart + runStart,
            aEndIdx: iStart + runEnd,
            offset: d,
            similarity,
            method,
          });
        }
      }
      k = m;
    }
  }

  if (onProgress) onProgress(1, `${method} · done`);
  return raw;
}

/**
 * Full pipeline: run all relevant stream comparisons for the active mode
 * and return finalized matches. Uses the offset-histogram matcher.
 */
export function runMatchingOptimized(
  streamsA: FingerprintStream[],
  streamsB: FingerprintStream[],
  settings: AnalysisSettings,
  onProgress?: (p: number, detail: string) => void,
): { matches: Match[]; groupCount: number } {
  const videoA = streamsA.filter((s) => s.kind === "video-dhash");
  const videoB = streamsB.filter((s) => s.kind === "video-dhash");
  const colorA = streamsA.filter((s) => s.kind === "video-color");
  const colorB = streamsB.filter((s) => s.kind === "video-color");
  const audioA = streamsA.filter((s) => s.kind.startsWith("audio"));
  const audioB = streamsB.filter((s) => s.kind.startsWith("audio"));

  const wantVideo = settings.mode === "video" || settings.mode === "combined";
  const wantAudio = settings.mode === "audio" || settings.mode === "combined";

  let videoMatches: Match[] = [];
  let audioMatches: Match[] = [];

  if (wantVideo && videoA.length && videoB.length) {
    const raw = matchByOffsetHistogram(
      videoA[0],
      videoB[0],
      settings,
      "video-dhash",
      (p, d) => onProgress?.(0.5 * p, d),
    );
    videoMatches = dedupeMatches(rawToMatches(raw, videoA[0], videoB[0]));
    if (colorA.length && colorB.length) {
      videoMatches = videoMatches.map((m) => {
        const cs = colorSimilarityFor(colorA[0], colorB[0], m);
        return {
          ...m,
          confidence: m.confidence * (0.7 + 0.3 * cs),
          method: [...m.method, "video-color"],
        };
      });
    }
  }

  if (wantAudio && audioA.length && audioB.length) {
    const raw = matchByOffsetHistogram(
      audioA[0],
      audioB[0],
      settings,
      "audio-chroma",
      (p, d) => onProgress?.(0.5 + 0.5 * p, d),
    );
    audioMatches = dedupeMatches(rawToMatches(raw, audioA[0], audioB[0]));
  }

  let matches: Match[];
  if (settings.mode === "combined") {
    matches = fuseMatches(videoMatches, audioMatches);
  } else if (settings.mode === "video") {
    matches = videoMatches;
  } else {
    matches = audioMatches;
  }

  matches = dedupeMatches(matches);
  // Cap total matches to prevent UI overload
  if (matches.length > 200) {
    matches = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 200);
  }
  const hop = (videoA[0] || audioA[0] || { hop: 0.5 }).hop;
  const grouped = assignGroups(matches, hop);
  onProgress?.(1, "done");
  return grouped;
}

/** Mean color-similarity across the frames inside a match region. */
function colorSimilarityFor(
  colorA: FingerprintStream,
  colorB: FingerprintStream,
  m: Match,
): number {
  const aIdx0 = findIndexAt(colorA.times, m.aStart);
  const aIdx1 = findIndexAt(colorA.times, m.aEnd);
  const bIdx0 = findIndexAt(colorB.times, m.bStart);
  const bIdx1 = findIndexAt(colorB.times, m.bEnd);
  if (aIdx0 < 0 || bIdx0 < 0) return 0.5;
  let sum = 0;
  let cnt = 0;
  let ai = aIdx0;
  let bi = bIdx0;
  while (ai <= aIdx1 && bi <= bIdx1) {
    sum += cosineSimilarity(colorA.vectors[ai], colorB.vectors[bi]);
    cnt++;
    ai++;
    bi++;
  }
  return cnt > 0 ? sum / cnt : 0.5;
}

function findIndexAt(times: Float32Array, t: number): number {
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(times[i] - t);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}
