# Phase 04: Accessibility

**Status**: pending | **Effort**: 2h | **Priority**: Medium

## Objective

Add ARIA labels, keyboard navigation, and screen reader support.

## Issues Addressed

| ID | Severity | Description |
|----|----------|-------------|
| L1 | Low | Missing ARIA labels on buttons |
| L2 | Low | No keyboard navigation for dropdown |

## Implementation

### 1. ARIA Labels for Buttons

**toolbar.tsx:**
```tsx
<button
  onClick={handleCaptureFullscreen}
  disabled={loading}
  aria-label="Capture full screen screenshot"
  className="..."
>
  {loading ? 'Capturing...' : 'Capture Screen'}
</button>

<button
  onClick={() => setShowWindows(!showWindows)}
  aria-expanded={showWindows}
  aria-haspopup="listbox"
  aria-label="Select window to capture"
  className="..."
>
  Capture Window
</button>

<button
  onClick={clearCanvas}
  aria-label="Clear current screenshot"
  className="..."
>
  Clear
</button>
```

**zoom-controls.tsx:**
```tsx
<button
  onClick={zoomOut}
  aria-label="Zoom out"
  className="..."
>
  -
</button>

<span aria-live="polite" aria-label={`Zoom level ${Math.round(scale * 100)} percent`}>
  {Math.round(scale * 100)}%
</span>

<button
  onClick={zoomIn}
  aria-label="Zoom in"
  className="..."
>
  +
</button>

<button
  onClick={zoomFit}
  aria-label="Fit image to screen"
  className="..."
>
  Fit
</button>
```

### 2. Keyboard Navigation for Dropdown

```tsx
// Window dropdown with keyboard nav
<div
  role="listbox"
  aria-label="Available windows"
  tabIndex={-1}
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') {
      // Focus next item
    } else if (e.key === 'ArrowUp') {
      // Focus previous item
    } else if (e.key === 'Enter') {
      // Select current item
    }
  }}
>
  {windows.map((w, index) => (
    <button
      key={w.id}
      role="option"
      tabIndex={showWindows ? 0 : -1}
      aria-selected={false}
      onClick={() => handleCaptureWindow(w.id)}
      className="..."
    >
      <span className="font-medium">{w.app_name}</span>
      <span className="text-gray-500 ml-2">{w.title}</span>
    </button>
  ))}
</div>
```

### 3. Focus Management

```tsx
// Focus first dropdown item when opened
useEffect(() => {
  if (showWindows && dropdownRef.current) {
    const firstButton = dropdownRef.current.querySelector('button');
    firstButton?.focus();
  }
}, [showWindows]);
```

## Files to Modify

| File | Action |
|------|--------|
| src/components/toolbar/toolbar.tsx | Modify |
| src/components/canvas/zoom-controls.tsx | Modify |

## Success Criteria

- [ ] All buttons have aria-label
- [ ] Dropdown has proper ARIA roles
- [ ] Keyboard navigation works (Arrow keys + Enter)
- [ ] Zoom level announced to screen readers
- [ ] Focus management on dropdown open
