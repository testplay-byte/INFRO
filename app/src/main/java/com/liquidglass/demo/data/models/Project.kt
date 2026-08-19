package com.liquidglass.demo.data.models

import androidx.compose.ui.graphics.Color

enum class ProjectCategory(val label: String) {
    ALL("All Projects"),
    ACTIVE("Active"),
    IN_REVIEW("In Review"),
    COMPLETED("Completed"),
    STARRED("Starred")
}

enum class ProjectPriority(val label: String) {
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High"),
    URGENT("Urgent")
}

data class TeamMember(
    val name: String,
    val role: String,
    val initials: String,
    val accentColor: Color
)

data class Project(
    val id: String,
    val title: String,
    val description: String,
    val category: ProjectCategory,
    val progress: Float, // 0.0f to 1.0f
    val priority: ProjectPriority,
    val accentColor: Color,
    val dueDate: String,
    val tasksCompleted: Int,
    val totalTasks: Int,
    val team: List<TeamMember>,
    val tags: List<String>,
    val isStarred: Boolean = false,
    val isFeatured: Boolean = false
)

data class MetricStat(
    val id: String,
    val title: String,
    val value: String,
    val changeText: String,
    val isPositive: Boolean,
    val accentColor: Color,
    val iconType: MetricIconType
)

enum class MetricIconType {
    VELOCITY,
    TASKS,
    EFFICIENCY,
    COLLABORATORS
}

data class WorkspaceItem(
    val id: String,
    val title: String,
    val content: String,
    val tag: String,
    val isCompleted: Boolean = false,
    val accentColor: Color,
    val timeAgo: String
)
