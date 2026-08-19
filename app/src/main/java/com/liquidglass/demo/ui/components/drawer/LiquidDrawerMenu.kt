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
import com.liquidglass.demo.ui.components.icons.LiquidThemeModeIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.AccentTheme
import com.liquidglass.demo.ui.theme.LiquidBlueBright
import com.liquidglass.demo.ui.theme.LiquidRedBright
import com.liquidglass.demo.ui.theme.LiquidYellowBright
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidThemeController
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

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
    val isDark = colors.isDarkMode

    AnimatedVisibility(
        visible = isOpen,
        enter = fadeIn(animationSpec = tween(250)),
        exit = fadeOut(animationSpec = tween(200))
    ) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = if (isDark) 0.60f else 0.35f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                )
        ) {
            // Sliding Glass Container
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
                        .width(315.dp)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = {}
                        )
                        .liquidGlass(
                            shape = RoundedCornerShape(topEnd = 32.dp, bottomEnd = 32.dp),
                            elevation = 20.dp,
                            borderWidth = 1.5.dp,
                            enableShimmer = true
                        )
                        .padding(horizontal = 22.dp, vertical = 28.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Drawer Header with Avatar & Close Button
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
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
                                        text = if (isDark) "Obsidian Mode" else "Frost Mode",
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

                        Spacer(modifier = Modifier.height(22.dp))

                        // Theme Mode Segmented Switcher (Dark / Light)
                        Text(
                            text = "APPEARANCE",
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
                                    shape = RoundedCornerShape(16.dp),
                                    elevation = 2.dp,
                                    borderWidth = 1.dp
                                )
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Light Mode Button
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .bouncyClick(onClick = { themeController.applyDarkMode(false) })
                                    .then(
                                        if (!isDark) {
                                            Modifier.liquidGlassPill(
                                                shape = RoundedCornerShape(12.dp),
                                                tint = activeAccent.primary.copy(alpha = 0.20f),
                                                borderColor = activeAccent.bright,
                                                borderWidth = 1.2.dp
                                            )
                                        } else Modifier
                                    )
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    LiquidThemeModeIcon(isDark = false, color = if (!isDark) activeAccent.bright else colors.textSecondary)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Light",
                                        style = typography.labelSmall.copy(
                                            color = if (!isDark) activeAccent.bright else colors.textSecondary,
                                            fontWeight = if (!isDark) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
                                        )
                                    )
                                }
                            }

                            // Dark Mode Button
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .bouncyClick(onClick = { themeController.applyDarkMode(true) })
                                    .then(
                                        if (isDark) {
                                            Modifier.liquidGlassPill(
                                                shape = RoundedCornerShape(12.dp),
                                                tint = activeAccent.primary.copy(alpha = 0.25f),
                                                borderColor = activeAccent.bright,
                                                borderWidth = 1.2.dp
                                            )
                                        } else Modifier
                                    )
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    LiquidThemeModeIcon(isDark = true, color = if (isDark) activeAccent.neon else colors.textSecondary)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Dark",
                                        style = typography.labelSmall.copy(
                                            color = if (isDark) activeAccent.neon else colors.textSecondary,
                                            fontWeight = if (isDark) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
                                        )
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Liquid Accent Color Switcher
                        Text(
                            text = "ACCENT REFLECTION",
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
                            AccentSelectorButton(
                                label = "Blue",
                                color = LiquidBlueBright,
                                isSelected = activeAccent == AccentTheme.BLUE,
                                onClick = { themeController.updateAccent(AccentTheme.BLUE) }
                            )
                            AccentSelectorButton(
                                label = "Yellow",
                                color = LiquidYellowBright,
                                isSelected = activeAccent == AccentTheme.YELLOW,
                                onClick = { themeController.updateAccent(AccentTheme.YELLOW) }
                            )
                            AccentSelectorButton(
                                label = "Red",
                                color = LiquidRedBright,
                                isSelected = activeAccent == AccentTheme.RED,
                                onClick = { themeController.updateAccent(AccentTheme.RED) }
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Navigation Destinations
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
                            subtitle = "6 Active pipelines",
                            isSelected = currentTab == 0,
                            accentColor = activeAccent.bright,
                            icon = { isSel ->
                                LiquidFolderIcon(
                                    color = if (isSel) activeAccent.bright else colors.textPrimary,
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
                            title = "Telemetry & Stats",
                            subtitle = "Performance metrics",
                            isSelected = currentTab == 1,
                            accentColor = activeAccent.bright,
                            icon = { isSel ->
                                LiquidAnalyticsIcon(
                                    color = if (isSel) activeAccent.bright else colors.textPrimary,
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
                            subtitle = "Interactive glass notes",
                            isSelected = currentTab == 2,
                            accentColor = activeAccent.bright,
                            icon = { isSel ->
                                LiquidWorkspaceIcon(
                                    color = if (isSel) activeAccent.bright else colors.textPrimary,
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

                        // Engine Badge Card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .liquidGlass(
                                    shape = RoundedCornerShape(16.dp),
                                    elevation = 2.dp,
                                    borderWidth = 1.dp
                                )
                                .padding(14.dp)
                        ) {
                            Column {
                                Text(
                                    text = "Liquid Glass Engine 2.0",
                                    style = typography.titleMedium.copy(fontSize = 13.5.sp)
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = "Optical refraction caustics, multi-pass specular highlights & obsidian crystal.",
                                    style = typography.bodyMedium.copy(fontSize = 11.5.sp, color = colors.textSecondary)
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
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current

    Box(
        modifier = Modifier
            .bouncyClick(onClick = onClick)
            .liquidGlassPill(
                tint = if (isSelected) color.copy(alpha = 0.22f) else Color.White.copy(alpha = if (colors.isDarkMode) 0.08f else 0.35f),
                borderColor = if (isSelected) color else Color.White.copy(alpha = if (colors.isDarkMode) 0.20f else 0.60f)
            )
            .padding(horizontal = 14.dp, vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(9.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                style = typography.labelSmall.copy(
                    color = if (isSelected) color else colors.textSecondary,
                    fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
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
                            accentColor.copy(alpha = if (colors.isDarkMode) 0.25f else 0.18f),
                            (if (colors.isDarkMode) Color(0xFF1E293B) else Color.White).copy(alpha = 0.65f)
                        )
                    )
                } else null
            )
            .padding(horizontal = 14.dp, vertical = 11.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (isSelected) accentColor.copy(alpha = 0.20f)
                        else (if (colors.isDarkMode) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.50f))
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
                        fontSize = 13.5.sp
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
