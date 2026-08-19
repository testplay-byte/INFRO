# 🌊 Liquid Glass Android Application Demo

A modern, fluid, and liquid glass-inspired Android demo application built completely with **Jetpack Compose**.

![Architecture](https://img.shields.io/badge/Architecture-Modular%20Compose-blue)
![Theme](https://img.shields.io/badge/Design-Liquid%20Glass%20%7C%20No%20M3-success)
![Build](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange)

---

## ✨ Features & Visual Architecture

- **Translucent Frosted Glass Surfaces**: Custom Jetpack Compose modifiers (`liquidGlass()`, `liquidGlassPill()`) with multi-layered specular edge highlights and inner reflection glares.
- **Organic Animated Refraction Canvas**: Dynamic floating gradient orbs in **Electric Blue**, **Radiant Yellow**, and **Coral Red** that drift underneath glass cards to generate real refractive depth.
- **Top Circular 3-Line Menu Button**: Frosted glass circular hamburger button triggering the themed sidebar drawer.
- **Sliding Liquid Sidebar (Drawer)**: Themed with user profile, navigation destinations, dynamic system stats, and an interactive theme accent switcher.
- **Floating Central Navigation Dock**: 3-option pill dock (*Projects*, *Analytics*, *Workspace*). Active tabs smoothly expand using spring physics to display both the vector icon and title.
- **Separate Floating Action Button (+)**: Glowing liquid gradient button with rotational click physics that summons the *Quick Creation* sheet.
- **Zero Material 3 Look & Zero Emojis**: Pure custom design system using custom vector paths and Compose primitives.

---

## 🏗️ Project Structure

```
app/src/main/java/com/liquidglass/demo/
├── MainActivity.kt
├── data/
│   ├── models/           # Project, MetricStat, WorkspaceItem data structures
│   └── repository/       # Sample data repository
└── ui/
    ├── theme/            # Color tokens, Typography, Ambient theme controller
    ├── core/             # Liquid glass modifiers, Spring physics, Glow
    ├── components/
    │   ├── background/   # Animated organic liquid canvas
    │   ├── topbar/       # Top header with circular 3-line menu button
    │   ├── drawer/       # Sliding liquid glass drawer & accent switcher
    │   ├── navigation/   # Floating 3-tab dock & separate floating action button
    │   ├── cards/        # Hero project banner, grid cards & metric tiles
    │   ├── dialogs/      # Quick create modal sheet
    │   └── icons/        # Bespoke vector icons
    └── screens/
        ├── MainScaffoldScreen.kt
        ├── ProjectsHomeScreen.kt
        ├── AnalyticsScreen.kt
        └── WorkspaceScreen.kt
```

---

## 🚀 CI/CD & Automated APK Build

The application uses **GitHub Actions** (`.github/workflows/build-apk.yml`) to automatically compile the Android APK on every push to `main`.

1. **Workflow Artifacts**: The compiled APK (`LiquidGlass-Demo-APK`) is uploaded to the Actions run summary.
2. **GitHub Releases**: An automated release tag `v1.0.0` is published with `app-debug.apk` directly downloadable.
