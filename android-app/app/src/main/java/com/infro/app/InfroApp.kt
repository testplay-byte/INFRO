package com.infro.app

import android.app.Application
import android.util.Log

class InfroApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("InfroApp", "Uncaught exception on ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }
}

/** Singleton to pass results between activities. */
object ResultHolder {
    enum class Type { COMPARE, DETECT }
    var comparisonResult: com.infro.app.model.ComparisonResult? = null
    var detectionResult: com.infro.app.model.DetectionResult? = null
    var resultType: Type = Type.COMPARE
    var videoUriA: android.net.Uri? = null
    var videoUriB: android.net.Uri? = null
    var detectVideoUri: android.net.Uri? = null
    var settings: com.infro.app.model.AnalysisSettings = com.infro.app.model.AnalysisSettings()
    var fileNameA: String = ""
    var fileNameB: String = ""
    var detectFileName: String = ""
    var signatureData: com.infro.app.model.SignatureData? = null
}
