package com.liquidglass.demo.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
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
import com.liquidglass.demo.data.models.ProjectCategory
import com.liquidglass.demo.data.repository.SampleData
import com.liquidglass.demo.ui.components.cards.HeroProjectCard
import com.liquidglass.demo.ui.components.cards.MetricGlassCard
import com.liquidglass.demo.ui.components.cards.ProjectGridCard
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun ProjectsHomeScreen(
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent

    var selectedCategory by remember { mutableStateOf(ProjectCategory.ALL) }
    val starredMap = remember {
        mutableStateMapOf<String, Boolean>().apply {
            SampleData.sampleProjects.forEach { put(it.id, it.isStarred) }
        }
    }

    val featuredProject = remember { SampleData.sampleProjects.first { it.isFeatured } }

    val filteredProjects = remember(selectedCategory, starredMap) {
        SampleData.sampleProjects.filter { proj ->
            when (selectedCategory) {
                ProjectCategory.ALL -> true
                ProjectCategory.ACTIVE -> proj.category == ProjectCategory.ACTIVE
                ProjectCategory.IN_REVIEW -> proj.category == ProjectCategory.IN_REVIEW
                ProjectCategory.COMPLETED -> proj.category == ProjectCategory.COMPLETED
                ProjectCategory.STARRED -> starredMap[proj.id] == true
            }
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Category Filter Pills Row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ProjectCategory.values().forEach { category ->
                    val isSelected = category == selectedCategory
                    Box(
                        modifier = Modifier
                            .bouncyClick(onClick = { selectedCategory = category })
                            .liquidGlassPill(
                                shape = RoundedCornerShape(50),
                                tint = if (isSelected) accent.primary.copy(alpha = 0.20f) else Color.White.copy(alpha = 0.50f),
                                borderColor = if (isSelected) accent.primary else Color.White.copy(alpha = 0.70f),
                                borderWidth = if (isSelected) 1.5.dp else 1.dp
                            )
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = category.label,
                            style = typography.titleMedium.copy(
                                color = if (isSelected) accent.primary else colors.textSecondary,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.SemiBold else androidx.compose.ui.text.font.FontWeight.Medium
                            )
                        )
                    }
                }
            }
        }

        // Featured Project Banner (Shown when ALL or ACTIVE is selected)
        if (selectedCategory == ProjectCategory.ALL || selectedCategory == ProjectCategory.ACTIVE) {
            item {
                HeroProjectCard(
                    project = featuredProject,
                    isStarred = starredMap[featuredProject.id] == true,
                    onStarToggle = {
                        val current = starredMap[featuredProject.id] ?: false
                        starredMap[featuredProject.id] = !current
                    },
                    onClick = {}
                )
            }
        }

        // Section Title: Active Projects Counter
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Project Pipeline",
                    style = typography.titleLarge
                )
                Text(
                    text = "${filteredProjects.size} Available",
                    style = typography.labelSmall.copy(color = colors.textTertiary)
                )
            }
        }

        // Project Cards
        items(filteredProjects, key = { it.id }) { project ->
            ProjectGridCard(
                project = project,
                isStarred = starredMap[project.id] == true,
                onStarToggle = {
                    val current = starredMap[project.id] ?: false
                    starredMap[project.id] = !current
                }
            )
        }
    }
}
