package com.infro.app.audio

import kotlin.math.cos
import kotlin.math.log2
import kotlin.math.sqrt

/**
 * Audio + video fingerprinting: FFT, chroma features, spectral peak hashes,
 * and perceptual dHash for video frames. Pure Kotlin, no Android dependencies.
 */
object Fingerprinter {

    const val FFT_SIZE = 2048
    const val AUDIO_HOP_SECONDS = 0.05

    // ========== FFT ==========

    fun fft(re: FloatArray, im: FloatArray) {
        val n = re.size
        if (n <= 1) return
        var j = 0
        for (i in 1 until n) {
            var bit = n shr 1
            while (j and bit != 0) { j = j xor bit; bit = bit shr 1 }
            j = j or bit
            if (i < j) {
                re[i] = re[j].also { re[j] = re[i] }
                im[i] = im[j].also { im[j] = im[i] }
            }
        }
        var len = 2
        while (len <= n) {
            val half = len shr 1
            val ang = -2 * Math.PI / len
            val wRe = cos(ang).toFloat()
            val wIm = Math.sin(ang).toFloat()
            var i = 0
            while (i < n) {
                var curRe = 1f; var curIm = 0f
                for (k in 0 until half) {
                    val tRe = curRe * re[i + k + half] - curIm * im[i + k + half]
                    val tIm = curRe * im[i + k + half] + curIm * re[i + k + half]
                    re[i + k + half] = re[i + k] - tRe
                    im[i + k + half] = im[i + k] - tIm
                    re[i + k] += tRe; im[i + k] += tIm
                    val nextRe = curRe * wRe - curIm * wIm
                    curIm = curRe * wIm + curIm * wRe
                    curRe = nextRe
                }
                i += len
            }
            len = len shl 1
        }
    }

    // ========== Chroma Features ==========

    data class ChromaStream(
        val vectors: Array<FloatArray>,
        val times: FloatArray,
        val hop: Double
    )

    fun chromaSequence(pcm: FloatArray, sampleRate: Int, fftSize: Int = FFT_SIZE, hopSec: Double = AUDIO_HOP_SECONDS): ChromaStream {
        val hop = (hopSec * sampleRate).toInt().coerceAtLeast(1)
        val numFrames = ((pcm.size - fftSize) / hop + 1).coerceAtLeast(0)
        if (numFrames == 0) return ChromaStream(emptyArray(), FloatArray(0), hopSec)

        val window = FloatArray(fftSize) { i ->
            0.5f * (1 - cos(2 * Math.PI * i / (fftSize - 1)).toFloat())
        }
        val result = Array(numFrames) { FloatArray(12) }
        val times = FloatArray(numFrames) { (it * hopSec).toFloat() }
        val bins = fftSize / 2 + 1

        for (f in 0 until numFrames) {
            val start = f * hop
            val re = FloatArray(fftSize)
            val im = FloatArray(fftSize)
            for (i in 0 until fftSize) {
                val s = if (start + i < pcm.size) pcm[start + i] else 0f
                re[i] = s * window[i]
            }
            fft(re, im)

            val chroma = FloatArray(12)
            for (k in 1 until bins) {
                val freq = k.toFloat() * sampleRate / fftSize
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
        return ChromaStream(result, times, hopSec)
    }

    // ========== Spectral Peak Fingerprints (Shazam-style) ==========

    data class PeakStream(
        val hashes: IntArray,
        val times: FloatArray,
        val hop: Double
    )

    fun spectralPeaks(pcm: FloatArray, sampleRate: Int, fftSize: Int = FFT_SIZE, hopSec: Double = AUDIO_HOP_SECONDS): PeakStream {
        val hop = (hopSec * sampleRate).toInt().coerceAtLeast(1)
        val numFrames = ((pcm.size - fftSize) / hop + 1).coerceAtLeast(0)
        if (numFrames == 0) return PeakStream(IntArray(0), FloatArray(0), hopSec)

        val window = FloatArray(fftSize) { i ->
            0.5f * (1 - cos(2 * Math.PI * i / (fftSize - 1)).toFloat())
        }
        val hashes = IntArray(numFrames)
        val times = FloatArray(numFrames) { (it * hopSec).toFloat() }
        val bins = fftSize / 2 + 1
        val minBin = (100.0 * fftSize / sampleRate).toInt()
        val maxBin = (5000.0 * fftSize / sampleRate).toInt()

        for (f in 0 until numFrames) {
            val start = f * hop
            val re = FloatArray(fftSize)
            val im = FloatArray(fftSize)
            for (i in 0 until fftSize) {
                val s = if (start + i < pcm.size) pcm[start + i] else 0f
                re[i] = s * window[i]
            }
            fft(re, im)

            var peak1Bin = 0; var peak1Mag = 0f
            var peak2Bin = 0; var peak2Mag = 0f
            for (k in minBin until maxBin.coerceAtMost(bins)) {
                val mag = sqrt(re[k] * re[k] + im[k] * im[k])
                if (mag > peak1Mag) {
                    peak2Mag = peak1Mag; peak2Bin = peak1Bin
                    peak1Mag = mag; peak1Bin = k
                } else if (mag > peak2Mag) {
                    peak2Mag = mag; peak2Bin = k
                }
            }
            hashes[f] = ((peak1Bin and 0xffff) shl 16) or (peak2Bin and 0xffff)
        }
        return PeakStream(hashes, times, hopSec)
    }

    // ========== Video dHash ==========

    const val UNIFORM_HASH = -1

    fun computeDHash(gray: IntArray, width: Int, height: Int): Int {
        // Detect uniform frames
        var sum = 0L
        for (v in gray) sum += v
        val mean = sum / gray.size
        var variance = 0L
        for (v in gray) { val d = v - mean; variance += d.toLong() * d }
        variance /= gray.size
        if (variance < 10) return UNIFORM_HASH

        var hash = 0
        var bit = 0
        val rows = minOf(height, 4)
        for (y in 0 until rows) {
            for (x in 0 until width - 1) {
                if (bit >= 32) break
                val left = gray[y * width + x]
                val right = gray[y * width + x + 1]
                if (left > right) hash = hash or (1 shl bit)
                bit++
            }
        }
        return hash
    }

    fun hammingDistance(a: Int, b: Int): Int {
        return Integer.bitCount(a xor b)
    }

    fun hashSimilarity(a: Int, b: Int): Double {
        if (a == UNIFORM_HASH || b == UNIFORM_HASH) return 0.0
        return 1.0 - hammingDistance(a, b) / 32.0
    }

    // ========== Cosine Similarity ==========

    fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
        var dot = 0f; var na = 0f; var nb = 0f
        for (i in a.indices) {
            dot += a[i] * b[i]
            na += a[i] * a[i]
            nb += b[i] * b[i]
        }
        return if (na > 0 && nb > 0) dot / sqrt(na * nb) else 0f
    }
}
