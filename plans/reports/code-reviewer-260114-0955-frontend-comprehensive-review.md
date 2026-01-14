# Code Review Report: Frontend Codebase

**Grade: B+**

## Scope
- Files reviewed: 15+ core files across stores, hooks, components
- Lines analyzed: ~2500+ LOC
- Focus: Recent changes, memory safety, type safety, React patterns
- Stack: React 18, TypeScript (strict), Zustand, React-Konva, Vite

## Overall Assessment
Well-structured React+TypeScript app with solid architecture. Strong type safety (strict mode enabled), clean store patterns, proper blob URL lifecycle management. Main concerns: excessive history operations, missing dependency optimization, potential memory issues with large undo stacks.

---

## Critical Issues

### 1. **History Performance - Excessive saveToHistory Calls**
**Location:** `annotation-store.ts` L101, L120, L130, L167, L188, L205, L222, L239

**Issue:** `saveToHistory()` called on EVERY annotation mutation (add, update, delete, style change). For rapid operations (dragging, color adjustments), creates excessive history snapshots with full annotation arrays + image bytes.

**Impact:** Memory bloat, UI lag during fast operations, potential OOM with large images.

**Fix:**
```typescript
// Debounce history saves for continuous operations
let historyTimer: NodeJS.Timeout | null = null;
const debouncedSaveToHistory = () => {
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    get().saveToHistory();
  }, 300); // Save after 300ms of inactivity
};

// Use in updateAnnotation, setStrokeColor, etc.
updateAnnotation: (id, updates) => {
  debouncedSaveToHistory(); // Instead of immediate save
  set(/* ... */);
}
```

### 2. **Memory Leak - Image History Unbounded Growth**
**Location:** `history-store.ts` L44-46, `annotation-store.ts` L204-207

**Issue:** Each crop operation saves full `imageBytes` (Uint8Array) to history. With MAX_HISTORY=50 and 2MB images = 100MB+ memory usage. `cropImage()` always includes image snapshot.

**Impact:** Memory exhaustion with repeated crops, browser crashes.

**Fix:**
```typescript
// Only save image snapshots for destructive ops (crop, filters)
// Skip for annotation-only changes
saveToHistory: (imageSnapshot?: ImageSnapshot, forceImage = false) => {
  const state = get();
  useHistoryStore.getState().pushState({
    annotations: [...state.annotations],
    image: forceImage ? imageSnapshot : undefined, // Conditional image save
  });
}

// In cropImage - explicitly force image save
get().saveToHistory({ imageBytes, originalWidth, originalHeight }, true);
```

---

## High Priority Findings

### 3. **Race Condition in Blob URL Cleanup**
**Location:** `canvas-store.ts` L60-72

**Issue:** `safeRevokeURL()` uses 100ms timeout + Set tracking, but no guarantee React finished rendering. If component unmounts < 100ms, URL may be revoked while still referenced.

**Recommendation:** Use `useEffect` cleanup in consuming components instead of global timeout. Track ref counts per URL.

```typescript
// Better pattern: Let consuming component manage lifecycle
useEffect(() => {
  const url = imageUrl;
  return () => {
    if (url) setTimeout(() => URL.revokeObjectURL(url), 0);
  };
}, [imageUrl]);
```

### 4. **Missing useMemo for Expensive Calculations**
**Location:** `canvas-editor.tsx` L67-70

**Issue:** `calculateAspectRatioExtend()` runs on EVERY render (even when deps unchanged) due to non-memoized calculation.

**Fix:**
```typescript
const aspectExtension = useMemo(() => {
  if (!originalWidth || !originalHeight) return null;
  return calculateAspectRatioExtend(baseCanvasWidth, baseCanvasHeight, outputAspectRatio);
}, [baseCanvasWidth, baseCanvasHeight, outputAspectRatio]);
```

### 5. **Stale Closure in isDraggingRef**
**Location:** `canvas-editor.tsx` L58-59, L235-241

**Issue:** `isDraggingRef.current` bypasses React state for cursor style, then state re-renders cursor. State update in `getCursorStyle()` may reference stale `isDraggingCanvas` during rapid mouse events.

**Impact:** Cursor flickers or shows wrong style.

**Fix:** Remove state, use only ref + forceUpdate for cursor changes.

### 6. **Event Listener Cleanup - Incomplete Pattern**
**Location:** Multiple files (App.tsx L81, canvas-editor.tsx L105, etc.)

**Issue:** Most event listeners properly cleaned up, BUT:
- `region-overlay.tsx` L6-7: Duplicate `window` and `document` listeners for same handler
- No AbortController pattern for easier cleanup

**Fix:**
```typescript
// Use AbortController for cleaner pattern
useEffect(() => {
  const controller = new AbortController();
  window.addEventListener('keydown', handler, { signal: controller.signal });
  return () => controller.abort();
}, []);
```

### 7. **Type Safety - Incomplete Annotation Guards**
**Location:** `annotation-store.ts` L171-176, L187-192

**Issue:** Type assertions `as Annotation` after map operations skip runtime validation. If annotation type changes during update, may cause runtime errors in Konva rendering.

**Fix:**
```typescript
// Add runtime type guard
function isValidAnnotation(a: Partial<Annotation>): a is Annotation {
  return a.id !== undefined && a.type !== undefined;
}

annotations: state.annotations.map((a) => {
  if (a.id !== selectedId) return a;
  const updated = { ...a, stroke: color };
  if (!isValidAnnotation(updated)) throw new Error('Invalid annotation');
  return updated;
})
```

---

## Medium Priority Improvements

### 8. **useDrawing Hook - Oversized State Object**
**Location:** `use-drawing.ts` L38-45

**Issue:** Single state object with 4 fields causes full re-render on any change. `freehandPoints` array grows rapidly during drawing.

**Fix:** Split into separate `useState` calls for independent updates.

### 9. **Missing Error Boundaries**
**Location:** All component files

**Issue:** No React error boundaries. Konva rendering errors crash entire app.

**Recommendation:** Wrap `<CanvasEditor />` in error boundary with fallback UI.

### 10. **Zustand Store - Mutable State Leak**
**Location:** `annotation-store.ts` L92, L122, L169

**Issue:** Spread operators create shallow copies. Nested annotation properties (e.g., `points` array in freehand) shared between history snapshots.

**Impact:** Mutating current annotation also mutates history.

**Fix:**
```typescript
// Deep clone annotations with structured clone
saveToHistory: () => {
  const state = get();
  useHistoryStore.getState().pushState({
    annotations: structuredClone(state.annotations),
    // ...
  });
}
```

### 11. **TextEditOverlay - Double useEffect Timing**
**Location:** `text-edit-overlay.tsx` L29-46

**Issue:** Two separate `useEffect` hooks for same `annotation?.id` dependency with `setTimeout`. First sets text, second focuses input. Could race.

**Fix:** Combine into single effect with sequential logic.

### 12. **Export Hook - Tight Coupling**
**Location:** `use-export.ts` L27-38

**Issue:** Hook directly accesses 5+ stores. Changes to any store require hook updates. Violates single responsibility.

**Recommendation:** Create facade store or selector function to aggregate export-related state.

---

## Low Priority Suggestions

### 13. **Console Errors Not Handled**
**Location:** `use-export.ts` L148, L202, L244

**Issue:** `logError()` called but errors not shown to user (only toast notifications). DevTools errors hidden.

**Recommendation:** Add dev-only console.error for debugging.

### 14. **Magic Numbers - Hardcoded Values**
**Location:** `canvas-editor.tsx` L156, `canvas-store.ts` L71

**Issue:** `100` (ms timeout), `20` (margin px), `50` (min input width) not in constants file.

**Fix:** Extract to `constants/canvas.ts` or `constants/ui.ts`.

### 15. **Toast Duration - No Per-Type Config**
**Location:** `toast.tsx` L24

**Issue:** All toasts auto-dismiss after 5s. Error toasts should stay longer or require manual dismiss.

**Fix:**
```typescript
const duration = toast.duration ?? (toast.type === 'error' ? 10000 : 5000);
```

### 16. **Accessibility - Missing ARIA Labels**
**Location:** Multiple components (toolbars, buttons)

**Issue:** Icon buttons lack `aria-label` for screen readers.

**Example:** `toolbar/tool-buttons.tsx` - tool buttons show icons only.

---

## Positive Observations

1. **Excellent Blob URL Management**: Centralized in `canvas-store.ts` with deferred revocation pattern. Prevents common pitfalls.
2. **Type Safety**: Strict mode enabled, no `any` types, proper discriminated unions for annotations.
3. **Clean Store Architecture**: Zustand stores well-separated by concern (canvas, annotations, settings). Clear ownership.
4. **Hook Composition**: Custom hooks (`useDrawing`, `useExport`) properly extract business logic from components.
5. **Build Success**: TypeScript compilation clean, no type errors, Vite build successful.
6. **No TODOs**: Codebase appears complete, no pending work markers.
7. **Proper Effect Cleanup**: Most `useEffect` hooks return cleanup functions for listeners/timers.
8. **Immutable Updates**: State updates follow immutability (shallow), proper use of spread operators.
9. **Code Organization**: Clear file structure, components under 400 LOC, hooks focused on single concerns.

---

## Recommended Actions

**Immediate (Pre-Release):**
1. Fix critical issue #1 - debounce history saves
2. Fix critical issue #2 - cap image history memory usage
3. Add error boundary around canvas editor
4. Audit blob URL lifecycle in all components

**Short-Term (Next Sprint):**
5. Optimize re-renders with `useMemo` for expensive calculations
6. Add deep cloning for history snapshots
7. Implement AbortController pattern for event listeners
8. Add runtime type guards for annotation updates

**Long-Term (Technical Debt):**
9. Create export facade to reduce store coupling
10. Add accessibility audit and ARIA labels
11. Extract magic numbers to constants
12. Implement per-type toast durations

---

## Metrics
- Type Coverage: 100% (strict mode, no `any`)
- Build Status: ✅ Passing (1.03s, 591KB total)
- Test Coverage: Unknown (no tests run in this review)
- Linting: No linter configured (`npm run lint` missing)
- Bundle Size: 591KB (29.6KB main gzipped)

---

## Unresolved Questions

1. **Test Coverage**: Are there E2E tests for annotation undo/redo with large images?
2. **Memory Profiling**: Has the history stack been tested with 50+ undo operations on 4K screenshots?
3. **Performance Baseline**: What's the target FPS for freehand drawing on lower-end devices?
4. **Linter Config**: Why no ESLint script? Intentional or missing setup?
5. **Konva Performance**: Are there known issues with large annotation counts (100+ shapes)?
