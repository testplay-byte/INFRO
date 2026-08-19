package com.liquidglass.demo.ui.components.background

import androidx.compose.animation.core.FastOutSlowInEasing
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
import com.liquidglass.demo.ui.theme.LiquidBlueBright
import com.liquidglass.demo.ui.theme.LiquidRedBright
import com.liquidglass.demo.ui.theme.LiquidYellowBright
import com.liquidglass.demo.ui.theme.LocalLiquidColors

/**
 * Animated Liquid Refraction Canvas.
 * Generates continuous organic floating glowing liquid metaballs in Blue, Yellow, and Red
 * that illuminate through frosted glass panels with dynamic light/dark mode adaptation.
 */
@Composable
fun AnimatedLiquidCanvas(
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val isDark = colors.isDarkMode

    val infiniteTransition = rememberInfiniteTransition(label = "liquid_blobs")

    // Orb 1: Electric Blue (Top Right / Center flow)
    val blueOrbX by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.45f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blue_x"
    )
    val blueOrbY by infiniteTransition.animateFloat(
        initialValue = 0.12f,
        targetValue = 0.40f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 10000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blue_y"
    )

    // Orb 2: Solar Yellow (Middle Left / Bottom Left flow)
    val yellowOrbX by infiniteTransition.animateFloat(
        initialValue = 0.10f,
        targetValue = 0.48f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 15000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yellow_x"
    )
    val yellowOrbY by infiniteTransition.animateFloat(
        initialValue = 0.40f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 11000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yellow_y"
    )

    // Orb 3: Crimson Red (Bottom Right / Center flow)
    val redOrbX by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 0.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 16000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "red_x"
    )
    val redOrbY by infiniteTransition.animateFloat(
        initialValue = 0.82f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 13000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "red_y"
    )

    // Dynamic Pulsing factor
    val pulseFactor by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.18f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 7000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        // Canvas base background gradient
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(colors.canvasBackground, colors.canvasMeshDarker)
            )
        )

        val alphaMultiplier = if (isDark) 0.38f else 0.28f

        // Blue Luminous Liquid Orb
        val blueCenter = Offset(width * blueOrbX, height * blueOrbY)
        val blueRadius = width * 0.60f * pulseFactor
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidBlueBright.copy(alpha = alphaMultiplier * 1.2f),
                    LiquidBlueBright.copy(alpha = alphaMultiplier * 0.4f),
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
        val yellowRadius = width * 0.55f * (2f - pulseFactor)
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidYellowBright.copy(alpha = alphaMultiplier * 1.1f),
                    LiquidYellowBright.copy(alpha = alphaMultiplier * 0.35f),
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
        val redRadius = width * 0.52f * pulseFactor
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    LiquidRedBright.copy(alpha = alphaMultiplier * 1.0f),
                    LiquidRedBright.copy(alpha = alphaMultiplier * 0.3f),
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
