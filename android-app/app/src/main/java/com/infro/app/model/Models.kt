package com.infro.app.model

import com.google.gson.annotations.SerializedName

data class Match(
    val aStart: Double,
    val aEnd: Double,
    val bStart: Double,
    val bEnd: Double,
    val confidence: Double,
    val method: List<String>,
    val similarity: Double,
    var isIntro: Boolean = false,
    var isOutro: Boolean = false,
    var group: Int = 0
)

data class IntroOutroResult(
    val intro: Match?,
    val outro: Match?,
    val rationale: String
)

data class ComparisonStats(
    val totalMatches: Int,
    val longestMatchDuration: Double,
    val averageConfidence: Double,
    val totalMatchedDuration: Double,
    val processingTimeMs: Long,
    val framesAnalyzed: Int,
    val audioSamplesAnalyzed: Int,
    val detectedIntro: Boolean,
    val detectedOutro: Boolean
)

data class MediaMeta(
    val fileName: String,
    val duration: Double,
    val width: Int,
    val height: Int,
    val hasAudio: Boolean,
    val size: Long
)

data class ComparisonResult(
    val matches: List<Match>,
    val introOutro: IntroOutroResult,
    val stats: ComparisonStats,
    val streamA: MediaMeta,
    val streamB: MediaMeta,
    val mode: String,
    val signature: SignatureData?
)

data class AnalysisSettings(
    var mode: String = "combined",
    var frameSampleRate: Int = 2,
    var audioSampleRate: Int = 30000,
    var similarityThreshold: Double = 0.9,
    var minMatchDuration: Double = 10.0,
    var maxGap: Double = 1.0,
    var matchDensity: Double = 0.9
)

data class SignatureData(
    val version: String = "1.0",
    val generatedAt: String = "",
    val mode: String = "",
    val frameSampleRate: Int = 0,
    val audioSampleRate: Int = 0,
    val sources: Sources? = null,
    val segments: List<SignatureSegment> = emptyList()
)

data class Sources(
    val a: SourceInfo,
    val b: SourceInfo
)

data class SourceInfo(
    val fileName: String,
    val duration: Double
)

data class SignatureSegment(
    val label: String,
    val aStart: Double,
    val aEnd: Double,
    val bStart: Double,
    val bEnd: Double,
    val confidence: Double,
    val method: List<String>,
    val videoHashes: List<Int> = emptyList(),
    val videoTimes: List<Double> = emptyList(),
    val videoHop: Double = 0.5,
    val audioChroma: List<List<Float>> = emptyList(),
    val audioTimes: List<Double> = emptyList(),
    val audioHop: Double = 0.05
)

data class SegmentDetection(
    val label: String,
    val start: Double,
    val end: Double,
    val signatureStart: Double,
    val signatureEnd: Double,
    val confidence: Double,
    val method: List<String>,
    val found: Boolean
)

data class DetectionResult(
    val detections: List<SegmentDetection>,
    val videoMeta: MediaMeta,
    val processingTimeMs: Long,
    val framesAnalyzed: Int,
    val audioSamplesAnalyzed: Int
)
