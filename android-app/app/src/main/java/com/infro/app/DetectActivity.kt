package com.infro.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.infro.app.matching.AnalysisEngine
import com.infro.app.model.AnalysisSettings
import com.infro.app.model.SignatureData
import kotlinx.coroutines.launch

class DetectActivity : AppCompatActivity() {

    private var signatureUri: Uri? = null
    private var signatureData: SignatureData? = null
    private var videoUri: Uri? = null
    private var videoFileName: String = ""

    private lateinit var btnBack: Button
    private lateinit var btnSettings: Button
    private lateinit var btnSignature: Button
    private lateinit var btnVideo: Button
    private lateinit var btnDetect: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvInfo: TextView

    private var settings: AnalysisSettings = ResultHolder.settings

    private val pickSignature = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            signatureUri = it
            val name = getFileName(it) ?: "signature.json"
            try {
                val json = contentResolver.openInputStream(it)?.bufferedReader().use { it?.readText() } ?: ""
                signatureData = Gson().fromJson(json, SignatureData::class.java)
                btnSignature.text = name
                btnSignature.setBackgroundColor(getColor(R.color.sage_hint))
                tvInfo.visibility = View.GONE
                tvInfo.text = ""
                updateDetectButton()
            } catch (e: Exception) {
                signatureData = null
                tvInfo.visibility = View.VISIBLE
                tvInfo.text = "Failed to read signature: ${e.message ?: "Unknown error"}"
                updateDetectButton()
            }
        }
    }

    private val pickVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            videoUri = it
            videoFileName = getFileName(it) ?: "video"
            btnVideo.text = videoFileName
            btnVideo.setBackgroundColor(getColor(R.color.sage_hint))
            updateDetectButton()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detect)

        btnBack = findViewById(R.id.btnBack)
        btnSettings = findViewById(R.id.btnSettings)
        btnSignature = findViewById(R.id.btnSignature)
        btnVideo = findViewById(R.id.btnVideo)
        btnDetect = findViewById(R.id.btnDetect)
        progressBar = findViewById(R.id.progressBar)
        tvInfo = findViewById(R.id.tvInfo)

        btnBack.setOnClickListener { finish() }
        btnSettings.setOnClickListener {
            val sheet = SettingsBottomSheet(this, settings) { newSettings ->
                settings = newSettings
                ResultHolder.settings = newSettings
            }
            sheet.show()
        }

        btnSignature.setOnClickListener { pickSignature.launch("application/json") }
        btnVideo.setOnClickListener { pickVideo.launch("video/*") }
        btnDetect.setOnClickListener { detect() }

        updateDetectButton()

        // Staggered entrance — fade in + translate Y, just like CompareActivity
        lifecycleScope.launch {
            val views = listOf(btnBack, btnSignature, btnVideo, btnDetect)
            for (v in views) {
                v.alpha = 0f
                v.translationY = 20f
            }
            for (v in views) {
                v.animate().alpha(1f).translationY(0f).setDuration(300).start()
                try { Thread.sleep(50) } catch (_: Exception) {}
            }
        }
    }

    private fun updateDetectButton() {
        val ready = signatureData != null && videoUri != null
        btnDetect.isEnabled = ready
        if (ready) {
            btnDetect.setBackgroundColor(getColor(R.color.primary))
            btnDetect.setTextColor(getColor(R.color.white))
        } else {
            btnDetect.setBackgroundColor(getColor(R.color.border))
            btnDetect.setTextColor(getColor(R.color.text_secondary))
        }
    }

    private fun detect() {
        val sig = signatureData ?: return
        val video = videoUri ?: return

        progressBar.visibility = View.VISIBLE
        tvInfo.visibility = View.VISIBLE
        btnDetect.isEnabled = false
        tvInfo.text = "Starting detection..."

        ResultHolder.detectVideoUri = video
        ResultHolder.detectFileName = videoFileName
        ResultHolder.signatureData = sig
        ResultHolder.settings = settings

        lifecycleScope.launch {
            try {
                val result = AnalysisEngine.detect(
                    this@DetectActivity, sig, video, videoFileName, settings
                ) { stage, progress, detail ->
                    tvInfo.text = "$detail (${(progress * 100).toInt()}%)"
                }

                if (result.detections.isEmpty()) {
                    tvInfo.text = "No segments detected. Try different settings or another video."
                    return@launch
                }

                ResultHolder.detectionResult = result
                ResultHolder.resultType = ResultHolder.Type.DETECT
                startActivity(Intent(this@DetectActivity, ResultsActivity::class.java))
                finish()

            } catch (e: OutOfMemoryError) {
                tvInfo.text = "Out of memory. Try a shorter video."
            } catch (e: Exception) {
                tvInfo.text = "Error: ${e.message ?: "Unknown error"}"
            } finally {
                progressBar.visibility = View.GONE
                btnDetect.isEnabled = true
                updateDetectButton()
            }
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
}
