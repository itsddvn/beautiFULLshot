# Phase 01: DRY Violations & Constants

**Status**: pending | **Effort**: 1h | **Priority**: Medium

## Objective

Eliminate code duplication and consolidate magic numbers into shared constants.

## Issues Addressed

| ID | Description | Location |
|----|-------------|----------|
| M2 | Duplicate ZOOM_FACTOR | canvas-editor.tsx:11, zoom-controls.tsx:5 |
| M3 | Duplicate scale clamping | canvas-store.ts + canvas-editor.tsx |

## Implementation

### 1. Create Constants File

**src/constants/canvas.ts:**
```typescript
// Canvas constants - shared across canvas components
export const ZOOM = {
  FACTOR: 1.1,
  MIN_SCALE: 0.1,
  MAX_SCALE: 5,
} as const;
```

### 2. Update canvas-store.ts

```typescript
import { ZOOM } from '../constants/canvas';

setScale: (scale) => set({
  scale: Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, scale))
}),
```

### 3. Update canvas-editor.tsx

```typescript
import { ZOOM } from '../../constants/canvas';

// Remove local constants
// const MIN_SCALE = 0.1;
// const MAX_SCALE = 5;
// const ZOOM_FACTOR = 1.1;

// Use ZOOM.FACTOR, ZOOM.MIN_SCALE, ZOOM.MAX_SCALE
```

### 4. Update zoom-controls.tsx

```typescript
import { ZOOM } from '../../constants/canvas';

// Remove: const ZOOM_FACTOR = 1.1;
const zoomIn = () => setScale(scale * ZOOM.FACTOR);
const zoomOut = () => setScale(scale / ZOOM.FACTOR);
```

## Files to Create/Modify

| File | Action |
|------|--------|
| src/constants/canvas.ts | Create |
| src/stores/canvas-store.ts | Modify |
| src/components/canvas/canvas-editor.tsx | Modify |
| src/components/canvas/zoom-controls.tsx | Modify |

## Success Criteria

- [ ] Single source of truth for zoom constants
- [ ] No duplicate ZOOM_FACTOR definitions
- [ ] Scale clamping only in store
- [ ] TypeScript: 0 errors
