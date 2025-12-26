# Phase 02: UX Improvements

**Status**: pending | **Effort**: 2h | **Priority**: High

## Objective

Fix critical UX issues: dropdown behavior, loading states, error handling.

## Issues Addressed

| ID | Severity | Description |
|----|----------|-------------|
| H1 | High | No click-away/ESC for window dropdown |
| M5 | Medium | handleWheel causes unnecessary re-renders |
| M6 | Medium | No visual loading spinner |
| L4 | Low | Errors don't auto-dismiss |

## Implementation

### 1. Dropdown Click-Away Hook

**src/hooks/use-click-away.ts:**
```typescript
import { useEffect, RefObject } from 'react';

export function useClickAway(
  ref: RefObject<HTMLElement>,
  onClickAway: () => void
) {
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickAway();
      }
    };

    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClickAway();
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', escHandler);

    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [ref, onClickAway]);
}
```

### 2. Update Toolbar

```typescript
import { useRef, useCallback } from 'react';
import { useClickAway } from '../../hooks/use-click-away';

// In Toolbar component:
const dropdownRef = useRef<HTMLDivElement>(null);
const closeDropdown = useCallback(() => setShowWindows(false), []);
useClickAway(dropdownRef, closeDropdown);

// Wrap dropdown in ref'd div
<div ref={dropdownRef} className="relative">
  {/* dropdown content */}
</div>
```

### 3. Loading Spinner

Add visual loading indicator:
```typescript
{loading && (
  <div className="flex items-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <span>Capturing...</span>
  </div>
)}
```

### 4. Auto-Dismiss Errors

```typescript
// In useScreenshot:
const [error, setError] = useState<string | null>(null);

// Auto-dismiss after 5s
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }
}, [error]);
```

## Files to Create/Modify

| File | Action |
|------|--------|
| src/hooks/use-click-away.ts | Create |
| src/components/toolbar/toolbar.tsx | Modify |
| src/hooks/use-screenshot.ts | Modify |

## Success Criteria

- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on ESC key
- [ ] Loading spinner visible during capture
- [ ] Errors auto-dismiss after 5s
