package com.infro.app.video

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri

/**
 * Extracts downsampled grayscale frames from a video for perceptual hashing.
 * Uses MediaMetadataRetriever.getFrameAtTime — the Android equivalent of
 * the web app's canvas-based frame extraction.
 */
object FrameExtractor {

    data class FramePack(
        val hashes: IntArray,
        val times: FloatArray,
        val hop: Double,
        val count: Int
    )

    data class VideoMeta(
        val duration: Double,
        val width: Int,
        val height: Int
    )

    fun getVideoMeta(context: Context, uri: Uri): VideoMeta {
        val retriever = MediaMetadataRetriever()
        retriever.setDataSource(context, uri)
        val duration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()?.div(1000.0) ?: 0.0
        val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
        val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
        retriever.release()
        return VideoMeta(duration, width, height)
    }

    /**
     * Extract dHash fingerprints at the given sample rate.
     * Grid is 9 wide × 4 tall = 32-bit hash.
     */
    fun extractFrames(
        context: Context,
        uri: Uri,
        fps: Int,
        onProgress: (done: Int, total: Int) -> Unit
    ): FramePack? {
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(context, uri)
        } catch (e: Exception) {
            return null
        }

        val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        val duration = durationStr?.toLongOrNull()?.div(1000.0) ?: 0.0
        if (duration <= 0) { retriever.release(); return null }

        val MAX_FRAMES = 500
        var count = maxOf(2, (duration * fps).toInt())
        if (count > MAX_FRAMES) count = MAX_FRAMES
        val effFps = (count - 1) / duration
        val gw = 9
        val gh = 4

        val hashes = IntArray(count)
        val times = FloatArray(count)

        for (i in 0 until count) {
            val t = i / effFps
            times[i] = t.toFloat()

            // Get frame at this timestamp (microseconds)
            val bitmap = retriever.getFrameAtTime(
                (t * 1_000_000).toLong(),
                MediaMetadataRetriever.OPTION_CLOSEST_SYNC
            )

            if (bitmap != null) {
                val gray = downsampleToGray(bitmap, gw, gh)
                hashes[i] = com.infro.app.audio.Fingerprinter.computeDHash(gray, gw, gh)
                bitmap.recycle()
            } else {
                hashes[i] = com.infro.app.audio.Fingerprinter.UNIFORM_HASH
            }

            onProgress(i + 1, count)
        }

        retriever.release()
        return FramePack(hashes, times, 1.0 / effFps, count)
    }

    /** Downsample a bitmap to a small grayscale grid. */
    private fun downsampleToGray(bitmap: Bitmap, gw: Int, gh: Int): IntArray {
        val gray = IntArray(gw * gh)
        val bw = bitmap.width
        val bh = bitmap.height
        for (gy in 0 until gh) {
            for (gx in 0 until gw) {
                val x0 = (gx * bw / gw).coerceIn(0, bw - 1)
                val x1 = ((gx + 1) * bw / gw).coerceIn(0, bw)
                val y0 = (gy * bh / gh).coerceIn(0, bh - 1)
                val y1 = ((gy + 1) * bh / gh).coerceIn(0, bh)
                var r = 0; var g = 0; var b = 0; var n = 0
                var sy = y0
                while (sy < y1) {
                    var sx = x0
                    while (sx < x1) {
                        val pixel = bitmap.getPixel(sx, sy)
                        r += Color.red(pixel)
                        g += Color.green(pixel)
                        b += Color.blue(pixel)
                        n++
                        sx++
                    }
                    sy++
                }
                val lum = if (n > 0) (0.299 * r + 0.587 * g + 0.114 * b) / n else 0
                gray[gy * gw + gx] = lum.toInt()
            }
        }
        return gray
    }
}
