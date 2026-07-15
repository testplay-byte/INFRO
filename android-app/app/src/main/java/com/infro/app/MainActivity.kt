package com.infro.app

import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Home screen — minimal, centered layout with animated geometric shapes.
 * Matches the web prototype exactly.
 */
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Animated shapes background
        val shapesContainer = findViewById<LinearLayout>(R.id.shapesContainer)
        val shapesView = GeometricShapesView(this)
        shapesContainer.addView(shapesView, 0, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT
        ))

        // Button click handlers with fade animation
        val btnCompare = findViewById<LinearLayout>(R.id.cardCompare)
        val btnDetect = findViewById<LinearLayout>(R.id.cardDetect)

        btnCompare.setOnClickListener {
            animateCardClick(it) {
                startActivity(Intent(this, CompareActivity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            }
        }

        btnDetect.setOnClickListener {
            animateCardClick(it) {
                startActivity(Intent(this, DetectActivity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            }
        }

        // Staggered entrance animation
        lifecycleScope.launch {
            val logo = findViewById<LinearLayout>(R.id.logoContainer)
            val title = findViewById<TextView>(R.id.tvTitle)
            val subtitle = findViewById<TextView>(R.id.tvSubtitle)

            logo.alpha = 0f
            title.alpha = 0f
            subtitle.alpha = 0f
            btnCompare.alpha = 0f
            btnDetect.alpha = 0f

            delay(100)
            animateIn(logo, 400)
            delay(150)
            animateIn(title, 400)
            delay(100)
            animateIn(subtitle, 400)
            delay(150)
            animateIn(btnCompare, 300)
            delay(100)
            animateIn(btnDetect, 300)
        }
    }

    private fun animateIn(view: View, duration: Long) {
        view.alpha = 0f
        view.translationY = 30f
        view.animate()
            .alpha(1f)
            .translationY(0f)
            .setDuration(duration)
            .start()
    }

    private fun animateCardClick(view: View, onComplete: () -> Unit) {
        view.animate()
            .scaleX(0.97f)
            .scaleY(0.97f)
            .setDuration(100)
            .withEndAction {
                view.animate()
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(100)
                    .withEndAction { onComplete() }
                    .start()
            }
            .start()
    }
}

/**
 * Custom view that renders animated geometric shapes — triangles, rectangles,
 * pentagons, hexagons, diamonds, circles, plus signs, dots — scattered across
 * the screen with rotation, bounce, and pulse animations.
 */
class GeometricShapesView(context: android.content.Context) : View(context) {

    data class Shape(
        val type: Int, // 0=triangle, 1=rect, 2=pentagon, 3=hexagon, 4=diamond, 5=circle, 6=plus, 7=ring, 8=square
        val x: Float, val y: Float,
        val size: Float,
        val color: Int,
        val strokeWidth: Float,
        val fillAlpha: Int,
        val animType: Int, // 0=spin, 1=bounce, 2=pulse, 3=drift
        val animDuration: Float, // seconds
        val animDelay: Float,
        val rotationOffset: Float = 0f
    )

    private val shapes = listOf(
        // Triangle — spinning, top right
        Shape(0, 0.82f, 0.12f, 40f, 0xFFB45309.toInt(), 1.5f, 31, 0, 20f, 0f),
        // Rectangle — bouncing, left
        Shape(1, 0.12f, 0.16f, 34f, 0xFF4D7C0F.toInt(), 1.5f, 31, 1, 4f, 0f, -8f),
        // Pentagon — spinning, left-center
        Shape(2, 0.25f, 0.10f, 36f, 0xFFC2410C.toInt(), 1.5f, 31, 0, 25f, 0f, -1f),
        // Hexagon — bouncing, right
        Shape(3, 0.88f, 0.22f, 32f, 0xFFB45309.toInt(), 1.5f, 26, 1, 5f, 0.5f, 15f),
        // Circle — pulsing, left
        Shape(5, 0.35f, 0.15f, 16f, 0xFF4D7C0F.toInt(), 0f, 102, 2, 3f, 0f),
        // Circle — pulsing, right
        Shape(5, 0.72f, 0.20f, 14f, 0xFFB45309.toInt(), 0f, 102, 2, 4f, 1f),
        // Diamond — spinning, lower left
        Shape(4, 0.10f, 0.28f, 30f, 0xFFC2410C.toInt(), 1.5f, 26, 0, 18f, 0f),
        // Small triangle — bouncing, lower right
        Shape(0, 0.80f, 0.30f, 26f, 0xFF4D7C0F.toInt(), 1.5f, 38, 1, 3.5f, 0.8f),
        // Plus — pulsing, center
        Shape(6, 0.50f, 0.24f, 18f, 0xFF4D7C0F.toInt(), 2f, 102, 2, 4f, 0f),
        // Square — drifting, center-left
        Shape(8, 0.22f, 0.27f, 12f, 0xFFC2410C.toInt(), 0f, 77, 3, 4.5f, 1.5f, 12f),
        // Ring — floating, center-right
        Shape(7, 0.72f, 0.26f, 12f, 0xFF4D7C0F.toInt(), 1.5f, 102, 3, 5.5f, 2.5f),
        // Cross — rotating, bottom right
        Shape(6, 0.82f, 0.55f, 18f, 0xFFB45309.toInt(), 1.5f, 77, 0, 8f, 0f),
        // Small diamond — drifting, center-right
        Shape(4, 0.62f, 0.30f, 16f, 0xFFC2410C.toInt(), 1.5f, 38, 3, 4.2f, 1.2f),
        // Outline triangle — drifting, center-left
        Shape(0, 0.35f, 0.20f, 20f, 0xFF4D7C0F.toInt(), 1.5f, 0, 3, 5f, 2.2f),
        // Small square — drifting, center
        Shape(8, 0.45f, 0.22f, 10f, 0xFFB45309.toInt(), 0f, 77, 3, 5f, 0.7f, 45f),
        // Tiny circle — pulsing
        Shape(5, 0.55f, 0.20f, 6f, 0xFFB45309.toInt(), 0f, 128, 2, 3f, 0.3f),
        // Tiny circle — pulsing
        Shape(5, 0.30f, 0.58f, 8f, 0xFF4D7C0F.toInt(), 0f, 102, 2, 4f, 1.8f),
    )

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val startTime = System.currentTimeMillis()

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val elapsed = (System.currentTimeMillis() - startTime) / 1000f

        // Background blobs (gradient circles)
        paint.style = Paint.Style.FILL
        paint.color = Color.argb(20, 180, 83, 9)
        canvas.drawCircle(w * 1.1f, h * 0.02f, w * 0.4f, paint)
        paint.color = Color.argb(20, 77, 124, 15)
        canvas.drawCircle(w * -0.1f, h * 0.08f, w * 0.35f, paint)

        for (shape in shapes) {
            val t = (elapsed + shape.animDelay) % shape.animDuration
            val progress = t / shape.animDuration
            val cycleProgress = if (progress < 0.5f) progress * 2 else (1 - progress) * 2

            val cx = shape.x * w
            val cy = shape.y * h

            canvas.save()

            when (shape.animType) {
                0 -> { // spin
                    val angle = (elapsed / shape.animDuration) * 360f * if (shape.animDuration < 0) -1f else 1f
                    canvas.rotate(angle + shape.rotationOffset, cx, cy)
                }
                1 -> { // bounce
                    val bounceOffset = cycleProgress * 12f * (if (shape.animDuration < 10) 1 else -1)
                    canvas.translate(0f, -bounceOffset)
                    canvas.rotate(shape.rotationOffset + cycleProgress * 8f, cx, cy)
                }
                2 -> { // pulse
                    val scale = 1f + cycleProgress * 0.4f
                    canvas.scale(scale, scale, cx, cy)
                }
                3 -> { // drift
                    val driftY = cycleProgress * 8f * (if (shape.animDuration < 5) 1 else -1)
                    canvas.translate(0f, -driftY)
                    if (shape.rotationOffset != 0f) {
                        canvas.rotate(shape.rotationOffset + cycleProgress * 15f, cx, cy)
                    }
                }
            }

            drawShape(canvas, shape, cx, cy)

            canvas.restore()
        }

        // Dotted lines
        paint.color = Color.argb(100, 180, 83, 9)
        val dotAlpha = (60 + cycleProgressForTime(elapsed, 5f, 2f) * 60).toInt()
        paint.alpha = dotAlpha
        for (i in 0..4) {
            canvas.drawCircle(40f + i * 8f, 50f, 2f, paint)
        }
        paint.color = Color.argb(100, 77, 124, 15)
        paint.alpha = (60 + cycleProgressForTime(elapsed, 5f, 3f) * 60).toInt()
        for (i in 0..3) {
            canvas.drawCircle(w - 40f - i * 8f, 50f, 2f, paint)
        }

        invalidate()
    }

    private fun cycleProgressForTime(elapsed: Float, duration: Float, delay: Float): Float {
        val t = (elapsed + delay) % duration
        val p = t / duration
        return if (p < 0.5f) p * 2 else (1 - p) * 2
    }

    private fun drawShape(canvas: Canvas, shape: Shape, cx: Float, cy: Float) {
        val s = shape.size / 2
        paint.color = shape.color
        paint.strokeWidth = shape.strokeWidth
        paint.style = if (shape.fillAlpha > 0) Paint.Style.FILL_AND_STROKE else Paint.Style.STROKE
        paint.alpha = if (shape.fillAlpha > 0) shape.fillAlpha + 128 else 128

        val path = Path()
        when (shape.type) {
            0 -> { // triangle
                path.moveTo(cx, cy - s)
                path.lineTo(cx + s, cy + s)
                path.lineTo(cx - s, cy + s)
                path.close()
            }
            1 -> { // rectangle (rounded)
                val r = s * 0.3f
                path.addRoundRect(cx - s, cy - s, cx + s, cy + s, r, r, Path.Direction.CW)
            }
            2 -> { // pentagon
                for (i in 0..4) {
                    val angle = Math.toRadians((-90 + i * 72).toDouble())
                    val x = cx + (s * Math.cos(angle)).toFloat()
                    val y = cy + (s * Math.sin(angle)).toFloat()
                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                path.close()
            }
            3 -> { // hexagon
                for (i in 0..5) {
                    val angle = Math.toRadians((i * 60).toDouble())
                    val x = cx + (s * Math.cos(angle)).toFloat()
                    val y = cy + (s * Math.sin(angle)).toFloat()
                    if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                path.close()
            }
            4 -> { // diamond
                path.moveTo(cx, cy - s)
                path.lineTo(cx + s, cy)
                path.lineTo(cx, cy + s)
                path.lineTo(cx - s, cy)
                path.close()
            }
            5 -> { // circle
                if (shape.fillAlpha > 0) {
                    paint.style = Paint.Style.FILL
                    paint.alpha = shape.fillAlpha + 128
                    canvas.drawCircle(cx, cy, s, paint)
                } else {
                    paint.style = Paint.Style.STROKE
                    canvas.drawCircle(cx, cy, s, paint)
                }
                return
            }
            6 -> { // plus/cross
                paint.style = Paint.Style.STROKE
                canvas.drawLine(cx, cy - s, cx, cy + s, paint)
                canvas.drawLine(cx - s, cy, cx + s, cy, paint)
                return
            }
            7 -> { // ring (outline circle)
                paint.style = Paint.Style.STROKE
                canvas.drawCircle(cx, cy, s, paint)
                return
            }
            8 -> { // square (small, rotated)
                paint.style = Paint.Style.FILL
                paint.alpha = shape.fillAlpha + 128
                canvas.rotate(shape.rotationOffset, cx, cy)
                canvas.drawRoundRect(cx - s, cy - s, cx + s, cy + s, 2f, 2f, paint)
                return
            }
        }

        if (shape.fillAlpha > 0) {
            paint.style = Paint.Style.FILL
            paint.alpha = shape.fillAlpha + 128
            canvas.drawPath(path, paint)
        }
        if (shape.strokeWidth > 0) {
            paint.style = Paint.Style.STROKE
            paint.alpha = 128
            canvas.drawPath(path, paint)
        }
    }
}
