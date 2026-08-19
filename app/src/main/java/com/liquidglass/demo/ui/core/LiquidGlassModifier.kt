package com.liquidglass.demo.ui.core

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.liquidglass.demo.ui.theme.GlassSurfaceBrush
import com.liquidglass.demo.ui.theme.GlassWhiteHigh
import com.liquidglass.demo.ui.theme.GlassWhiteMedium
import com.liquidglass.demo.ui.theme.GlassWhiteSubtle
import com.liquidglass.demo.ui.theme.SpecularHighlightBottom
import com.liquidglass.demo.ui.theme.SpecularHighlightMiddle
import com.liquidglass.demo.ui.theme.SpecularHighlightTop

/**
 * Custom Liquid Glass surface modifier.
 * Creates a frosted glass effect with specular lighting borders,
 * soft translucent gradients, and custom edge reflections without using standard Material surfaces.
 */
fun Modifier.liquidGlass(
    shape: Shape = RoundedCornerShape(24.dp),
    backgroundColor: Color? = null,
    backgroundBrush: Brush? = null,
    borderBrush: Brush? = null,
    borderWidth: Dp = 1.dp,
    elevation: Dp = 4.dp,
    shadowColor: Color = Color(0x1A0F172A),
    innerHighlight: Boolean = true
): Modifier {
    val defaultBgBrush = backgroundBrush ?: GlassSurfaceBrush
    val defaultBorderBrush = borderBrush ?: Brush.linearGradient(
        colors = listOf(
            SpecularHighlightTop,
            SpecularHighlightMiddle,
            SpecularHighlightBottom
        ),
        start = Offset(0f, 0f),
        end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY)
    )

    return this
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
        .border(
            width = borderWidth,
            brush = defaultBorderBrush,
            shape = shape
        )
        .then(
            if (innerHighlight) {
                Modifier.drawBehind {
                    // Draw a subtle top-edge inner specular glare line
                    val strokeW = 1.5f
                    drawLine(
                        color = Color.White.copy(alpha = 0.6f),
                        start = Offset(24f, strokeW),
                        end = Offset(size.width - 24f, strokeW),
                        strokeWidth = strokeW
                    )
                }
            } else {
                Modifier
            }
        )
}

/**
 * Lightweight liquid glass modifier for small chips, pills, and badges.
 */
fun Modifier.liquidGlassPill(
    shape: Shape = RoundedCornerShape(50),
    tint: Color = Color.White.copy(alpha = 0.55f),
    borderColor: Color = Color.White.copy(alpha = 0.8f),
    borderWidth: Dp = 1.dp
): Modifier {
    return this
        .clip(shape)
        .background(tint, shape)
        .border(
            width = borderWidth,
            brush = Brush.linearGradient(
                colors = listOf(borderColor, borderColor.copy(alpha = 0.25f))
            ),
            shape = shape
        )
}
