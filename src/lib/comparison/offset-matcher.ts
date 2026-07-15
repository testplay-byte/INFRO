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
import { hashSimilarity, cosineSimilarity, UNIFORM_FRAME_HASH } from "./perceptual";
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

/** Check if an audio chroma vector is near-silent (all zeros or near-uniform). */
function isSilentChroma(v: Float32Array): boolean {
  let energy = 0;
  for (let i = 0; i < v.length; i++) energy += v[i] * v[i];
  return energy < 0.01;
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
      // Skip uniform/black frames — they cause false matches
      if (key === UNIFORM_FRAME_HASH) continue;
      let arr = table.get(key);
      if (!arr) {
        arr = [];
        table.set(key, arr);
      }
      arr.push(j);
    }
  } else {
    for (let j = 0; j < n; j++) {
      // Skip silent audio frames — they produce degenerate chroma vectors
      if (isSilentChroma(stream.vectors[j])) continue;
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
      // Skip uniform/black frames — they never match legitimately
      if (key === UNIFORM_FRAME_HASH) continue;
    } else {
      // Skip silent audio frames
      if (isSilentChroma(A.vectors[i])) continue;
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

        // Strict acceptance: require actual similarity >= threshold.
        if (similarity >= threshold) {
          // ---- Gradient-based boundary refinement ----
          // Extend backward/forward to find the TRUE edges where similarity
          // drops off. We stop at the steepest descent point rather than
          // extending while above a fixed floor — this prevents the match
          // from bleeding into adjacent content during gradual transitions.
          const refinedStart = refineStartBoundary(sims, runStart);
          const refinedEnd = refineEndBoundary(sims, runEnd, len);

          raw.push({
            aStartIdx: iStart + refinedStart,
            aEndIdx: iStart + refinedEnd,
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
 * Refine the START boundary: extend backward while similarity is above the
 * floor, but stop at the steepest drop-off. Uses 75% of threshold as the
 * floor and detects the gradient change to avoid over-extension.
 */
function refineStartBoundary(
  sims: Float32Array,
  runStart: number,
): number {
  const floor = 0.6; // absolute floor — below this is definitely not a match
  let pos = runStart;
  let prevSim = sims[runStart];
  while (pos > 0) {
    const nextSim = sims[pos - 1];
    if (nextSim < floor) break;
    // Stop if we detect a significant drop (steepest descent point)
    if (prevSim - nextSim > 0.15 && nextSim < 0.75) break;
    pos--;
    prevSim = nextSim;
  }
  return pos;
}

/**
 * Refine the END boundary: extend forward, but stop MORE aggressively than
 * the start. The end of an intro/outro is where the unique content begins,
 * so we use a tighter floor and detect the drop-off sooner to prevent the
 * match from extending too late.
 */
function refineEndBoundary(
  sims: Float32Array,
  runEnd: number,
  len: number,
): number {
  const floor = 0.7; // tighter floor for the end — prevents over-extension
  let pos = runEnd;
  let prevSim = sims[runEnd];
  while (pos < len - 1) {
    const nextSim = sims[pos + 1];
    if (nextSim < floor) break;
    // Stop at the first significant drop — this is the true boundary
    if (prevSim - nextSim > 0.1 && nextSim < 0.8) break;
    pos++;
    prevSim = nextSim;
  }
  return pos;
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

  // ---- Targeted outro scan ----
  // The outro often has slightly lower similarity (encoding differences at
  // the end of videos, credits fading in, etc.) and may not pass the strict
  // threshold. We do a targeted scan of the last 30s of both videos with a
  // relaxed threshold specifically to catch the outro.
  const outroScan = targetedEndScan(streamsA, streamsB, settings);
  if (outroScan) {
    // Only add if it doesn't heavily overlap with an existing match
    const overlaps = matches.some(
      (m) => overlapFractionA(m, outroScan) > 0.5,
    );
    if (!overlaps) {
      matches.push(outroScan);
      matches = dedupeMatches(matches);
    }
  }

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

/** Check if two matches overlap heavily in the A timeline. */
function overlapFractionA(a: Match, b: Match): number {
  const start = Math.max(a.aStart, b.aStart);
  const end = Math.min(a.aEnd, b.aEnd);
  if (end <= start) return 0;
  const minLen = Math.min(a.aEnd - a.aStart, b.aEnd - b.aStart);
  return minLen > 0 ? (end - start) / minLen : 0;
}

/**
 * Targeted scan of the END regions of both videos to catch outros that
 * don't pass the strict threshold. Compares only the last 30 seconds using
 * a relaxed threshold.
 */
function targetedEndScan(
  streamsA: FingerprintStream[],
  streamsB: FingerprintStream[],
  settings: AnalysisSettings,
): Match | null {
  const videoA = streamsA.filter((s) => s.kind === "video-dhash");
  const videoB = streamsB.filter((s) => s.kind === "video-dhash");
  const audioA = streamsA.filter((s) => s.kind.startsWith("audio"));
  const audioB = streamsB.filter((s) => s.kind.startsWith("audio"));

  // Build sub-streams containing only the last 30 seconds
  const END_WINDOW = 30;
  const relaxedSettings: AnalysisSettings = {
    ...settings,
    similarityThreshold: Math.max(0.7, settings.similarityThreshold - 0.1),
    minMatchDuration: Math.max(3, settings.minMatchDuration / 2),
    matchDensity: 0.5,
  };

  let bestMatch: Match | null = null;

  // Try video
  if (videoA.length && videoB.length) {
    const subA = substreamLastN(videoA[0], END_WINDOW);
    const subB = substreamLastN(videoB[0], END_WINDOW);
    if (subA && subB) {
      const raw = matchByOffsetHistogram(subA, subB, relaxedSettings, "video-outro");
      const matches = dedupeMatches(rawToMatches(raw, subA, subB));
      if (matches.length > 0) {
        // Pick the match closest to the end of both videos
        const scored = matches.map((m) => {
          const distToEnd = Math.min(
            videoA[0].sourceDuration - m.aEnd,
            videoB[0].sourceDuration - m.bEnd,
          );
          return { m, score: m.confidence * (1 / (1 + distToEnd)) };
        });
        scored.sort((a, b) => b.score - a.score);
        bestMatch = scored[0].m;
      }
    }
  }

  // Try audio if video didn't find anything
  if (!bestMatch && audioA.length && audioB.length) {
    const subA = substreamLastN(audioA[0], END_WINDOW);
    const subB = substreamLastN(audioB[0], END_WINDOW);
    if (subA && subB) {
      const raw = matchByOffsetHistogram(subA, subB, relaxedSettings, "audio-outro");
      const matches = dedupeMatches(rawToMatches(raw, subA, subB));
      if (matches.length > 0) {
        const scored = matches.map((m) => {
          const distToEnd = Math.min(
            audioA[0].sourceDuration - m.aEnd,
            audioB[0].sourceDuration - m.bEnd,
          );
          return { m, score: m.confidence * (1 / (1 + distToEnd)) };
        });
        scored.sort((a, b) => b.score - a.score);
        bestMatch = scored[0].m;
      }
    }
  }

  return bestMatch;
}

/** Extract a sub-stream containing only the last N seconds. */
function substreamLastN(
  stream: FingerprintStream,
  n: number,
): FingerprintStream | null {
  const len = streamLength(stream);
  if (len === 0) return null;
  const duration = stream.sourceDuration;
  const cutoff = Math.max(0, duration - n);
  const times = stream.times;
  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= cutoff) {
      startIdx = i;
      break;
    }
  }
  if (startIdx >= len - 1) return null;

  const subLen = len - startIdx;
  const subTimes = times.subarray(startIdx);
  const subVectors = stream.vectors.slice(startIdx);
  const subHashes = stream.hashes
    ? stream.hashes.subarray(startIdx)
    : null;

  return {
    ...stream,
    times: new Float32Array(subTimes),
    vectors: subVectors,
    hashes: subHashes,
  };
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
