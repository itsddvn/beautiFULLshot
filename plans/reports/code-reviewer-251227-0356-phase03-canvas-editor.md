# Code Review: Phase 03 Canvas Editor Foundation

**Status**: CRITICAL ISSUES FOUND | **Date**: 2025-12-27 | **Reviewer**: code-reviewer

---

## Scope

- Files reviewed: 8 files (501 LOC)
- Review focus: Phase 03 implementation - Canvas editor with Konva, Zustand state management
- Plan: `plans/251226-1356-tauri-screenshot-app/phase-03-canvas-editor.md`

### Files Analyzed
- `src/stores/canvas-store.ts` (58 lines)
- `src/hooks/use-image.ts` (39 lines)
- `src/hooks/use-screenshot.ts` (122 lines)
- `src/components/canvas/canvas-editor.tsx` (112 lines)
- `src/components/canvas/zoom-controls.tsx` (40 lines)
- `src/components/toolbar/toolbar.tsx` (101 lines)
- `src/components/layout/editor-layout.tsx` (20 lines)
- `src/App.tsx` (9 lines)

---

## Overall Assessment

**FAIL - Critical memory leak and architectural violations**

Build: ✓ PASS (TypeScript compilation successful)
Performance: ⚠️ WARNING (502KB bundle size, no code splitting)
Security: ❌ CRITICAL (Memory leak via unreleased blob URLs)
Architecture: ⚠️ VIOLATIONS (State duplication, tight coupling)
YAGNI/KISS/DRY: ⚠️ VIOLATIONS (Over-engineering, redundant state)

---

## Critical Issues

### 1. **MEMORY LEAK: Blob URL Not Revoked in Toolbar Component**

**Severity**: CRITICAL
**File**: `src/components/toolbar/toolbar.tsx` (lines 21-42)

**Problem**: When capturing screenshots, new Image objects create blob URLs that never get revoked. The toolbar creates temporary Image objects to get dimensions but doesn't track or clean up their blob URLs.

```typescript
// Lines 21-29 and 32-40
const handleCaptureFullscreen = async () => {
  const result = await captureFullscreen();
  if (result) {
    const img = new Image();  // ❌ Blob URL from result.url never revoked
    img.onload = () => {
      setImage(result.url, result.bytes, img.width, img.height);
    };
    img.src = result.url;  // result.url is a blob URL that needs cleanup
  }
};
```

**Impact**: Each screenshot capture creates permanent blob URLs in memory. After 10+ captures, app performance degrades. Browser may crash on low-memory devices.

**Root Cause**: `useScreenshot` hook properly manages blob URLs, but toolbar creates additional Image objects without cleanup. Blob URL ownership unclear between components.

**Fix Required**: Either:
- Extract dimensions before creating blob URL (use canvas to decode bytes)
- Add cleanup in image.onload/onerror callbacks
- Track blob URLs in component and cleanup on unmount

---

### 2. **STATE DUPLICATION: Image Data Stored in Two Places**

**Severity**: HIGH
**Files**: `src/hooks/use-screenshot.ts`, `src/stores/canvas-store.ts`

**Problem**: Screenshot data (`imageUrl`, `imageBytes`) duplicated across hook state and Zustand store.

```typescript
// useScreenshot hook (lines 36-37)
const [imageUrl, setImageUrl] = useState<string | null>(null);
const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);

// canvas-store.ts (lines 7-8, 28-29)
imageUrl: string | null;
imageBytes: Uint8Array | null;
```

**Impact**:
- Memory waste (image bytes stored 2x)
- Synchronization bugs (state can drift)
- Violates Single Source of Truth principle

**YAGNI Violation**: `useScreenshot` hook state unnecessary - data immediately moved to canvas store.

**Fix Required**: Remove state from hook. Return capture result directly without storing. Let canvas store be sole owner.

---

### 3. **BLOB URL CLEANUP RACE CONDITION**

**Severity**: HIGH
**File**: `src/hooks/use-screenshot.ts` (lines 56, 76)

**Problem**: Old blob URL revoked BEFORE new Image object finishes loading in toolbar.

```typescript
// useScreenshot.ts lines 55-59
const bytes = await api.captureFullscreen();
setImageBytes(bytes);
if (imageUrl) URL.revokeObjectURL(imageUrl);  // ❌ Revoked here
const url = api.bytesToImageUrl(bytes);
setImageUrl(url);

// toolbar.tsx lines 23-28 (executes AFTER above)
const result = await captureFullscreen();  // Returns revoked URL
if (result) {
  const img = new Image();
  img.onload = () => {
    setImage(result.url, result.bytes, img.width, img.height);
  };
  img.src = result.url;  // ⚠️ May be revoked already
}
```

**Impact**: Intermittent image load failures. Timing-dependent bug hard to reproduce.

**Fix Required**: Revoke ONLY after confirming new URL safely transferred to consumer. Use ref counting or cleanup callbacks.

---

## High Priority Findings

### 4. **PERFORMANCE: No Code Splitting (502KB Bundle)**

**Severity**: HIGH
**Build Output**: Warning displayed

```
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-DbG35Ddb.js   502.00 kB │ gzip: 155.14 kB
```

**Problem**: Konva (heavy canvas library) bundled with initial load. User pays 155KB gzip cost even before capturing first screenshot.

**Impact**: Slow initial load, especially on mobile/slow connections.

**Fix Required**: Lazy load canvas components:
```typescript
const CanvasEditor = lazy(() => import('./components/canvas/canvas-editor'));
```

---

### 5. **TIGHT COUPLING: Toolbar Directly Depends on Screenshot Hook**

**Severity**: MEDIUM
**File**: `src/components/toolbar/toolbar.tsx`

**Problem**: Toolbar violates separation of concerns. It handles screenshot capture AND manages windows dropdown AND interacts with canvas store.

```typescript
const { captureFullscreen, captureWindow, getWindows, loading, waylandWarning } = useScreenshot();
const { setImage, clearCanvas, imageUrl } = useCanvasStore();
```

**Architecture Violation**: Toolbar is presentation layer but contains business logic (image dimension extraction, async capture orchestration).

**KISS Violation**: Overly complex component with multiple responsibilities.

**Fix Required**: Extract capture logic to custom hook (e.g., `useScreenshotCapture`) that encapsulates dimension extraction and store updates.

---

### 6. **MISSING ERROR HANDLING: Image Load Failures Not Caught**

**Severity**: MEDIUM
**File**: `src/components/toolbar/toolbar.tsx` (lines 24-28, 35-39)

**Problem**: No error handlers on Image objects. If blob URL invalid or image decode fails, silent failure.

```typescript
const img = new Image();
img.onload = () => {
  setImage(result.url, result.bytes, img.width, img.height);
};
// ❌ Missing: img.onerror = () => { ... }
img.src = result.url;
```

**Impact**: User sees no feedback on failure. Canvas stays blank with no error message.

**Fix Required**: Add onerror handlers, show user-facing error message.

---

## Medium Priority Improvements

### 7. **YAGNI: Unused Image Status in useImage Hook**

**File**: `src/hooks/use-image.ts`

**Issue**: Hook returns `ImageStatus` ('loading' | 'loaded' | 'error') but NO consumer uses it.

```typescript
const [image] = useImage(imageUrl || '');  // Status ignored everywhere
```

**Fix**: Remove status return value until needed. Simpler API.

---

### 8. **DRY VIOLATION: Duplicate Zoom Factor Constants**

**Files**:
- `src/components/canvas/canvas-editor.tsx` (line 11: `ZOOM_FACTOR = 1.1`)
- `src/components/canvas/zoom-controls.tsx` (lines 8-9: hardcoded `1.2`)

**Problem**: Zoom controls use different factor (1.2) than wheel zoom (1.1). Inconsistent UX.

**Fix**: Extract to shared constant or canvas store config.

---

### 9. **MISSING CLEANUP: Window Resize Listener Potential Leak**

**File**: `src/components/canvas/canvas-editor.tsx` (lines 31-44)

**Issue**: Resize listener cleanup assumes component unmounts cleanly. If React suspends/errors during render, listener may leak.

**Mitigation**: Already has cleanup in useEffect. Low risk but worth noting.

---

### 10. **MAGIC NUMBERS: Zoom Limits Hardcoded**

**File**: `src/components/canvas/canvas-editor.tsx` (lines 9-10)

```typescript
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
```

**Issue**: Not configurable. No clear rationale for limits (why 5x? why 0.1x?).

**Improvement**: Move to canvas store or config file. Add comments explaining rationale.

---

## Low Priority Suggestions

### 11. **ACCESSIBILITY: Missing ARIA Labels**

**File**: All components

**Issue**: No aria-labels on buttons, no keyboard shortcuts, no screen reader support.

**Fix**: Add aria-labels, keyboard navigation (Space/Enter for buttons, +/- for zoom).

---

### 12. **PERFORMANCE: Unnecessary Position Object Recreation**

**File**: `src/stores/canvas-store.ts` (line 48)

```typescript
setPosition: (x, y) => set({ position: { x, y } }),
```

**Issue**: Creates new position object on every pan event. Could use immer for structural sharing.

**Impact**: Minor - Zustand already optimizes shallow comparisons.

---

## Positive Observations

✓ **TypeScript**: Proper typing throughout, no `any` types
✓ **Hooks**: Correct dependency arrays, proper cleanup functions
✓ **Konva Integration**: Proper ref usage, event handling follows Konva patterns
✓ **State Management**: Zustand implementation clean and minimal
✓ **Code Style**: Consistent formatting, clear component structure

---

## Recommended Actions

### Immediate (Block Release)

1. **FIX MEMORY LEAK**: Refactor toolbar blob URL management
   - Extract dimension detection to utility function
   - Ensure single blob URL owner (canvas store)
   - Add cleanup on component unmount

2. **ELIMINATE STATE DUPLICATION**: Remove imageUrl/imageBytes from useScreenshot
   - Hook should only expose capture functions
   - Canvas store is single source of truth

3. **FIX RACE CONDITION**: Implement blob URL lifecycle management
   - Use ref counting or callback-based cleanup
   - Revoke only when safe (after consumer loaded)

### High Priority (Before Phase 04)

4. **ADD ERROR HANDLING**: Image load error handlers in toolbar
5. **CODE SPLITTING**: Lazy load Konva components
6. **REFACTOR TOOLBAR**: Extract capture orchestration logic

### Medium Priority (Tech Debt)

7. Remove unused `status` from useImage hook
8. Consolidate zoom factor constants
9. Document zoom limit rationale

---

## Plan Update

### Phase 03 Success Criteria Review

| Criteria | Status | Notes |
|----------|--------|-------|
| Screenshot displays on Konva canvas | ✓ PASS | Works but has memory leak |
| Zoom in/out with scroll wheel | ✓ PASS | Smooth, proper clamping |
| Pan by dragging stage | ✓ PASS | Konva handles well |
| Responsive canvas sizing | ✓ PASS | Resize listener works |
| Zoom controls UI working | ✓ PASS | Different zoom factor than wheel |
| Performance: smooth 60fps drag/zoom | ✓ PASS | Konva optimized, no lag observed |

**Overall Status**: ❌ FAIL - Critical memory leak blocks phase completion

---

## Unresolved Questions

1. **Blob URL Ownership**: Should canvas store own blob URLs or should components create temporary ones? Need architectural decision.

2. **Image Bytes Storage**: Do we need to keep `imageBytes` in memory for export? Or reconstruct from blob URL when needed? Memory vs computation tradeoff.

3. **Zoom Factor Discrepancy**: Which zoom factor is correct - 1.1 or 1.2? Should they be different for wheel vs buttons?

4. **Performance Budget**: What's acceptable bundle size? 155KB gzip seems high for initial load. Need lazy loading strategy?

5. **Error Recovery**: If image load fails, should we keep previous image or clear canvas? UX decision needed.
