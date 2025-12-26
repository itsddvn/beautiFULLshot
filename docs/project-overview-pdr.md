# BeautyShot - Project Overview & Product Development Requirements

## Project Vision

BeautyShot is a modern, cross-platform screenshot beautification tool that empowers content creators, developers, and professionals to capture and enhance screenshots with intuitive editing and annotation features. The application combines native screenshot capabilities with a powerful canvas editor, enabling users to add annotations, apply filters, and export polished visual content.

**Target Users:** Content creators, developers, technical writers, UI/UX designers
**Primary Platforms:** macOS, Linux, Windows
**Positioning:** Fast, beautiful, developer-friendly screenshot editor

---

## Product Development Requirements (PDR)

### 1. Core Functional Requirements

#### F1: Screenshot Capture
- **Requirement:** Application must capture full-screen and individual window screenshots
- **Scope:** Phase 02 ✓
- **Acceptance Criteria:**
  - Fullscreen capture works on macOS, Linux, Windows
  - Window enumeration displays all open windows
  - Window capture targets specific application window
  - Captured output: raw PNG bytes (lossless)
  - Max resolution: native screen resolution

#### F2: Canvas Editing & Viewport
- **Requirement:** Display captured screenshots in interactive canvas with zoom and pan
- **Scope:** Phase 03 ✓
- **Acceptance Criteria:**
  - Image displays correctly in Konva stage
  - Zoom: 10% to 500% (0.1x to 5x) via mouse wheel
  - Pan: click-drag to move around canvas
  - Responsive: canvas resizes with window
  - Zoom controls UI: in, out, fit-to-screen buttons
  - Performance: smooth interactions at full resolution images

#### F3: Annotation Tools
- **Requirement:** Tools to add drawings, shapes, text to screenshots
- **Scope:** Phase 04 (planned)
- **Acceptance Criteria:**
  - Brush tool with adjustable size/color
  - Shape tools: rectangle, circle, arrow
  - Text tool with font selection
  - Color picker for all tools
  - Undo/redo functionality
  - Layer management

#### F4: Beautification & Filters
- **Requirement:** Apply visual filters and enhancements
- **Scope:** Phase 05 (planned)
- **Acceptance Criteria:**
  - Pre-defined filter set (blur, brightness, contrast, etc.)
  - Real-time preview
  - Adjustable parameters
  - Non-destructive (can remove filters)

#### F5: Export & Sharing
- **Requirement:** Save edited screenshots in multiple formats
- **Scope:** Phase 06 (planned)
- **Acceptance Criteria:**
  - Export formats: PNG, JPG, WebP
  - Compression settings
  - Save to file
  - Copy to clipboard
  - Direct share to services (if Phase 07)

#### F6: Native Integration
- **Requirement:** Seamless OS integration
- **Scope:** Phase 07 (planned)
- **Acceptance Criteria:**
  - Global hotkey for screenshot
  - Tray/menu bar integration
  - Auto-open after capture
  - Context menu integration

---

### 2. Non-Functional Requirements

#### NFR1: Performance
- **Requirement:** Application must handle high-resolution images smoothly
- **Target:**
  - Full-screen capture completion: < 500ms
  - Canvas render: 60 FPS at native resolution
  - Memory: < 200MB for typical screenshots
  - Zoom/pan operations: < 16ms latency

#### NFR2: Security
- **Requirement:** Sensitive data handling and privacy
- **Implementation:**
  - Screenshots stored in memory (not cached)
  - No data collection or telemetry
  - No network requests (offline-first)
  - User controls all file I/O

#### NFR3: Compatibility
- **Requirement:** Work reliably across platforms
- **Targets:**
  - macOS 11.0+
  - Ubuntu 20.04+, Fedora 35+
  - Windows 10+
  - Touch support (future: Phase 08)

#### NFR4: User Experience
- **Requirement:** Intuitive, responsive interface
- **Implementation:**
  - < 100ms feedback for all interactions
  - Clear error messages
  - Loading indicators for async operations
  - Keyboard shortcuts for power users (Phase 08)

#### NFR5: Maintainability
- **Requirement:** Clean, well-documented codebase
- **Implementation:**
  - TypeScript strict mode
  - Component-based architecture
  - Zustand for centralized state
  - Clear separation of concerns
  - Comprehensive documentation

---

### 3. Technical Constraints

| Constraint | Details |
|-----------|---------|
| **Framework** | Tauri 2 for native integration + React 19 frontend |
| **State Management** | Zustand (lightweight, minimal boilerplate) |
| **Canvas Rendering** | Konva.js (performant 2D canvas library) |
| **Styling** | Tailwind CSS v4 (utility-first) |
| **Language** | TypeScript strict mode |
| **Screenshot Library** | xcap (Rust crate) for native captures |
| **Build Tool** | Vite for frontend bundling |

---

### 4. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Launch Time** | < 1s | Cold startup |
| **Capture Speed** | < 500ms | Full-screen capture |
| **Memory Usage** | < 200MB | Typical workflow |
| **Zoom FPS** | 60 FPS | Smooth interaction |
| **Code Coverage** | > 80% | Unit tests |
| **Platform Support** | 3 (macOS, Linux, Windows) | CI/CD validation |

---

## Architecture Decisions

### Decision 1: Tauri vs Electron
**Choice:** Tauri 2
**Rationale:**
- Native performance (Rust backend)
- Smaller bundle size (~30MB vs 150MB+)
- Better resource utilization
- macOS, Linux, Windows support
- Growing ecosystem

### Decision 2: Zustand for State
**Choice:** Zustand (not Redux/Context)
**Rationale:**
- Minimal boilerplate
- Excellent TypeScript support
- Perfect for canvas-centric app
- Easy to test and debug
- No wrapper component overhead

### Decision 3: Konva Canvas Library
**Choice:** Konva.js (not Fabric.js or Three.js)
**Rationale:**
- Excellent 2D performance
- Built-in zoom/pan support
- React wrapper (react-konva)
- Supports layers for annotations
- Active maintenance

---

## Development Roadmap

| Phase | Title | Status | Timeline |
|-------|-------|--------|----------|
| 01 | Project Setup | ✓ | Complete |
| 02 | Screenshot Capture | ✓ | Complete |
| 03 | Canvas Editor Foundation | ✓ | Complete |
| 04 | Annotation Tools | ⏳ | Next |
| 05 | Beautification Filters | ⏳ | Q1 2026 |
| 06 | Export System | ⏳ | Q1 2026 |
| 07 | Native Integration | ⏳ | Q2 2026 |
| 08 | Polish & Distribution | ⏳ | Q2 2026 |

---

## Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Wayland Screenshot Limitations** | Low | Warning displayed; fallback to X11 |
| **High-Res Image Performance** | Medium | Implement image tiling; lazy rendering |
| **Cross-Platform Divergence** | Medium | Comprehensive CI/CD testing; platform-specific handlers |
| **Annotation Complexity** | Low | Phase 04 design planned; modular implementation |
| **Export Format Support** | Low | Use native OS APIs; third-party libraries as fallback |

---

## Team & Responsibilities

| Role | Responsibility |
|------|-----------------|
| **Developer** | Implementation across all phases |
| **QA** | Testing on macOS, Linux, Windows; performance validation |
| **UX Designer** | UI/UX polish (Phase 08); user feedback integration |
| **Documentation** | Docs/wiki maintenance; user guide creation |

---

## Glossary

- **Canvas:** Konva Stage + Layers for rendering images and annotations
- **Stage:** Konva rendering surface with zoom/pan
- **Layer:** Konva grouping mechanism (image layer, annotation layer)
- **Blob URL:** JavaScript object URL created from Uint8Array bytes
- **Xcap:** Rust screenshot library used by Tauri backend
- **PDR:** Product Development Requirements (this document)

---

## References

- [Tauri 2 Documentation](https://tauri.app/v2/)
- [Konva.js API Docs](https://konvajs.org/api/Konva.html)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Xcap Screenshot Library](https://github.com/nashaofu/xcap)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-27
**Phase Completed:** 03 - Canvas Editor Foundation
**Next Phase:** 04 - Annotation Tools
