package com.infro.app

import com.google.gson.annotations.SerializedName

data class SignatureData(
    val version: String,
    val mode: String,
    @SerializedName("frameSampleRate") val frameSampleRate: Double,
    @SerializedName("audioSampleRate") val audioSampleRate: Int,
    val sources: Sources,
    val segments: List<SignatureSegment>
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
    val videoHashes: List<Int>,
    val videoTimes: List<Double>,
    val videoHop: Double,
    val audioChroma: List<List<Float>>,
    val audioTimes: List<Double>,
    val audioHop: Double
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
