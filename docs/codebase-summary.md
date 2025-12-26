# BeautyShot Codebase Summary

## Project Overview
BeautyShot is a cross-platform screenshot beautification application built with Tauri 2, React 19, and TypeScript. It enables users to capture screenshots and apply editing/annotation tools for enhanced visual content creation.

**Version:** 0.1.0
**Tech Stack:** Tauri 2 | React 19 | TypeScript | Tailwind CSS 4 | Konva Canvas

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
**File:** `src/components/canvas/canvas-editor.tsx`

Main Konva-based canvas rendering component:
- **Responsive:** Auto-resize to container dimensions
- **Zoom:** Mouse wheel zoom with clamping (0.1x - 5x)
- **Pan:** Click-drag to pan around canvas
- **Multi-layer:** Image layer + annotation layer (placeholder for Phase 04)

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
- **EditorLayout** (`src/components/layout/editor-layout.tsx`): Main container layout with toolbar + canvas
- **ZoomControls** (`src/components/canvas/zoom-controls.tsx`): Float controls for zoom in/out, fit to screen

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

### Phase 04-08: Planned
- **Phase 04:** Annotation tools (brush, shapes, text)
- **Phase 05:** Beautification filters
- **Phase 06:** Export system
- **Phase 07:** Native integration
- **Phase 08:** Polish & distribution

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

## Known Limitations & TODO

- Annotation layer exists but is placeholder (Phase 04)
- No undo/redo system yet
- No export functionality (Phase 06)
- Wayland screenshot support limited (warning displayed)
- No touch input support yet

---

## External Resources

- [Tauri Documentation](https://tauri.app/)
- [Konva.js Canvas Library](https://konvajs.org/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [React 19 Documentation](https://react.dev/)

---

**Last Updated:** 2025-12-27
**Phase:** 03 - Canvas Editor Foundation
