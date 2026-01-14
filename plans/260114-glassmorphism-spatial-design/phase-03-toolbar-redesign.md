---
title: "Phase 3: Toolbar Redesign"
status: pending
effort: 1h
---

# Phase 3: Toolbar Redesign

## Overview
Transform toolbar from flat bordered bar to floating glass panel with rounded corners and subtle shadow.

## Context Links
- [Main Plan](./plan.md)
- [Phase 2: Layout Structure](./phase-02-layout-structure.md)
- File: `src/components/toolbar/toolbar.tsx`
- File: `src/components/toolbar/tool-buttons.tsx`
- File: `src/components/toolbar/tool-settings.tsx`
- File: `src/components/toolbar/undo-redo-buttons.tsx`

## Key Insights
- Current: `h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700`
- Glass needs: backdrop-blur, semi-transparent, rounded corners, shadow
- Keep orange accent for capture buttons and active states
- Dividers should be subtle glass-style

## Requirements

### Functional
- Glass effect on toolbar container
- Rounded corners (16px)
- Subtle shadow for elevation
- Glass-style dividers between sections
- Preserve all button functionality

### Non-Functional
- Smooth hover transitions
- Consistent with sidebar glass effect

## Implementation

### File: `src/components/toolbar/toolbar.tsx`

**Current line 61:**
```tsx
<div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 gap-2 overflow-visible">
```

**Replace with:**
```tsx
<div className="h-14 glass floating-panel flex items-center px-4 gap-3 overflow-visible">
```

**Update dividers (lines 118, 126, 134):**

Current:
```tsx
<div className="w-px h-7 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
```

Replace with:
```tsx
<div className="w-px h-7 bg-black/10 dark:bg-white/10 flex-shrink-0" />
```

**Update capture buttons (lines 65-101):**

Replace button classes:
```tsx
className="w-10 h-10 flex items-center justify-center border-2 border-orange-500 text-orange-500 rounded-xl glass-btn hover:border-orange-400 disabled:opacity-50 transition-all"
```

**Update clear button (lines 106-114):**
```tsx
className="px-4 py-2 bg-gray-500/80 backdrop-blur-sm text-white rounded-xl hover:bg-gray-600/90 font-medium text-sm flex-shrink-0 transition-all"
```

**Update settings button (lines 155-180):**
```tsx
className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 glass-btn rounded-xl flex-shrink-0"
```

### File: `src/components/toolbar/tool-buttons.tsx`

**Update tool button classes (line 40-47):**

Current:
```tsx
className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-medium border ${
  currentTool === tool.type
    ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20'
    : 'border-transparent bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
}`}
```

Replace:
```tsx
className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
  currentTool === tool.type
    ? 'glass-btn-active border border-orange-500/50 text-orange-500'
    : 'glass-btn text-gray-700 dark:text-gray-200'
}`}
```

### File: `src/components/toolbar/tool-settings.tsx`

**Update color buttons (lines 32-43):**
```tsx
className={`w-6 h-6 rounded-lg transition-all ${
  strokeColor === color
    ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-white/50 dark:ring-offset-black/50'
    : 'ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/20 dark:hover:ring-white/20'
}`}
```

**Update width buttons (lines 51-59):**
```tsx
className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
  strokeWidth === width
    ? 'glass-btn-active border border-orange-500/50'
    : 'glass-btn'
}`}
```

### File: `src/components/toolbar/undo-redo-buttons.tsx`

**Update undo button (lines 15-24):**
```tsx
className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
  canUndo
    ? 'glass-btn text-gray-700 dark:text-gray-200'
    : 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
}`}
```

**Update redo button (lines 37-46):**
```tsx
className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
  canRedo
    ? 'glass-btn text-gray-700 dark:text-gray-200'
    : 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
}`}
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/toolbar/toolbar.tsx` | Modify | Glass toolbar container |
| `src/components/toolbar/tool-buttons.tsx` | Modify | Glass tool buttons |
| `src/components/toolbar/tool-settings.tsx` | Modify | Glass settings buttons |
| `src/components/toolbar/undo-redo-buttons.tsx` | Modify | Glass undo/redo |

## Todo List
- [ ] Update toolbar container with glass class
- [ ] Update dividers to glass-style
- [ ] Update capture buttons to glass-btn
- [ ] Update tool buttons to glass-btn
- [ ] Update color/width selectors
- [ ] Update undo/redo buttons
- [ ] Update settings button
- [ ] Test all button interactions
- [ ] Verify dark mode appearance

## Success Criteria
- Toolbar has glass blur effect
- Rounded corners visible
- Shadow provides elevation
- All buttons remain functional
- Orange accent preserved for active states

## Risk Assessment
- **Low**: Class changes only, no structural changes
- **Mitigation**: Glass utilities are additive

## Next Steps
Proceed to [Phase 4: Sidebar Redesign](./phase-04-sidebar-redesign.md)
