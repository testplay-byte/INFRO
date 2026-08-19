package com.liquidglass.demo.ui.components.topbar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.ui.components.icons.LiquidBellIcon
import com.liquidglass.demo.ui.components.icons.LiquidMenuIcon
import com.liquidglass.demo.ui.components.icons.LiquidSearchIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography
import com.liquidglass.demo.ui.theme.SpecularHighlightTop

/**
 * Top Bar featuring the circular 3-line hamburger menu button,
 * liquid title banner, and notification pill.
 */
@Composable
fun LiquidHeaderBar(
    title: String = "Projects",
    subtitle: String = "Liquid Studio",
    onMenuClick: () -> Unit,
    onSearchClick: () -> Unit = {},
    onNotificationClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left: Circular 3-line Hamburger Menu Button
        Box(
            modifier = Modifier
                .size(46.dp)
                .bouncyClick(onClick = onMenuClick)
                .liquidGlass(
                    shape = CircleShape,
                    elevation = 6.dp,
                    borderWidth = 1.2.dp,
                    backgroundBrush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.85f),
                            Color.White.copy(alpha = 0.45f)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            LiquidMenuIcon(
                color = colors.textPrimary,
                strokeWidth = 2.dp
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        // Center: Title and Subtitle Info
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = subtitle.uppercase(),
                    style = typography.labelSmall.copy(
                        color = accent.primary,
                        letterSpacing = 1.5.sp
                    )
                )
                Spacer(modifier = Modifier.width(6.dp))
                // Active status liquid dot
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(accent.primary)
                )
            }
            Text(
                text = title,
                style = typography.displayMedium
            )
        }

        // Right Actions: Search Pill & Notification Button
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Search Glass Button
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .bouncyClick(onClick = onSearchClick)
                    .liquidGlass(
                        shape = CircleShape,
                        elevation = 4.dp,
                        borderWidth = 1.dp
                    ),
                contentAlignment = Alignment.Center
            ) {
                LiquidSearchIcon(color = colors.textSecondary)
            }

            // Notification Glass Button with Accent Dot
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
                        .padding(top = 10.dp, end = 10.dp)
                        .clip(CircleShape)
                        .background(accent.primary)
                )
            }
        }
    }
}
