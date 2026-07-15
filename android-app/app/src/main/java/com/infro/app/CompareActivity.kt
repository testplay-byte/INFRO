package com.infro.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.infro.app.matching.AnalysisEngine
import com.infro.app.model.AnalysisSettings
import kotlinx.coroutines.launch

class CompareActivity : AppCompatActivity() {

    private var uriA: Uri? = null
    private var uriB: Uri? = null
    private var nameA: String = ""
    private var nameB: String = ""

    private lateinit var btnAudio: Button
    private lateinit var btnVideo: Button
    private lateinit var btnCombined: Button
    private lateinit var btnVideoA: Button
    private lateinit var btnVideoB: Button
    private lateinit var btnAnalyze: Button
    private lateinit var btnBack: Button
    private lateinit var btnSettings: Button
    private lateinit var tvModeDesc: TextView
    private lateinit var tvModeIcon: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvInfo: TextView

    private var settings = ResultHolder.settings

    private val pickA = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            uriA = it
            nameA = getFileName(it) ?: "video_a"
            btnVideoA.text = nameA
            btnVideoA.setBackgroundColor(getColor(R.color.sage_hint))
            updateAnalyzeButton()
        }
    }

    private val pickB = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            uriB = it
            nameB = getFileName(it) ?: "video_b"
            btnVideoB.text = nameB
            btnVideoB.setBackgroundColor(getColor(R.color.sage_hint))
            updateAnalyzeButton()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_compare)

        btnBack = findViewById(R.id.btnBack)
        btnSettings = findViewById(R.id.btnSettings)
        btnAudio = findViewById(R.id.btnAudio)
        btnVideo = findViewById(R.id.btnVideo)
        btnCombined = findViewById(R.id.btnCombined)
        btnVideoA = findViewById(R.id.btnVideoA)
        btnVideoB = findViewById(R.id.btnVideoB)
        btnAnalyze = findViewById(R.id.btnAnalyze)
        tvModeDesc = findViewById(R.id.tvModeDesc)
        tvModeIcon = findViewById(R.id.tvModeIcon)
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

        btnAudio.setOnClickListener { setMode("audio") }
        btnVideo.setOnClickListener { setMode("video") }
        btnCombined.setOnClickListener { setMode("combined") }
        setMode(settings.mode)

        btnVideoA.setOnClickListener { pickA.launch("video/*") }
        btnVideoB.setOnClickListener { pickB.launch("video/*") }
        btnAnalyze.setOnClickListener { analyze() }

        // Staggered entrance
        lifecycleScope.launch {
            val views = listOf(btnBack, btnAudio, btnVideo, btnCombined, tvModeDesc, btnVideoA, btnVideoB, btnAnalyze)
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

    private fun setMode(mode: String) {
        settings.mode = mode
        val activeBg = getColor(R.color.primary)
        val inactiveBg = getColor(R.color.card)
        val activeText = getColor(R.color.white)
        val inactiveText = getColor(R.color.text_primary)

        btnAudio.setBackgroundColor(if (mode == "audio") activeBg else inactiveBg)
        btnAudio.setTextColor(if (mode == "audio") activeText else inactiveText)
        btnVideo.setBackgroundColor(if (mode == "video") activeBg else inactiveBg)
        btnVideo.setTextColor(if (mode == "video") activeText else inactiveText)
        btnCombined.setBackgroundColor(if (mode == "combined") activeBg else inactiveBg)
        btnCombined.setTextColor(if (mode == "combined") activeText else inactiveText)

        when (mode) {
            "audio" -> {
                tvModeIcon.text = "♪"
                tvModeDesc.text = "Audio fingerprints only — fastest, best for reused music"
            }
            "video" -> {
                tvModeIcon.text = "▶"
                tvModeDesc.text = "Visual frame hashes — best when audio differs"
            }
            "combined" -> {
                tvModeIcon.text = "✦"
                tvModeDesc.text = "Audio + video fused — most accurate, recommended"
            }
        }
    }

    private fun updateAnalyzeButton() {
        btnAnalyze.isEnabled = uriA != null && uriB != null
        if (btnAnalyze.isEnabled) {
            btnAnalyze.setBackgroundColor(getColor(R.color.primary))
            btnAnalyze.setTextColor(getColor(R.color.white))
        } else {
            btnAnalyze.setBackgroundColor(getColor(R.color.border))
            btnAnalyze.setTextColor(getColor(R.color.text_secondary))
        }
    }

    private fun analyze() {
        val a = uriA ?: return
        val b = uriB ?: return

        progressBar.visibility = View.VISIBLE
        tvInfo.visibility = View.VISIBLE
        btnAnalyze.isEnabled = false
        tvInfo.text = "Starting analysis..."

        ResultHolder.videoUriA = a
        ResultHolder.videoUriB = b
        ResultHolder.fileNameA = nameA
        ResultHolder.fileNameB = nameB
        ResultHolder.settings = settings

        lifecycleScope.launch {
            try {
                val result = AnalysisEngine.analyze(
                    this@CompareActivity, a, b, nameA, nameB, settings
                ) { stage, progress, detail ->
                    tvInfo.text = "$detail (${(progress * 100).toInt()}%)"
                }

                if (result.matches.isEmpty() && !result.stats.detectedIntro && !result.stats.detectedOutro) {
                    tvInfo.text = "No matches found. Try different settings or mode."
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
                btnAnalyze.isEnabled = true
                updateAnalyzeButton()
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
