---
title: "Phase 2: Layout Structure"
status: pending
effort: 1h
---

# Phase 2: Layout Structure

## Overview
Transform `editor-layout.tsx` to create spatial gaps between main sections (toolbar, canvas, sidebar) for floating panel effect.

## Context Links
- [Main Plan](./plan.md)
- [Phase 1: CSS Foundation](./phase-01-css-foundation.md)
- File: `src/components/layout/editor-layout.tsx`

## Key Insights
- Current layout: flex column with toolbar on top, content area below
- Need gaps around canvas area to create floating effect
- Canvas background should be visible through gaps
- Toolbar and sidebar float above canvas visually

## Requirements

### Functional
- 12px gap between toolbar and content
- 12px gap between canvas and sidebar
- Visible canvas background through gaps
- Toolbar floats at top
- Sidebar floats on right

### Non-Functional
- Maintain existing functionality
- Responsive behavior preserved
- No layout shift on load

## Architecture

### Current Structure
```
<div h-screen flex-col>
  <Toolbar /> (h-14, border-b)
  <div flex-1 flex>
    <div flex-1> <Canvas/> <ZoomControls/> </div>
    <Sidebar /> (w-80, border-l)
  </div>
</div>
```

### New Structure
```
<div h-screen flex-col canvas-area p-3>
  <Toolbar /> (floating, glass, rounded)
  <div flex-1 flex gap-3 mt-3>
    <div flex-1 relative> <Canvas/> <ZoomControls/> </div>
    <Sidebar /> (floating, glass, rounded)
  </div>
</div>
```

## Implementation

### File: `src/components/layout/editor-layout.tsx`

**Replace lines 26-50:**

```tsx
return (
  <div className="h-screen w-screen flex flex-col overflow-hidden canvas-area p-3">
    {/* Top toolbar - floating glass panel */}
    <Toolbar />

    {/* Main content area with spatial gap */}
    <div className="flex-1 flex min-h-0 overflow-hidden mt-3 gap-3">
      {/* Canvas area - no background, shows through */}
      <div className="flex-1 relative min-w-0 overflow-hidden rounded-2xl bg-white/50 dark:bg-black/30">
        <CanvasEditor />
        <ZoomControls />
      </div>

      {/* Right sidebar - floating glass panel */}
      <Sidebar />
    </div>

    {/* Window picker modal */}
    <WindowPickerModal
      isOpen={isWindowPickerOpen}
      onClose={closeWindowPicker}
      onCapture={handleWindowCapture}
    />
  </div>
);
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/layout/editor-layout.tsx` | Modify | Add spatial layout |

## Todo List
- [ ] Update root container with canvas-area background
- [ ] Add padding to root container
- [ ] Add gap between toolbar and content
- [ ] Add gap between canvas and sidebar
- [ ] Add subtle background to canvas wrapper
- [ ] Test layout in light/dark modes
- [ ] Verify window picker modal still works

## Success Criteria
- Visible gaps between toolbar, canvas, sidebar
- Canvas background visible in gaps
- Floating panel effect achieved
- No functionality regression

## Risk Assessment
- **Medium**: Layout changes could affect canvas sizing
- **Mitigation**: Canvas uses flex-1 + relative positioning, should adapt

## Next Steps
Proceed to [Phase 3: Toolbar Redesign](./phase-03-toolbar-redesign.md)
