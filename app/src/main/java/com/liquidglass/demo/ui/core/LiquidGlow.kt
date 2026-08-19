package com.liquidglass.demo.ui.core

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Draws a soft liquid glow / colored aura around a composable.
 */
fun Modifier.liquidGlow(
    color: Color,
    radius: Dp = 16.dp,
    alpha: Float = 0.35f,
    offsetY: Dp = 4.dp
): Modifier = this.drawBehind {
    val transparentColor = color.copy(alpha = 0f).toArgb()
    val shadowColor = color.copy(alpha = alpha).toArgb()

    drawIntoCanvas { canvas ->
        val paint = Paint()
        val frameworkPaint = paint.asFrameworkPaint()
        frameworkPaint.color = shadowColor
        frameworkPaint.setShadowLayer(
            radius.toPx(),
            0f,
            offsetY.toPx(),
            shadowColor
        )
        canvas.drawRoundRect(
            left = 0f,
            top = 0f,
            right = size.width,
            bottom = size.height,
            radiusX = 24.dp.toPx(),
            radiusY = 24.dp.toPx(),
            paint = paint
        )
    }
}
