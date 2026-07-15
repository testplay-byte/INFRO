package com.infro.app.matching

import android.content.Context
import android.net.Uri
import com.infro.app.audio.AudioExtractor
import com.infro.app.audio.Fingerprinter
import com.infro.app.model.*
import com.infro.app.video.FrameExtractor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Full analysis pipeline: extract audio + frames, fingerprint, match,
 * infer intro/outro, build signature. The Android equivalent of the
 * web app's worker.
 */
object AnalysisEngine {

    suspend fun analyze(
        context: Context,
        uriA: Uri,
        uriB: Uri,
        fileNameA: String,
        fileNameB: String,
        settings: AnalysisSettings,
        onProgress: (stage: String, progress: Float, detail: String) -> Unit
    ): ComparisonResult = withContext(Dispatchers.Default) {

        val startTime = System.currentTimeMillis()
        onProgress("decoding", 0.05f, "Reading media metadata...")

        // Get video metadata
        val videoMetaA = FrameExtractor.getVideoMeta(context, uriA)
        val videoMetaB = FrameExtractor.getVideoMeta(context, uriB)

        val metaA = MediaMeta(fileNameA, videoMetaA.duration, videoMetaA.width, videoMetaA.height, true, 0)
        val metaB = MediaMeta(fileNameB, videoMetaB.duration, videoMetaB.width, videoMetaB.height, true, 0)

        onProgress("decoding", 0.1f, "Extracting audio...")

        // Extract audio
        var audioA: AudioExtractor.PcmData? = null
        var audioB: AudioExtractor.PcmData? = null
        var chromaA: Fingerprinter.ChromaStream? = null
        var chromaB: Fingerprinter.ChromaStream? = null

        if (settings.mode != "video") {
            try {
                audioA = AudioExtractor.extractPcm(context, uriA, settings.audioSampleRate)
                onProgress("fingerprinting", 0.2f, "Fingerprinting audio A...")
                chromaA = Fingerprinter.chromaSequence(audioA.samples, audioA.sampleRate)

                audioB = AudioExtractor.extractPcm(context, uriB, settings.audioSampleRate)
                onProgress("fingerprinting", 0.3f, "Fingerprinting audio B...")
                chromaB = Fingerprinter.chromaSequence(audioB.samples, audioB.sampleRate)
            } catch (e: Exception) {
                // Audio extraction may fail — continue with video only
            }
        }

        onProgress("fingerprinting", 0.4f, "Extracting video frames...")

        // Extract video frames
        var framesA: FrameExtractor.FramePack? = null
        var framesB: FrameExtractor.FramePack? = null

        if (settings.mode != "audio" && videoMetaA.width > 0 && videoMetaB.width > 0) {
            framesA = FrameExtractor.extractFrames(context, uriA, settings.frameSampleRate) { done, total ->
                onProgress("fingerprinting", 0.4f + 0.15f * done / total, "Frames A: $done/$total")
            }
            framesB = FrameExtractor.extractFrames(context, uriB, settings.frameSampleRate) { done, total ->
                onProgress("fingerprinting", 0.55f + 0.15f * done / total, "Frames B: $done/$total")
            }
        }

        onProgress("comparing", 0.7f, "Matching fingerprints...")

        // Match
        val allMatches = mutableListOf<Match>()

        // Video matching
        if (framesA != null && framesB != null && (settings.mode == "video" || settings.mode == "combined")) {
            val raw = Matcher.matchHashStreams(
                framesA.hashes, framesA.times,
                framesB.hashes, framesB.times,
                framesA.hop, settings, "video-dhash"
            )
            allMatches.addAll(Matcher.dedupe(Matcher.rawToMatches(raw, framesA.times, framesB.times, framesA.hop)))
        }

        // Audio matching
        if (chromaA != null && chromaB != null && (settings.mode == "audio" || settings.mode == "combined")) {
            val raw = Matcher.matchVectorStreams(
                chromaA.vectors, chromaA.times,
                chromaB.vectors, chromaB.times,
                chromaA.hop, settings, "audio-chroma"
            )
            allMatches.addAll(Matcher.dedupe(Matcher.rawToMatches(raw, chromaA.times, chromaB.times, chromaA.hop)))
        }

        val dedupedMatches = Matcher.dedupe(allMatches)

        onProgress("comparing", 0.85f, "Inferring intro/outro...")

        val introOutro = Matcher.inferIntroOutro(dedupedMatches, metaA.duration, metaB.duration)

        onProgress("building-timeline", 0.9f, "Building signature...")

        val signature = Matcher.buildSignature(
            dedupedMatches, introOutro, settings, metaA, metaB,
            framesA?.hashes, framesA?.times,
            chromaA?.vectors, chromaA?.times
        )

        val processingTime = System.currentTimeMillis() - startTime

        val stats = ComparisonStats(
            totalMatches = dedupedMatches.size,
            longestMatchDuration = dedupedMatches.maxOfOrNull { it.aEnd - it.aStart } ?: 0.0,
            averageConfidence = if (dedupedMatches.isNotEmpty()) dedupedMatches.map { it.confidence }.average() else 0.0,
            totalMatchedDuration = dedupedMatches.sumOf { it.aEnd - it.aStart },
            processingTimeMs = processingTime,
            framesAnalyzed = (framesA?.count ?: 0) + (framesB?.count ?: 0),
            audioSamplesAnalyzed = (audioA?.samples?.size ?: 0) + (audioB?.samples?.size ?: 0),
            detectedIntro = introOutro.intro != null,
            detectedOutro = introOutro.outro != null
        )

        onProgress("done", 1f, "Complete")

        ComparisonResult(dedupedMatches, introOutro, stats, metaA, metaB, settings.mode, signature)
    }

    /** Detect intro/outro in a new video using a signature. */
    suspend fun detect(
        context: Context,
        signature: SignatureData,
        videoUri: Uri,
        videoFileName: String,
        settings: AnalysisSettings,
        onProgress: (stage: String, progress: Float, detail: String) -> Unit
    ): DetectionResult = withContext(Dispatchers.Default) {

        val startTime = System.currentTimeMillis()
        onProgress("decoding", 0.1f, "Reading video...")

        val videoMeta = FrameExtractor.getVideoMeta(context, videoUri)
        val meta = MediaMeta(videoFileName, videoMeta.duration, videoMeta.width, videoMeta.height, true, 0)

        onProgress("fingerprinting", 0.2f, "Extracting audio...")

        var audio: AudioExtractor.PcmData? = null
        var chroma: Fingerprinter.ChromaStream? = null
        try {
            audio = AudioExtractor.extractPcm(context, videoUri, settings.audioSampleRate)
            chroma = Fingerprinter.chromaSequence(audio.samples, audio.sampleRate)
        } catch (e: Exception) {
            // continue without audio
        }

        onProgress("comparing", 0.4f, "Matching against signature...")

        val detections = mutableListOf<SegmentDetection>()

        for (seg in signature.segments) {
            if (seg.audioChroma.isNotEmpty() && chroma != null) {
                val sigChroma = seg.audioChroma.map { FloatArray(it.size) { i -> it[i] } }.toTypedArray()
                val sigTimes = FloatArray(seg.audioTimes.size) { seg.audioTimes[it].toFloat() }

                val relaxedSettings = AnalysisSettings(
                    mode = "audio",
                    similarityThreshold = maxOf(0.6, settings.similarityThreshold - 0.15),
                    minMatchDuration = maxOf(2.0, settings.minMatchDuration / 3),
                    matchDensity = 0.45
                )

                val raw = Matcher.matchVectorStreams(
                    sigChroma, sigTimes,
                    chroma.vectors, chroma.times,
                    chroma.hop, relaxedSettings, "detect-audio-${seg.label}"
                )
                val matches = Matcher.dedupe(Matcher.rawToMatches(raw, sigTimes, chroma.times, chroma.hop))

                if (matches.isNotEmpty()) {
                    val best = matches.maxByOrNull { it.confidence }!!
                    detections.add(SegmentDetection(
                        label = seg.label,
                        start = best.bStart,
                        end = best.bEnd,
                        signatureStart = seg.aStart,
                        signatureEnd = seg.aEnd,
                        confidence = best.confidence,
                        method = best.method,
                        found = true
                    ))
                } else {
                    detections.add(SegmentDetection(
                        label = seg.label, start = 0.0, end = 0.0,
                        signatureStart = seg.aStart, signatureEnd = seg.aEnd,
                        confidence = 0.0, method = emptyList(), found = false
                    ))
                }
            } else {
                detections.add(SegmentDetection(
                    label = seg.label, start = 0.0, end = 0.0,
                    signatureStart = seg.aStart, signatureEnd = seg.aEnd,
                    confidence = 0.0, method = emptyList(), found = false
                ))
            }
        }

        DetectionResult(
            detections = detections,
            videoMeta = meta,
            processingTimeMs = System.currentTimeMillis() - startTime,
            framesAnalyzed = 0,
            audioSamplesAnalyzed = audio?.samples?.size ?: 0
        )
    }
}
