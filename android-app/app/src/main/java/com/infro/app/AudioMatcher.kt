package com.infro.app

import kotlin.math.log10
import kotlin.math.log2
import kotlin.math.sqrt

/**
 * Audio fingerprinting + matching for Android.
 *
 * Mirrors the web app's approach: chroma features from FFT spectrograms,
 * matched via offset-histogram. Produces the same fingerprint format as the
 * web signature, so signatures exported from the web app work here.
 */
object AudioMatcher {

    private const val FFT_SIZE = 2048
    private const val HOP_SECONDS = 0.05

    /**
     * Match the signature's audio segments against the video's audio.
     * Returns a list of SegmentDetection (one per signature segment).
     */
    fun match(signature: SignatureData, pcm: AudioExtractor.PcmData): List<SegmentDetection> {
        val results = mutableListOf<SegmentDetection>()

        // Generate chroma features for the entire video
        val videoChroma = chromaSequence(pcm.samples, pcm.sampleRate)
        val videoTimes = FloatArray(videoChroma.size) { (it * HOP_SECONDS).toFloat() }

        for (seg in signature.segments) {
            if (seg.audioChroma.isEmpty()) {
                results.add(SegmentDetection(
                    label = seg.label,
                    start = 0.0, end = 0.0,
                    signatureStart = seg.aStart,
                    signatureEnd = seg.aEnd,
                    confidence = 0.0,
                    method = listOf("no-audio"),
                    found = false
                ))
                continue
            }

            val sigChroma = seg.audioChroma.map { FloatArray(it.size) { idx -> it[idx] } }.toTypedArray()
            val bestMatch = matchSegment(sigChroma, videoChroma, videoTimes)

            results.add(SegmentDetection(
                label = seg.label,
                start = bestMatch?.first ?: 0.0,
                end = bestMatch?.second ?: 0.0,
                signatureStart = seg.aStart,
                signatureEnd = seg.aEnd,
                confidence = 0.85,
                method = listOf("audio-chroma"),
                found = bestMatch != null
            ))
        }

        return results
    }

    /**
     * Match a signature's chroma sequence against the video's chroma sequence
     * using offset-histogram. Returns (startTime, endTime) of best match or null.
     */
    private fun matchSegment(
        sigChroma: Array<FloatArray>,
        videoChroma: Array<FloatArray>,
        videoTimes: FloatArray
    ): Pair<Double, Double>? {
        val sigLen = sigChroma.size
        val vidLen = videoChroma.size
        if (sigLen < 2 || vidLen < 2) return null

        val minFrames = maxOf(2, sigLen / 2)
        val threshold = 0.6f

        // Build offset histogram
        val offsetCounts = HashMap<Int, Int>()
        val offsetFrames = HashMap<Int, MutableList<Int>>()

        for (i in 0 until sigLen step 2) {
            val sigVec = sigChroma[i]
            for (j in 0 until vidLen step 2) {
                val sim = cosineSimilarity(sigVec, videoChroma[j])
                if (sim >= threshold) {
                    val offset = j - i
                    offsetCounts[offset] = (offsetCounts[offset] ?: 0) + 1
                    offsetFrames.getOrPut(offset) { mutableListOf() }.add(i)
                }
            }
        }

        // Find best offset
        var bestOffset = 0
        var bestCount = 0
        for ((offset, count) in offsetCounts) {
            if (count > bestCount) {
                bestCount = count
                bestOffset = offset
            }
        }

        if (bestCount < minFrames) return null

        // Verify: walk the diagonal and find contiguous run
        var runStart = -1
        var runEnd = -1
        var bestRunStart = -1
        var bestRunLen = 0

        for (i in 0 until sigLen) {
            val j = i + bestOffset
            if (j in 0 until vidLen) {
                val sim = cosineSimilarity(sigChroma[i], videoChroma[j])
                if (sim >= threshold) {
                    if (runStart < 0) runStart = i
                    runEnd = i
                } else {
                    if (runStart >= 0 && runEnd - runStart > bestRunLen) {
                        bestRunStart = runStart
                        bestRunLen = runEnd - runStart
                    }
                    runStart = -1
                }
            }
        }
        if (runStart >= 0 && runEnd - runStart > bestRunLen) {
            bestRunStart = runStart
            bestRunLen = runEnd - runStart
        }

        if (bestRunStart < 0 || bestRunLen < minFrames) return null

        val startTime = (bestRunStart + bestOffset) * HOP_SECONDS
        val endTime = (bestRunStart + bestRunLen + bestOffset) * HOP_SECONDS
        return Pair(startTime, endTime)
    }

    private fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
        var dot = 0f
        var na = 0f
        var nb = 0f
        for (i in a.indices) {
            dot += a[i] * b[i]
            na += a[i] * a[i]
            nb += b[i] * b[i]
        }
        return if (na > 0 && nb > 0) dot / sqrt(na * nb) else 0f
    }

    /**
     * Generate chroma features (12-dim) from mono PCM.
     */
    private fun chromaSequence(pcm: FloatArray, sampleRate: Int): Array<FloatArray> {
        val hop = (HOP_SECONDS * sampleRate).toInt().coerceAtLeast(1)
        val numFrames = ((pcm.size - FFT_SIZE) / hop + 1).coerceAtLeast(0)
        if (numFrames == 0) return emptyArray()

        val window = FloatArray(FFT_SIZE) { i ->
            0.5f * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)).toFloat())
        }
        val result = Array(numFrames) { FloatArray(12) }

        for (f in 0 until numFrames) {
            val start = f * hop
            val re = FloatArray(FFT_SIZE)
            val im = FloatArray(FFT_SIZE)
            for (i in 0 until FFT_SIZE) {
                val s = if (start + i < pcm.size) pcm[start + i] else 0f
                re[i] = s * window[i]
            }
            fft(re, im)

            val chroma = FloatArray(12)
            val bins = FFT_SIZE / 2 + 1
            for (k in 1 until bins) {
                val freq = k.toFloat() * sampleRate / FFT_SIZE
                if (freq < 55 || freq > 5000) continue
                val midi = 69 + 12 * log2(freq / 440.0)
                val pc = (Math.round(midi).toInt() % 12 + 12) % 12
                chroma[pc] += sqrt(re[k] * re[k] + im[k] * im[k])
            }
            var max = 0f
            for (v in chroma) if (v > max) max = v
            if (max > 0) for (i in chroma.indices) chroma[i] /= max
            result[f] = chroma
        }

        return result
    }

    /** In-place radix-2 FFT. */
    private fun fft(re: FloatArray, im: FloatArray) {
        val n = re.size
        if (n <= 1) return

        // Bit reversal
        var j = 0
        for (i in 1 until n) {
            var bit = n shr 1
            while (j and bit != 0) {
                j = j xor bit
                bit = bit shr 1
            }
            j = j or bit
            if (i < j) {
                re[i] = re[j].also { re[j] = re[i] }
                im[i] = im[j].also { im[j] = im[i] }
            }
        }

        // Cooley-Tukey
        var len = 2
        while (len <= n) {
            val half = len shr 1
            val ang = -2 * Math.PI / len
            val wRe = Math.cos(ang).toFloat()
            val wIm = Math.sin(ang).toFloat()
            var i = 0
            while (i < n) {
                var curRe = 1f
                var curIm = 0f
                for (k in 0 until half) {
                    val tRe = curRe * re[i + k + half] - curIm * im[i + k + half]
                    val tIm = curRe * im[i + k + half] + curIm * re[i + k + half]
                    re[i + k + half] = re[i + k] - tRe
                    im[i + k + half] = im[i + k] - tIm
                    re[i + k] += tRe
                    im[i + k] += tIm
                    val nextRe = curRe * wRe - curIm * wIm
                    curIm = curRe * wIm + curIm * wRe
                    curRe = nextRe
                }
                i += len
            }
            len = len shl 1
        }
    }
}
