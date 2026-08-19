package com.liquidglass.demo.ui.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

enum class AccentTheme(
    val label: String,
    val primary: Color,
    val bright: Color,
    val neon: Color,
    val glow: Color,
    val brush: Brush
) {
    BLUE("Liquid Blue", LiquidBlue, LiquidBlueBright, LiquidBlueNeon, LiquidBlueGlow, LiquidBlueBrush),
    YELLOW("Solar Gold", LiquidYellow, LiquidYellowBright, LiquidYellowNeon, LiquidYellowGlow, LiquidYellowBrush),
    RED("Crimson Flame", LiquidRed, LiquidRedBright, LiquidRedNeon, LiquidRedGlow, LiquidRedBrush)
}

@Immutable
data class LiquidColorScheme(
    val isDarkMode: Boolean,
    val canvasBackground: Color,
    val canvasMeshDarker: Color,
    val glassSurfaceBrush: Brush,
    val specularBorderBrush: Brush,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val activeAccent: AccentTheme
)

val LocalLiquidColors = compositionLocalOf {
    LiquidColorScheme(
        isDarkMode = false,
        canvasBackground = CanvasBgLight,
        canvasMeshDarker = CanvasMeshDarkerLight,
        glassSurfaceBrush = Brush.verticalGradient(listOf(GlassSurfaceTopLight, GlassSurfaceMidLight, GlassSurfaceBtmLight)),
        specularBorderBrush = Brush.linearGradient(listOf(SpecularEdgeTopLight, SpecularEdgeMidLight, SpecularEdgeBtmLight)),
        textPrimary = TextPrimaryLight,
        textSecondary = TextSecondaryLight,
        textTertiary = TextTertiaryLight,
        activeAccent = AccentTheme.BLUE
    )
}

val LocalLiquidTypography = compositionLocalOf { LiquidTypography }

class LiquidThemeController(
    initialDarkMode: Boolean = false,
    initialAccent: AccentTheme = AccentTheme.BLUE
) {
    var isDarkMode by mutableStateOf(initialDarkMode)
        private set

    var activeAccent by mutableStateOf(initialAccent)
        private set

    fun toggleDarkMode() {
        isDarkMode = !isDarkMode
    }

    fun applyDarkMode(dark: Boolean) {
        isDarkMode = dark
    }

    fun updateAccent(accent: AccentTheme) {
        activeAccent = accent
    }
}

val LocalLiquidThemeController = compositionLocalOf<LiquidThemeController> {
    error("No LiquidThemeController provided")
}

@Composable
fun LiquidGlassTheme(
    controller: LiquidThemeController = remember { LiquidThemeController(initialDarkMode = false) },
    content: @Composable () -> Unit
) {
    val isDark = controller.isDarkMode
    val accent = controller.activeAccent

    val animCanvasBg by animateColorAsState(
        targetValue = if (isDark) CanvasBgDark else CanvasBgLight,
        animationSpec = tween(400),
        label = "canvas_bg"
    )
    val animMeshDarker by animateColorAsState(
        targetValue = if (isDark) CanvasMeshDarkerDark else CanvasMeshDarkerLight,
        animationSpec = tween(400),
        label = "mesh_darker"
    )
    val animTextPrimary by animateColorAsState(
        targetValue = if (isDark) TextPrimaryDark else TextPrimaryLight,
        animationSpec = tween(350),
        label = "text_primary"
    )
    val animTextSecondary by animateColorAsState(
        targetValue = if (isDark) TextSecondaryDark else TextSecondaryLight,
        animationSpec = tween(350),
        label = "text_sec"
    )
    val animTextTertiary by animateColorAsState(
        targetValue = if (isDark) TextTertiaryDark else TextTertiaryLight,
        animationSpec = tween(350),
        label = "text_tert"
    )

    val surfaceBrush = remember(isDark) {
        if (isDark) {
            Brush.verticalGradient(
                colors = listOf(
                    GlassSurfaceTopDark,
                    GlassSurfaceMidDark,
                    GlassSurfaceBtmDark
                )
            )
        } else {
            Brush.verticalGradient(
                colors = listOf(
                    GlassSurfaceTopLight,
                    GlassSurfaceMidLight,
                    GlassSurfaceBtmLight
                )
            )
        }
    }

    val borderBrush = remember(isDark) {
        if (isDark) {
            Brush.linearGradient(
                colors = listOf(
                    SpecularEdgeTopDark,
                    SpecularEdgeMidDark,
                    SpecularEdgeBtmDark
                ),
                start = Offset(0f, 0f),
                end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY)
            )
        } else {
            Brush.linearGradient(
                colors = listOf(
                    SpecularEdgeTopLight,
                    SpecularEdgeMidLight,
                    SpecularEdgeBtmLight
                ),
                start = Offset(0f, 0f),
                end = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY)
            )
        }
    }

    val colorScheme = LiquidColorScheme(
        isDarkMode = isDark,
        canvasBackground = animCanvasBg,
        canvasMeshDarker = animMeshDarker,
        glassSurfaceBrush = surfaceBrush,
        specularBorderBrush = borderBrush,
        textPrimary = animTextPrimary,
        textSecondary = animTextSecondary,
        textTertiary = animTextTertiary,
        activeAccent = accent
    )

    CompositionLocalProvider(
        LocalLiquidColors provides colorScheme,
        LocalLiquidTypography provides LiquidTypography,
        LocalLiquidThemeController provides controller,
        content = content
    )
}
