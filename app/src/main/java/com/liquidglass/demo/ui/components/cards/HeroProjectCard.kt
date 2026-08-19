package com.liquidglass.demo.ui.components.cards

import androidx.compose.animation.core.animateFloatAsState
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
fun HeroProjectCard(
    project: Project,
    isStarred: Boolean,
    onStarToggle: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val isDark = colors.isDarkMode

    val animatedProgress by animateFloatAsState(
        targetValue = project.progress,
        animationSpec = LiquidPhysics.SnappySpringSpec,
        label = "hero_progress"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .bouncyClick(scaleDown = 0.98f, onClick = onClick)
            .liquidGlass(
                shape = RoundedCornerShape(28.dp),
                elevation = 10.dp,
                borderWidth = 1.4.dp,
                enableShimmer = true
            )
            .padding(20.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Top Row: Featured Pill & Star Glass Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Featured Liquid Pill
                Box(
                    modifier = Modifier
                        .liquidGlassPill(
                            shape = RoundedCornerShape(50),
                            tint = project.accentColor.copy(alpha = if (isDark) 0.25f else 0.15f),
                            borderColor = project.accentColor.copy(alpha = if (isDark) 0.60f else 0.40f)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "FEATURED PIPELINE",
                        style = typography.labelSmall.copy(
                            color = if (isDark) Color.White else project.accentColor,
                            letterSpacing = 1.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                    )
                }

                // Star Glass Button
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .bouncyClick(onClick = onStarToggle)
                        .liquidGlass(
                            shape = CircleShape,
                            elevation = 2.dp,
                            borderWidth = 1.dp
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    LiquidStarIcon(
                        color = if (isStarred) LiquidYellowBright else colors.textTertiary,
                        isFilled = isStarred
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Project Title & Description
            Text(
                text = project.title,
                style = typography.displayMedium
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = project.description,
                style = typography.bodyMedium.copy(color = colors.textSecondary)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Progress Header & Track
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Completion Status",
                    style = typography.labelSmall.copy(color = colors.textSecondary)
                )
                Text(
                    text = "${(animatedProgress * 100).toInt()}%",
                    style = typography.labelLarge.copy(
                        color = if (isDark) project.accentColor else project.accentColor,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Glass Progress Track
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(50))
                    .background(if (isDark) Color.White.copy(alpha = 0.12f) else Color.White.copy(alpha = 0.60f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress)
                        .height(8.dp)
                        .clip(RoundedCornerShape(50))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(project.accentColor, project.accentColor.copy(alpha = 0.75f))
                            )
                        )
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Footer: Team Avatars & Due Date
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Team Avatars Stack
                Row(verticalAlignment = Alignment.CenterVertically) {
                    project.team.take(3).forEachIndexed { index, member ->
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(member.accentColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = member.initials,
                                style = typography.labelSmall.copy(
                                    color = Color.White,
                                    fontSize = 9.5.sp,
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                )
                            )
                        }
                        if (index < 2) Spacer(modifier = Modifier.width(4.dp))
                    }
                    if (project.team.size > 3) {
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = "+${project.team.size - 3}",
                            style = typography.labelSmall.copy(color = colors.textTertiary)
                        )
                    }
                }

                // Due Date Badge
                Box(
                    modifier = Modifier
                        .liquidGlassPill(
                            tint = if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.50f),
                            borderColor = if (isDark) Color.White.copy(alpha = 0.20f) else Color.White.copy(alpha = 0.70f)
                        )
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Due ${project.dueDate}",
                        style = typography.labelSmall.copy(color = colors.textSecondary)
                    )
                }
            }
        }
    }
}
