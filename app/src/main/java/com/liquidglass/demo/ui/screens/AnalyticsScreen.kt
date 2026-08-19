package com.liquidglass.demo.ui.screens

import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.runtime.getValue
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
import com.liquidglass.demo.ui.components.icons.LiquidAnalyticsIcon
import com.liquidglass.demo.ui.components.icons.LiquidCheckIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.core.liquidGlow
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidRed
import com.liquidglass.demo.ui.theme.LiquidYellow
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun AnalyticsScreen(
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent

    val metrics = remember { SampleData.sampleMetrics }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 110.dp),
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

    val days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val heights = listOf(0.45f, 0.70f, 0.55f, 0.90f, 0.65f, 0.85f, 0.95f)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .liquidGlass(
                shape = RoundedCornerShape(26.dp),
                elevation = 6.dp,
                borderWidth = 1.2.dp,
                backgroundBrush = Brush.verticalGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.85f),
                        Color.White.copy(alpha = 0.55f)
                    )
                )
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
                        style = typography.titleLarge.copy(fontSize = 17.sp)
                    )
                    Text(
                        text = "Average 8.4 tasks / day",
                        style = typography.labelSmall.copy(color = colors.textSecondary)
                    )
                }

                Box(
                    modifier = Modifier
                        .liquidGlassPill(
                            tint = accent.primary.copy(alpha = 0.15f),
                            borderColor = accent.primary.copy(alpha = 0.35f)
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "+24.5%",
                        style = typography.labelSmall.copy(
                            color = accent.primary,
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
                                            accent.primary.copy(alpha = 0.50f),
                                            accent.primary.copy(alpha = 0.20f)
                                        )
                                    )
                                )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = day,
                            style = typography.labelSmall.copy(
                                color = if (isPeak) accent.primary else colors.textTertiary,
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
                elevation = 4.dp,
                borderWidth = 1.dp
            )
            .padding(18.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "Pipeline Distribution",
                style = typography.titleLarge.copy(fontSize = 16.sp)
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
                        .background(LiquidBlue)
                )
                Box(
                    modifier = Modifier
                        .weight(0.30f)
                        .fillMaxSize()
                        .background(LiquidYellow)
                )
                Box(
                    modifier = Modifier
                        .weight(0.15f)
                        .fillMaxSize()
                        .background(LiquidRed)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Legend
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                LegendItem(label = "Active (55%)", color = LiquidBlue)
                LegendItem(label = "Review (30%)", color = LiquidYellow)
                LegendItem(label = "Urgent (15%)", color = LiquidRed)
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
