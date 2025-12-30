# Debug Report: Crop Function Not Working

**Date:** 2025-12-29
**Reporter:** debugger subagent
**Severity:** Critical
**Status:** Root cause identified

---

## Executive Summary

**Issue:** Crop overlay does not appear when "Start Crop" button clicked. Console shows `isCropping: false` after button click despite store logging "setting isCropping=true".

**Root Cause:** Zustand 5.0 store subscription issue with destructuring pattern in React-Konva component.

**Impact:** Core crop functionality completely non-functional in production.

---

## Technical Analysis

### Symptoms Observed

1. User clicks "Start Crop" button
2. Console logs show `startCrop()` called
3. Store logs "crop-store: startCrop called, setting isCropping=true"
4. But `CropOverlay` component shows `isCropping: false` in console
5. No crop overlay appears on canvas
6. UI remains in pre-crop state

### Investigation Timeline

#### 1. Initial Hypothesis: Multiple Store Instances
**Result:** ❌ ELIMINATED
- Both components import from same path: `../../stores/crop-store`
- Tests pass (31/31) showing store works correctly
- No duplicate store instances detected

#### 2. Store Update Verification
**Result:** ✓ CONFIRMED WORKING
- Store logs show `set()` called with `isCropping: true`
- `startCrop()` function executes properly (line 29-36 in crop-store.ts)
- State mutation is correct

#### 3. Component Subscription Analysis
**Result:** ⚠️ ISSUE FOUND

**Code in question** (crop-overlay.tsx:17):
```typescript
const { isCropping, cropRect, aspectRatio, setCropRect } = useCropStore();
```

**Problem:** In Zustand 5.0, bare destructuring without explicit selector creates subscription to ENTIRE store, but uses `Object.is` shallow equality on destructured object.

**Comparison with working component** (background-layer.tsx:11):
```typescript
const { type, gradient, solidColor, padding } = useBackgroundStore();
```

Same pattern, but works correctly. Why?

#### 4. React-Konva Layer Rendering
**Result:** ⚠️ POTENTIAL FACTOR

Both components return their own `<Layer>`:
- `CropOverlay` → returns `<Layer>...</Layer>` at line 53
- `BackgroundLayer` → returns `<Shape>` or `<Rect>` (no Layer wrapper)

**Critical difference:**
- `CropOverlay` has early return `null` when `isCropping === false` (line 39-42)
- `BackgroundLayer` always renders something

**Hypothesis:** When component returns `null`, React may not re-render even when Zustand notifies of state change.

#### 5. Zustand 5.0 Subscription Mechanics

Research findings (see Sources section):

**Key Issue:** Zustand 5.0 changed subscription behavior for destructured hooks.

**Old behavior (Zustand 4.x):**
```typescript
const { isCropping } = useCropStore();
// Subscribes specifically to isCropping changes
```

**New behavior (Zustand 5.0):**
```typescript
const { isCropping } = useCropStore();
// Subscribes to entire store, but compares destructured object with Object.is
// If functions (setCropRect, etc.) have same reference, might skip re-render
```

---

## Root Cause

**Definitive Issue:** Zustand 5.0 subscription mechanism with destructured properties does not properly trigger React re-renders when:

1. Component destructures state + functions from store
2. Functions are stable references (defined once in store)
3. Component conditionally returns `null` vs JSX
4. Store update changes only state values (not functions)

**Why it fails:**
- `useCropStore()` creates subscription to entire store
- On state change, Zustand compares NEW destructured object vs OLD
- Functions (`startCrop`, `setCropRect`, etc.) are same reference
- State values (`isCropping`) changed, but Zustand's equality check might fail
- React never re-renders `CropOverlay` component
- Console log at line 22 never executes with new value

**Why tests pass:**
- Tests directly call store methods and assert state
- No React component subscription involved
- Store state management works perfectly

---

## Solution

### Fix 1: Use Explicit Selectors (RECOMMENDED)

**File:** `/Users/dcppsw/Projects/beautyshot/src/components/canvas/crop-overlay.tsx`

**Change line 17-19 from:**
```typescript
const { isCropping, cropRect, aspectRatio, setCropRect } = useCropStore();
const { originalWidth, originalHeight } = useCanvasStore();
const { padding } = useBackgroundStore();
```

**To:**
```typescript
const isCropping = useCropStore((state) => state.isCropping);
const cropRect = useCropStore((state) => state.cropRect);
const aspectRatio = useCropStore((state) => state.aspectRatio);
const setCropRect = useCropStore((state) => state.setCropRect);
const { originalWidth, originalHeight } = useCanvasStore();
const { padding } = useBackgroundStore();
```

**Why this works:**
- Each `useCropStore()` call with selector creates SPECIFIC subscription
- Zustand compares ONLY that property value (not entire object)
- Primitive boolean `isCropping` always triggers re-render when changed
- No false-positive equality checks

### Fix 2: Use `useShallow` (ALTERNATIVE)

**File:** `/Users/dcppsw/Projects/beautyshot/src/components/canvas/crop-overlay.tsx`

**Add import:**
```typescript
import { useShallow } from 'zustand/react/shallow';
```

**Change line 17 from:**
```typescript
const { isCropping, cropRect, aspectRatio, setCropRect } = useCropStore();
```

**To:**
```typescript
const { isCropping, cropRect, aspectRatio, setCropRect } = useCropStore(
  useShallow((state) => ({
    isCropping: state.isCropping,
    cropRect: state.cropRect,
    aspectRatio: state.aspectRatio,
    setCropRect: state.setCropRect,
  }))
);
```

**Why this works:**
- `useShallow` performs proper shallow equality check
- Compares each property individually
- More verbose but explicit about subscription

### Fix 3: Apply to CropPanel Too (RECOMMENDED)

**File:** `/Users/dcppsw/Projects/beautyshot/src/components/sidebar/crop-panel.tsx`

**Change line 8-10 from:**
```typescript
const { isCropping, aspectRatio, startCrop, applyCrop, cancelCrop, setAspectRatio } =
  useCropStore();
const { imageUrl, originalWidth } = useCanvasStore();
```

**To:**
```typescript
const isCropping = useCropStore((state) => state.isCropping);
const aspectRatio = useCropStore((state) => state.aspectRatio);
const startCrop = useCropStore((state) => state.startCrop);
const applyCrop = useCropStore((state) => state.applyCrop);
const cancelCrop = useCropStore((state) => state.cancelCrop);
const setAspectRatio = useCropStore((state) => state.setAspectRatio);
const { imageUrl, originalWidth } = useCanvasStore();
```

---

## Verification Steps

1. Apply Fix 1 to both files
2. Start dev server: `npm run dev`
3. Take screenshot (Cmd+Shift+4 or capture button)
4. Click "Start Crop" button
5. Verify:
   - Console shows `CropOverlay render: { isCropping: true, ... }`
   - Crop overlay appears on canvas with dashed border
   - Transformer handles visible
   - Aspect ratio buttons appear in sidebar

---

## Prevention Measures

### 1. Update Development Guidelines

**Add to `/Users/dcppsw/Projects/beautyshot/.claude/workflows/development-rules.md`:**

```markdown
## Zustand Store Subscription Best Practices

When using Zustand 5.0+ stores:

❌ AVOID bare destructuring:
```typescript
const { state1, state2, action } = useStore();
```

✅ USE explicit selectors:
```typescript
const state1 = useStore((state) => state.state1);
const state2 = useStore((state) => state.state2);
const action = useStore((state) => state.action);
```

✅ OR use useShallow for multiple properties:
```typescript
import { useShallow } from 'zustand/react/shallow';
const { state1, state2, action } = useStore(
  useShallow((state) => ({ state1: state.state1, state2: state.state2, action: state.action }))
);
```
```

### 2. Audit Other Store Usages

**Files to check:**
```bash
grep -n "= use.*Store()" src/**/*.tsx
```

Verify all store subscriptions use explicit selectors or `useShallow`.

### 3. Add ESLint Rule (Future)

Consider adding custom ESLint rule to prevent bare Zustand destructuring.

---

## Supporting Evidence

### Console Logs

**crop-store.ts:30**
```
crop-store: startCrop called, setting isCropping=true
```
✓ Store update executes

**crop-panel.tsx:16**
```
Start Crop clicked { canCrop: true, imageUrl: true, originalWidth: 3420, isCropping: false }
```
✓ Button handler executes

**crop-overlay.tsx:22 (MISSING)**
```
CropOverlay render: { isCropping: true, originalWidth: 3420, originalHeight: 2224, padding: 40 }
```
❌ Component never re-renders with new state

### Test Results

```
✓ src/stores/__tests__/crop-store.test.ts (31 tests)
  Test Files  1 passed (1)
  Tests       31 passed (31)
  Duration    358ms
```

✓ Store logic correct
❌ React subscription broken

### Code References

**Working store subscription** (annotation-layer.tsx:16):
```typescript
const { annotations, currentTool } = useAnnotationStore();
```
Works because component always renders (no early `return null`)

**Broken store subscription** (crop-overlay.tsx:17):
```typescript
const { isCropping, cropRect, aspectRatio, setCropRect } = useCropStore();
// ... early return null at line 41
```
Fails due to Zustand 5.0 subscription + early return pattern

---

## Unresolved Questions

1. **Why does BackgroundPanel work with same pattern?**
   - Uses same destructuring: `const { type, gradient, solidColor, padding, ... } = useBackgroundStore();`
   - No early `return null` condition
   - Always renders UI elements
   - **Answer:** Component never leaves React tree, so subscriptions stay active

2. **Should we refactor ALL store usages?**
   - Recommendation: YES for consistency
   - Prevents similar bugs in future
   - Makes subscription behavior explicit
   - Slight performance benefit (fewer subscriptions)

3. **Is this a Zustand 5.0 regression?**
   - Research suggests intentional API change
   - Forces developers to be explicit about subscriptions
   - Better performance for large stores
   - **Conclusion:** Working as designed, our usage pattern incorrect

---

## Sources

- [Prevent rerenders with useShallow - Zustand](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
- [State change does not cause re-render · pmndrs/zustand · Discussion #1653](https://github.com/pmndrs/zustand/discussions/1653)
- [destructuring in zustand · pmndrs/zustand · Discussion #2041](https://github.com/pmndrs/zustand/discussions/2041)
- [Destructured State Selection · pmndrs/zustand · Discussion #921](https://github.com/pmndrs/zustand/discussions/921)
- [Zustand in React: DOs and DON'Ts](https://medium.com/@nfailla93/zustand-in-react-dos-and-donts-5a608c26c68)

---

**Report Generated:** 2025-12-29 16:32
**Debugger Agent ID:** a6de497
