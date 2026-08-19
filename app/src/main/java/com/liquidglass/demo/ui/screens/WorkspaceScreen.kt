package com.liquidglass.demo.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.liquidglass.demo.data.models.WorkspaceItem
import com.liquidglass.demo.data.repository.SampleData
import com.liquidglass.demo.ui.components.icons.LiquidCheckIcon
import com.liquidglass.demo.ui.components.icons.LiquidPlusIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
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

    val completedMap = remember {
        mutableStateMapOf<String, Boolean>().apply {
            SampleData.sampleWorkspaceItems.forEach { put(it.id, it.isCompleted) }
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Workspace Header Banner
        item {
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
                                Color.White.copy(alpha = 0.60f),
                                accent.primary.copy(alpha = 0.08f)
                            )
                        )
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
                            style = typography.displayMedium.copy(fontSize = 19.sp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Dynamic reactive shader tokens and fluid architecture notes.",
                            style = typography.bodyMedium
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Quick Add Button
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .bouncyClick(onClick = onNewNoteClick)
                            .liquidGlass(
                                shape = CircleShape,
                                elevation = 4.dp,
                                borderWidth = 1.2.dp,
                                backgroundBrush = accent.brush
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        LiquidPlusIcon(color = Color.White)
                    }
                }
            }
        }

        // Section Title: Action Items
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Canvas Notes",
                    style = typography.titleLarge
                )
                Text(
                    text = "${completedMap.values.count { it }}/${SampleData.sampleWorkspaceItems.size} Resolved",
                    style = typography.labelSmall.copy(color = colors.textTertiary)
                )
            }
        }

        // Workspace Item Cards
        items(SampleData.sampleWorkspaceItems, key = { it.id }) { item ->
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

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .bouncyClick(scaleDown = 0.98f, onClick = onToggle)
            .liquidGlass(
                shape = RoundedCornerShape(22.dp),
                elevation = if (isCompleted) 1.dp else 4.dp,
                borderWidth = 1.dp,
                backgroundBrush = Brush.verticalGradient(
                    colors = if (isCompleted) {
                        listOf(
                            Color.White.copy(alpha = 0.45f),
                            Color.White.copy(alpha = 0.25f)
                        )
                    } else {
                        listOf(
                            Color.White.copy(alpha = 0.85f),
                            Color.White.copy(alpha = 0.55f)
                        )
                    }
                )
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
                        else Color.White.copy(alpha = 0.7f)
                    )
                    .then(
                        if (!isCompleted) {
                            Modifier.liquidGlassPill(
                                shape = CircleShape,
                                borderColor = item.accentColor.copy(alpha = 0.5f),
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
                        )
                    )

                    // Tag Pill
                    Box(
                        modifier = Modifier
                            .liquidGlassPill(
                                tint = item.accentColor.copy(alpha = 0.12f),
                                borderColor = item.accentColor.copy(alpha = 0.35f)
                            )
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = item.tag,
                            style = typography.labelSmall.copy(
                                color = item.accentColor,
                                fontSize = 10.sp,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
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
