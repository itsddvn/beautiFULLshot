# BeautyShot Codebase Summary

## Project Overview
BeautyShot is a cross-platform screenshot beautification application built with Tauri 2, React 19, and TypeScript. It enables users to capture screenshots and apply editing/annotation tools for enhanced visual content creation.

**Version:** 1.0.0 (Production Release)
**Tech Stack:** Tauri 2 | React 19.1.0 | TypeScript | Tailwind CSS 4 | Konva 9.3.0 | Zustand 5.0.9
**Last Updated:** 2026-01-16

---

## Architecture Overview

### High-Level Structure
```
beautyshot/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── canvas/              # Canvas rendering & controls
│   │   ├── toolbar/             # Top toolbar UI
│   │   └── layout/              # Main layout structure
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand state management
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── App.tsx                   # Root app component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Tauri native backend
│   ├── src/                      # Rust backend code
│   ├── capabilities/             # Tauri permissions
│   ├── tauri.conf.json          # Tauri configuration
│   └── icons/                    # App icons
├── plans/                        # Development plans & research
├── docs/                         # Documentation (this directory)
└── package.json                  # Node dependencies
```

---

## Core Components & Systems

### 1. State Management (Zustand)
**File:** `src/stores/canvas-store.ts`

Central state store for canvas editor, managing:
- **Image Data:** `imageUrl` (blob URL), `imageBytes` (raw PNG data), dimensions
- **Canvas Viewport:** `stageWidth`, `stageHeight`, `scale`, `position`
- **Actions:** Image loading, stage sizing, zoom/pan, view reset, canvas clearing

Memory management included: automatic URL revocation on image change/clear to prevent leaks.

```typescript
// Key interface
interface CanvasState {
  imageUrl: string | null;
  imageBytes: Uint8Array | null;
  originalWidth: number;
  originalHeight: number;
  stageWidth: number;
  stageHeight: number;
  scale: number;
  position: { x: number; y: number };
  // ... action methods
}
```

### 2. Canvas Editor Component
**File:** `src/components/canvas/canvas-editor.tsx` (~379 LOC)

Main Konva-based canvas rendering component:
- **Responsive:** Auto-resize to container dimensions
- **Zoom:** Mouse wheel zoom with clamping (0.1x - 5x)
- **Pan:** Click-drag to pan around canvas
- **Multi-layer:** Background layer + Image layer + Crop overlay + Annotation layer

Dependencies: react-konva, Konva.js

### 3. Hooks

#### useImage
**File:** `src/hooks/use-image.ts`
React hook that loads image from URL and tracks loading status.
- Returns: `[HTMLImageElement | null, 'loading' | 'loaded' | 'error']`
- Used by CanvasEditor to convert URL to DOM image element for Konva

#### useScreenshot
**File:** `src/hooks/use-screenshot.ts`
Wrapper around Tauri screenshot APIs, returns raw PNG bytes.
- Methods: `captureFullscreen()`, `captureWindow(windowId)`, `getWindows()`
- Returns: `Uint8Array` for PNG image data
- Includes error/warning handling (Wayland detection)

### 4. Toolbar Component
**File:** `src/components/toolbar/toolbar.tsx`

Top toolbar UI providing:
- **Capture Screen:** Full-screen screenshot button
- **Capture Window:** Dropdown to select & capture specific windows
- **Clear:** Remove current image from canvas
- **Status Feedback:** Loading indicator, error messages, Wayland warnings
- **App Name:** "BeautyShot" branding

Integrates `useScreenshot()` and `useCanvasStore()` to flow captured bytes → store → canvas.

### 5. Layout & Control Components
- **EditorLayout** (`src/components/layout/editor-layout.tsx`): Main container layout with toolbar + canvas + sidebar
- **ZoomControls** (`src/components/canvas/zoom-controls.tsx`): Float controls for zoom in/out, fit to screen

### 6. Phase 05: Beautification Features (Complete)

#### Background Layer Component
**File:** `src/components/canvas/background-layer.tsx`

Renders beautified backgrounds behind the image with support for:
- **Gradient Backgrounds:** 24 presets with linear/radial directions
- **Solid Colors:** 6 pre-defined colors (white, black, gray, red, blue, green)
- **Transparent Mode:** Checkerboard pattern (10px squares) to show transparency
- **Padding:** 0-200px margin around the image for spacing
- **Border Feature:** Customizable border with color picker and opacity control (1-100px stroke width)

Uses Konva Shape or Rect components for canvas rendering. Gradient angles calculated from degrees.

#### Crop Overlay Component
**File:** `src/components/canvas/crop-overlay.tsx`

Non-destructive crop tool providing:
- **Draggable Crop Box:** White dashed rectangle
- **Aspect Ratio Support:** 1:1, 4:3, 3:2, 16:9, 21:9, 9:16, 3:4, or freeform
- **Transformer Handle:** Resize from corners/edges with visual feedback
- **Dimmed Overlay:** Shows area outside crop region
- **Minimum Size:** 50px to prevent invalid crops

Crop rect stored in `useCropStore`; applied during export (Phase 06).

#### Sidebar Panel Components
**File:** `src/components/sidebar/background-panel.tsx` & `crop-panel.tsx`

Right sidebar UI panels for:
- **Background Panel:** Grid of gradient presets, solid color buttons, transparent toggle, padding slider, border color picker, border width slider
- **Crop Panel:** Aspect ratio selector, crop mode toggle, apply/cancel buttons

#### Color Picker Component (NEW)
**File:** `src/components/ui/color-picker.tsx` (~469 LOC)

Modal-based color picker with:
- Hex color input validation
- Opacity/alpha slider (0-100%)
- 2x2 color grid presets for quick selection
- Real-time preview
- Modal dialog pattern with confirm/cancel buttons

### 7. State Management (Phase 05)

#### Background Store
**File:** `src/stores/background-store.ts`

Manages background beautification state:
- `type`: 'gradient' | 'solid' | 'transparent'
- `gradient`: Selected GradientPreset object
- `solidColor`: Hex color string
- `padding`: 0-200px (clamped)
- `borderColor`: Hex color string for border
- `borderWidth`: 1-100px stroke width
- `borderOpacity`: 0-1 (0-100%)

Actions: `setGradient()`, `setSolidColor()`, `setTransparent()`, `setPadding()`, `setBorderColor()`, `setBorderWidth()`, `setBorderOpacity()`, `reset()`

#### Crop Store
**File:** `src/stores/crop-store.ts`

Manages crop tool state:
- `isCropping`: Toggle crop mode on/off
- `cropRect`: Position & dimensions of crop selection
- `aspectRatio`: Ratio constraint (null = freeform)

Actions: `startCrop()`, `setCropRect()`, `applyCrop()`, `cancelCrop()`, `setAspectRatio()`

### 8. Data Constants (Phase 05)

**File:** `src/data/gradients.ts`
- `GRADIENT_PRESETS`: 24 presets (Blues, Purples, Warm, Greens, Neutrals, Vibrant, Soft, Dark)
- `SOLID_COLORS`: 6 colors

**File:** `src/data/aspect-ratios.ts`
- `ASPECT_RATIOS`: 8 presets including Free, Square, Widescreen, Portrait variants

---

## Development Workflow

### Build & Run
```bash
npm install              # Install dependencies
npm run dev             # Dev server with Tauri
npm run build           # Production build
```

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.0 | UI framework |
| zustand | 5.0.9 | State management |
| konva | 9.3.0 | Canvas rendering |
| react-konva | 18.2.10 | React bindings for Konva |
| @tauri-apps/api | 2.x | Tauri API access |
| tailwindcss | 4 | Utility-first CSS |

---

## Phase-Wise Implementation

### Phase 01: Project Setup ✓
- Tauri v2 + React 19 + TypeScript initialization
- Tailwind CSS v4 configuration
- Basic project structure

### Phase 02: Screenshot Capture ✓
- Native screenshot capabilities via Tauri + xcap
- Window enumeration
- Raw PNG byte generation

### Phase 03: Canvas Editor Foundation ✓
- Zustand state management implementation
- Konva canvas rendering with zoom/pan
- Image loading pipeline (bytes → store → canvas)
- Responsive toolbar with capture controls
- Zoom controls UI

### Phase 04: Annotation Tools ✓
- Brush tool with adjustable size/color/opacity
- Shape tools: rectangle, circle, arrow, text
- Color picker integration
- Layer management (drawing order control)
- Undo/redo functionality

### Phase 05: Beautification Features ✓
- Gradient backgrounds (24 presets)
- Solid color backgrounds (6 colors)
- Transparent mode with checkerboard pattern
- Padding control (0-200px around image)
- Non-destructive crop tool with aspect ratios
- Right sidebar panel for quick access

### Phase 06: Export System ✓
- PNG/JPEG/WebP export with quality settings
- 1x/2x/3x resolution scaling
- Crop application during export
- Clipboard copy functionality
- File dialog integration

### Phase 07: Native Integration ✓
- Global hotkey registration (Cmd/Ctrl+Shift+C)
- System tray/menu bar icon
- System notifications
- Auto-save quick export

### Phase 08: Polish & Distribution ✓
- macOS entitlements & permissions (screen recording)
- Linux desktop entry & AppImage packaging
- Windows NSIS installer configuration
- CI/CD workflows (GitHub Actions)
- Release automation with multi-platform builds
- v1.0.0 stable release

---

## Data Flow

```
Capture Action (Toolbar)
    ↓
useScreenshot() hook → raw Uint8Array bytes
    ↓
getImageDimensions() helper → extract width/height
    ↓
useCanvasStore.setImageFromBytes() → store bytes + dimensions
    ↓
Zustand creates blob URL from bytes
    ↓
useImage() hook loads URL → HTMLImageElement
    ↓
CanvasEditor renders via react-konva Stage
```

---

## Type Definitions
**File:** `src/types/screenshot.ts`

```typescript
interface WindowInfo {
  id: number;
  app_name: string;
  title: string;
}
```

---

## Code Standards

### File Organization
- Components in `src/components/`, organized by feature
- Custom hooks in `src/hooks/`
- State stores in `src/stores/`
- Type definitions in `src/types/`
- Utilities in `src/utils/`

### Naming Conventions
- **Components:** PascalCase (e.g., `CanvasEditor`)
- **Hooks:** camelCase with `use` prefix (e.g., `useCanvasStore`)
- **Functions:** camelCase (e.g., `captureFullscreen()`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_SCALE`)

### React Patterns
- Functional components with hooks
- Custom hooks for logic extraction
- Zustand for global state (no prop drilling)
- useCallback for event handlers to prevent re-renders

---

## Memory & Performance Notes

1. **Blob URL Management:** Canvas store automatically revokes old URLs to prevent memory leaks
2. **Responsive Canvas:** Stage auto-resizes with window; event listeners cleaned up on unmount
3. **Image Loading:** Hook prevents multiple simultaneous loads; cleans up event listeners
4. **Zoom Clamping:** Scale constrained to 0.1x - 5x to prevent UI freezing

---

## Annotation Tools (Phase 04) ✓

All 7 annotation types fully implemented:
- **Shapes:** Rectangle, Ellipse with fill/stroke control
- **Lines:** Direct line + Arrow with customizable pointers
- **Freehand:** Brush with variable stroke width
- **Text:** Click-to-place with font family/size selection
- **Spotlight:** Highlight effect with transparent overlay
- **Selection:** Move/resize via transformer handles
- **Undo/Redo:** Full history with 50 snapshot limit

## Export System (Phase 06) ✓

Comprehensive export capabilities:
- **Formats:** PNG (lossless) + JPEG (quality slider 0.1-1.0)
- **Resolution:** 1x/2x/3x pixel ratios for scaling
- **Destinations:** Quick save + Save As dialog with path persistence
- **Clipboard:** Direct copy to system clipboard
- **Crop Integration:** Applied during export (non-destructive)
- **Notifications:** Toast feedback via settings

## Native Integration (Phase 07) ✓

OS-level integration features:
- **Hotkeys:** Globally registered shortcuts synced with Tauri backend
- **System Tray:** Minimize/restore via tray icon with menu
- **Notifications:** System notifications for export status
- **Themes:** Light/dark/system auto-detection
- **Settings:** Hotkey customization, auto-save location, minimize to tray

## Known Limitations

- **Wayland:** Limited screenshot support (X11 recommended on Linux)
- **Touch:** No touch event handling for mobile/tablet devices
- **Multi-Monitor:** Region capture works on primary monitor only
- **Clipboard:** PNG-only format (no text or metadata)

---

## External Resources

- [Tauri Documentation](https://tauri.app/)
- [Konva.js Canvas Library](https://konvajs.org/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [React 19 Documentation](https://react.dev/)

---

## Phase 08: Distribution & Packaging

### Platform-Specific Build Configuration
**File:** `src-tauri/tauri.conf.json`

Multi-platform distribution targets:
- **macOS:** Universal binary (Intel + Apple Silicon), DMG installer, Code signing ready
- **Windows:** x86_64 NSIS installer with language selector
- **Linux:** AppImage + DEB packages for Debian/Ubuntu distributions
- **Common:** Icon bundling (32x32, 128x128, ICNS, ICO), metadata (name, version, copyright)

### macOS Permissions & Security
**Files:** `src-tauri/Info.plist`, `src-tauri/entitlements.plist`

- **Screen Recording:** NSScreenCaptureDescription explains permission request to users
- **Sandbox:** Disabled for screen capture access
- **File Access:** User-selected file read/write permitted for exports
- **Minimum OS:** 11.0 (Big Sur)

### Linux Distribution
**File:** `src-tauri/beautyfullshot.desktop`

Linux desktop entry for:
- Application menu integration
- System launcher registration
- Icon and category classification
- AppImage & DEB package support

### CI/CD Pipeline
**Files:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`

**CI Workflow:**
- Runs on: push to master/main, pull requests
- Steps: Dependency install, TypeScript check, tests with coverage, Rust cargo check
- Node 20, Rust latest, Ubuntu Linux build environment

**Release Workflow:**
- Triggers on version tags (v*)
- Matrix builds: macOS aarch64 + x86_64, Windows x86_64, Linux x86_64
- Cross-platform build matrix with platform-specific dependencies
- Auto-creates GitHub release with signed/unsigned binaries
- Tests included in release job (npm test, tsc check)

### Release Configuration
- **Signing:** TAURI_SIGNING_PRIVATE_KEY secrets for release signing
- **Drafts:** Releases created as drafts (manual review before publish)
- **Assets:** Binaries automatically uploaded to GitHub releases

---

**Last Updated:** 2026-01-16
**Phase:** 08 - Polish & Distribution ✓ (Complete + Active Enhancements)
**Release:** v1.0.0 - Production Ready
**Frontend:** ~14,000 LOC across 76 files (expanded with new UI components and features)
**Backend:** ~750 LOC across 10 Rust files (overlay window management improvements)
