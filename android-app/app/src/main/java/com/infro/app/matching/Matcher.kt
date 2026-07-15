package com.infro.app.matching

import com.infro.app.audio.Fingerprinter
import com.infro.app.model.*

/**
 * Offset-histogram matching engine — the Android equivalent of the web app's
 * offset-matcher. Finds repeated segments between two fingerprint streams
 * using hash-lookup + offset-clustering + diagonal verification.
 */
object Matcher {

    data class RawMatch(
        val aStartIdx: Int,
        val aEndIdx: Int,
        val offset: Int,
        val similarity: Double,
        val method: String
    )

    /** Match two hash streams using offset-histogram approach. */
    fun matchHashStreams(
        hashesA: IntArray,
        timesA: FloatArray,
        hashesB: IntArray,
        timesB: FloatArray,
        hop: Double,
        settings: AnalysisSettings,
        method: String
    ): List<RawMatch> {
        val N = hashesA.size
        val M = hashesB.size
        if (N < 2 || M < 2) return emptyList()

        val threshold = settings.similarityThreshold
        val windowFrames = maxOf(3, (1.0 / hop).toInt())
        val minFrames = maxOf(1, (settings.minMatchDuration / hop).toInt())
        val gapFrames = maxOf(1, (settings.maxGap / hop).toInt())

        // Build hash table from B (skip uniform frames)
        val bTable = HashMap<Int, MutableList<Int>>()
        for (j in 0 until M) {
            if (hashesB[j] == Fingerprinter.UNIFORM_HASH) continue
            bTable.getOrPut(hashesB[j]) { mutableListOf() }.add(j)
        }

        // Lookup each A frame, collect offset hits
        val offsetMap = HashMap<Int, MutableList<Int>>()
        for (i in 0 until N) {
            if (hashesA[i] == Fingerprinter.UNIFORM_HASH) continue
            val bMatches = bTable[hashesA[i]] ?: continue
            for (j in bMatches) {
                val offset = j - i
                offsetMap.getOrPut(offset) { mutableListOf() }.add(i)
            }
        }

        // Filter to candidate offsets with enough hits
        val candidates = offsetMap.entries
            .filter { it.value.size >= minFrames }
            .sortedByDescending { it.value.size }
            .take(100)

        // Verify each candidate
        val raw = mutableListOf<RawMatch>()
        for ((offset, _) in candidates) {
            val d = offset
            val iStart = maxOf(0, -d)
            val iEnd = minOf(N - 1, M - 1 - d)
            if (iEnd - iStart + 1 < minFrames) continue

            val len = iEnd - iStart + 1
            val sims = FloatArray(len)
            val flags = IntArray(len)

            for (k in 0 until len) {
                sims[k] = Fingerprinter.hashSimilarity(hashesA[iStart + k], hashesB[iStart + k + d]).toFloat()
                flags[k] = 0
            }

            // Density-based flags
            var lo = 0; var hit = 0
            for (hi in 0 until len) {
                if (sims[hi] >= threshold) hit++
                while (hi - lo + 1 > windowFrames) {
                    if (sims[lo] >= threshold) hit--
                    lo++
                }
                if (hi - lo + 1 == windowFrames) {
                    if (hit.toDouble() / windowFrames >= settings.matchDensity) flags[hi] = 1
                } else if (hi - lo + 1 < windowFrames && hi == len - 1) {
                    if (hit.toDouble() / (hi - lo + 1) >= settings.matchDensity) flags[hi] = 1
                }
            }

            // Extract runs
            var k = 0
            while (k < len) {
                if (flags[k] == 0) { k++; continue }
                val runStart = k
                var runEnd = k
                var m = k + 1
                while (m < len) {
                    if (flags[m] == 1) { runEnd = m; m++ }
                    else {
                        var gap = 0; var p = m
                        while (p < len && flags[p] == 0 && gap < gapFrames) { gap++; p++ }
                        if (p < len && flags[p] == 1 && gap <= gapFrames) { runEnd = p; m = p + 1 }
                        else break
                    }
                }
                val runLen = runEnd - runStart + 1
                if (runLen >= minFrames) {
                    var sum = 0.0; var cnt = 0
                    for (q in runStart..runEnd) {
                        if (sims[q] >= threshold) { sum += sims[q]; cnt++ }
                    }
                    val similarity = if (cnt > 0) sum / cnt else 0.0
                    if (similarity >= threshold) {
                        // Boundary refinement
                        val refinedStart = refineStart(sims, runStart)
                        val refinedEnd = refineEnd(sims, runEnd, len)
                        raw.add(RawMatch(iStart + refinedStart, iStart + refinedEnd, d, similarity, method))
                    }
                }
                k = m
            }
        }
        return raw
    }

    /** Match two chroma (vector) streams. */
    fun matchVectorStreams(
        vectorsA: Array<FloatArray>,
        timesA: FloatArray,
        vectorsB: Array<FloatArray>,
        timesB: FloatArray,
        hop: Double,
        settings: AnalysisSettings,
        method: String
    ): List<RawMatch> {
        val N = vectorsA.size
        val M = vectorsB.size
        if (N < 2 || M < 2) return emptyList()

        val threshold = settings.similarityThreshold
        val windowFrames = maxOf(3, (1.0 / hop).toInt())
        val minFrames = maxOf(1, (settings.minMatchDuration / hop).toInt())
        val gapFrames = maxOf(1, (settings.maxGap / hop).toInt())

        // Build hash table from quantized B vectors (skip silent)
        val bTable = HashMap<Int, MutableList<Int>>()
        for (j in 0 until M) {
            if (isSilent(vectorsB[j])) continue
            val key = quantize(vectorsB[j])
            bTable.getOrPut(key) { mutableListOf() }.add(j)
        }

        val offsetMap = HashMap<Int, MutableList<Int>>()
        for (i in 0 until N) {
            if (isSilent(vectorsA[i])) continue
            val key = quantize(vectorsA[i])
            val bMatches = bTable[key] ?: continue
            for (j in bMatches) {
                offsetMap.getOrPut(j - i) { mutableListOf() }.add(i)
            }
        }

        val candidates = offsetMap.entries
            .filter { it.value.size >= minFrames }
            .sortedByDescending { it.value.size }
            .take(100)

        val raw = mutableListOf<RawMatch>()
        for ((offset, _) in candidates) {
            val d = offset
            val iStart = maxOf(0, -d)
            val iEnd = minOf(N - 1, M - 1 - d)
            if (iEnd - iStart + 1 < minFrames) continue

            val len = iEnd - iStart + 1
            val sims = FloatArray(len)
            val flags = IntArray(len)

            for (k in 0 until len) {
                sims[k] = Fingerprinter.cosineSimilarity(vectorsA[iStart + k], vectorsB[iStart + k + d])
                flags[k] = 0
            }

            var lo = 0; var hit = 0
            for (hi in 0 until len) {
                if (sims[hi] >= threshold) hit++
                while (hi - lo + 1 > windowFrames) {
                    if (sims[lo] >= threshold) hit--
                    lo++
                }
                if (hi - lo + 1 == windowFrames) {
                    if (hit.toDouble() / windowFrames >= settings.matchDensity) flags[hi] = 1
                } else if (hi - lo + 1 < windowFrames && hi == len - 1) {
                    if (hit.toDouble() / (hi - lo + 1) >= settings.matchDensity) flags[hi] = 1
                }
            }

            var k = 0
            while (k < len) {
                if (flags[k] == 0) { k++; continue }
                val runStart = k
                var runEnd = k
                var m = k + 1
                while (m < len) {
                    if (flags[m] == 1) { runEnd = m; m++ }
                    else {
                        var gap = 0; var p = m
                        while (p < len && flags[p] == 0 && gap < gapFrames) { gap++; p++ }
                        if (p < len && flags[p] == 1 && gap <= gapFrames) { runEnd = p; m = p + 1 }
                        else break
                    }
                }
                val runLen = runEnd - runStart + 1
                if (runLen >= minFrames) {
                    var sum = 0.0; var cnt = 0
                    for (q in runStart..runEnd) {
                        if (sims[q] >= threshold) { sum += sims[q]; cnt++ }
                    }
                    val similarity = if (cnt > 0) sum / cnt else 0.0
                    if (similarity >= threshold) {
                        val refinedStart = refineStart(sims, runStart)
                        val refinedEnd = refineEnd(sims, runEnd, len)
                        raw.add(RawMatch(iStart + refinedStart, iStart + refinedEnd, d, similarity, method))
                    }
                }
                k = m
            }
        }
        return raw
    }

    private fun refineStart(sims: FloatArray, runStart: Int): Int {
        var pos = runStart
        var prevSim = sims[runStart]
        while (pos > 0) {
            val nextSim = sims[pos - 1]
            if (nextSim < 0.6f) break
            if (prevSim - nextSim > 0.15f && nextSim < 0.75f) break
            pos--; prevSim = nextSim
        }
        return pos
    }

    private fun refineEnd(sims: FloatArray, runEnd: Int, len: Int): Int {
        var pos = runEnd
        var prevSim = sims[runEnd]
        while (pos < len - 1) {
            val nextSim = sims[pos + 1]
            if (nextSim < 0.7f) break
            if (prevSim - nextSim > 0.1f && nextSim < 0.8f) break
            pos++; prevSim = nextSim
        }
        return pos
    }

    private fun quantize(v: FloatArray): Int {
        val mean = v.sum() / v.size
        var key = 0
        for (i in v.indices) { if (v[i] >= mean) key = key or (1 shl i) }
        return key
    }

    private fun isSilent(v: FloatArray): Boolean {
        var energy = 0f
        for (x in v) energy += x * x
        return energy < 0.01f
    }

    // ========== Convert raw to final matches ==========

    fun rawToMatches(raw: List<RawMatch>, timesA: FloatArray, timesB: FloatArray, hop: Double): List<Match> {
        return raw.mapIndexed { idx, r ->
            val aStart = timesA[r.aStartIdx].toDouble()
            val aEnd = timesA[r.aEndIdx].toDouble() + hop
            val bStart = timesB[r.aStartIdx + r.offset].toDouble()
            val bEnd = timesB[r.aEndIdx + r.offset].toDouble() + hop
            val duration = maxOf(aEnd - aStart, bEnd - bStart)
            val lengthBonus = minOf(0.12, duration / 240)
            val confidence = minOf(1.0, r.similarity * 0.9 + lengthBonus + 0.04)
            Match(aStart, aEnd, bStart, bEnd, confidence, listOf(r.method), r.similarity, group = idx)
        }
    }

    fun dedupe(matches: List<Match>): List<Match> {
        val sorted = matches.sortedBy { it.aStart }
        val result = mutableListOf<Match>()
        for (m in sorted) {
            val last = result.lastOrNull()
            if (last != null && overlapA(last, m) > 0.7) {
                // Merge
                val merged = Match(
                    minOf(last.aStart, m.aStart),
                    maxOf(last.aEnd, m.aEnd),
                    minOf(last.bStart, m.bStart),
                    maxOf(last.bEnd, m.bEnd),
                    maxOf(last.confidence, m.confidence),
                    (last.method + m.method).distinct(),
                    maxOf(last.similarity, m.similarity),
                    group = last.group
                )
                result[result.lastIndex] = merged
            } else {
                result.add(m.copy(group = result.size))
            }
        }
        return result
    }

    private fun overlapA(a: Match, b: Match): Double {
        val start = maxOf(a.aStart, b.aStart)
        val end = minOf(a.aEnd, b.aEnd)
        if (end <= start) return 0.0
        val minLen = minOf(a.aEnd - a.aStart, b.aEnd - b.aStart)
        return if (minLen > 0) (end - start) / minLen else 0.0
    }

    // ========== Intro/Outro inference ==========

    fun inferIntroOutro(matches: List<Match>, durationA: Double, durationB: Double): IntroOutroResult {
        if (matches.isEmpty()) return IntroOutroResult(null, null, "No matches detected")

        // Intro: closest to start
        var intro: Match? = null
        var introScore = Double.NEGATIVE_INFINITY
        for (m in matches) {
            val nearStart = minOf(m.aStart, m.bStart)
            val proximity = 1.0 / (1 + nearStart)
            val length = m.aEnd - m.aStart
            val score = proximity * 0.6 + m.confidence * 0.25 + minOf(length, 60.0) / 60.0 * 0.15
            if (score > introScore) { introScore = score; intro = m }
        }

        // Outro: closest to end
        var outro: Match? = null
        var outroScore = Double.NEGATIVE_INFINITY
        for (m in matches) {
            val distToEnd = minOf(durationA - m.aEnd, durationB - m.bEnd)
            val proximity = 1.0 / (1 + maxOf(0.0, distToEnd))
            val length = m.aEnd - m.aStart
            val score = proximity * 0.6 + m.confidence * 0.25 + minOf(length, 60.0) / 60.0 * 0.15
            if (score > outroScore) { outroScore = score; outro = m }
        }

        if (intro != null && outro != null && intro == outro) outro = null

        // Tag
        intro?.isIntro = true
        outro?.isOutro = true

        return IntroOutroResult(intro, outro, "Inferred from ${matches.size} matches")
    }

    // ========== Signature building ==========

    fun buildSignature(
        matches: List<Match>,
        introOutro: IntroOutroResult,
        settings: AnalysisSettings,
        metaA: MediaMeta,
        metaB: MediaMeta,
        videoHashes: IntArray? = null,
        videoTimes: FloatArray? = null,
        audioChroma: Array<FloatArray>? = null,
        audioTimes: FloatArray? = null
    ): SignatureData {
        val segments = mutableListOf<SignatureSegment>()

        introOutro.intro?.let { intro ->
            val seg = extractSegment(intro, "intro", videoHashes, videoTimes, audioChroma, audioTimes)
            if (seg != null) segments.add(seg)
        }
        introOutro.outro?.let { outro ->
            val seg = extractSegment(outro, "outro", videoHashes, videoTimes, audioChroma, audioTimes)
            if (seg != null) segments.add(seg)
        }

        return SignatureData(
            version = "1.0",
            generatedAt = java.util.Date().toString(),
            mode = settings.mode,
            frameSampleRate = settings.frameSampleRate,
            audioSampleRate = settings.audioSampleRate,
            sources = Sources(
                SourceInfo(metaA.fileName, metaA.duration),
                SourceInfo(metaB.fileName, metaB.duration)
            ),
            segments = segments
        )
    }

    private fun extractSegment(
        match: Match,
        label: String,
        videoHashes: IntArray?,
        videoTimes: FloatArray?,
        audioChroma: Array<FloatArray>?,
        audioTimes: FloatArray?
    ): SignatureSegment? {
        val vHashes = mutableListOf<Int>()
        val vTimes = mutableListOf<Double>()
        if (videoHashes != null && videoTimes != null) {
            for (i in videoHashes.indices) {
                val t = videoTimes[i].toDouble()
                if (t >= match.aStart && t <= match.aEnd) {
                    vHashes.add(videoHashes[i])
                    vTimes.add(t)
                }
            }
        }

        val aChroma = mutableListOf<List<Float>>()
        val aTimes = mutableListOf<Double>()
        if (audioChroma != null && audioTimes != null) {
            for (i in audioChroma.indices) {
                val t = audioTimes[i].toDouble()
                if (t >= match.aStart && t <= match.aEnd) {
                    aChroma.add(audioChroma[i].toList())
                    aTimes.add(t)
                }
            }
        }

        if (vHashes.isEmpty() && aChroma.isEmpty()) return null

        return SignatureSegment(
            label = label,
            aStart = match.aStart,
            aEnd = match.aEnd,
            bStart = match.bStart,
            bEnd = match.bEnd,
            confidence = match.confidence,
            method = match.method,
            videoHashes = vHashes,
            videoTimes = vTimes,
            audioChroma = aChroma,
            audioTimes = aTimes
        )
    }
}
