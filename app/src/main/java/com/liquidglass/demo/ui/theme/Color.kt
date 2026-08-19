package com.liquidglass.demo.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Canvas Base Background (Soft off-white / light slate tinted, never harsh pure white)
val LiquidCanvasBackground = Color(0xFFF2F5F9)
val LiquidCanvasMeshDarker = Color(0xFFE5ECF4)
val LiquidCanvasCardBg = Color(0xFFFAFCFF)

// Frosted Glass Layer Tints
val GlassWhiteUltra = Color(0xFFFFFFFF).copy(alpha = 0.85f)
val GlassWhiteHigh = Color(0xFFFFFFFF).copy(alpha = 0.65f)
val GlassWhiteMedium = Color(0xFFFFFFFF).copy(alpha = 0.45f)
val GlassWhiteLow = Color(0xFFFFFFFF).copy(alpha = 0.25f)
val GlassWhiteSubtle = Color(0xFFFFFFFF).copy(alpha = 0.12f)

// Glass Border Highlights (Specular lighting reflection)
val SpecularHighlightTop = Color(0xFFFFFFFF).copy(alpha = 0.90f)
val SpecularHighlightMiddle = Color(0xFFFFFFFF).copy(alpha = 0.40f)
val SpecularHighlightBottom = Color(0xFFCBD5E1).copy(alpha = 0.35f)

// Glass Shadow & Ambient Tint
val GlassAmbientShadow = Color(0x1A0F172A)
val GlassDeepShadow = Color(0x2E0F172A)

// Vibrant Accent Colors
val LiquidBlue = Color(0xFF2563EB)
val LiquidBlueLight = Color(0xFF60A5FA)
val LiquidBlueGlow = Color(0x332563EB)

val LiquidYellow = Color(0xFFF59E0B)
val LiquidYellowLight = Color(0xFFFCD34D)
val LiquidYellowGlow = Color(0x33F59E0B)

val LiquidRed = Color(0xFFEF4444)
val LiquidRedLight = Color(0xFFF87171)
val LiquidRedGlow = Color(0x33EF4444)

// Text and Content Colors (Refined contrast on glass surfaces)
val LiquidTextPrimary = Color(0xFF0F172A)
val LiquidTextSecondary = Color(0xFF475569)
val LiquidTextTertiary = Color(0xFF94A3B8)
val LiquidTextOnAccent = Color(0xFFFFFFFF)

// Gradient Brushes
val GlassSurfaceBrush = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFFFFFFF).copy(alpha = 0.70f),
        Color(0xFFFFFFFF).copy(alpha = 0.35f),
        Color(0xFFF1F5F9).copy(alpha = 0.45f)
    )
)

val GlassCardHoverBrush = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFFFFFFF).copy(alpha = 0.85f),
        Color(0xFFFFFFFF).copy(alpha = 0.50f)
    )
)

val SpecularBorderBrush = Brush.linearGradient(
    colors = listOf(
        SpecularHighlightTop,
        SpecularHighlightMiddle,
        SpecularHighlightBottom
    )
)

val LiquidBlueBrush = Brush.linearGradient(
    colors = listOf(Color(0xFF3B82F6), Color(0xFF1D4ED8))
)

val LiquidYellowBrush = Brush.linearGradient(
    colors = listOf(Color(0xFFFBBF24), Color(0xFFD97706))
)

val LiquidRedBrush = Brush.linearGradient(
    colors = listOf(Color(0xFFF87171), Color(0xFFDC2626))
)

val LiquidTriColorBrush = Brush.horizontalGradient(
    colors = listOf(LiquidBlue, LiquidYellow, LiquidRed)
)
