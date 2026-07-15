package com.infro.app

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.infro.app.model.*
import com.infro.app.view.TimelineView

class ResultsActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var timelineView: TimelineView
    private lateinit var rvMatches: RecyclerView
    private lateinit var tvStats: TextView
    private lateinit var tvBanner: TextView
    private lateinit var btnExport: Button
    private lateinit var btnNew: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_results)

        playerView = findViewById(R.id.playerView)
        timelineView = findViewById(R.id.timelineView)
        rvMatches = findViewById(R.id.rvMatches)
        tvStats = findViewById(R.id.tvStats)
        tvBanner = findViewById(R.id.tvBanner)
        btnExport = findViewById(R.id.btnExport)
        btnNew = findViewById(R.id.btnNew)

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
    }

    private fun showComparisonResults() {
        val result = ResultHolder.comparisonResult ?: run { finish(); return }

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
            append("Longest: ${fmtDur(result.stats.longestMatchDuration)}\n")
            append("Avg confidence: ${(result.stats.averageConfidence * 100).toInt()}%\n")
            append("Matched time: ${fmtDur(result.stats.totalMatchedDuration)}\n")
            append("Processing: ${(result.stats.processingTimeMs / 1000.0).toFixed(1)}s\n")
            append("Frames: ${result.stats.framesAnalyzed}\n")
            append("Audio samples: ${result.stats.audioSamplesAnalyzed}")
        }

        // Timeline
        timelineView.setData(result.matches, result.streamA.duration, result.streamB.duration)

        // Match list
        rvMatches.layoutManager = LinearLayoutManager(this)
        rvMatches.adapter = MatchAdapter(result.matches)

        // Export
        btnExport.visibility = View.VISIBLE
        btnExport.setOnClickListener {
            val sig = result.signature
            if (sig != null) {
                pendingJson = Gson().toJson(sig)
                saveLauncher.launch("infro-signature.json")
            }
        }

        // Video player (play video A)
        // Note: We'd need to pass the URI through. For now, skip player in compare mode
        // since URIs are not retained. In production, use a ViewModel or saved state.
        playerView.visibility = View.GONE
    }

    private var pendingJson: String? = null
    private val saveLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val json = pendingJson
        if (uri != null && json != null) {
            contentResolver.openOutputStream(uri)?.use { os ->
                os.write(json.toByteArray())
            }
        }
    }

    private fun showDetectionResults() {
        val result = ResultHolder.detectionResult ?: run { finish(); return }

        tvBanner.text = "Detection Results: ${result.detections.count { it.found }}/${result.detections.size} found"

        tvStats.text = buildString {
            append("Processing: ${(result.processingTimeMs / 1000.0).toFixed(1)}s\n")
            append("Audio samples: ${result.audioSamplesAnalyzed}")
        }

        // Timeline not applicable in detect mode (single video)
        timelineView.visibility = View.GONE

        // Show detections as "matches"
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
        rvMatches.layoutManager = LinearLayoutManager(this)
        rvMatches.adapter = MatchAdapter(fakeMatches)

        btnExport.visibility = View.GONE
        playerView.visibility = View.GONE
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }

    // ========== Adapter ==========

    private inner class MatchAdapter(val matches: List<Match>) : RecyclerView.Adapter<MatchAdapter.VH>() {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_match, parent, false)
            return VH(view)
        }
        override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(matches[position])
        override fun getItemCount() = matches.size

        inner class VH(view: View) : RecyclerView.ViewHolder(view) {
            fun bind(m: Match) {
                itemView.findViewById<TextView>(R.id.tvMatchLabel).apply {
                    text = when {
                        m.isIntro -> "INTRO"
                        m.isOutro -> "OUTRO"
                        else -> "MATCH #${absoluteAdapterPosition + 1}"
                    }
                    val color = if (m.isIntro) getColor(R.color.sage) else if (m.isOutro) getColor(R.color.copper) else getColor(R.color.primary)
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
    private fun fmtDur(t: Double): String = fmt(t)
}

private fun Double.toFixed(digits: Int): String = "%.${digits}f".format(this)
