package com.liquidglass.demo.ui.core

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.liquidglass.demo.ui.theme.CausticGlareColor
import com.liquidglass.demo.ui.theme.LocalLiquidColors

/**
 * Optical Liquid Glass Modifier.
 * Produces authentic glass refraction, specular highlight strokes,
 * inner caustic light bending, and an optional subtle animated light sheen.
 */
fun Modifier.liquidGlass(
    shape: Shape = RoundedCornerShape(24.dp),
    backgroundColor: Color? = null,
    backgroundBrush: Brush? = null,
    borderBrush: Brush? = null,
    borderWidth: Dp = 1.2.dp,
    elevation: Dp = 6.dp,
    enableShimmer: Boolean = false,
    innerHighlight: Boolean = true
): Modifier = composed {
    val colors = LocalLiquidColors.current
    val isDark = colors.isDarkMode

    val defaultBgBrush = backgroundBrush ?: colors.glassSurfaceBrush
    val defaultBorderBrush = borderBrush ?: colors.specularBorderBrush

    val shadowColor = if (isDark) Color(0x66000000) else Color(0x180F172A)

    val shimmerModifier = if (enableShimmer) {
        val infiniteTransition = rememberInfiniteTransition(label = "glass_shimmer")
        val shimmerProgress by infiniteTransition.animateFloat(
            initialValue = -0.5f,
            targetValue = 1.5f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = 6000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "shimmer_pos"
        )
        Modifier.drawBehind {
            val width = size.width
            val height = size.height
            val shimmerX = width * shimmerProgress

            val sheenBrush = Brush.linearGradient(
                colors = listOf(
                    Color.Transparent,
                    (if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.20f)),
                    Color.Transparent
                ),
                start = Offset(shimmerX - width * 0.3f, 0f),
                end = Offset(shimmerX + width * 0.3f, height)
            )
            drawRect(brush = sheenBrush)
        }
    } else Modifier

    this
        .shadow(
            elevation = elevation,
            shape = shape,
            ambientColor = shadowColor,
            spotColor = shadowColor
        )
        .clip(shape)
        .then(
            if (backgroundColor != null) {
                Modifier.background(backgroundColor, shape)
            } else {
                Modifier.background(defaultBgBrush, shape)
            }
        )
        .then(shimmerModifier)
        .border(
            width = borderWidth,
            brush = defaultBorderBrush,
            shape = shape
        )
        .then(
            if (innerHighlight) {
                Modifier.drawBehind {
                    // Top-edge caustic refraction glare line (curved glass highlight)
                    val strokeW = 1.5f
                    val glareColor = if (isDark) Color.White.copy(alpha = 0.30f) else Color.White.copy(alpha = 0.65f)
                    drawLine(
                        color = glareColor,
                        start = Offset(20f, strokeW),
                        end = Offset(size.width - 20f, strokeW),
                        strokeWidth = strokeW
                    )
                }
            } else {
                Modifier
            }
        )
}

/**
 * Lightweight liquid glass pill modifier for chips, badges, and segmented toggles.
 */
fun Modifier.liquidGlassPill(
    shape: Shape = RoundedCornerShape(50),
    tint: Color = Color.White.copy(alpha = 0.40f),
    borderColor: Color = Color.White.copy(alpha = 0.70f),
    borderWidth: Dp = 1.dp
): Modifier {
    return this
        .clip(shape)
        .background(tint, shape)
        .border(
            width = borderWidth,
            brush = Brush.linearGradient(
                colors = listOf(borderColor, borderColor.copy(alpha = 0.20f))
            ),
            shape = shape
        )
}
