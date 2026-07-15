package com.infro.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
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
    private var videoUri: Uri? = null
    private var signatureData: SignatureData? = null
    private var videoName: String = ""
    private var settings = AnalysisSettings()

    private lateinit var btnSig: Button
    private lateinit var btnVideo: Button
    private lateinit var btnDetect: Button
    private lateinit var tvInfo: TextView
    private lateinit var progressBar: ProgressBar

    private val pickSig = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            signatureUri = it
            try {
                val json = contentResolver.openInputStream(it)?.bufferedReader()?.use { r -> r.readText() }
                signatureData = Gson().fromJson(json, SignatureData::class.java)
                val segCount = signatureData?.segments?.size ?: 0
                btnSig.text = "Signature: $segCount segments"
                updateButton()
            } catch (e: Exception) {
                tvInfo.text = "Invalid signature: ${e.message}"
                tvInfo.visibility = View.VISIBLE
            }
        }
    }

    private val pickVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            videoUri = it
            videoName = getFileName(it) ?: "video"
            btnVideo.text = "Video: $videoName"
            updateButton()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detect)

        btnSig = findViewById(R.id.btnSignature)
        btnVideo = findViewById(R.id.btnVideo)
        btnDetect = findViewById(R.id.btnDetect)
        tvInfo = findViewById(R.id.tvInfo)
        progressBar = findViewById(R.id.progressBar)

        btnSig.setOnClickListener { pickSig.launch("application/json") }
        btnVideo.setOnClickListener { pickVideo.launch("video/*") }
        btnDetect.setOnClickListener { detect() }
    }

    private fun updateButton() {
        btnDetect.isEnabled = signatureData != null && videoUri != null
    }

    private fun detect() {
        val sig = signatureData ?: return
        val video = videoUri ?: return

        progressBar.visibility = View.VISIBLE
        tvInfo.visibility = View.VISIBLE
        btnDetect.isEnabled = false
        tvInfo.text = "Detecting..."

        lifecycleScope.launch {
            try {
                val result = AnalysisEngine.detect(
                    this@DetectActivity, sig, video, videoName, settings
                ) { stage, progress, detail ->
                    tvInfo.text = "$detail (${(progress * 100).toInt()}%)"
                }

                ResultHolder.detectionResult = result
                ResultHolder.resultType = ResultHolder.Type.DETECT
                ResultHolder.resultJson = Gson().toJson(sig)
                startActivity(Intent(this@DetectActivity, ResultsActivity::class.java))
                finish()

            } catch (e: Exception) {
                tvInfo.text = "Error: ${e.message}"
            } finally {
                progressBar.visibility = View.GONE
                btnDetect.isEnabled = true
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
