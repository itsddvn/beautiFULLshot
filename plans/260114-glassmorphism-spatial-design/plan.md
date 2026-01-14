---
title: "Glassmorphism & Spatial Design Overhaul"
description: "Complete UI redesign with glass effects, floating panels, and spatial depth"
status: pending
priority: P1
effort: 6h
branch: main
tags: [ui, design, glassmorphism, tailwind]
created: 2026-01-14
---

# Glassmorphism & Spatial Design Implementation

## Overview
Transform BeautyFullShot from flat design to modern glassmorphism with spatial depth. Floating panels, glass effects, layered UI while preserving orange brand color.

## Design Principles
- **Glass Effect**: backdrop-blur, semi-transparent backgrounds, subtle borders
- **Spatial Depth**: Floating panels with margins, shadows for elevation, layered z-index
- **Brand Identity**: Orange (#f97316) accent color preserved throughout
- **Dark Mode**: Darker glass with adjusted opacity for contrast

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| 1 | [CSS Foundation](./phase-01-css-foundation.md) - Glass utilities & base styles | pending | 1h |
| 2 | [Layout Structure](./phase-02-layout-structure.md) - Spatial gaps & floating panels | pending | 1h |
| 3 | [Toolbar Redesign](./phase-03-toolbar-redesign.md) - Glass toolbar with spatial layout | pending | 1h |
| 4 | [Sidebar Redesign](./phase-04-sidebar-redesign.md) - Floating glass sidebar | pending | 1h |
| 5 | [Controls & Overlays](./phase-05-controls-overlays.md) - Zoom, toast, modals | pending | 1h |
| 6 | [Screens & Polish](./phase-06-screens-polish.md) - Permission, loading, final touches | pending | 1h |

## Files to Modify
- `src/styles.css` - Glass utilities
- `src/App.tsx` - Loading/permission screens
- `src/components/layout/editor-layout.tsx` - Spatial layout
- `src/components/toolbar/toolbar.tsx` - Glass toolbar
- `src/components/sidebar/sidebar.tsx` - Floating sidebar
- `src/components/canvas/zoom-controls.tsx` - Glass controls
- `src/components/settings/settings-modal.tsx` - Glass modal
- `src/components/capture/window-picker-modal.tsx` - Glass modal
- `src/components/common/toast.tsx` - Glass notifications
- `src/components/permission-required.tsx` - Glass permission screen

## Key Design Tokens
```css
/* Light Mode Glass */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-blur: 16px;

/* Dark Mode Glass */
--glass-bg-dark: rgba(15, 15, 15, 0.8);
--glass-border-dark: rgba(255, 255, 255, 0.1);

/* Spatial */
--panel-radius: 16px;
--panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
--gap-layout: 12px;
```

## Success Criteria
- [ ] All panels have glass effect with backdrop blur
- [ ] Spatial gaps between toolbar, canvas, sidebar
- [ ] Floating elevated panels with shadows
- [ ] Dark mode maintains glass aesthetic
- [ ] Orange accent preserved for active states
- [ ] No visual regressions on functionality
