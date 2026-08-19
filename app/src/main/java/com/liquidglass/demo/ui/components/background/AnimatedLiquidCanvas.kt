package com.liquidglass.demo.ui.components.background

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidCanvasBackground
import com.liquidglass.demo.ui.theme.LiquidCanvasMeshDarker
import com.liquidglass.demo.ui.theme.LiquidRed
import com.liquidglass.demo.ui.theme.LiquidYellow

/**
 * Animated liquid mesh background.
 * Draws subtle organic floating luminous orbs in Blue, Yellow, and Red
 * that move gently underneath glass components, creating refraction and depth.
 */
@Composable
fun AnimatedLiquidCanvas(
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "liquid_blobs")

    // Orb 1: Blue - Top Right to Center floating motion
    val blueOrbX by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 14000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blue_x"
    )
    val blueOrbY by infiniteTransition.animateFloat(
        initialValue = 0.15f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 11000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blue_y"
    )

    // Orb 2: Yellow - Middle Left to Bottom Left floating motion
    val yellowOrbX by infiniteTransition.animateFloat(
        initialValue = 0.12f,
        targetValue = 0.38f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 16000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yellow_x"
    )
    val yellowOrbY by infiniteTransition.animateFloat(
        initialValue = 0.45f,
        targetValue = 0.70f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 13000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yellow_y"
    )

    // Orb 3: Red/Coral - Bottom Right to Center floating motion
    val redOrbX by infiniteTransition.animateFloat(
        initialValue = 0.80f,
        targetValue = 0.50f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 18000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "red_x"
    )
    val redOrbY by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.60f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 15000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "red_y"
    )

    // Pulse radius factor
    val pulseFactor by infiniteTransition.animateFloat(
        initialValue = 0.90f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 8000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // Base soft gradient canvas
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(LiquidCanvasBackground, LiquidCanvasMeshDarker)
            )
        )

        // Blue Luminous Liquid Orb
        val blueCenter = Offset(width * blueOrbX, height * blueOrbY)
        val blueRadius = width * 0.55f * pulseFactor
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidBlue.copy(alpha = 0.22f),
                    LiquidBlue.copy(alpha = 0.08f),
                    Color.Transparent
                ),
                center = blueCenter,
                radius = blueRadius
            ),
            center = blueCenter,
            radius = blueRadius
        )

        // Yellow Radiant Liquid Orb
        val yellowCenter = Offset(width * yellowOrbX, height * yellowOrbY)
        val yellowRadius = width * 0.50f * (2f - pulseFactor)
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidYellow.copy(alpha = 0.20f),
                    LiquidYellow.copy(alpha = 0.07f),
                    Color.Transparent
                ),
                center = yellowCenter,
                radius = yellowRadius
            ),
            center = yellowCenter,
            radius = yellowRadius
        )

        // Red Radiant Liquid Orb
        val redCenter = Offset(width * redOrbX, height * redOrbY)
        val redRadius = width * 0.48f * pulseFactor
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidRed.copy(alpha = 0.18f),
                    LiquidRed.copy(alpha = 0.06f),
                    Color.Transparent
                ),
                center = redCenter,
                radius = redRadius
            ),
            center = redCenter,
            radius = redRadius
        )
    }
}
