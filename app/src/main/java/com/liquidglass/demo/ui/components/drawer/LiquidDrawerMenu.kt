package com.liquidglass.demo.ui.components.drawer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.ui.components.icons.LiquidAnalyticsIcon
import com.liquidglass.demo.ui.components.icons.LiquidCloseIcon
import com.liquidglass.demo.ui.components.icons.LiquidFolderIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.AccentTheme
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidRed
import com.liquidglass.demo.ui.theme.LiquidYellow
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidThemeController
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

enum class DrawerDestination(val title: String) {
    PROJECTS("Projects"),
    ANALYTICS("Analytics"),
    WORKSPACE("Workspace"),
    SETTINGS("Settings")
}

@Composable
fun LiquidDrawerMenu(
    isOpen: Boolean,
    currentTab: Int,
    onTabSelected: (Int) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val themeController = LocalLiquidThemeController.current
    val activeAccent = colors.activeAccent

    AnimatedVisibility(
        visible = isOpen,
        enter = fadeIn(animationSpec = tween(250)),
        exit = fadeOut(animationSpec = tween(200))
    ) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.35f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                )
        ) {
            // Sliding Glass Drawer Container
            AnimatedVisibility(
                visible = isOpen,
                enter = slideInHorizontally(
                    initialOffsetX = { -it },
                    animationSpec = tween(350)
                ),
                exit = slideOutHorizontally(
                    targetOffsetX = { -it },
                    animationSpec = tween(300)
                )
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(310.dp)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = {} // Intercept clicks
                        )
                        .liquidGlass(
                            shape = RoundedCornerShape(topEnd = 32.dp, bottomEnd = 32.dp),
                            elevation = 16.dp,
                            borderWidth = 1.5.dp,
                            backgroundBrush = Brush.horizontalGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.92f),
                                    Color.White.copy(alpha = 0.78f)
                                )
                            )
                        )
                        .padding(horizontal = 22.dp, vertical = 28.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Drawer Header with Close Button
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Profile Avatar
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(CircleShape)
                                        .background(activeAccent.brush),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "LG",
                                        style = typography.titleMedium.copy(
                                            color = Color.White,
                                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                        )
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Liquid OS",
                                        style = typography.titleMedium
                                    )
                                    Text(
                                        text = "v1.0 • Modern Glass",
                                        style = typography.labelSmall.copy(color = colors.textTertiary)
                                    )
                                }
                            }

                            // Close Button
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .bouncyClick(onClick = onClose)
                                    .liquidGlass(
                                        shape = CircleShape,
                                        elevation = 2.dp,
                                        borderWidth = 1.dp
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                LiquidCloseIcon(color = colors.textPrimary)
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Liquid Accent Color Switcher Card
                        Text(
                            text = "ACCENT THEME",
                            style = typography.labelSmall.copy(
                                color = colors.textTertiary,
                                letterSpacing = 1.2.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .liquidGlass(
                                    shape = RoundedCornerShape(18.dp),
                                    elevation = 2.dp,
                                    borderWidth = 1.dp
                                )
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            // Blue Pill
                            AccentSelectorButton(
                                label = "Blue",
                                color = LiquidBlue,
                                isSelected = activeAccent == AccentTheme.BLUE,
                                onClick = { themeController.updateAccent(AccentTheme.BLUE) }
                            )
                            // Yellow Pill
                            AccentSelectorButton(
                                label = "Yellow",
                                color = LiquidYellow,
                                isSelected = activeAccent == AccentTheme.YELLOW,
                                onClick = { themeController.updateAccent(AccentTheme.YELLOW) }
                            )
                            // Red Pill
                            AccentSelectorButton(
                                label = "Red",
                                color = LiquidRed,
                                isSelected = activeAccent == AccentTheme.RED,
                                onClick = { themeController.updateAccent(AccentTheme.RED) }
                            )
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        // Navigation Items
                        Text(
                            text = "NAVIGATION",
                            style = typography.labelSmall.copy(
                                color = colors.textTertiary,
                                letterSpacing = 1.2.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        DrawerNavItem(
                            title = "Projects Hub",
                            subtitle = "6 Active projects",
                            isSelected = currentTab == 0,
                            accentColor = activeAccent.primary,
                            icon = { isSel ->
                                LiquidFolderIcon(
                                    color = if (isSel) activeAccent.primary else colors.textPrimary,
                                    isFilled = isSel
                                )
                            },
                            onClick = {
                                onTabSelected(0)
                                onClose()
                            }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        DrawerNavItem(
                            title = "Analytics & Stats",
                            subtitle = "Performance metrics",
                            isSelected = currentTab == 1,
                            accentColor = activeAccent.primary,
                            icon = { isSel ->
                                LiquidAnalyticsIcon(
                                    color = if (isSel) activeAccent.primary else colors.textPrimary,
                                    isFilled = isSel
                                )
                            },
                            onClick = {
                                onTabSelected(1)
                                onClose()
                            }
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        DrawerNavItem(
                            title = "Liquid Workspace",
                            subtitle = "Interactive notes & boards",
                            isSelected = currentTab == 2,
                            accentColor = activeAccent.primary,
                            icon = { isSel ->
                                LiquidWorkspaceIcon(
                                    color = if (isSel) activeAccent.primary else colors.textPrimary,
                                    isFilled = isSel
                                )
                            },
                            onClick = {
                                onTabSelected(2)
                                onClose()
                            }
                        )

                        Spacer(modifier = Modifier.weight(1f))
                        Spacer(modifier = Modifier.height(24.dp))

                        // Bottom Info Card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .liquidGlass(
                                    shape = RoundedCornerShape(16.dp),
                                    elevation = 2.dp,
                                    borderWidth = 1.dp,
                                    backgroundBrush = Brush.verticalGradient(
                                        colors = listOf(
                                            activeAccent.primary.copy(alpha = 0.08f),
                                            Color.White.copy(alpha = 0.40f)
                                        )
                                    )
                                )
                                .padding(14.dp)
                        ) {
                            Column {
                                Text(
                                    text = "Liquid Glass Engine",
                                    style = typography.titleMedium.copy(fontSize = 14.sp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Custom-built without Material 3 components. Dynamic spring physics enabled.",
                                    style = typography.bodyMedium.copy(fontSize = 12.sp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AccentSelectorButton(
    label: String,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .bouncyClick(onClick = onClick)
            .liquidGlassPill(
                tint = if (isSelected) color.copy(alpha = 0.20f) else Color.White.copy(alpha = 0.35f),
                borderColor = if (isSelected) color else Color.White.copy(alpha = 0.6f)
            )
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                style = LocalLiquidTypography.current.labelSmall.copy(
                    color = if (isSelected) color else LocalLiquidColors.current.textSecondary,
                    fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Medium
                )
            )
        }
    }
}

@Composable
private fun DrawerNavItem(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    accentColor: Color,
    icon: @Composable (Boolean) -> Unit,
    onClick: () -> Unit
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .bouncyClick(onClick = onClick)
            .liquidGlass(
                shape = RoundedCornerShape(16.dp),
                elevation = if (isSelected) 4.dp else 1.dp,
                borderWidth = if (isSelected) 1.5.dp else 0.8.dp,
                backgroundBrush = if (isSelected) {
                    Brush.horizontalGradient(
                        colors = listOf(
                            accentColor.copy(alpha = 0.18f),
                            Color.White.copy(alpha = 0.70f)
                        )
                    )
                } else {
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.50f),
                            Color.White.copy(alpha = 0.25f)
                        )
                    )
                }
            )
            .padding(horizontal = 14.dp, vertical = 12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (isSelected) accentColor.copy(alpha = 0.15f)
                        else Color.White.copy(alpha = 0.6f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                icon(isSelected)
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = title,
                    style = typography.titleMedium.copy(
                        color = if (isSelected) accentColor else colors.textPrimary,
                        fontSize = 14.sp
                    )
                )
                Text(
                    text = subtitle,
                    style = typography.labelSmall.copy(color = colors.textTertiary)
                )
            }
        }
    }
}
