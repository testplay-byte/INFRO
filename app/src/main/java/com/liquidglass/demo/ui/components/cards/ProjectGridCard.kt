package com.liquidglass.demo.ui.components.cards

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.data.models.Project
import com.liquidglass.demo.ui.components.icons.LiquidStarIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LiquidYellowBright
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun ProjectGridCard(
    project: Project,
    isStarred: Boolean,
    onStarToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val isDark = colors.isDarkMode
    var isExpanded by remember { mutableStateOf(false) }

    val animatedProgress by animateFloatAsState(
        targetValue = project.progress,
        animationSpec = LiquidPhysics.SnappySpringSpec,
        label = "proj_progress"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .bouncyClick(scaleDown = 0.98f, onClick = { isExpanded = !isExpanded })
            .liquidGlass(
                shape = RoundedCornerShape(22.dp),
                elevation = 5.dp,
                borderWidth = 1.2.dp,
                enableShimmer = false
            )
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header: Category Pill & Star Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Category Pill
                Box(
                    modifier = Modifier
                        .liquidGlassPill(
                            tint = project.accentColor.copy(alpha = if (isDark) 0.20f else 0.12f),
                            borderColor = project.accentColor.copy(alpha = if (isDark) 0.50f else 0.35f)
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = project.category.label.uppercase(),
                        style = typography.labelSmall.copy(
                            color = if (isDark) Color.White else project.accentColor,
                            fontSize = 9.5.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                    )
                }

                // Star Button
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .bouncyClick(onClick = onStarToggle)
                        .liquidGlass(
                            shape = CircleShape,
                            elevation = 1.dp,
                            borderWidth = 0.8.dp
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    LiquidStarIcon(
                        color = if (isStarred) LiquidYellowBright else colors.textTertiary,
                        isFilled = isStarred,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Project Title
            Text(
                text = project.title,
                style = typography.titleLarge
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Description
            Text(
                text = project.description,
                style = typography.bodyMedium.copy(color = colors.textSecondary),
                maxLines = if (isExpanded) Int.MAX_VALUE else 2
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Tasks Metric & Progress %
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${project.tasksCompleted}/${project.totalTasks} Tasks Completed",
                    style = typography.labelSmall.copy(color = colors.textSecondary)
                )
                Text(
                    text = "${(animatedProgress * 100).toInt()}%",
                    style = typography.labelSmall.copy(
                        color = project.accentColor,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Glass progress line
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(50))
                    .background(if (isDark) Color.White.copy(alpha = 0.12f) else Color.White.copy(alpha = 0.55f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress)
                        .height(6.dp)
                        .clip(RoundedCornerShape(50))
                        .background(project.accentColor)
                )
            }

            // Expandable details (Tag chips & Team Lead)
            AnimatedVisibility(
                visible = isExpanded,
                enter = fadeIn(animationSpec = LiquidPhysics.FluidEnterSpec),
                exit = fadeOut(animationSpec = LiquidPhysics.FluidEnterSpec)
            ) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    // Tag Chips Row
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        project.tags.forEach { tag ->
                            Box(
                                modifier = Modifier
                                    .liquidGlassPill(
                                        tint = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.60f),
                                        borderColor = if (isDark) Color.White.copy(alpha = 0.20f) else Color.White.copy(alpha = 0.80f)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = tag,
                                    style = typography.labelSmall.copy(
                                        color = colors.textSecondary,
                                        fontSize = 10.sp
                                    )
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Lead: ${project.team.firstOrNull()?.name ?: "Alex Morgan"}",
                        style = typography.labelSmall.copy(color = colors.textTertiary)
                    )
                }
            }
        }
    }
}
