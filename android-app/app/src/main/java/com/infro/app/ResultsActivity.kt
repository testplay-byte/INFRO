package com.infro.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.infro.app.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ResultsActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null
    private lateinit var rvMatches: RecyclerView
    private lateinit var tvBanner: TextView
    private lateinit var tvStats: TextView
    private lateinit var timelineView: com.infro.app.view.TimelineView
    private lateinit var btnNew: Button
    private lateinit var btnExport: Button
    private lateinit var btnBack: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_results)

        rvMatches = findViewById(R.id.rvMatches)
        tvBanner = findViewById(R.id.tvBanner)
        tvStats = findViewById(R.id.tvStats)
        timelineView = findViewById(R.id.timelineView)
        btnNew = findViewById(R.id.btnNew)
        btnExport = findViewById(R.id.btnExport)
        btnBack = findViewById(R.id.btnBack)

        btnBack.setOnClickListener { finish() }

        when (ResultHolder.resultType) {
            ResultHolder.Type.COMPARE -> showComparisonResults()
            ResultHolder.Type.DETECT -> showDetectionResults()
        }

        btnNew.setOnClickListener {
            ResultHolder.comparisonResult = null
            ResultHolder.detectionResult = null
            startActivity(Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK))
            finish()
        }

        // Staggered entrance
        lifecycleScope.launch {
            val views = listOf(tvBanner, timelineView, tvStats, rvMatches, btnNew)
            for (v in views) {
                v.alpha = 0f
                v.translationY = 20f
            }
            for (v in views) {
                v.animate().alpha(1f).translationY(0f).setDuration(300).start()
                delay(80)
            }
        }
    }

    private fun showComparisonResults() {
        val result = ResultHolder.comparisonResult ?: run { finish(); return }

        btnExport.visibility = View.VISIBLE
        btnExport.setOnClickListener { exportSignature(result.signature) }

        // Banner
        val intro = result.introOutro.intro
        val outro = result.introOutro.outro
        val bannerText = buildString {
            append("Inferred from ${result.stats.totalMatches} matches\n")
            if (intro != null) append("Intro: A ${fmt(intro.aStart)}–${fmt(intro.aEnd)} · B ${fmt(intro.bStart)}–${fmt(intro.bEnd)}\n")
            if (outro != null) append("Outro: A ${fmt(outro.aStart)}–${fmt(outro.aEnd)} · B ${fmt(outro.bStart)}–${fmt(outro.bEnd)}")
        }
        tvBanner.text = bannerText.trim()

        // Stats
        tvStats.text = buildString {
            append("Matches: ${result.stats.totalMatches}\n")
            append("Avg confidence: ${(result.stats.averageConfidence * 100).toInt()}%\n")
            append("Longest: ${fmt(result.stats.longestMatchDuration)}\n")
            append("Processing: ${(result.stats.processingTimeMs / 1000.0)}s\n")
            append("Frames: ${result.stats.framesAnalyzed}\n")
            append("Audio: ${result.stats.audioSamplesAnalyzed}")
        }

        // Timeline
        timelineView.setData(result.matches, result.streamA.duration, result.streamB.duration)

        // Match list
        rvMatches.layoutManager = LinearLayoutManager(this)
        rvMatches.adapter = MatchAdapter(result.matches)
        rvMatches.isNestedScrollingEnabled = false
    }

    private fun showDetectionResults() {
        val result = ResultHolder.detectionResult ?: run { finish(); return }
        btnExport.visibility = View.GONE

        tvBanner.text = "Detection: ${result.detections.count { it.found }}/${result.detections.size} found"

        tvStats.text = buildString {
            append("Processing: ${(result.processingTimeMs / 1000.0)}s\n")
            append("Audio samples: ${result.audioSamplesAnalyzed}")
        }

        // Convert detections to matches for display
        val fakeMatches = result.detections.mapIndexed { i, d ->
            Match(
                aStart = d.signatureStart, aEnd = d.signatureEnd,
                bStart = d.start, bEnd = d.end,
                confidence = d.confidence,
                method = d.method,
                similarity = d.confidence,
                isIntro = d.label == "intro",
                isOutro = d.label == "outro",
                group = i
            )
        }
        timelineView.setData(fakeMatches, result.videoMeta.duration, result.videoMeta.duration)
        rvMatches.layoutManager = LinearLayoutManager(this)
        rvMatches.adapter = MatchAdapter(fakeMatches)
        rvMatches.isNestedScrollingEnabled = false
    }

    private var pendingJson: String? = null
    private val saveLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val json = pendingJson
        if (uri != null && json != null) {
            contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray()) }
            Toast.makeText(this, "Signature saved", Toast.LENGTH_SHORT).show()
        }
    }

    private fun exportSignature(sig: SignatureData?) {
        if (sig != null) {
            pendingJson = Gson().toJson(sig)
            saveLauncher.launch("infro-signature.json")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }

    // ===== Adapter =====
    inner class MatchAdapter(val matches: List<Match>) : RecyclerView.Adapter<MatchAdapter.VH>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_match, parent, false)
            return VH(view)
        }
        override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(matches[position])
        override fun getItemCount() = matches.size

        inner class VH(view: View) : RecyclerView.ViewHolder(view) {
            fun bind(m: Match) {
                val label = when {
                    m.isIntro -> "INTRO"
                    m.isOutro -> "OUTRO"
                    else -> "MATCH #${absoluteAdapterPosition + 1}"
                }
                val color = if (m.isIntro) getColor(R.color.sage) else if (m.isOutro) getColor(R.color.copper) else getColor(R.color.primary)

                itemView.findViewById<TextView>(R.id.tvMatchLabel).apply {
                    text = label
                    setTextColor(color)
                }
                itemView.findViewById<TextView>(R.id.tvMatchTime).text =
                    "A: ${fmt(m.aStart)}–${fmt(m.aEnd)}  ·  B: ${fmt(m.bStart)}–${fmt(m.bEnd)}"
                itemView.findViewById<TextView>(R.id.tvMatchConf).text =
                    "${(m.confidence * 100).toInt()}% confidence"
                itemView.findViewById<TextView>(R.id.tvMatchMethod).text =
                    m.method.joinToString(" + ")
            }
        }
    }

    private fun fmt(t: Double): String {
        val total = t.toInt()
        return "${total / 60}:${(total % 60).toString().padStart(2, '0')}"
    }
}
