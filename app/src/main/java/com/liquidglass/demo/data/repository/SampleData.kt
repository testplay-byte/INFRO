package com.liquidglass.demo.data.repository

import androidx.compose.ui.graphics.Color
import com.liquidglass.demo.data.models.MetricIconType
import com.liquidglass.demo.data.models.MetricStat
import com.liquidglass.demo.data.models.Project
import com.liquidglass.demo.data.models.ProjectCategory
import com.liquidglass.demo.data.models.ProjectPriority
import com.liquidglass.demo.data.models.TeamMember
import com.liquidglass.demo.data.models.WorkspaceItem
import com.liquidglass.demo.ui.theme.LiquidBlue
import com.liquidglass.demo.ui.theme.LiquidRed
import com.liquidglass.demo.ui.theme.LiquidYellow

object SampleData {

    val teamAlex = TeamMember("Alex Morgan", "Lead Architect", "AM", LiquidBlue)
    val teamSarah = TeamMember("Sarah Chen", "Design Lead", "SC", LiquidYellow)
    val teamDave = TeamMember("David Kim", "Engine Specialist", "DK", LiquidRed)
    val teamElena = TeamMember("Elena Rostova", "Shader Dev", "ER", LiquidBlue)

    val sampleProjects = listOf(
        Project(
            id = "proj-1",
            title = "Aether Liquid Canvas",
            description = "Refractive glassmorphism rendering pipeline with dynamic physics-based light scattering and realtime depth map.",
            category = ProjectCategory.ACTIVE,
            progress = 0.84f,
            priority = ProjectPriority.URGENT,
            accentColor = LiquidBlue,
            dueDate = "Aug 28",
            tasksCompleted = 21,
            totalTasks = 25,
            team = listOf(teamAlex, teamSarah, teamDave),
            tags = listOf("Graphics", "OpenGL", "Fluid Physics"),
            isStarred = true,
            isFeatured = true
        ),
        Project(
            id = "proj-2",
            title = "Solaris Design System",
            description = "Multi-surface component architecture built without rigid material constraints, emphasizing soft specular gradients.",
            category = ProjectCategory.ACTIVE,
            progress = 0.62f,
            priority = ProjectPriority.HIGH,
            accentColor = LiquidYellow,
            dueDate = "Sep 04",
            tasksCompleted = 13,
            totalTasks = 20,
            team = listOf(teamSarah, teamElena),
            tags = listOf("Design System", "Tokens", "Compose"),
            isStarred = true,
            isFeatured = false
        ),
        Project(
            id = "proj-3",
            title = "Crimson Vector Engine",
            description = "High-performance vector geometry renderer with instant bezier curve deformation and kinetic spring damping.",
            category = ProjectCategory.IN_REVIEW,
            progress = 0.95f,
            priority = ProjectPriority.HIGH,
            accentColor = LiquidRed,
            dueDate = "Aug 24",
            tasksCompleted = 38,
            totalTasks = 40,
            team = listOf(teamDave, teamAlex),
            tags = listOf("Vector", "Performance", "Math"),
            isStarred = false,
            isFeatured = false
        ),
        Project(
            id = "proj-4",
            title = "Nebula Glass Studio",
            description = "Interactive workspace canvas enabling designers to prototype layered glass optics and real-time refractive filters.",
            category = ProjectCategory.ACTIVE,
            progress = 0.45f,
            priority = ProjectPriority.MEDIUM,
            accentColor = LiquidBlue,
            dueDate = "Sep 15",
            tasksCompleted = 9,
            totalTasks = 20,
            team = listOf(teamAlex, teamElena, teamSarah),
            tags = listOf("Studio", "Tooling", "Optics"),
            isStarred = false,
            isFeatured = false
        ),
        Project(
            id = "proj-5",
            title = "Aura Wave Simulator",
            description = "Harmonic fluid oscillation calculations for reactive background surfaces and gesture ripple propagation.",
            category = ProjectCategory.COMPLETED,
            progress = 1.0f,
            priority = ProjectPriority.LOW,
            accentColor = LiquidYellow,
            dueDate = "Aug 12",
            tasksCompleted = 18,
            totalTasks = 18,
            team = listOf(teamDave, teamElena),
            tags = listOf("Simulation", "Audio", "Waves"),
            isStarred = true,
            isFeatured = false
        ),
        Project(
            id = "proj-6",
            title = "Ignite Telemetry Core",
            description = "Zero-overhead profiling and render-frame budget monitoring with glass dashboard visualization widgets.",
            category = ProjectCategory.IN_REVIEW,
            progress = 0.78f,
            priority = ProjectPriority.HIGH,
            accentColor = LiquidRed,
            dueDate = "Sep 01",
            tasksCompleted = 25,
            totalTasks = 32,
            team = listOf(teamAlex, teamDave),
            tags = listOf("Telemetry", "Profiling", "Core"),
            isStarred = false,
            isFeatured = false
        )
    )

    val sampleMetrics = listOf(
        MetricStat(
            id = "m-1",
            title = "Velocity",
            value = "94.2%",
            changeText = "+12.4% this week",
            isPositive = true,
            accentColor = LiquidBlue,
            iconType = MetricIconType.VELOCITY
        ),
        MetricStat(
            id = "m-2",
            title = "Active Tasks",
            value = "126",
            changeText = "18 completed today",
            isPositive = true,
            accentColor = LiquidYellow,
            iconType = MetricIconType.TASKS
        ),
        MetricStat(
            id = "m-3",
            title = "Efficiency Index",
            value = "98.5",
            changeText = "+3.1% optimization",
            isPositive = true,
            accentColor = LiquidRed,
            iconType = MetricIconType.EFFICIENCY
        ),
        MetricStat(
            id = "m-4",
            title = "Collaborators",
            value = "18 Active",
            changeText = "4 sprint teams",
            isPositive = true,
            accentColor = LiquidBlue,
            iconType = MetricIconType.COLLABORATORS
        )
    )

    val sampleWorkspaceItems = listOf(
        WorkspaceItem(
            id = "ws-1",
            title = "Refraction Shader Optimization",
            content = "Compute blur kernel passes with downsampled multi-pass mipmaps to keep 120 FPS on all device profiles.",
            tag = "Optimization",
            isCompleted = false,
            accentColor = LiquidBlue,
            timeAgo = "10 min ago"
        ),
        WorkspaceItem(
            id = "ws-2",
            title = "Specular Highlight Gradient Curve",
            content = "Tune the top-left linear gradient stop from 0.85 opacity down to 0.15 for maximum glass depth feeling.",
            tag = "Optics",
            isCompleted = true,
            accentColor = LiquidYellow,
            timeAgo = "1 hour ago"
        ),
        WorkspaceItem(
            id = "ws-3",
            title = "Spring Physics Calibration",
            content = "Apply medium bouncy spring damping (stiffness = 250f, damping = 0.65f) to the floating dock expansion.",
            tag = "Animation",
            isCompleted = false,
            accentColor = LiquidRed,
            timeAgo = "3 hours ago"
        ),
        WorkspaceItem(
            id = "ws-4",
            title = "No-Material Custom Component Audit",
            content = "Verify that zero Material 3 standard containers or color tokens are referenced in custom glass modifier layers.",
            tag = "Architecture",
            isCompleted = true,
            accentColor = LiquidBlue,
            timeAgo = "Yesterday"
        )
    )
}
