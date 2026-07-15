package com.infro.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.gson.Gson
import com.infro.app.audio.AudioExtractor
import com.infro.app.audio.Fingerprinter
import com.infro.app.matching.AnalysisEngine
import com.infro.app.matching.Matcher
import com.infro.app.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * WebView-based main activity. Loads the web prototype from assets and bridges
 * native audio/video processing via JavascriptInterface. The UI looks EXACTLY
 * like the web prototype because it IS the web prototype.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingFilePicker: String? = null // "videoA", "videoB", "detectVideo", "signature"

    private var uriA: Uri? = null
    private var uriB: Uri? = null
    private var detectUri: Uri? = null
    private var signatureUri: Uri? = null

    private val filePicker = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null && pendingFilePicker != null) {
            val fileName = getFileName(uri) ?: "file"
            when (pendingFilePicker) {
                "videoA" -> { uriA = uri; ResultHolder.videoUriA = uri; ResultHolder.fileNameA = fileName }
                "videoB" -> { uriB = uri; ResultHolder.videoUriB = uri; ResultHolder.fileNameB = fileName }
                "detectVideo" -> { detectUri = uri; ResultHolder.detectVideoUri = uri; ResultHolder.detectFileName = fileName }
                "signature" -> {
                    signatureUri = uri
                    val json = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    ResultHolder.signatureData = Gson().fromJson(json, SignatureData::class.java)
                }
            }
            // Notify JS that a file was selected
            val type = if (pendingFilePicker == "signature") "signature" else "video"
            webView.post {
                webView.evaluateJavascript(
                    "window.infroNative.onFileSelected('$pendingFilePicker', '$fileName', '$type');",
                    null
                )
            }
        }
        pendingFilePicker = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            webViewClient = WebViewClient()
            addJavascriptInterface(NativeBridge(), "infroNative")
        }
        setContentView(webView)

        // Load the app page from assets
        webView.loadUrl("file:///android_asset/app/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    private fun getFileName(uri: Uri): String? {
        val cursor = contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && it.moveToFirst()) return it.getString(nameIndex)
        }
        return uri.lastPathSegment
    }

    /**
     * Native bridge — exposed to JavaScript as window.infroNative.
     * JS calls these methods to trigger native processing.
     */
    inner class NativeBridge {

        @JavascriptInterface
        fun pickFile(slot: String) {
            pendingFilePicker = slot
            val mime = if (slot == "signature") "application/json" else "video/*"
            runOnUiThread { filePicker.launch(mime) }
        }

        /**
         * Run the full comparison analysis. Called from JS when the user taps
         * "Analyze Similarity". Returns a JSON result string.
         */
        @JavascriptInterface
        fun analyze(jsonSettings: String) {
            val settings = Gson().fromJson(jsonSettings, AnalysisSettings::class.java)
            val a = uriA ?: return
            val b = uriB ?: return

            webView.post {
                webView.evaluateJavascript("window.infroNative.onProgress('decoding', 0.05, 'Starting analysis...');", null)
            }

            CoroutineScope(Dispatchers.Default).launch {
                try {
                    val result = AnalysisEngine.analyze(
                        this@MainActivity, a, b,
                        ResultHolder.fileNameA, ResultHolder.fileNameB, settings
                    ) { stage, progress, detail ->
                        webView.post {
                            webView.evaluateJavascript(
                                "window.infroNative.onProgress('$stage', $progress, '$detail');",
                                null
                            )
                        }
                    }

                    val json = Gson().toJson(result)
                    webView.post {
                        webView.evaluateJavascript(
                            "window.infroNative.onAnalysisComplete($json);",
                            null
                        )
                    }
                } catch (e: Exception) {
                    webView.post {
                        webView.evaluateJavascript(
                            "window.infroNative.onError('${e.message?.replace("'", "\\'")}');",
                            null
                        )
                    }
                }
            }
        }

        /**
         * Run detection using a signature. Called from JS when the user taps
         * "Detect Intro & Outro".
         */
        @JavascriptInterface
        fun detect(jsonSettings: String) {
            val settings = Gson().fromJson(jsonSettings, AnalysisSettings::class.java)
            val sig = ResultHolder.signatureData ?: return
            val video = detectUri ?: return

            webView.post {
                webView.evaluateJavascript("window.infroNative.onProgress('decoding', 0.1, 'Starting detection...');", null)
            }

            CoroutineScope(Dispatchers.Default).launch {
                try {
                    val result = AnalysisEngine.detect(
                        this@MainActivity, sig, video,
                        ResultHolder.detectFileName, settings
                    ) { stage, progress, detail ->
                        webView.post {
                            webView.evaluateJavascript(
                                "window.infroNative.onProgress('$stage', $progress, '$detail');",
                                null
                            )
                        }
                    }

                    val json = Gson().toJson(result)
                    webView.post {
                        webView.evaluateJavascript(
                            "window.infroNative.onDetectionComplete($json);",
                            null
                        )
                    }
                } catch (e: Exception) {
                    webView.post {
                        webView.evaluateJavascript(
                            "window.infroNative.onError('${e.message?.replace("'", "\\'")}');",
                            null
                        )
                    }
                }
            }
        }

        /**
         * Export a signature JSON. Opens the system file save dialog.
         */
        @JavascriptInterface
        fun exportSignature(json: String) {
            pendingJson = json
            runOnUiThread {
                saveLauncher.launch("infro-signature.json")
            }
        }

        @JavascriptInterface
        fun getSettings(): String {
            return Gson().toJson(ResultHolder.settings)
        }

        @JavascriptInterface
        fun saveSettings(json: String) {
            ResultHolder.settings = Gson().fromJson(json, AnalysisSettings::class.java)
        }
    }

    private var pendingJson: String? = null
    private val saveLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val json = pendingJson
        if (uri != null && json != null) {
            contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray()) }
            webView.post {
                webView.evaluateJavascript("window.infroNative.onExportComplete();", null)
            }
        }
        pendingJson = null
    }
}
