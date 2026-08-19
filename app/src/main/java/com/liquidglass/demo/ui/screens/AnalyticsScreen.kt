package com.liquidglass.demo.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.liquidglass.demo.data.repository.SampleData
import com.liquidglass.demo.ui.components.cards.MetricGlassCard
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LiquidBlueBright
import com.liquidglass.demo.ui.theme.LiquidRedBright
import com.liquidglass.demo.ui.theme.LiquidYellowBright
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun AnalyticsScreen(
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val metrics = remember { SampleData.sampleMetrics }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section Header
        item {
            Column {
                Text(
                    text = "System Telemetry",
                    style = typography.displayMedium
                )
                Text(
                    text = "Real-time performance across liquid workflows",
                    style = typography.bodyMedium.copy(color = colors.textSecondary)
                )
            }
        }

        // Metrics 2x2 Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricGlassCard(stat = metrics[0], modifier = Modifier.weight(1f))
                    MetricGlassCard(stat = metrics[1], modifier = Modifier.weight(1f))
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricGlassCard(stat = metrics[2], modifier = Modifier.weight(1f))
                    MetricGlassCard(stat = metrics[3], modifier = Modifier.weight(1f))
                }
            }
        }

        // Glass Velocity Chart Card
        item {
            VelocityChartCard()
        }

        // Project Health Breakdown
        item {
            HealthDistributionCard()
        }
    }
}

@Composable
private fun VelocityChartCard() {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent
    val isDark = colors.isDarkMode

    val days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val heights = listOf(0.45f, 0.70f, 0.55f, 0.90f, 0.65f, 0.85f, 0.95f)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .liquidGlass(
                shape = RoundedCornerShape(26.dp),
                elevation = 8.dp,
                borderWidth = 1.3.dp,
                enableShimmer = true
            )
            .padding(20.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Weekly Velocity",
                        style = typography.titleLarge
                    )
                    Text(
                        text = "Average 8.4 tasks / day",
                        style = typography.labelSmall.copy(color = colors.textSecondary)
                    )
                }

                Box(
                    modifier = Modifier
                        .liquidGlassPill(
                            tint = accent.primary.copy(alpha = if (isDark) 0.25f else 0.15f),
                            borderColor = accent.bright.copy(alpha = if (isDark) 0.60f else 0.40f)
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "+24.5%",
                        style = typography.labelSmall.copy(
                            color = if (isDark) accent.neon else accent.bright,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Chart Bars
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                days.forEachIndexed { idx, day ->
                    val factor = heights[idx]
                    val isPeak = factor >= 0.90f

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Bottom,
                        modifier = Modifier.weight(1f)
                    ) {
                        // Bar Pill
                        Box(
                            modifier = Modifier
                                .width(22.dp)
                                .height(100.dp * factor)
                                .clip(RoundedCornerShape(50))
                                .background(
                                    if (isPeak) accent.brush
                                    else Brush.verticalGradient(
                                        colors = listOf(
                                            accent.bright.copy(alpha = if (isDark) 0.60f else 0.45f),
                                            accent.primary.copy(alpha = if (isDark) 0.20f else 0.15f)
                                        )
                                    )
                                )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = day,
                            style = typography.labelSmall.copy(
                                color = if (isPeak) (if (isDark) accent.neon else accent.bright) else colors.textTertiary,
                                fontSize = 11.sp,
                                fontWeight = if (isPeak) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
                            )
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HealthDistributionCard() {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .liquidGlass(
                shape = RoundedCornerShape(24.dp),
                elevation = 5.dp,
                borderWidth = 1.1.dp
            )
            .padding(18.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "Pipeline Distribution",
                style = typography.titleLarge
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Tri-Color Liquid Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(50))
            ) {
                Box(
                    modifier = Modifier
                        .weight(0.55f)
                        .fillMaxSize()
                        .background(LiquidBlueBright)
                )
                Box(
                    modifier = Modifier
                        .weight(0.30f)
                        .fillMaxSize()
                        .background(LiquidYellowBright)
                )
                Box(
                    modifier = Modifier
                        .weight(0.15f)
                        .fillMaxSize()
                        .background(LiquidRedBright)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Legend
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                LegendItem(label = "Active (55%)", color = LiquidBlueBright)
                LegendItem(label = "Review (30%)", color = LiquidYellowBright)
                LegendItem(label = "Urgent (15%)", color = LiquidRedBright)
            }
        }
    }
}

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = label,
            style = LocalLiquidTypography.current.labelSmall.copy(fontSize = 11.sp)
        )
    }
}
