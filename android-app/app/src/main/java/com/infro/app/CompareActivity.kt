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
import com.infro.app.matching.AnalysisEngine
import com.infro.app.model.AnalysisSettings
import com.infro.app.model.ComparisonResult
import com.google.gson.Gson
import kotlinx.coroutines.launch

class CompareActivity : AppCompatActivity() {

    private var uriA: Uri? = null
    private var uriB: Uri? = null
    private var nameA: String = ""
    private var nameB: String = ""

    private lateinit var btnA: Button
    private lateinit var btnB: Button
    private lateinit var btnAnalyze: Button
    private lateinit var tvInfo: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnAudio: Button
    private lateinit var btnVideo: Button
    private lateinit var btnCombined: Button

    private var settings = AnalysisSettings()

    private val pickA = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            uriA = it
            nameA = getFileName(it) ?: "video_a"
            btnA.text = "Video A: $nameA"
            updateAnalyzeButton()
        }
    }

    private val pickB = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            uriB = it
            nameB = getFileName(it) ?: "video_b"
            btnB.text = "Video B: $nameB"
            updateAnalyzeButton()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_compare)

        btnA = findViewById(R.id.btnVideoA)
        btnB = findViewById(R.id.btnVideoB)
        btnAnalyze = findViewById(R.id.btnAnalyze)
        tvInfo = findViewById(R.id.tvInfo)
        progressBar = findViewById(R.id.progressBar)
        btnAudio = findViewById(R.id.btnAudio)
        btnVideo = findViewById(R.id.btnVideo)
        btnCombined = findViewById(R.id.btnCombined)

        btnA.setOnClickListener { pickA.launch("video/*") }
        btnB.setOnClickListener { pickB.launch("video/*") }
        btnAnalyze.setOnClickListener { analyze() }

        btnAudio.setOnClickListener { setMode("audio") }
        btnVideo.setOnClickListener { setMode("video") }
        btnCombined.setOnClickListener { setMode("combined") }
        setMode("combined")
    }

    private fun setMode(mode: String) {
        settings.mode = mode
        val active = listOf(R.color.primary, R.color.primary, R.color.primary)
        val passive = listOf(R.color.card, R.color.card, R.color.card)
        btnAudio.backgroundTintList = android.content.res.ColorStateList.valueOf(
            if (mode == "audio") getColor(R.color.primary) else getColor(R.color.card))
        btnVideo.backgroundTintList = android.content.res.ColorStateList.valueOf(
            if (mode == "video") getColor(R.color.primary) else getColor(R.color.card))
        btnCombined.backgroundTintList = android.content.res.ColorStateList.valueOf(
            if (mode == "combined") getColor(R.color.primary) else getColor(R.color.card))
        btnAudio.setTextColor(if (mode == "audio") getColor(R.color.white) else getColor(R.color.text_primary))
        btnVideo.setTextColor(if (mode == "video") getColor(R.color.white) else getColor(R.color.text_primary))
        btnCombined.setTextColor(if (mode == "combined") getColor(R.color.white) else getColor(R.color.text_primary))
    }

    private fun updateAnalyzeButton() {
        btnAnalyze.isEnabled = uriA != null && uriB != null
    }

    private fun analyze() {
        val a = uriA ?: return
        val b = uriB ?: return

        // Disable buttons during analysis
        btnA.isEnabled = false
        btnB.isEnabled = false
        progressBar.visibility = View.VISIBLE
        tvInfo.visibility = View.VISIBLE
        btnAnalyze.isEnabled = false
        tvInfo.text = "Starting analysis..."

        lifecycleScope.launch {
            try {
                val result = AnalysisEngine.analyze(
                    this@CompareActivity, a, b, nameA, nameB, settings
                ) { stage, progress, detail ->
                    tvInfo.text = "$detail (${(progress * 100).toInt()}%)"
                }

                if (result.matches.isEmpty() && !result.stats.detectedIntro && !result.stats.detectedOutro) {
                    tvInfo.text = "No matches found. Try adjusting settings or using a different mode."
                    return@launch
                }

                ResultHolder.comparisonResult = result
                ResultHolder.resultType = ResultHolder.Type.COMPARE
                startActivity(Intent(this@CompareActivity, ResultsActivity::class.java))
                finish()

            } catch (e: OutOfMemoryError) {
                tvInfo.text = "Out of memory. Try shorter videos or Audio-only mode."
            } catch (e: Exception) {
                tvInfo.text = "Error: ${e.message ?: "Unknown error"}"
            } finally {
                progressBar.visibility = View.GONE
                btnA.isEnabled = true
                btnB.isEnabled = true
                btnAnalyze.isEnabled = true
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

/** Singleton to pass results between activities. */
object ResultHolder {
    enum class Type { COMPARE, DETECT }
    var comparisonResult: ComparisonResult? = null
    var detectionResult: com.infro.app.model.DetectionResult? = null
    var resultType: Type = Type.COMPARE
    var resultJson: String? = null
}
