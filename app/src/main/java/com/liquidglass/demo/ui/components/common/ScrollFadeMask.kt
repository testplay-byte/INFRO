package com.liquidglass.demo.ui.components.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.liquidglass.demo.ui.theme.LocalLiquidColors

/**
 * Top and Bottom Gradient Fade Scrims.
 * Smoothly blends scrolling list items into a frosted haze under the top header
 * and floating navigation bar, eliminating abrupt clipping.
 */
@Composable
fun TopScrollFadeMask(
    height: Dp = 28.dp,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        colors.canvasBackground.copy(alpha = 0.85f),
                        colors.canvasBackground.copy(alpha = 0.35f),
                        Color.Transparent
                    )
                )
            )
    )
}

@Composable
fun BottomScrollFadeMask(
    height: Dp = 80.dp,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        colors.canvasBackground.copy(alpha = 0.50f),
                        colors.canvasBackground.copy(alpha = 0.92f)
                    )
                )
            )
    )
}
