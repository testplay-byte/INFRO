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
import com.liquidglass.demo.ui.core.liquidGlow
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidYellow
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
    val accent = colors.activeAccent

    val animatedProgress by animateFloatAsState(
        targetValue = project.progress,
        animationSpec = LiquidPhysics.BouncySpringSpec,
        label = "hero_progress"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .liquidGlow(
                color = project.accentColor,
                radius = 16.dp,
                alpha = 0.20f,
                offsetY = 6.dp
            )
            .bouncyClick(scaleDown = 0.98f, onClick = onClick)
            .liquidGlass(
                shape = RoundedCornerShape(28.dp),
                elevation = 8.dp,
                borderWidth = 1.3.dp,
                backgroundBrush = Brush.verticalGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.88f),
                        Color.White.copy(alpha = 0.65f),
                        project.accentColor.copy(alpha = 0.08f)
                    )
                )
            )
            .padding(20.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Top Row: Featured Badge + Star Action
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
                            tint = project.accentColor.copy(alpha = 0.15f),
                            borderColor = project.accentColor.copy(alpha = 0.40f)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "FEATURED PIPELINE",
                        style = typography.labelSmall.copy(
                            color = project.accentColor,
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
                        color = if (isStarred) LiquidYellow else colors.textTertiary,
                        isFilled = isStarred
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Project Title & Description
            Text(
                text = project.title,
                style = typography.displayMedium.copy(fontSize = 20.sp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = project.description,
                style = typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Progress Header & Liquid Progress Bar
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
                        color = project.accentColor,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Custom Glass Track Progress Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Color.White.copy(alpha = 0.6f))
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

            // Footer: Team Member Avatars + Due Date
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Team Avatar Stack
                Row(verticalAlignment = Alignment.CenterVertically) {
                    project.team.take(3).forEachIndexed { index, member ->
                        Box(
                            modifier = Modifier
                                .padding(start = if (index > 0) 0.dp else 0.dp)
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(member.accentColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = member.initials,
                                style = typography.labelSmall.copy(
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                                )
                            )
                        }
                        if (index < 2) Spacer(modifier = Modifier.width(4.dp))
                    }
                    if (project.team.size > 3) {
                        Spacer(modifier = Modifier.width(4.dp))
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
                            tint = Color.White.copy(alpha = 0.5f),
                            borderColor = Color.White.copy(alpha = 0.7f)
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
