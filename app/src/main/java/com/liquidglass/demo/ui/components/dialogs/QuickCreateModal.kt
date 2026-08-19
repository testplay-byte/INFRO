package com.liquidglass.demo.ui.components.dialogs

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import com.liquidglass.demo.ui.components.icons.LiquidAnalyticsIcon
import com.liquidglass.demo.ui.components.icons.LiquidCloseIcon
import com.liquidglass.demo.ui.components.icons.LiquidFolderIcon
import com.liquidglass.demo.ui.components.icons.LiquidPlusIcon
import com.liquidglass.demo.ui.components.icons.LiquidWorkspaceIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidRed
import com.liquidglass.demo.ui.theme.LiquidYellow
import com.liquidglass.demo.ui.theme.LocalLiquidColors
import com.liquidglass.demo.ui.theme.LocalLiquidTypography

@Composable
fun QuickCreateModal(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onOptionSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current
    val accent = colors.activeAccent

    AnimatedVisibility(
        visible = isOpen,
        enter = fadeIn(animationSpec = tween(200)),
        exit = fadeOut(animationSpec = tween(200))
    ) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.35f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onDismiss
                ),
            contentAlignment = Alignment.BottomCenter
        ) {
            AnimatedVisibility(
                visible = isOpen,
                enter = scaleIn(
                    initialScale = 0.88f,
                    animationSpec = LiquidPhysics.BouncySpringSpec
                ),
                exit = scaleOut(
                    targetScale = 0.88f,
                    animationSpec = tween(200)
                )
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 32.dp)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = {}
                        )
                        .liquidGlass(
                            shape = RoundedCornerShape(32.dp),
                            elevation = 20.dp,
                            borderWidth = 1.5.dp,
                            backgroundBrush = Brush.verticalGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.95f),
                                    Color.White.copy(alpha = 0.82f)
                                )
                            )
                        )
                        .padding(24.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        // Modal Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Quick Creation",
                                    style = typography.titleLarge
                                )
                                Text(
                                    text = "Choose an item to generate in liquid space",
                                    style = typography.bodyMedium.copy(color = colors.textTertiary)
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .bouncyClick(onClick = onDismiss)
                                    .liquidGlass(
                                        shape = CircleShape,
                                        elevation = 2.dp,
                                        borderWidth = 1.dp
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                LiquidCloseIcon(color = colors.textPrimary)
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Action Options
                        QuickCreateTile(
                            title = "New Liquid Project",
                            subtitle = "Configure shaders, canvas layers & physics",
                            accentColor = LiquidBlue,
                            icon = { LiquidFolderIcon(color = Color.White, isFilled = true) },
                            onClick = {
                                onOptionSelected("New Project")
                                onDismiss()
                            }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        QuickCreateTile(
                            title = "Add Sprint Milestone",
                            subtitle = "Schedule velocity deadlines & objectives",
                            accentColor = LiquidYellow,
                            icon = { LiquidAnalyticsIcon(color = Color.White, isFilled = true) },
                            onClick = {
                                onOptionSelected("New Milestone")
                                onDismiss()
                            }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        QuickCreateTile(
                            title = "Glass Canvas Note",
                            subtitle = "Place a translucent note on workspace canvas",
                            accentColor = LiquidRed,
                            icon = { LiquidWorkspaceIcon(color = Color.White, isFilled = true) },
                            onClick = {
                                onOptionSelected("New Glass Note")
                                onDismiss()
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickCreateTile(
    title: String,
    subtitle: String,
    accentColor: Color,
    icon: @Composable () -> Unit,
    onClick: () -> Unit
) {
    val colors = LocalLiquidColors.current
    val typography = LocalLiquidTypography.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .bouncyClick(onClick = onClick)
            .liquidGlass(
                shape = RoundedCornerShape(20.dp),
                elevation = 2.dp,
                borderWidth = 1.dp,
                backgroundBrush = Brush.horizontalGradient(
                    colors = listOf(
                        accentColor.copy(alpha = 0.08f),
                        Color.White.copy(alpha = 0.65f)
                    )
                )
            )
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(accentColor),
                contentAlignment = Alignment.Center
            ) {
                icon()
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = typography.titleMedium.copy(fontSize = 15.sp)
                )
                Text(
                    text = subtitle,
                    style = typography.labelSmall.copy(color = colors.textSecondary)
                )
            }
        }
    }
}
