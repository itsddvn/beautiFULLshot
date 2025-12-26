# Code Review: BeautyShot Frontend

**Date**: 2025-12-27 04:45
**Reviewer**: code-reviewer (a9871c8)
**Scope**: Frontend React/TypeScript components & state management

---

## Code Review Summary

### Scope
- Files reviewed: 6 core frontend files
- Lines of code analyzed: ~390 LOC
- Review focus: React hooks, state management, memory leaks, performance, accessibility
- TypeScript compilation: ✅ PASSED (no errors)

### Overall Assessment
**Quality: HIGH** - Well-architected frontend with proper separation of concerns. Code demonstrates good understanding of React patterns, memory management, and TypeScript best practices. Some minor improvements identified.

---

## Critical Issues
**NONE FOUND** ✅

---

## High Priority Findings

### H1. Missing Cleanup in Toolbar Window Dropdown
**File**: `src/components/toolbar/toolbar.tsx:87-100`
**Severity**: HIGH
**Issue**: Window dropdown doesn't close on outside click or ESC key. Creates poor UX and potential state issues.

```tsx
// Missing: Outside click handler & ESC key handler
{showWindows && windows.length > 0 && (
  <div className="absolute top-full mt-2 left-0 w-64...">
    {/* No click-away or ESC handler */}
  </div>
)}
```

**Fix**: Add click-away listener & ESC key handler
```tsx
useEffect(() => {
  if (!showWindows) return;

  const handleClickAway = (e: MouseEvent) => {
    if (!(e.target as Element).closest('.window-dropdown')) {
      setShowWindows(false);
    }
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowWindows(false);
  };

  document.addEventListener('mousedown', handleClickAway);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('mousedown', handleClickAway);
    document.removeEventListener('keydown', handleEsc);
  };
}, [showWindows]);
```

---

## Medium Priority Improvements

### M1. Toolbar Creates Temporary Blob URLs Without Cleanup
**File**: `src/components/toolbar/toolbar.tsx:9-27`
**Severity**: MEDIUM
**Issue**: `getImageDimensions()` creates blob URLs but revokes inside callbacks. Not guaranteed cleanup on error/unmount.

**Impact**: Potential memory leak if component unmounts during image load

**Current**:
```tsx
function getImageDimensions(bytes: Uint8Array): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: 'image/png' });
    const url = URL.createObjectURL(blob); // Created
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url); // Revoked on success
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url); // Revoked on error
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
```

**Recommendation**: Move to cleanup pattern or use AbortController for cancellation

---

### M2. DRY Violation - Duplicate ZOOM_FACTOR Constant
**Files**:
- `src/components/canvas/canvas-editor.tsx:11`
- `src/components/canvas/zoom-controls.tsx:5`

**Severity**: MEDIUM
**Issue**: Magic number duplicated in 2 files. Changes require updates in both places.

**Fix**: Create shared constants file
```tsx
// src/constants/canvas.ts
export const ZOOM_FACTOR = 1.1;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
```

---

### M3. DRY Violation - Duplicate Zoom Clamping Logic
**File**: `src/components/canvas/canvas-editor.tsx:67` & `src/stores/canvas-store.ts:60`
**Severity**: MEDIUM
**Issue**: Scale clamping logic duplicated

**Current**:
```tsx
// canvas-editor.tsx:67
const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

// canvas-store.ts:60
setScale: (scale) => set({ scale: Math.max(0.1, Math.min(5, scale)) }),
```

**Fix**: Store should handle all clamping, components just call `setScale()`

---

### M4. useScreenshot - Unnecessary Async Wrappers
**File**: `src/hooks/use-screenshot.ts:69-79`
**Severity**: MEDIUM
**Issue**: `getWindows`, `getMonitors`, `checkPermission` wrapped in `useCallback` with no dependencies but are simple passthroughs

**Current**:
```tsx
const getWindows = useCallback(async () => {
  return await api.getWindows();
}, []);
```

**Simpler**:
```tsx
// Just export the API functions directly or use simple wrappers
const getWindows = api.getWindows;
```

**Note**: If error handling needed later, current pattern is fine. Low priority optimization.

---

### M5. CanvasEditor - Scale/Position Deps Cause Unnecessary Re-renders
**File**: `src/components/canvas/canvas-editor.tsx:47-74`
**Severity**: MEDIUM
**Issue**: `handleWheel` includes `scale` & `position` in deps array but reads from store directly

**Current**:
```tsx
const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
  // ...uses scale from closure
}, [scale, position, setScale, setPosition]); // Re-created on every scale/position change
```

**Fix**: Use ref or get from store inside callback
```tsx
const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();

  const stage = stageRef.current;
  if (!stage) return;

  // Get latest values from store instead of closure
  const { scale, position, setScale, setPosition } = useCanvasStore.getState();

  // ... rest of logic
}, []); // No deps, never re-creates
```

---

### M6. Missing Loading State Visual Feedback
**File**: `src/components/toolbar/toolbar.tsx:70-76`
**Severity**: MEDIUM
**Issue**: Button text changes but no visual feedback (spinner, disabled state consistent)

**Recommendation**: Add spinner icon when loading

---

## Low Priority Suggestions

### L1. Missing Accessibility - Button ARIA Labels
**Files**: All button components
**Severity**: LOW
**Issue**: Zoom buttons use `title` but no `aria-label`

**Fix**:
```tsx
<button
  onClick={zoomOut}
  aria-label="Zoom Out"
  title="Zoom Out"
  className="..."
>
  -
</button>
```

---

### L2. Missing Accessibility - Keyboard Navigation
**File**: `src/components/toolbar/toolbar.tsx:87-100`
**Severity**: LOW
**Issue**: Window dropdown not keyboard navigable (arrow keys, enter to select)

**Recommendation**: Add `role="listbox"`, `tabIndex`, keyboard handlers

---

### L3. useImage - Missing Abort on URL Change
**File**: `src/hooks/use-image.ts:11-36`
**Severity**: LOW
**Issue**: If URL changes rapidly, old image load continues. Not aborted.

**Current Cleanup**:
```tsx
return () => {
  img.onload = null;
  img.onerror = null;
}; // Doesn't abort in-flight request
```

**Recommendation**: Set flag to ignore stale loads
```tsx
useEffect(() => {
  if (!url) {
    setImage(null);
    return;
  }

  let cancelled = false;
  setStatus('loading');
  const img = new Image();

  img.onload = () => {
    if (!cancelled) {
      setImage(img);
      setStatus('loaded');
    }
  };

  img.onerror = () => {
    if (!cancelled) {
      setImage(null);
      setStatus('error');
    }
  };

  img.src = url;

  return () => {
    cancelled = true;
    img.onload = null;
    img.onerror = null;
  };
}, [url]);
```

---

### L4. Toolbar - Error Doesn't Auto-Dismiss
**File**: `src/components/toolbar/toolbar.tsx:114-116`
**Severity**: LOW
**Issue**: Error persists until next action. No timeout or dismiss button.

**Recommendation**: Add auto-dismiss after 5s or close button

---

### L5. CanvasEditor - Missing Loading State for Image
**File**: `src/components/canvas/canvas-editor.tsx:28`
**Severity**: LOW
**Issue**: `useImage` returns status but it's unused. No loading spinner shown.

**Current**:
```tsx
const [image] = useImage(imageUrl || ''); // Status ignored
```

**Recommendation**: Show loading spinner while image loads

---

## Positive Observations

✅ **Excellent Memory Management** - Blob URLs properly revoked in canvas-store
✅ **Clean Separation** - Hooks don't manage URLs, store does (single source of truth)
✅ **Type Safety** - Proper TypeScript usage, no `any` types found
✅ **Event Listener Cleanup** - Resize listener properly cleaned up
✅ **Responsive Design** - Canvas resizes on window resize
✅ **Zustand Best Practices** - Store actions use `get()` to access current state
✅ **Konva Integration** - Proper use of refs and Konva event handlers
✅ **Code Organization** - Clear file structure, components are focused

---

## Recommended Actions

1. **HIGH**: Add click-away & ESC handlers to window dropdown (H1)
2. **MEDIUM**: Extract zoom constants to shared file (M2)
3. **MEDIUM**: Consolidate scale clamping to store only (M3)
4. **MEDIUM**: Fix `handleWheel` deps to prevent re-renders (M5)
5. **LOW**: Add keyboard navigation to window dropdown (L2)
6. **LOW**: Add `cancelled` flag to `useImage` hook (L3)
7. **LOW**: Auto-dismiss errors after timeout (L4)

---

## Metrics

- **Type Coverage**: 100% (explicit types on all hooks/components)
- **Test Coverage**: Not measured (no test files found)
- **Linting Issues**: 0 (TypeScript compilation clean)
- **Memory Leak Risks**: 1 (toolbar temp URLs - M1)
- **Performance Issues**: 1 (unnecessary re-renders - M5)
- **Accessibility Gaps**: 2 (missing ARIA labels, keyboard nav)

---

## Unresolved Questions

1. **Performance**: Has wheel zoom been tested with large images (10k+ px)? May need throttling.
2. **Browser Compat**: Blob URLs work in all target browsers for Tauri WebView?
3. **Testing Strategy**: Unit tests planned? Recommend testing blob URL cleanup.
4. **Future Plans**: Will zoom controls support keyboard shortcuts (Cmd+/-, 0 for fit)?
