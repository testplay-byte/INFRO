package com.liquidglass.demo.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ==========================================
// CANVASES & BACKGROUNDS (Light & Dark)
// ==========================================
val CanvasBgLight = Color(0xFFF1F5F9)
val CanvasMeshDarkerLight = Color(0xFFE2E8F0)
val CanvasCardBgLight = Color(0xFFFAFCFF)

val CanvasBgDark = Color(0xFF070B12)
val CanvasMeshDarkerDark = Color(0xFF0F172A)
val CanvasCardBgDark = Color(0xFF111827)

// ==========================================
// OPTICAL GLASS SURFACES - LIGHT MODE
// ==========================================
val GlassSurfaceTopLight = Color(0xFFFFFFFF).copy(alpha = 0.82f)
val GlassSurfaceMidLight = Color(0xFFFFFFFF).copy(alpha = 0.45f)
val GlassSurfaceBtmLight = Color(0xFFF1F5F9).copy(alpha = 0.65f)

// Specular Highlights (Top-Left Light Source)
val SpecularEdgeTopLight = Color(0xFFFFFFFF).copy(alpha = 0.95f)
val SpecularEdgeMidLight = Color(0xFFFFFFFF).copy(alpha = 0.50f)
val SpecularEdgeBtmLight = Color(0xFFCBD5E1).copy(alpha = 0.40f)

// ==========================================
// OPTICAL GLASS SURFACES - DARK MODE (Obsidian Crystal)
// ==========================================
val GlassSurfaceTopDark = Color(0xFF1E293B).copy(alpha = 0.70f)
val GlassSurfaceMidDark = Color(0xFF0F172A).copy(alpha = 0.55f)
val GlassSurfaceBtmDark = Color(0xFF0B0F17).copy(alpha = 0.75f)

// Specular Highlights - Dark Mode (Crisp Luminous Edge)
val SpecularEdgeTopDark = Color(0xFFFFFFFF).copy(alpha = 0.45f)
val SpecularEdgeMidDark = Color(0xFF94A3B8).copy(alpha = 0.20f)
val SpecularEdgeBtmDark = Color(0xFF1E293B).copy(alpha = 0.30f)

// Refraction Caustic Glare
val CausticGlareColor = Color(0xFFFFFFFF).copy(alpha = 0.50f)

// ==========================================
// VIBRANT ACCENT COLORS (Blue, Yellow, Red)
// ==========================================
val LiquidBlue = Color(0xFF2563EB)
val LiquidBlueBright = Color(0xFF3B82F6)
val LiquidBlueNeon = Color(0xFF60A5FA)
val LiquidBlueGlow = Color(0x553B82F6)

val LiquidYellow = Color(0xFFD97706)
val LiquidYellowBright = Color(0xFFF59E0B)
val LiquidYellowNeon = Color(0xFFFBBF24)
val LiquidYellowGlow = Color(0x55F59E0B)

val LiquidRed = Color(0xFFDC2626)
val LiquidRedBright = Color(0xFFEF4444)
val LiquidRedNeon = Color(0xFFF87171)
val LiquidRedGlow = Color(0x55EF4444)

// ==========================================
// TEXT CONTRAST TOKENS
// ==========================================
val TextPrimaryLight = Color(0xFF0A0F1D)
val TextSecondaryLight = Color(0xFF334155)
val TextTertiaryLight = Color(0xFF64748B)

val TextPrimaryDark = Color(0xFFF8FAFC)
val TextSecondaryDark = Color(0xFFCBD5E1)
val TextTertiaryDark = Color(0xFF94A3B8)

// ==========================================
// GRADIENT BRUSHES
// ==========================================
val LiquidBlueBrush = Brush.linearGradient(
    colors = listOf(LiquidBlueBright, Color(0xFF1D4ED8))
)

val LiquidYellowBrush = Brush.linearGradient(
    colors = listOf(LiquidYellowNeon, LiquidYellow)
)

val LiquidRedBrush = Brush.linearGradient(
    colors = listOf(LiquidRedNeon, Color(0xFFB91C1C))
)

val LiquidTriColorBrush = Brush.horizontalGradient(
    colors = listOf(LiquidBlueBright, LiquidYellowBright, LiquidRedBright)
)
