---
title: "Phase 4: Sidebar Redesign"
status: pending
effort: 1h
---

# Phase 4: Sidebar Redesign

## Overview
Transform sidebar and its panels to floating glass design with spatial feel.

## Context Links
- [Main Plan](./plan.md)
- [Phase 3: Toolbar Redesign](./phase-03-toolbar-redesign.md)
- File: `src/components/sidebar/sidebar.tsx`
- File: `src/components/sidebar/background-panel.tsx`
- File: `src/components/sidebar/crop-panel.tsx`
- File: `src/components/sidebar/export-panel.tsx`

## Key Insights
- Current sidebar: `w-80 bg-white dark:bg-gray-900 border-l border-gray-200`
- Needs: glass effect, rounded corners, no hard border
- Tab navigation needs glass-style active states
- Panels inside use glass-flat for nested glass
- Preserve all button styling (orange accent)

## Requirements

### Functional
- Glass effect on sidebar container
- Rounded corners (16px)
- Glass-style tab navigation
- Panel sections with subtle dividers
- All functionality preserved

### Non-Functional
- Scrollable content works with backdrop-filter
- Consistent with toolbar design

## Implementation

### File: `src/components/sidebar/sidebar.tsx`

**Current line 21:**
```tsx
<div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
```

**Replace:**
```tsx
<div className="w-80 glass floating-panel flex flex-col h-full overflow-hidden">
```

**Update tab navigation (lines 23-37):**

Current:
```tsx
<div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
        activeTab === tab.id
          ? 'text-blue-500 border-b-2 border-blue-500 bg-gray-50 dark:bg-gray-800'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

Replace:
```tsx
<div className="flex border-b border-black/5 dark:border-white/5 shrink-0 px-2 pt-2">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all rounded-t-xl ${
        activeTab === tab.id
          ? 'text-orange-500 bg-white/50 dark:bg-white/10 border-b-2 border-orange-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

**Update "no image" message (lines 41-44):**
```tsx
<div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm border-b border-black/5 dark:border-white/5">
  Take a screenshot to get started
</div>
```

### File: `src/components/sidebar/background-panel.tsx`

**Update panel container (line 189-190):**
```tsx
<div className="p-4 border-b border-black/5 dark:border-white/5">
```

**Update tab buttons container (line 194):**
```tsx
<div className="flex gap-1 mb-4 glass-flat rounded-xl p-1">
```

**Update tab buttons (lines 196-206):**
```tsx
className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
  ? 'bg-white/80 dark:bg-white/20 text-gray-800 dark:text-white shadow-sm'
  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-white/10'
}`}
```

**Update category tabs (lines 213-227):**
```tsx
className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === category.id
  ? 'bg-white/80 dark:bg-white/20 text-gray-800 dark:text-white shadow-sm'
  : 'glass-flat text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
}`}
```

**Update random button (lines 230-236):**
```tsx
className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl glass-btn text-gray-700 dark:text-gray-300 transition-all"
```

**Update slider sections (lines 435, 450, 465, 480):**
Replace border classes:
```tsx
className="mt-4 pt-4 border-t border-black/5 dark:border-white/5"
```

### File: `src/components/sidebar/crop-panel.tsx`

**Update container (line 114):**
```tsx
<div className="p-4 border-b border-black/5 dark:border-white/5">
```

**Update start crop button (lines 119-127):**
```tsx
className={`w-full py-2.5 rounded-xl font-medium transition-all border-2 ${
  canCrop
    ? 'border-orange-500 text-orange-500 hover:bg-orange-500/10'
    : 'border-gray-300/50 dark:border-gray-600/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'
}`}
```

**Update aspect ratio buttons (lines 133-145):**
```tsx
className={`px-2 py-1.5 text-sm font-medium rounded-lg transition-all ${
  aspectRatio === ar.ratio
    ? 'glass-btn-active border border-orange-500/50 text-orange-500'
    : 'glass-btn text-gray-600 dark:text-gray-300'
}`}
```

**Update apply/cancel buttons (lines 149-162):**
Apply:
```tsx
className="flex-1 py-2.5 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-500/10 font-medium transition-all"
```

Cancel:
```tsx
className="flex-1 py-2.5 glass-btn text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all"
```

### File: `src/components/sidebar/export-panel.tsx`

**Update container (line 59):**
```tsx
<div className="p-4 border-b border-black/5 dark:border-white/5">
```

**Update format/resolution buttons (lines 66-88, 114-129):**
```tsx
className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
  format === 'png'
    ? 'glass-btn-active border border-orange-500/50 text-orange-500'
    : 'glass-btn text-gray-600 dark:text-gray-300'
} ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
```

**Update output ratio grid buttons (lines 141-155):**
Same pattern as format buttons with glass-btn styles.

**Update action buttons (lines 164-213):**

Quick Save:
```tsx
className={`w-full py-2.5 border-2 border-orange-500 text-orange-500 rounded-xl text-sm font-medium transition-all ${
  isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-500/10'
}`}
```

Save As:
```tsx
className={`w-full py-2.5 border-2 border-amber-500 text-amber-500 rounded-xl text-sm font-medium transition-all ${
  isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-500/10'
}`}
```

Copy to Clipboard:
```tsx
className={`w-full py-2.5 glass-btn rounded-xl text-sm font-medium transition-all ${
  isExporting ? 'opacity-70 cursor-not-allowed' : ''
}`}
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/sidebar/sidebar.tsx` | Modify | Glass container + tabs |
| `src/components/sidebar/background-panel.tsx` | Modify | Glass sections |
| `src/components/sidebar/crop-panel.tsx` | Modify | Glass buttons |
| `src/components/sidebar/export-panel.tsx` | Modify | Glass buttons |

## Todo List
- [ ] Update sidebar container with glass class
- [ ] Update tab navigation to glass style
- [ ] Update background panel tabs and buttons
- [ ] Update crop panel buttons
- [ ] Update export panel buttons
- [ ] Replace hard borders with subtle glass borders
- [ ] Test scrolling behavior
- [ ] Verify dark mode appearance

## Success Criteria
- Sidebar floats with glass effect
- Tabs have smooth glass transitions
- All panel buttons use glass styling
- Orange accent preserved
- Scrolling works correctly

## Risk Assessment
- **Low**: Class changes only
- **Consideration**: Nested backdrop-filters may compound - use glass-flat for nested elements

## Next Steps
Proceed to [Phase 5: Controls & Overlays](./phase-05-controls-overlays.md)
