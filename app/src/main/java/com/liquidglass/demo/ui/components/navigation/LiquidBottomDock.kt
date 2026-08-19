package com.liquidglass.demo.ui.components.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Bottom Floating Dock combining the Central Navigation Bar
 * and the separate Floating Plus Button on the very right side.
 */
@Composable
fun LiquidBottomDock(
    selectedIndex: Int,
    onTabSelected: (Int) -> Unit,
    isActionModalOpen: Boolean,
    onActionClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, bottom = 24.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Central Floating Navigation Bar
        LiquidFloatingNavBar(
            selectedIndex = selectedIndex,
            onTabSelected = onTabSelected,
            modifier = Modifier.weight(1f, fill = false)
        )

        // Separate Floating Action Button on the very right side
        LiquidFloatingActionButton(
            isExpanded = isActionModalOpen,
            onClick = onActionClick,
            modifier = Modifier.padding(start = 12.dp)
        )
    }
}
