package com.liquidglass.demo.ui.components.topbar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.ui.components.icons.LiquidBellIcon
import com.liquidglass.demo.ui.components.icons.LiquidMenuIcon
import com.liquidglass.demo.ui.components.icons.LiquidThemeModeIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidThemeController
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

/**
 * Top Header Bar featuring the circular 3-line hamburger menu button,
 * dynamic theme toggle (Dark/Light mode), and glass notification pill.
 */
@Composable
fun LiquidHeaderBar(
    title: String = "Projects",
    subtitle: String = "Liquid Studio",
    onMenuClick: () -> Unit,
    onNotificationClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val themeController = LocalLiquidThemeController.current
    val accent = colors.activeAccent
    val isDark = colors.isDarkMode

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left: Circular 3-line Hamburger Menu Glass Button
        Box(
            modifier = Modifier
                .size(46.dp)
                .bouncyClick(scaleDown = 0.90f, onClick = onMenuClick)
                .liquidGlass(
                    shape = CircleShape,
                    elevation = 8.dp,
                    borderWidth = 1.2.dp,
                    enableShimmer = true
                ),
            contentAlignment = Alignment.Center
        ) {
            LiquidMenuIcon(
                color = colors.textPrimary,
                strokeWidth = 2.dp
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        // Center: Title & Subtitle Info
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = subtitle.uppercase(),
                    style = typography.labelSmall.copy(
                        color = accent.bright,
                        letterSpacing = 1.2.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                )
                Spacer(modifier = Modifier.width(6.dp))
                // Active status liquid dot
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(accent.bright)
                )
            }
            Text(
                text = title,
                style = typography.displayMedium
            )
        }

        // Right Actions: Dark/Light Mode Switch & Notification Bell
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Theme Toggle Button (Sun / Moon)
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .bouncyClick(scaleDown = 0.88f, onClick = { themeController.toggleDarkMode() })
                    .liquidGlass(
                        shape = CircleShape,
                        elevation = 4.dp,
                        borderWidth = 1.dp
                    ),
                contentAlignment = Alignment.Center
            ) {
                LiquidThemeModeIcon(
                    isDark = isDark,
                    color = if (isDark) accent.neon else colors.textPrimary
                )
            }

            // Notification Glass Button
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .bouncyClick(onClick = onNotificationClick)
                    .liquidGlass(
                        shape = CircleShape,
                        elevation = 4.dp,
                        borderWidth = 1.dp
                    ),
                contentAlignment = Alignment.Center
            ) {
                LiquidBellIcon(color = colors.textPrimary)
                // Unread indicator dot
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .align(Alignment.TopEnd)
                        .padding(top = 9.dp, end = 9.dp)
                        .clip(CircleShape)
                        .background(accent.bright)
                )
            }
        }
    }
}
