package com.infro.app

import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private var signatureUri: Uri? = null
    private var videoUri: Uri? = null
    private var signatureData: SignatureData? = null

    private lateinit var btnSignature: Button
    private lateinit var btnVideo: Button
    private lateinit var btnDetect: Button
    private lateinit var tvSignatureInfo: TextView
    private lateinit var tvVideoInfo: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvProgress: TextView
    private lateinit var resultsContainer: LinearLayout

    private val signaturePicker = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            signatureUri = it
            loadSignature(it)
        }
    }

    private val videoPicker = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            videoUri = it
            tvVideoInfo.text = "Video selected"
            tvVideoInfo.visibility = View.VISIBLE
            updateDetectButton()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnSignature = findViewById(R.id.btnSignature)
        btnVideo = findViewById(R.id.btnVideo)
        btnDetect = findViewById(R.id.btnDetect)
        tvSignatureInfo = findViewById(R.id.tvSignatureInfo)
        tvVideoInfo = findViewById(R.id.tvVideoInfo)
        progressBar = findViewById(R.id.progressBar)
        tvProgress = findViewById(R.id.tvProgress)
        resultsContainer = findViewById(R.id.resultsContainer)

        btnSignature.setOnClickListener {
            signaturePicker.launch("application/json")
        }

        btnVideo.setOnClickListener {
            videoPicker.launch("video/*")
        }

        btnDetect.setOnClickListener {
            detect()
        }
    }

    private fun loadSignature(uri: Uri) {
        lifecycleScope.launch {
            try {
                val json = withContext(Dispatchers.IO) {
                    contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                }
                val data = Gson().fromJson(json, SignatureData::class.java)
                signatureData = data
                val segCount = data.segments.size
                tvSignatureInfo.text = "Loaded: $segCount segment${if (segCount != 1) "s" else ""} · mode: ${data.mode}"
                tvSignatureInfo.visibility = View.VISIBLE
                updateDetectButton()
            } catch (e: Exception) {
                tvSignatureInfo.text = "Error: ${e.message}"
                tvSignatureInfo.visibility = View.VISIBLE
            }
        }
    }

    private fun updateDetectButton() {
        btnDetect.isEnabled = signatureData != null && videoUri != null
    }

    private fun detect() {
        val sig = signatureData ?: return
        val video = videoUri ?: return

        progressBar.visibility = View.VISIBLE
        tvProgress.visibility = View.VISIBLE
        tvProgress.text = "Extracting audio..."
        resultsContainer.visibility = View.GONE
        btnDetect.isEnabled = false

        lifecycleScope.launch {
            try {
                tvProgress.text = "Decoding audio from video..."

                val audioPcm = withContext(Dispatchers.IO) {
                    AudioExtractor.extractPcm(this@MainActivity, video, 30000)
                }

                tvProgress.text = "Generating fingerprints..."

                val detections = withContext(Dispatchers.IO) {
                    AudioMatcher.match(signature = sig, pcm = audioPcm)
                }

                tvProgress.text = "Done!"
                showResults(detections)

            } catch (e: Exception) {
                tvProgress.text = "Error: ${e.message}"
            } finally {
                progressBar.visibility = View.GONE
                btnDetect.isEnabled = true
            }
        }
    }

    private fun showResults(detections: List<SegmentDetection>) {
        resultsContainer.removeAllViews()

        // Show results header
        val resultsHeader = findViewById<TextView>(R.id.tvResultsHeader)
        resultsHeader.visibility = View.VISIBLE

        if (detections.isEmpty()) {
            val tv = TextView(this).apply {
                text = "No segments detected"
                textSize = 15f
                setTextColor(getColor(R.color.text_secondary))
                setPadding(0, 24, 0, 24)
            }
            resultsContainer.addView(tv)
        } else {
            for (det in detections) {
                val view = layoutInflater.inflate(R.layout.item_detection, resultsContainer, false)

                // Label badge
                view.findViewById<TextView>(R.id.tvLabel).apply {
                    text = det.label.uppercase()
                    val colorRes = if (det.label == "intro") R.color.sage else R.color.copper
                    val color = getColor(colorRes)
                    setTextColor(color)
                    // Semi-transparent background
                    val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
                        cornerRadius = 24f
                        setColor(color and 0x22FFFFFF)
                    }
                    background = bgDrawable
                }

                // Confidence
                view.findViewById<TextView>(R.id.tvConfidence).apply {
                    text = if (det.found) "${(det.confidence * 100).toInt()}%" else "—"
                    setTextColor(if (det.found) getColor(R.color.sage) else getColor(R.color.text_secondary))
                }

                // Time range
                view.findViewById<TextView>(R.id.tvTimeRange).apply {
                    text = if (det.found) "${formatTime(det.start)} → ${formatTime(det.end)}" else "Not found"
                }

                // Duration
                view.findViewById<TextView>(R.id.tvDuration).apply {
                    text = if (det.found) {
                        "Duration: ${formatTime(det.end - det.start)} · original: ${formatTime(det.signatureStart)}–${formatTime(det.signatureEnd)}"
                    } else {
                        "Segment not found in this video"
                    }
                }

                // Method
                view.findViewById<TextView>(R.id.tvMethod).apply {
                    text = if (det.found) "matched via: ${det.method.joinToString(" + ")}" else ""
                }

                resultsContainer.addView(view)
            }
        }

        resultsContainer.visibility = View.VISIBLE
        tvProgress.visibility = View.GONE
    }

    private fun formatTime(seconds: Double): String {
        val totalSecs = seconds.toInt()
        val m = totalSecs / 60
        val s = totalSecs % 60
        return "%d:%02d".format(m, s)
    }
}
