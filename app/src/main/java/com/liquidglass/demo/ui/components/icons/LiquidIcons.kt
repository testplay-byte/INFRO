package com.liquidglass.demo.ui.components.icons

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Custom 3-Line Hamburger Menu Icon with rounded ends and glass styling
 */
@Composable
fun LiquidMenuIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A),
    strokeWidth: Dp = 2.dp
) {
    Canvas(modifier = modifier.size(20.dp)) {
        val strokePx = strokeWidth.toPx()
        val width = size.width
        val height = size.height
        val lineSpacing = height / 3f

        // Top line
        drawLine(
            color = color,
            start = Offset(0f, lineSpacing * 0.5f),
            end = Offset(width * 0.85f, lineSpacing * 0.5f),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
        // Middle line (full length)
        drawLine(
            color = color,
            start = Offset(0f, lineSpacing * 1.5f),
            end = Offset(width, lineSpacing * 1.5f),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
        // Bottom line
        drawLine(
            color = color,
            start = Offset(0f, lineSpacing * 2.5f),
            end = Offset(width * 0.65f, lineSpacing * 2.5f),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Plus / Add Icon
 */
@Composable
fun LiquidPlusIcon(
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    strokeWidth: Dp = 2.5.dp
) {
    Canvas(modifier = modifier.size(20.dp)) {
        val strokePx = strokeWidth.toPx()
        val cx = size.width / 2f
        val cy = size.height / 2f
        val padding = size.width * 0.2f

        drawLine(
            color = color,
            start = Offset(cx, padding),
            end = Offset(cx, size.height - padding),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
        drawLine(
            color = color,
            start = Offset(padding, cy),
            end = Offset(size.width - padding, cy),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Projects / Folder Icon
 */
@Composable
fun LiquidFolderIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A),
    isFilled: Boolean = false
) {
    Canvas(modifier = modifier.size(22.dp)) {
        val w = size.width
        val h = size.height
        val path = Path().apply {
            moveTo(w * 0.1f, h * 0.25f)
            lineTo(w * 0.4f, h * 0.25f)
            lineTo(w * 0.5f, h * 0.38f)
            lineTo(w * 0.9f, h * 0.38f)
            lineTo(w * 0.9f, h * 0.85f)
            lineTo(w * 0.1f, h * 0.85f)
            close()
        }
        if (isFilled) {
            drawPath(path, color = color.copy(alpha = 0.25f), style = Fill)
        }
        drawPath(path, color = color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
    }
}

/**
 * Analytics / Chart Pulse Icon
 */
@Composable
fun LiquidAnalyticsIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A),
    isFilled: Boolean = false
) {
    Canvas(modifier = modifier.size(22.dp)) {
        val w = size.width
        val h = size.height
        val stroke = 2.dp.toPx()

        // 3 Vertical Bars
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.15f, h * 0.55f),
            size = Size(w * 0.18f, h * 0.35f),
            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
            style = if (isFilled) Fill else Stroke(stroke)
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.41f, h * 0.25f),
            size = Size(w * 0.18f, h * 0.65f),
            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
            style = Fill
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.67f, h * 0.40f),
            size = Size(w * 0.18f, h * 0.50f),
            cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
            style = if (isFilled) Fill else Stroke(stroke)
        )
    }
}

/**
 * Workspace / Canvas Grid Icon
 */
@Composable
fun LiquidWorkspaceIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A),
    isFilled: Boolean = false
) {
    Canvas(modifier = modifier.size(22.dp)) {
        val w = size.width
        val h = size.height
        val stroke = 1.8.dp.toPx()
        val corner = 4.dp.toPx()
        val cellSize = w * 0.36f

        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.1f, h * 0.1f),
            size = Size(cellSize, cellSize),
            cornerRadius = CornerRadius(corner, corner),
            style = if (isFilled) Fill else Stroke(stroke)
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.54f, h * 0.1f),
            size = Size(cellSize, cellSize),
            cornerRadius = CornerRadius(corner, corner),
            style = Stroke(stroke)
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.1f, h * 0.54f),
            size = Size(cellSize, cellSize),
            cornerRadius = CornerRadius(corner, corner),
            style = Stroke(stroke)
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(w * 0.54f, h * 0.54f),
            size = Size(cellSize, cellSize),
            cornerRadius = CornerRadius(corner, corner),
            style = if (isFilled) Fill else Stroke(stroke)
        )
    }
}

/**
 * Star / Favorite Icon
 */
@Composable
fun LiquidStarIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFFF59E0B),
    isFilled: Boolean = true
) {
    Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width
        val h = size.height
        val path = Path().apply {
            moveTo(w * 0.5f, h * 0.05f)
            lineTo(w * 0.63f, h * 0.35f)
            lineTo(w * 0.95f, h * 0.38f)
            lineTo(w * 0.71f, h * 0.60f)
            lineTo(w * 0.78f, h * 0.92f)
            lineTo(w * 0.50f, h * 0.75f)
            lineTo(w * 0.22f, h * 0.92f)
            lineTo(w * 0.29f, h * 0.60f)
            lineTo(w * 0.05f, h * 0.38f)
            lineTo(w * 0.37f, h * 0.35f)
            close()
        }
        if (isFilled) {
            drawPath(path, color = color, style = Fill)
        }
        drawPath(path, color = color, style = Stroke(width = 1.5.dp.toPx(), cap = StrokeCap.Round))
    }
}

/**
 * Search Icon
 */
@Composable
fun LiquidSearchIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF64748B)
) {
    Canvas(modifier = modifier.size(18.dp)) {
        val stroke = 2.dp.toPx()
        val radius = size.width * 0.35f
        val center = Offset(size.width * 0.42f, size.height * 0.42f)

        drawCircle(
            color = color,
            radius = radius,
            center = center,
            style = Stroke(stroke)
        )
        drawLine(
            color = color,
            start = Offset(center.x + radius * 0.7f, center.y + radius * 0.7f),
            end = Offset(size.width * 0.92f, size.height * 0.92f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Notification Bell Icon
 */
@Composable
fun LiquidBellIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A)
) {
    Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width
        val h = size.height
        val stroke = 2.dp.toPx()

        val bellPath = Path().apply {
            moveTo(w * 0.5f, h * 0.15f)
            cubicTo(w * 0.3f, h * 0.15f, w * 0.25f, h * 0.55f, w * 0.18f, h * 0.75f)
            lineTo(w * 0.82f, h * 0.75f)
            cubicTo(w * 0.75f, h * 0.55f, w * 0.7f, h * 0.15f, w * 0.5f, h * 0.15f)
        }
        drawPath(bellPath, color = color, style = Stroke(stroke, cap = StrokeCap.Round))
        drawCircle(
            color = color,
            radius = 2.dp.toPx(),
            center = Offset(w * 0.5f, h * 0.88f)
        )
    }
}

/**
 * Checkmark Icon
 */
@Composable
fun LiquidCheckIcon(
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    strokeWidth: Dp = 2.dp
) {
    Canvas(modifier = modifier.size(16.dp)) {
        val strokePx = strokeWidth.toPx()
        val path = Path().apply {
            moveTo(size.width * 0.2f, size.height * 0.5f)
            lineTo(size.width * 0.45f, size.height * 0.75f)
            lineTo(size.width * 0.85f, size.height * 0.25f)
        }
        drawPath(path, color = color, style = Stroke(strokePx, cap = StrokeCap.Round))
    }
}

/**
 * Close / Dismiss Icon
 */
@Composable
fun LiquidCloseIcon(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFF0F172A),
    strokeWidth: Dp = 2.dp
) {
    Canvas(modifier = modifier.size(18.dp)) {
        val strokePx = strokeWidth.toPx()
        val pad = size.width * 0.2f
        drawLine(
            color = color,
            start = Offset(pad, pad),
            end = Offset(size.width - pad, size.height - pad),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
        drawLine(
            color = color,
            start = Offset(size.width - pad, pad),
            end = Offset(pad, size.height - pad),
            strokeWidth = strokePx,
            cap = StrokeCap.Round
        )
    }
}
