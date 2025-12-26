# Phase 03: Canvas Editor Foundation

**Status**: ⚠️ BLOCKED - Critical Issues | **Effort**: 4h | **Priority**: P1

## Objective

Build react-konva canvas editor with image display, responsive sizing, zoom/pan controls, and layer management.

---

## Tasks

### 3.1 Canvas Store (State Management)

**src/stores/canvas-store.ts:**
```typescript
import { create } from 'zustand';

interface CanvasState {
  // Image
  imageUrl: string | null;
  imageBytes: Uint8Array | null;
  originalWidth: number;
  originalHeight: number;

  // Canvas viewport
  stageWidth: number;
  stageHeight: number;
  scale: number;
  position: { x: number; y: number };

  // Actions
  setImage: (url: string, bytes: Uint8Array, width: number, height: number) => void;
  setStageSize: (width: number, height: number) => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  resetView: () => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  imageUrl: null,
  imageBytes: null,
  originalWidth: 0,
  originalHeight: 0,
  stageWidth: 800,
  stageHeight: 600,
  scale: 1,
  position: { x: 0, y: 0 },

  setImage: (url, bytes, width, height) => set({
    imageUrl: url,
    imageBytes: bytes,
    originalWidth: width,
    originalHeight: height,
  }),

  setStageSize: (width, height) => set({ stageWidth: width, stageHeight: height }),
  setScale: (scale) => set({ scale: Math.max(0.1, Math.min(5, scale)) }),
  setPosition: (x, y) => set({ position: { x, y } }),
  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),
  clearCanvas: () => set({
    imageUrl: null,
    imageBytes: null,
    originalWidth: 0,
    originalHeight: 0,
  }),
}));
```

### 3.2 Canvas Editor Component

**src/components/canvas/canvas-editor.tsx:**
```typescript
import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvas-store';
import { useImage } from '../../hooks/use-image';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.1;

export function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    imageUrl,
    stageWidth,
    stageHeight,
    scale,
    position,
    setStageSize,
    setScale,
    setPosition,
  } = useCanvasStore();

  const [image] = useImage(imageUrl || '');

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight
        );
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStageSize]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0
      ? oldScale * ZOOM_FACTOR
      : oldScale / ZOOM_FACTOR;

    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    setScale(clampedScale);
    setPosition(
      pointer.x - mousePointTo.x * clampedScale,
      pointer.y - mousePointTo.y * clampedScale
    );
  }, [scale, position, setScale, setPosition]);

  // Pan with drag
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition(e.target.x(), e.target.y());
  }, [setPosition]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
            />
          )}
        </Layer>
        {/* Annotation layer will be added in Phase 04 */}
        <Layer name="annotations" />
      </Stage>
    </div>
  );
}
```

### 3.3 Image Loading Hook

**src/hooks/use-image.ts:**
```typescript
import { useState, useEffect } from 'react';

export function useImage(url: string): [HTMLImageElement | null, 'loading' | 'loaded' | 'error'] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

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

### 3.4 Zoom Controls Component

**src/components/canvas/zoom-controls.tsx:**
```typescript
import { useCanvasStore } from '../../stores/canvas-store';

export function ZoomControls() {
  const { scale, setScale, resetView } = useCanvasStore();

  const zoomIn = () => setScale(scale * 1.2);
  const zoomOut = () => setScale(scale / 1.2);
  const zoomFit = () => resetView();

  return (
    <div className="absolute bottom-4 right-4 flex gap-2 bg-white rounded-lg shadow p-2">
      <button
        onClick={zoomOut}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="Zoom Out"
      >
        -
      </button>
      <span className="w-16 text-center text-sm leading-8">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={zoomIn}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={zoomFit}
        className="px-2 h-8 text-sm hover:bg-gray-100 rounded"
        title="Fit to Screen"
      >
        Fit
      </button>
    </div>
  );
}
```

### 3.5 Main Layout

**src/components/layout/editor-layout.tsx:**
```typescript
import { CanvasEditor } from '../canvas/canvas-editor';
import { ZoomControls } from '../canvas/zoom-controls';
import { Toolbar } from '../toolbar/toolbar';

export function EditorLayout() {
  return (
    <div className="h-screen flex flex-col">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main canvas area */}
      <div className="flex-1 relative">
        <CanvasEditor />
        <ZoomControls />
      </div>
    </div>
  );
}
```

### 3.6 Basic Toolbar Placeholder

**src/components/toolbar/toolbar.tsx:**
```typescript
import { useScreenshot } from '../../hooks/use-screenshot';
import { useCanvasStore } from '../../stores/canvas-store';

export function Toolbar() {
  const { captureFullscreen, loading } = useScreenshot();
  const { setImage } = useCanvasStore();

  const handleCapture = async () => {
    const result = await captureFullscreen();
    if (result) {
      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImage(result.url, result.bytes, img.width, img.height);
      };
      img.src = result.url;
    }
  };

  return (
    <div className="h-12 bg-white border-b flex items-center px-4 gap-4">
      <button
        onClick={handleCapture}
        disabled={loading}
        className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Capturing...' : 'Capture Screen'}
      </button>

      {/* Tool buttons will be added in Phase 04 */}
      <div className="flex-1" />

      <span className="text-sm text-gray-500">BeautyShot</span>
    </div>
  );
}
```

---

## Install Zustand

```bash
npm install zustand
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/stores/canvas-store.ts` | Create |
| `src/components/canvas/canvas-editor.tsx` | Create |
| `src/components/canvas/zoom-controls.tsx` | Create |
| `src/components/layout/editor-layout.tsx` | Create |
| `src/components/toolbar/toolbar.tsx` | Create |
| `src/hooks/use-image.ts` | Create |
| `src/App.tsx` | Modify (use EditorLayout) |

---

## Verification

1. Capture screenshot → displays on canvas
2. Scroll wheel → zooms in/out
3. Drag canvas → pans around
4. Resize window → canvas resizes
5. Zoom controls → work correctly

---

## Success Criteria

- [x] Screenshot displays on Konva canvas ⚠️ (works but memory leak)
- [x] Zoom in/out with scroll wheel
- [x] Pan by dragging stage
- [x] Responsive canvas sizing
- [x] Zoom controls UI working ⚠️ (inconsistent zoom factor)
- [x] Performance: smooth 60fps drag/zoom

**Implementation Complete** but **BLOCKED by critical issues**. See code review report.

---

## Performance Notes

- Use `batchDraw()` for multiple shape updates
- Limit canvas redraws during drag
- Cache complex shapes when needed

---

## Code Review Results

**Review Date**: 2025-12-27
**Report**: `../reports/code-reviewer-251227-0356-phase03-canvas-editor.md`
**Status**: ❌ FAIL - Critical Issues Found

### Critical Issues (MUST FIX)

1. **Memory Leak**: Blob URLs not revoked in toolbar component (lines 21-42)
   - Each screenshot leaks memory, browser crashes after 10+ captures

2. **State Duplication**: Image data stored in both hook and Zustand store
   - Violates single source of truth, wastes memory

3. **Race Condition**: Blob URL revoked before consumer finishes loading
   - Intermittent image load failures

### High Priority Issues

4. **No Code Splitting**: 502KB bundle (155KB gzip) - too large for initial load
5. **Tight Coupling**: Toolbar has too many responsibilities
6. **Missing Error Handling**: Image load failures silently ignored

### Required Actions Before Phase 04

- [ ] Fix blob URL lifecycle management (implement ref counting or ownership model)
- [ ] Remove duplicate state from useScreenshot hook
- [ ] Add error handlers to Image objects in toolbar
- [ ] Implement code splitting for Konva components
- [ ] Refactor toolbar - extract capture orchestration logic
- [ ] Unify zoom factor constants (currently 1.1 vs 1.2)

---

## Next Phase

⚠️ **BLOCKED** - Cannot proceed to Phase 04 until critical issues resolved.

[Phase 04: Annotation Tools](./phase-04-annotation-tools.md) (on hold)
