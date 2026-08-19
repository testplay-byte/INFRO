# 🌊 Liquid Glass Android Application Demo v2.0

A modern, fluid, and deep optical liquid glass-inspired Android demo application built with **Jetpack Compose**.

![Architecture](https://img.shields.io/badge/Architecture-Modular%20Compose-blue)
![Theme](https://img.shields.io/badge/Design-Liquid%20Glass%20%7C%20No%20M3-success)
![Theme-Mode](https://img.shields.io/badge/Theme-Obsidian%20Dark%20%26%20Frost%20Light-purple)
![Build](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange)

---

## ✨ Features & Visual Architecture

- **Deep Optical Liquid Glass Refraction**: Multi-pass specular edge highlights, curved glass caustics, and animated liquid light shimmers.
- **Dual Dynamic Theme Engine**: Full **Deep Obsidian Dark Mode** (`#070B12` with glowing dark crystal glass) + **Iridescent Frost Light Mode**, toggleable instantly via top bar or drawer.
- **Top & Bottom Scroll Fade Masks**: Transitioning gradient blur scrims that dissolve scrolling lists into a frosted atmospheric haze under headers and docks.
- **Top Circular 3-Line Menu Button**: Frosted glass circular hamburger button triggering the themed sidebar drawer.
- **Sliding Liquid Sidebar (Drawer)**: Themed with user profile, segmented Light/Dark mode switcher, accent selectors (Blue/Yellow/Red), and system metrics.
- **Revamped Floating Navigation Dock**: High-contrast text readability, active glowing pill indicator with spring expansion (*Projects*, *Telemetry*, *Workspace*).
- **Separate Floating Action Button (+)**: Glowing liquid gradient button with rotational click physics that summons the *Quick Creation* modal.
- **Interactive Workspace Canvas**: Live note creation, tag filters, completion toggles, and clean spacious layout.
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
    ├── theme/            # Dual-theme engine, Typography, Color tokens
    ├── core/             # Optical glass modifiers, Spring physics, Glow
    ├── components/
    │   ├── background/   # Animated organic liquid canvas
    │   ├── common/       # Top & Bottom scroll fade masks
    │   ├── topbar/       # Top header with circular 3-line menu & theme switch
    │   ├── drawer/       # Sliding liquid glass drawer & appearance switcher
    │   ├── navigation/   # Floating 3-tab dock & separate floating action button
    │   ├── cards/        # Hero project banner, grid cards & metric tiles
    │   ├── dialogs/      # Quick create modal sheet
    │   └── icons/        # Bespoke vector icons & Sun/Moon morphing icon
    └── screens/
        ├── MainScaffoldScreen.kt
        ├── ProjectsHomeScreen.kt
        ├── AnalyticsScreen.kt
        └── WorkspaceScreen.kt
```

---

## 🚀 Automated APK Build & Release

The application uses **GitHub Actions** (`.github/workflows/build-apk.yml`) to automatically compile the Android APK on every push to `main`.

1. **Workflow Artifacts**: The compiled APK (`LiquidGlass-Demo-v2-APK`) is uploaded to the Actions run summary.
2. **GitHub Releases**: An automated release tag `v2.0.0` is published with `app-debug.apk` directly downloadable.
