package com.liquidglass.demo.ui.components.cards

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.data.models.MetricIconType
import com.liquidglass.demo.data.models.MetricStat
import com.liquidglass.demo.ui.components.icons.LiquidAnalyticsIcon
import com.liquidglass.demo.ui.components.icons.LiquidCheckIcon
import com.liquidglass.demo.ui.components.icons.LiquidFolderIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun MetricGlassCard(
    stat: MetricStat,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val isDark = colors.isDarkMode

    Box(
        modifier = modifier
            .bouncyClick(scaleDown = 0.96f, onClick = {})
            .liquidGlass(
                shape = RoundedCornerShape(20.dp),
                elevation = 4.dp,
                borderWidth = 1.1.dp
            )
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Icon Box
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(stat.accentColor.copy(alpha = if (isDark) 0.25f else 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    when (stat.iconType) {
                        MetricIconType.VELOCITY -> LiquidAnalyticsIcon(
                            color = stat.accentColor,
                            modifier = Modifier.size(16.dp),
                            isFilled = true
                        )
                        MetricIconType.TASKS -> LiquidCheckIcon(
                            color = stat.accentColor,
                            modifier = Modifier.size(16.dp)
                        )
                        MetricIconType.EFFICIENCY -> LiquidFolderIcon(
                            color = stat.accentColor,
                            modifier = Modifier.size(16.dp),
                            isFilled = true
                        )
                        MetricIconType.COLLABORATORS -> LiquidWorkspaceIcon(
                            color = stat.accentColor,
                            modifier = Modifier.size(16.dp),
                            isFilled = true
                        )
                    }
                }

                // Change indicator
                Text(
                    text = stat.changeText,
                    style = typography.labelSmall.copy(
                        color = stat.accentColor,
                        fontSize = 10.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = stat.value,
                style = typography.displayMedium.copy(fontSize = 19.sp)
            )

            Text(
                text = stat.title,
                style = typography.labelSmall.copy(color = colors.textSecondary)
            )
        }
    }
}
