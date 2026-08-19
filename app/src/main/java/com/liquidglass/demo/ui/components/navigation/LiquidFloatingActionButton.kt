package com.liquidglass.demo.ui.components.navigation

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.liquidglass.demo.ui.components.icons.LiquidPlusIcon
import com.liquidglass.demo.ui.core.LiquidPhysics
import com.liquidglass.demo.ui.core.bouncyClick
import com.liquidglass.demo.ui.core.liquidGlass
import com.liquidglass.demo.ui.core.liquidGlow
import com.liquidglass.demo.ui.theme.LocalLiquidColors

/**
 * Separate Floating Action Button with glowing liquid glass rim,
 * spring bounce effect, and rotational click animation.
 */
@Composable
fun LiquidFloatingActionButton(
    isExpanded: Boolean = false,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalLiquidColors.current
    val accent = colors.activeAccent

    val rotation by animateFloatAsState(
        targetValue = if (isExpanded) 45f else 0f,
        animationSpec = LiquidPhysics.BouncySpringSpec,
        label = "fab_rotation"
    )

    Box(
        modifier = modifier
            .size(58.dp)
            .liquidGlow(
                color = accent.primary,
                radius = 18.dp,
                alpha = 0.35f,
                offsetY = 4.dp
            )
            .bouncyClick(scaleDown = 0.90f, onClick = onClick)
            .liquidGlass(
                shape = CircleShape,
                elevation = 14.dp,
                borderWidth = 1.5.dp,
                backgroundBrush = accent.brush
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier.rotate(rotation),
            contentAlignment = Alignment.Center
        ) {
            LiquidPlusIcon(
                color = Color.White,
                strokeWidth = 2.5.dp
            )
        }
    }
}
