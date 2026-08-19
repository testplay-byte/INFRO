package com.liquidglass.demo.ui.components.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.ui.components.icons.LiquidAnalyticsIcon
import com.liquidglass.demo.ui.components.icons.LiquidFolderIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

data class NavTabItem(
    val index: Int,
    val title: String,
    val icon: @Composable (isSelected: Boolean, tint: Color) -> Unit
)

/**
 * Revamped Floating Liquid Glass Navigation Bar.
 * Clean, high-contrast, optical refraction pill with smooth spring expansion
 * that clearly displays selected item text with glowing accent highlights.
 */
@Composable
fun LiquidFloatingNavBar(
    selectedIndex: Int,
    onTabSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent
    val isDark = colors.isDarkMode

    val tabs = remember {
        listOf(
            NavTabItem(
                index = 0,
                title = "Projects",
                icon = { isSel, tint -> LiquidFolderIcon(color = tint, isFilled = isSel) }
            ),
            NavTabItem(
                index = 1,
                title = "Telemetry",
                icon = { isSel, tint -> LiquidAnalyticsIcon(color = tint, isFilled = isSel) }
            ),
            NavTabItem(
                index = 2,
                title = "Workspace",
                icon = { isSel, tint -> LiquidWorkspaceIcon(color = tint, isFilled = isSel) }
            )
        )
    }

    Box(
        modifier = modifier
            .liquidGlass(
                shape = RoundedCornerShape(50),
                elevation = 14.dp,
                borderWidth = 1.3.dp,
                enableShimmer = true
            )
            .padding(horizontal = 6.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            tabs.forEach { tab ->
                val isSelected = tab.index == selectedIndex

                val activeBgAlpha by animateFloatAsState(
                    targetValue = if (isSelected) (if (isDark) 0.28f else 0.18f) else 0f,
                    animationSpec = LiquidPhysics.SnappySpringSpec,
                    label = "nav_bg_alpha"
                )

                val itemColor by animateColorAsState(
                    targetValue = if (isSelected) {
                        if (isDark) accent.neon else accent.bright
                    } else colors.textSecondary,
                    animationSpec = tween(250),
                    label = "nav_item_color"
                )

                Box(
                    modifier = Modifier
                        .height(48.dp)
                        .clip(RoundedCornerShape(50))
                        .bouncyClick(scaleDown = 0.92f, onClick = { onTabSelected(tab.index) })
                        .then(
                            if (isSelected) {
                                Modifier.liquidGlassPill(
                                    shape = RoundedCornerShape(50),
                                    tint = accent.bright.copy(alpha = activeBgAlpha),
                                    borderColor = accent.bright.copy(alpha = if (isDark) 0.55f else 0.40f),
                                    borderWidth = 1.2.dp
                                )
                            } else Modifier
                        )
                        .padding(horizontal = if (isSelected) 16.dp else 13.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        tab.icon(isSelected, itemColor)

                        AnimatedVisibility(
                            visible = isSelected,
                            enter = fadeIn(animationSpec = LiquidPhysics.FluidEnterSpec),
                            exit = fadeOut(animationSpec = LiquidPhysics.FluidEnterSpec)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = tab.title,
                                    style = typography.titleMedium.copy(
                                        color = itemColor,
                                        fontSize = 13.sp,
                                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
