package com.liquidglass.demo.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.data.models.WorkspaceItem
import com.liquidglass.demo.data.repository.SampleData
import com.liquidglass.demo.ui.components.icons.LiquidCheckIcon
import com.liquidglass.demo.ui.components.icons.LiquidPlusIcon
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlassPill
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun WorkspaceScreen(
    onNewNoteClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent
    val isDark = colors.isDarkMode

    var selectedTagFilter by remember { mutableStateOf("All") }
    val tagsList = remember { listOf("All", "Optimization", "Optics", "Animation", "Architecture") }

    val itemsList = remember {
        mutableStateListOf<WorkspaceItem>().apply {
            addAll(SampleData.sampleWorkspaceItems)
        }
    }

    val completedMap = remember {
        mutableStateMapOf<String, Boolean>().apply {
            SampleData.sampleWorkspaceItems.forEach { put(it.id, it.isCompleted) }
        }
    }

    val filteredItems = remember(selectedTagFilter, itemsList, completedMap) {
        if (selectedTagFilter == "All") {
            itemsList
        } else {
            itemsList.filter { it.tag.equals(selectedTagFilter, ignoreCase = true) }
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Workspace Header Banner
        item {
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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Interactive Glass Canvas",
                            style = typography.displayMedium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Optical refraction tokens and reactive architecture notes.",
                            style = typography.bodyMedium.copy(color = colors.textSecondary)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Quick Add Button
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .bouncyClick(scaleDown = 0.88f, onClick = onNewNoteClick)
                            .liquidGlass(
                                shape = CircleShape,
                                elevation = 6.dp,
                                borderWidth = 1.4.dp,
                                backgroundBrush = accent.brush
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        LiquidPlusIcon(color = Color.White)
                    }
                }
            }
        }

        // Tag Filter Chips Row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                tagsList.forEach { tag ->
                    val isSelected = tag == selectedTagFilter
                    Box(
                        modifier = Modifier
                            .bouncyClick(onClick = { selectedTagFilter = tag })
                            .liquidGlassPill(
                                shape = RoundedCornerShape(50),
                                tint = if (isSelected) accent.primary.copy(alpha = if (isDark) 0.30f else 0.20f)
                                else (if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.50f)),
                                borderColor = if (isSelected) accent.bright
                                else (if (isDark) Color.White.copy(alpha = 0.18f) else Color.White.copy(alpha = 0.70f)),
                                borderWidth = if (isSelected) 1.5.dp else 1.dp
                            )
                            .padding(horizontal = 14.dp, vertical = 7.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tag,
                            style = typography.labelSmall.copy(
                                color = if (isSelected) (if (isDark) accent.neon else accent.bright) else colors.textSecondary,
                                fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
                            )
                        )
                    }
                }
            }
        }

        // Section Title: Action Items Counter
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Canvas Notes & Tasks",
                    style = typography.titleLarge
                )
                Text(
                    text = "${completedMap.values.count { it }}/${itemsList.size} Completed",
                    style = typography.labelSmall.copy(color = colors.textTertiary)
                )
            }
        }

        // Workspace Item Cards
        items(filteredItems, key = { it.id }) { item ->
            val isDone = completedMap[item.id] == true

            WorkspaceCard(
                item = item,
                isCompleted = isDone,
                onToggle = {
                    completedMap[item.id] = !isDone
                }
            )
        }
    }
}

@Composable
private fun WorkspaceCard(
    item: WorkspaceItem,
    isCompleted: Boolean,
    onToggle: () -> Unit
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val isDark = colors.isDarkMode

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .bouncyClick(scaleDown = 0.98f, onClick = onToggle)
            .liquidGlass(
                shape = RoundedCornerShape(22.dp),
                elevation = if (isCompleted) 2.dp else 5.dp,
                borderWidth = 1.2.dp
            )
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            // Checkbox Circle
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(
                        if (isCompleted) item.accentColor
                        else (if (isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.70f))
                    )
                    .then(
                        if (!isCompleted) {
                            Modifier.liquidGlassPill(
                                shape = CircleShape,
                                borderColor = item.accentColor.copy(alpha = if (isDark) 0.60f else 0.50f),
                                borderWidth = 1.5.dp
                            )
                        } else Modifier
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    LiquidCheckIcon(color = Color.White)
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.title,
                        style = typography.titleMedium.copy(
                            textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                            color = if (isCompleted) colors.textTertiary else colors.textPrimary
                        ),
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    // Tag Pill
                    Box(
                        modifier = Modifier
                            .liquidGlassPill(
                                tint = item.accentColor.copy(alpha = if (isDark) 0.20f else 0.12f),
                                borderColor = item.accentColor.copy(alpha = if (isDark) 0.50f else 0.35f)
                            )
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = item.tag,
                            style = typography.labelSmall.copy(
                                color = if (isDark) Color.White else item.accentColor,
                                fontSize = 9.5.sp,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = item.content,
                    style = typography.bodyMedium.copy(
                        color = if (isCompleted) colors.textTertiary else colors.textSecondary
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = item.timeAgo,
                    style = typography.labelSmall.copy(color = colors.textTertiary)
                )
            }
        }
    }
}
