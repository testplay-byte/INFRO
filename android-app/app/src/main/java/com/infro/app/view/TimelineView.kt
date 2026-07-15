package com.infro.app.view

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import com.infro.app.model.Match

/**
 * Custom canvas-based timeline showing two tracks (A and B) with match
 * regions highlighted and playhead indicators.
 */
class TimelineView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var matches: List<Match> = emptyList()
    private var durationA: Double = 1.0
    private var durationB: Double = 1.0
    private var playheadA: Double = 0.0
    private var playheadB: Double = 0.0

    private val bgPaint = Paint().apply {
        color = Color.parseColor("#F5F5F0")
        isAntiAlias = true
    }
    private val trackPaint = Paint().apply {
        color = Color.parseColor("#E7E5E4")
        isAntiAlias = true
    }
    private val matchPaint = Paint().apply {
        isAntiAlias = true
    }
    private val playheadPaint = Paint().apply {
        color = Color.parseColor("#B45309")
        strokeWidth = 4f
        isAntiAlias = true
    }
    private val textPaint = Paint().apply {
        color = Color.parseColor("#78716C")
        textSize = 28f
        isAntiAlias = true
    }
    private val labelPaint = Paint().apply {
        color = Color.parseColor("#78716C")
        textSize = 32f
        isFakeBoldText = true
        isAntiAlias = true
    }

    private val matchColors = intArrayOf(
        Color.parseColor("#B45309"),
        Color.parseColor("#4D7C0F"),
        Color.parseColor("#C2410C"),
        Color.parseColor("#92400E"),
        Color.parseColor("#7C2D12"),
        Color.parseColor("#365314")
    )

    fun setData(matches: List<Match>, durationA: Double, durationB: Double) {
        this.matches = matches
        this.durationA = maxOf(durationA, 0.001)
        this.durationB = maxOf(durationB, 0.001)
        invalidate()
    }

    fun setPlayheads(a: Double, b: Double) {
        playheadA = a
        playheadB = b
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val pad = 16f
        val trackH = 48f
        val gap = 24f
        val rulerH = 32f

        canvas.drawColor(Color.parseColor("#FAFAF7"))

        // Ruler
        val maxDur = maxOf(durationA, durationB)
        drawRuler(canvas, pad, w - pad, 0f, rulerH, maxDur)

        // Track A
        val trackAY = rulerH + gap
        drawTrack(canvas, pad, trackAY, w - pad, trackAY + trackH, durationA, matches, true)

        // Label A
        canvas.drawText("A", 4f, trackAY + trackH / 2 + 12f, labelPaint)

        // Track B
        val trackBY = trackAY + trackH + gap
        drawTrack(canvas, pad, trackBY, w - pad, trackBY + trackH, durationB, matches, false)

        // Label B
        canvas.drawText("B", 4f, trackBY + trackH / 2 + 12f, labelPaint)
    }

    private fun drawRuler(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, duration: Double) {
        val trackW = right - left
        val step = chooseTickStep(duration)
        val tickPaint = Paint().apply {
            color = Color.parseColor("#D6D3D1")
            strokeWidth = 1f
        }

        var t = 0.0
        while (t <= duration) {
            val x = left + (t / duration * trackW).toFloat()
            canvas.drawLine(x, top, x, bottom, tickPaint)
            val min = (t / 60).toInt()
            val sec = (t % 60).toInt()
            canvas.drawText("$min:${sec.toString().padStart(2, '0')}", x + 4f, top + 24f, textPaint)
            t += step
        }
    }

    private fun drawTrack(
        canvas: Canvas, left: Float, top: Float, right: Float, bottom: Float,
        duration: Double, matches: List<Match>, isA: Boolean
    ) {
        val trackW = right - left
        val trackH = bottom - top

        // Track background
        val rect = RectF(left, top, right, bottom)
        trackPaint.color = Color.parseColor("#E7E5E4")
        canvas.drawRoundRect(rect, 8f, 8f, trackPaint)

        // Match regions
        for (m in matches) {
            val start = if (isA) m.aStart else m.bStart
            val end = if (isA) m.aEnd else m.bEnd
            val x1 = left + (start / duration * trackW).toFloat()
            val x2 = left + (end / duration * trackW).toFloat()
            val matchRect = RectF(x1, top + 4f, x2, bottom - 4f)

            val color = matchColors[m.group % matchColors.size]
            matchPaint.color = color
            matchPaint.alpha = 180
            canvas.drawRoundRect(matchRect, 6f, 6f, matchPaint)

            // Label
            if (m.isIntro || m.isOutro) {
                matchPaint.color = Color.WHITE
                matchPaint.textSize = 24f
                matchPaint.isFakeBoldText = true
                val label = if (m.isIntro) "INTRO" else "OUTRO"
                canvas.drawText(label, x1 + 8f, top + trackH / 2 + 8f, matchPaint)
            }
        }

        // Playhead
        val playhead = if (isA) playheadA else playheadB
        val px = left + (playhead / duration * trackW).toFloat()
        playheadPaint.color = Color.parseColor("#B45309")
        canvas.drawLine(px, top - 4f, px, bottom + 4f, playheadPaint)
    }

    private fun chooseTickStep(duration: Double): Double {
        val steps = doubleArrayOf(0.5, 1.0, 2.0, 5.0, 10.0, 15.0, 30.0, 60.0, 120.0, 300.0, 600.0)
        for (s in steps) {
            if (duration / s <= 8) return s
        }
        return 600.0
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val desiredHeight = 200
        val width = MeasureSpec.getSize(widthMeasureSpec)
        setMeasuredDimension(width, desiredHeight)
    }
}
