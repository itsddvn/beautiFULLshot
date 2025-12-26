---
title: "BeautyFullShot - Cross-platform Screenshot Beautifier"
description: "Tauri v2 + React + Konva app for screenshot capture, annotation, and beautification"
status: in_progress
phase-03-completed: 2025-12-27
priority: P1
effort: 36h
branch: master
tags: [tauri, react, konva, screenshot, desktop-app]
created: 2025-12-26
---

# BeautyShot Implementation Plan

Cross-platform screenshot beautification app inspired by Winshot. Built with Tauri v2 (Rust) + React + TypeScript + react-konva.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Tauri v2.x |
| Backend | Rust + xcap crate |
| Frontend | React 18 + TypeScript + Vite |
| Canvas | react-konva 18.x + konva |
| Styling | Tailwind CSS |
| Plugins | global-shortcut, notification |

## Phases Overview

| Phase | Title | Status | Effort | File |
|-------|-------|--------|--------|------|
| 01 | Project Setup & Scaffolding | ✅ DONE | 2h | [phase-01](./phase-01-project-setup.md) |
| 02 | Screenshot Capture | ✅ DONE | 4h | [phase-02](./phase-02-screenshot-capture.md) |
| 03 | Canvas Editor Foundation | ✅ DONE | 4h | [phase-03](./phase-03-canvas-editor.md) |
| 04 | Annotation Tools | pending | 6h | [phase-04](./phase-04-annotation-tools.md) |
| 05 | Beautification Features | pending | 4h | [phase-05](./phase-05-beautification.md) |
| 06 | Export System | pending | 3h | [phase-06](./phase-06-export-system.md) |
| 07 | Native OS Integration | pending | 5h | [phase-07](./phase-07-native-integration.md) |
| 08 | Polish & Distribution | pending | 4h | [phase-08](./phase-08-polish-distribution.md) |

## Target Platforms

- Windows 10+ (x64)
- macOS 11+ (Intel & Apple Silicon)
- Ubuntu 22.04+ (X11, Wayland partial)

## Success Metrics

- Bundle size: < 15MB
- Cold start: < 1s
- RAM usage: < 100MB idle
- All Winshot annotation tools working
- Screenshot capture on all 3 platforms

## Dependencies

```toml
# Rust (Cargo.toml)
xcap = "0.8"
tauri = "2.0"
tauri-plugin-global-shortcut = "2.0"
tauri-plugin-notification = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

```json
// package.json
"react": "^18.3.0",
"react-konva": "^18.2.10",
"konva": "^9.3.0",
"@tauri-apps/api": "^2.0.0"
```

## Validation Summary

**Validated:** 2025-12-26 (Re-validated)
**Questions asked:** 8 total (5 initial + 3 re-validate)

### Confirmed Decisions

**Round 1 (Initial):**
- **Undo/Redo**: Add in Phase 4 (+2h effort)
- **Linux Wayland**: X11 only, warn when Wayland detected
- **Settings persistence**: localStorage
- **Auto-update**: Add in Phase 8 (+2h effort, use tauri-plugin-updater)
- **Default hotkey**: Cmd/Ctrl+Shift+C

**Round 2 (Re-validate):**
- **Project name**: `BeautyFullShot` (play on "full platform support")
- **macOS notarization**: Defer to later (ship unsigned first)
- **State management**: Zustand (keep as planned)
- **UI components**: Pure Tailwind (no library)
- **i18n**: English + Vietnamese from start
- **Default export**: PNG
- **License**: MIT

### Action Items
- [x] Phase 01: Rename project to `BeautyFullShot` ✅
- [ ] Phase 04: Add undo/redo với Zustand temporal middleware
- [x] Phase 02: Add Wayland detection + warning ✅
- [ ] Phase 07: Add i18n support (English + Vietnamese)
- [ ] Phase 08: Add tauri-plugin-updater integration
- [x] Add LICENSE file (MIT) ✅

---

## Unresolved Questions

1. ~~Undo/redo mechanism?~~ → **RESOLVED: Phase 4**
2. ~~macOS notarization?~~ → **RESOLVED: Defer**
3. ~~Wayland support?~~ → **RESOLVED: X11 only**

**All questions resolved. Ready for implementation.**
