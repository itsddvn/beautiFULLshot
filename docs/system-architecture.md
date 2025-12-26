# BeautyShot - System Architecture

## Executive Summary

BeautyShot is a cross-platform screenshot beautification desktop application built with Tauri 2 (Rust backend) and React 19 (TypeScript frontend). The architecture emphasizes performance, memory efficiency, and clean separation between native and web components.

**Current Phase:** 03 - Canvas Editor Foundation
**Tech Stack:** Tauri 2 | React 19 | TypeScript | Zustand | Konva.js | Tailwind CSS 4

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Desktop Application                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │      React 19 Frontend (TypeScript)              │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Components:                                      │   │
│  │  • CanvasEditor (Konva Stage + Layers)          │   │
│  │  • Toolbar (Capture + Export controls)          │   │
│  │  • ZoomControls (Zoom in/out/fit)              │   │
│  │  • EditorLayout (Main layout)                   │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ State Management (Zustand):                      │   │
│  │  • canvas-store (Image + viewport state)        │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Custom Hooks:                                    │   │
│  │  • useImage (Image loading)                      │   │
│  │  • useScreenshot (Screenshot API wrapper)       │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  IPC Bridge (Tauri Command Protocol)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │      Rust Backend (Tauri 2)                      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Capabilities:                                    │   │
│  │  • captureFullscreen() → PNG bytes              │   │
│  │  • captureWindow(id) → PNG bytes                │   │
│  │  • getWindows() → [WindowInfo]                  │   │
│  │  • saveFile() → file path                       │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Operating System APIs (macOS, Linux, Windows)          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App (root)
└── EditorLayout
    ├── Toolbar
    │   ├── Capture Screen button (useScreenshot)
    │   ├── Capture Window dropdown
    │   └── Clear button
    └── Canvas Area
        ├── CanvasEditor
        │   ├── Stage (Konva)
        │   │   ├── Layer (Image)
        │   │   │   └── Image (react-konva)
        │   │   └── Layer (Annotations - Phase 04)
        │   │       └── [Shapes, Text - Phase 04+]
        │   └── Zoom/Pan handlers
        └── ZoomControls (floating)
            ├── Zoom Out button
            ├── Zoom % display
            ├── Zoom In button
            └── Fit to Screen button
```

---

## Data Flow Architecture

### Capture to Canvas Flow

```
User Action: Click "Capture Screen"
    ↓
Toolbar.handleCaptureFullscreen()
    ↓
useScreenshot.captureFullscreen()
    ↓
Tauri IPC → Backend
    ↓
xcap crate captures fullscreen → PNG bytes (Uint8Array)
    ↓
Tauri IPC → Frontend (PNG bytes)
    ↓
Toolbar.getImageDimensions(bytes)
    ↓
Create temp blob URL, load with Image element → width/height
    ↓
useCanvasStore.setImageFromBytes(bytes, width, height)
    ↓
Zustand creates blob URL from bytes: bytesToUrl(bytes)
    ↓
useImage hook loads blob URL → HTMLImageElement
    ↓
CanvasEditor receives image via useImage hook
    ↓
react-konva Stage renders Image to canvas
    ↓
Result: Screenshot displayed in interactive canvas
```

### State Flow Diagram

```
┌─────────────────────────────────────────────┐
│  useCanvasStore (Zustand)                   │
├─────────────────────────────────────────────┤
│ State:                                      │
│  • imageUrl: string | null                 │
│  • imageBytes: Uint8Array | null           │
│  • originalWidth/Height: number            │
│  • stageWidth/Height: number               │
│  • scale: number (zoom level)              │
│  • position: { x, y } (pan offset)         │
├─────────────────────────────────────────────┤
│ Actions:                                    │
│  • setImageFromBytes(bytes, w, h)          │
│  • setStageSize(w, h) - responsive         │
│  • setScale(scale) - clamps 0.1-5x        │
│  • setPosition(x, y) - pan movement       │
│  • resetView() - reset zoom/pan           │
│  • clearCanvas() - cleanup                │
└─────────────────────────────────────────────┘
         ↕ (subscribed by)
┌─────────────────────────────────────────────┐
│  Components (subscribe to relevant slices)  │
├─────────────────────────────────────────────┤
│  CanvasEditor:                              │
│   • imageUrl → useImage hook                │
│   • stageWidth/Height → responsive sizing  │
│   • scale, position → Stage transform      │
│                                             │
│  ZoomControls:                              │
│   • scale → display zoom %                  │
│   • setScale → zoom in/out                  │
│                                             │
│  Toolbar:                                   │
│   • imageUrl → enable/disable Clear button  │
│   • setImageFromBytes → after capture      │
└─────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
App.tsx
  ├── EditorLayout
  │   ├── Toolbar
  │   │   ├── useScreenshot (hook)
  │   │   │   └── screenshot-api.ts (utils)
  │   │   ├── useCanvasStore (Zustand)
  │   │   └── WindowInfo (type)
  │   │
  │   └── CanvasEditor
  │       ├── useCanvasStore (Zustand)
  │       ├── useImage (hook)
  │       └── react-konva library
  │
  └── ZoomControls
      └── useCanvasStore (Zustand)

Types:
  └── types/screenshot.ts
      └── WindowInfo interface

Stores:
  └── stores/canvas-store.ts
      └── CanvasState interface

Hooks:
  ├── hooks/use-screenshot.ts
  └── hooks/use-image.ts

Utils:
  └── utils/screenshot-api.ts
```

---

## Zustand Store Architecture

### Canvas Store Pattern

```typescript
// Single source of truth for canvas state
interface CanvasState {
  // Data layer
  imageUrl: string | null;           // Display URL (blob)
  imageBytes: Uint8Array | null;     // Raw data (memory)
  originalWidth: number;              // Image metadata
  originalHeight: number;

  // Viewport layer
  stageWidth: number;                 // Canvas size
  stageHeight: number;
  scale: number;                      // Zoom level (0.1-5)
  position: { x: number; y: number }; // Pan offset

  // Action creators
  setImageFromBytes: (bytes, w, h) => void;
  setStageSize: (w, h) => void;
  setScale: (scale) => void;
  setPosition: (x, y) => void;
  resetView: () => void;
  clearCanvas: () => void;
}

// Memory optimization: automatic blob URL cleanup
export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  imageUrl: null,
  // ...

  // Actions with memory management
  setImageFromBytes: (bytes, width, height) => {
    const oldUrl = get().imageUrl;  // Get old URL
    if (oldUrl) URL.revokeObjectURL(oldUrl);  // Clean up

    const url = bytesToUrl(bytes);  // Create new URL
    set({ imageUrl: url, imageBytes: bytes, originalWidth: width, originalHeight: height });
  },

  clearCanvas: () => {
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    set({ imageUrl: null, imageBytes: null });
  },
}));
```

### Why Zustand?
- Minimal boilerplate vs Redux
- No context wrapping needed
- Excellent TypeScript support
- Hooks API (familiar to React devs)
- Efficient subscriptions (only updated components re-render)
- Perfect for canvas-centric app with centralized state

---

## Hook Architecture

### Custom Hook Pattern: useScreenshot

```typescript
// Wrapper around Tauri IPC APIs
export function useScreenshot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waylandWarning, setWaylandWarning] = useState<string | null>(null);

  const captureFullscreen = useCallback(async (): Promise<Uint8Array | null> => {
    try {
      setLoading(true);
      setError(null);
      const bytes = await invoke<Uint8Array>('capture_fullscreen');
      return bytes;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Similar for captureWindow, getWindows, etc.

  return { captureFullscreen, captureWindow, getWindows, loading, error, waylandWarning };
}
```

### Custom Hook Pattern: useImage

```typescript
// Load image from blob URL and track status
export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    setStatus('loading');
    const img = new Image();

    img.onload = () => {
      setImage(img);
      setStatus('loaded');
    };

    img.onerror = () => {
      setImage(null);
      setStatus('error');
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [image, status];
}
```

---

## Canvas Rendering Architecture (Konva)

### Konva Stage Structure

```
Stage (Konva.Stage)
├── Layer 1: Image Layer
│   └── Image (KonvaImage)
│       ├── Image source: HTMLImageElement (from useImage)
│       ├── Position: (0, 0)
│       └── Size: original image dimensions
│
└── Layer 2: Annotations (Phase 04+)
    ├── Shape (rect, circle, arrow)
    ├── Text
    └── Path (brush strokes)

Stage Properties:
  • width: responsive to container
  • height: responsive to container
  • scaleX/scaleY: zoom level from store
  • x/y: pan position from store
  • draggable: true (enables pan)
  • onWheel: zoom handler
  • onDragEnd: pan handler
```

### Zoom/Pan Implementation

```typescript
// Mouse wheel zoom (point-to-zoom)
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();

  const stage = stageRef.current;
  const oldScale = scale;
  const pointer = stage.getPointerPosition();

  // Calculate where mouse points to in canvas space
  const mousePointTo = {
    x: (pointer.x - position.x) / oldScale,
    y: (pointer.y - position.y) / oldScale,
  };

  // Apply zoom
  const direction = e.evt.deltaY > 0 ? -1 : 1;
  const newScale = direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR;
  const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  // Keep mouse point fixed while zooming
  setScale(clampedScale);
  setPosition(
    pointer.x - mousePointTo.x * clampedScale,
    pointer.y - mousePointTo.y * clampedScale
  );
};

// Click-drag pan
const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
  setPosition(e.target.x(), e.target.y());
};
```

---

## Memory Management Strategy

### Image Data Lifecycle

```
Capture
  ↓
PNG bytes: Uint8Array (stored in Zustand)
  ↓
Blob created: new Blob([bytes], { type: 'image/png' })
  ↓
Blob URL created: URL.createObjectURL(blob)
  ↓
Image loaded: useImage hook loads from URL
  ↓
Display: Konva Stage renders image
  ↓
User clears or loads new image
  ↓
Cleanup: URL.revokeObjectURL(oldUrl) [automatic in store]
  ↓
Blob GC: Browser garbage collects blob
  ↓
Memory freed: Uint8Array dereferenced and GC'd
```

### Memory Optimization Techniques
1. **Blob URL Cleanup:** Automatic revocation in store when clearing/replacing
2. **Event Listener Cleanup:** useEffect cleanup functions remove listeners
3. **No Caching:** Screenshots not persisted to disk (user controls)
4. **Reference Management:** Immediate cleanup of old objects

---

## Error Handling Architecture

### Error Flow

```
User Action
  ↓
Try Block
  ├─ invoke Tauri command
  ├─ parse response
  └─ update store
  ↓
Catch Block
  ├─ Log to console with context
  ├─ Set error state (hook)
  └─ Display to user (UI)
  ↓
Finally Block
  └─ Set loading = false
```

### Error Types

| Error | Handler | User Feedback |
|-------|---------|---------------|
| Capture failure | console.error | "Screenshot failed" |
| Permission denied | check Tauri capabilities | "No permission to capture" |
| Invalid window ID | validate before calling | "Window no longer available" |
| Image load error | useImage status | "Failed to load image" |
| Wayland limitation | warning display | Yellow warning banner |

---

## Performance Characteristics

### Bottlenecks & Optimizations

| Operation | Bottleneck | Optimization | Target |
|-----------|-----------|-------------|--------|
| **Screenshot** | OS API call | Native Rust (xcap) | < 500ms |
| **Image load** | Blob URL creation + Image decode | Async in useImage hook | < 200ms |
| **Canvas render** | Konva stage paint | GPU-accelerated canvas | 60 FPS |
| **Zoom** | Stage transform recalc | useCallback for handler | < 16ms |
| **Pan** | Layer position update | useCallback for handler | < 16ms |
| **Memory** | Blob URL storage | Auto-cleanup in store | < 200MB |

---

## Phase-by-Phase Architecture Evolution

### Phase 03 (Current): Canvas Foundation
- ✓ Screenshot capture via Tauri
- ✓ Zustand state management
- ✓ Konva canvas with zoom/pan
- ✓ Responsive toolbar
- ✓ Memory management

### Phase 04 (Planned): Annotation Tools
- Shapes layer (rect, circle, arrow)
- Brush/pencil tool
- Text tool
- Color picker
- Layer management UI

### Phase 05 (Planned): Beautification
- Filter pipeline
- Real-time preview
- Adjustable parameters

### Phase 06 (Planned): Export
- PNG/JPG/WebP export
- Compression settings
- File dialog integration

### Phase 07 (Planned): Native Integration
- Global hotkey registration
- Tray/menu bar icon
- Auto-open after capture

### Phase 08 (Planned): Polish
- Keyboard shortcuts
- Settings/preferences
- Distribution packaging

---

## Security Considerations

### Data Security
- **No persistence:** Screenshots only in memory
- **No telemetry:** Offline-first, no network calls
- **User control:** Only save with explicit user action
- **Cleanup:** Auto-revoke URLs, prevent memory leaks

### Permission Model
- **Tauri capabilities:** Defined in capabilities/default.json
- **OS permissions:** Respect system privacy prompts
- **Window capture:** Check window ID before capturing

---

## Deployment Architecture

### Binary Distribution
```
BeautyShot.app (macOS)
  ├── Contents/
  │   ├── MacOS/beautyshot (executable)
  │   ├── Resources/ (icons, assets)
  │   └── Info.plist

beautyshot (Linux AppImage or Deb)
  └── App binary + dependencies

BeautyShot.exe (Windows)
  ├── beautyshot.exe (executable)
  ├── Dependencies/ (DLLs)
  └── Resources/
```

### Build System
- **Frontend:** Vite bundler
- **Backend:** Cargo (Rust)
- **Tauri CLI:** Orchestrates build process

---

## Integration Points

### Tauri IPC Commands
```rust
// Backend commands invoked from frontend
#[tauri::command]
fn capture_fullscreen() -> Result<Vec<u8>, String> { }

#[tauri::command]
fn capture_window(window_id: u32) -> Result<Vec<u8>, String> { }

#[tauri::command]
fn get_windows() -> Result<Vec<WindowInfo>, String> { }

#[tauri::command]
fn save_file(bytes: Vec<u8>, path: String) -> Result<(), String> { }
```

### Type Synchronization
- Frontend types in `src/types/`
- Backend types in `src-tauri/src/`
- Shared types via Tauri command signatures

---

## Testing Architecture

### Test Pyramid
```
        ╱╲
       ╱  ╲ E2E Tests
      ╱────╲ (workflow, cross-platform)
     ╱╲    ╱
    ╱  ╲  ╱ Integration Tests
   ╱────╲╱ (hooks, store, components)
  ╱╲    ╱
 ╱  ╲  ╱ Unit Tests
╱────╲╱ (functions, stores, utils)
```

### Test Coverage Goals
- **Unit:** > 80% (store, hooks, utils)
- **Integration:** Key workflows (capture → render)
- **E2E:** Screenshot workflow on all platforms

---

## Scalability Considerations

### Current Constraints
- Single image at a time in memory
- No collaborative editing
- No server backend

### Future Extensions
- **Multiple images:** History panel (phase future)
- **Batch processing:** Resize, convert multiple files
- **Cloud storage:** Optional server integration
- **Collaboration:** Real-time annotation sharing

---

## References

- [Tauri Architecture](https://tauri.app/v2/learn/)
- [Konva.js Documentation](https://konvajs.org/)
- [Zustand Pattern](https://github.com/pmndrs/zustand/wiki/Guide)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-27
**Current Phase:** 03 - Canvas Editor Foundation
**Next Milestone:** Phase 04 - Annotation Tools
