package com.infro.app

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import kotlin.math.min

/**
 * Extracts mono PCM audio from a video/audio file at a target sample rate.
 *
 * Uses MediaCodec to decode the audio track, then downsamples to mono + the
 * target sample rate. This is the Android equivalent of the browser's
 * AudioContext.decodeAudioData + resample.
 */
object AudioExtractor {

    data class PcmData(
        val samples: FloatArray,
        val sampleRate: Int,
        val duration: Double
    )

    fun extractPcm(context: Context, uri: Uri, targetRate: Int = 8000): PcmData {
        val extractor = MediaExtractor()
        context.contentResolver.openFileDescriptor(uri, "r")?.use { pfd ->
            extractor.setDataSource(pfd.fileDescriptor)
        } ?: throw RuntimeException("Cannot open file")

        var audioTrackIndex = -1
        for (i in 0 until extractor.trackCount) {
            val format = extractor.getTrackFormat(i)
            val mime = format.getString(MediaFormat.KEY_MIME) ?: ""
            if (mime.startsWith("audio/")) {
                audioTrackIndex = i
                break
            }
        }

        if (audioTrackIndex < 0) {
            extractor.release()
            throw RuntimeException("No audio track found")
        }

        extractor.selectTrack(audioTrackIndex)
        val inputFormat = extractor.getTrackFormat(audioTrackIndex)
        val sourceRate = inputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
        val sourceChannels = inputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
        val durationUs = if (inputFormat.containsKey(MediaFormat.KEY_DURATION)) {
            inputFormat.getLong(MediaFormat.KEY_DURATION)
        } else 0L

        val codec = MediaCodec.createDecoderByType(inputFormat.getString(MediaFormat.KEY_MIME)!!)
        codec.configure(inputFormat, null, null, 0)
        codec.start()

        val pcmChunks = mutableListOf<FloatArray>()
        val info = MediaCodec.BufferInfo()
        var inputDone = false
        var outputDone = false
        val timeoutUs = 10000L

        while (!outputDone) {
            if (!inputDone) {
                val inputBufferIndex = codec.dequeueInputBuffer(timeoutUs)
                if (inputBufferIndex >= 0) {
                    val inputBuffer = codec.getInputBuffer(inputBufferIndex)!!
                    val sampleSize = extractor.readSampleData(inputBuffer, 0)
                    if (sampleSize < 0) {
                        codec.queueInputBuffer(
                            inputBufferIndex, 0, 0, 0,
                            MediaCodec.BUFFER_FLAG_END_OF_STREAM
                        )
                        inputDone = true
                    } else {
                        codec.queueInputBuffer(
                            inputBufferIndex, 0, sampleSize,
                            extractor.sampleTime, 0
                        )
                        extractor.advance()
                    }
                }
            }

            val outputBufferIndex = codec.dequeueOutputBuffer(info, timeoutUs)
            if (outputBufferIndex >= 0) {
                if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                    outputDone = true
                }
                val outputBuffer = codec.getOutputBuffer(outputBufferIndex)!!
                // Assume 16-bit PCM
                val chunk = decodePcm16(outputBuffer, info.size, sourceChannels)
                pcmChunks.add(chunk)
                codec.releaseOutputBuffer(outputBufferIndex, false)
            }
        }

        codec.stop()
        codec.release()
        extractor.release()

        // Merge chunks
        val totalLen = pcmChunks.sumOf { it.size }
        val merged = FloatArray(totalLen)
        var offset = 0
        for (chunk in pcmChunks) {
            System.arraycopy(chunk, 0, merged, offset, chunk.size)
            offset += chunk.size
        }

        // Resample
        val resampled = if (sourceRate != targetRate) {
            resample(merged, sourceRate, targetRate)
        } else {
            merged
        }

        val duration = if (durationUs > 0) durationUs / 1_000_000.0 else resampled.size.toDouble() / targetRate

        return PcmData(resampled, targetRate, duration)
    }

    private fun decodePcm16(buffer: java.nio.ByteBuffer, size: Int, channels: Int): FloatArray {
        val frameCount = size / (2 * channels)
        val out = FloatArray(frameCount)
        buffer.rewind()
        for (i in 0 until frameCount) {
            var sum = 0
            for (c in 0 until channels) {
                val lo = buffer.get().toInt() and 0xFF
                val hi = buffer.get().toInt()
                val sample = (hi shl 8) or lo
                sum += sample
            }
            // Mono mix + normalize to -1..1
            out[i] = (sum / channels) / 32768.0f
        }
        return out
    }

    private fun resample(input: FloatArray, fromRate: Int, toRate: Int): FloatArray {
        if (fromRate == toRate) return input
        val ratio = toRate.toDouble() / fromRate
        val outLen = (input.size * ratio).toInt()
        val out = FloatArray(outLen)
        for (i in 0 until outLen) {
            val srcPos = i / ratio
            val i0 = srcPos.toInt()
            val i1 = min(i0 + 1, input.size - 1)
            val frac = srcPos - i0
            out[i] = input[i0] * (1 - frac.toFloat()) + input[i1] * frac.toFloat()
        }
        return out
    }
}
