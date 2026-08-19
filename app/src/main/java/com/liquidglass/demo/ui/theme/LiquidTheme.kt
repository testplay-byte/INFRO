package com.liquidglass.demo.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

enum class AccentTheme(val label: String, val primary: Color, val light: Color, val glow: Color, val brush: Brush) {
    BLUE("Liquid Blue", LiquidBlue, LiquidBlueLight, LiquidBlueGlow, LiquidBlueBrush),
    YELLOW("Solar Yellow", LiquidYellow, LiquidYellowLight, LiquidYellowGlow, LiquidYellowBrush),
    RED("Crimson Red", LiquidRed, LiquidRedLight, LiquidRedGlow, LiquidRedBrush)
}

@Immutable
data class LiquidColorScheme(
    val background: Color = LiquidCanvasBackground,
    val surfaceGlass: Brush = GlassSurfaceBrush,
    val borderSpecular: Brush = SpecularBorderBrush,
    val textPrimary: Color = LiquidTextPrimary,
    val textSecondary: Color = LiquidTextSecondary,
    val textTertiary: Color = LiquidTextTertiary,
    val activeAccent: AccentTheme = AccentTheme.BLUE
)

val LocalLiquidColors = compositionLocalOf { LiquidColorScheme() }
val LocalLiquidTypography = compositionLocalOf { LiquidTypography }

class LiquidThemeController(initialAccent: AccentTheme = AccentTheme.BLUE) {
    var activeAccent by mutableStateOf(initialAccent)
        private set

    fun updateAccent(accent: AccentTheme) {
        activeAccent = accent
    }
}

val LocalLiquidThemeController = compositionLocalOf<LiquidThemeController> {
    error("No LiquidThemeController provided")
}

@Composable
fun LiquidGlassTheme(
    controller: LiquidThemeController = remember { LiquidThemeController() },
    content: @Composable () -> Unit
) {
    val colorScheme = remember(controller.activeAccent) {
        LiquidColorScheme(
            background = LiquidCanvasBackground,
            surfaceGlass = GlassSurfaceBrush,
            borderSpecular = SpecularBorderBrush,
            textPrimary = LiquidTextPrimary,
            textSecondary = LiquidTextSecondary,
            textTertiary = LiquidTextTertiary,
            activeAccent = controller.activeAccent
        )
    }

    CompositionLocalProvider(
        LocalLiquidColors provides colorScheme,
        LocalLiquidTypography provides LiquidTypography,
        LocalLiquidThemeController provides controller,
        content = content
    )
}
