package com.liquidglass.demo.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.liquidglass.demo.ui.components.background.AnimatedLiquidCanvas
import com.liquidglass.demo.ui.components.dialogs.QuickCreateModal
import com.liquidglass.demo.ui.components.drawer.LiquidDrawerMenu
import com.liquidglass.demo.ui.components.navigation.LiquidBottomDock
import com.liquidglass.demo.ui.components.topbar.LiquidHeaderBar

@Composable
fun MainScaffoldScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    var isDrawerOpen by remember { mutableStateOf(false) }
    var isQuickCreateOpen by remember { mutableStateOf(false) }

    val screenTitle = when (selectedTab) {
        0 -> "Projects"
        1 -> "Analytics"
        2 -> "Workspace"
        else -> "Projects"
    }

    val screenSubtitle = when (selectedTab) {
        0 -> "Liquid Pipeline"
        1 -> "Live Telemetry"
        2 -> "Canvas Notes"
        else -> "Liquid Studio"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
    ) {
        // Layer 1: Animated Refractive Liquid Canvas Background
        AnimatedLiquidCanvas()

        // Layer 2: Main Screen Content & Header
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // Liquid Top Header Bar with Circular 3-Line Menu Button
            LiquidHeaderBar(
                title = screenTitle,
                subtitle = screenSubtitle,
                onMenuClick = { isDrawerOpen = true },
                onSearchClick = { /* Search trigger */ },
                onNotificationClick = { /* Notification trigger */ }
            )

            // Animated Screen Switching
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
            ) {
                AnimatedContent(
                    targetState = selectedTab,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(250))
                    },
                    label = "screen_transition"
                ) { targetScreen ->
                    when (targetScreen) {
                        0 -> ProjectsHomeScreen()
                        1 -> AnalyticsScreen()
                        2 -> WorkspaceScreen(
                            onNewNoteClick = { isQuickCreateOpen = true }
                        )
                    }
                }
            }
        }

        // Layer 3: Central Floating Navigation Bar + Floating (+) Action Button
        LiquidBottomDock(
            selectedIndex = selectedTab,
            onTabSelected = { selectedTab = it },
            isActionModalOpen = isQuickCreateOpen,
            onActionClick = { isQuickCreateOpen = true },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
        )

        // Layer 4: Quick Create Modal Dialog
        QuickCreateModal(
            isOpen = isQuickCreateOpen,
            onDismiss = { isQuickCreateOpen = false },
            onOptionSelected = { /* Action handling */ }
        )

        // Layer 5: Liquid Sidebar / Drawer
        LiquidDrawerMenu(
            isOpen = isDrawerOpen,
            currentTab = selectedTab,
            onTabSelected = { selectedTab = it },
            onClose = { isDrawerOpen = false }
        )
    }
}
