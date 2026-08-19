package com.liquidglass.demo.ui.components.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
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
 * Central Floating Liquid Glass Navigation Bar.
 * Features 3 tabs with fluid spring expansion: the active tab expands to show
 * its label alongside its vector icon with glowing liquid highlight,
 * while inactive tabs display minimalist glass icons.
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

    val tabs = remember {
        listOf(
            NavTabItem(
                index = 0,
                title = "Projects",
                icon = { isSel, tint -> LiquidFolderIcon(color = tint, isFilled = isSel) }
            ),
            NavTabItem(
                index = 1,
                title = "Analytics",
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
                elevation = 12.dp,
                borderWidth = 1.2.dp,
                backgroundBrush = Brush.verticalGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.85f),
                        Color.White.copy(alpha = 0.55f),
                        Color.White.copy(alpha = 0.70f)
                    )
                )
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
                    targetValue = if (isSelected) 0.18f else 0f,
                    animationSpec = LiquidPhysics.BouncySpringSpec,
                    label = "tab_bg_alpha"
                )

                val itemColor by animateColorAsState(
                    targetValue = if (isSelected) accent.primary else colors.textSecondary,
                    animationSpec = LiquidPhysics.BouncySpringSpec,
                    label = "tab_color"
                )

                Box(
                    modifier = Modifier
                        .height(48.dp)
                        .clip(RoundedCornerShape(50))
                        .bouncyClick(onClick = { onTabSelected(tab.index) })
                        .then(
                            if (isSelected) {
                                Modifier.liquidGlassPill(
                                    shape = RoundedCornerShape(50),
                                    tint = accent.primary.copy(alpha = activeBgAlpha),
                                    borderColor = accent.primary.copy(alpha = 0.35f),
                                    borderWidth = 1.dp
                                )
                            } else {
                                Modifier
                            }
                        )
                        .padding(horizontal = if (isSelected) 16.dp else 12.dp),
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
                                        fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
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
