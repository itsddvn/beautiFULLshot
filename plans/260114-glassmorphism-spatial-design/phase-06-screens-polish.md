---
title: "Phase 6: Screens & Polish"
status: pending
effort: 1h
---

# Phase 6: Screens & Polish

## Overview
Update App.tsx loading/permission screens and final polish pass on all components.

## Context Links
- [Main Plan](./plan.md)
- [Phase 5: Controls & Overlays](./phase-05-controls-overlays.md)
- Files: App.tsx, permission-required.tsx

## Key Insights
- Loading screen: simple spinner on canvas-area background
- Permission screen: already has glass-like card, needs refinement
- Final pass: ensure consistent border-radius, shadows, transitions

## Requirements

### Functional
- Glass loading screen
- Refined permission screen with glass
- Consistent design language throughout

### Non-Functional
- Smooth loading experience
- Professional appearance
- Cross-browser compatibility

## Implementation

### File: `src/App.tsx`

**Update loading screen (lines 102-108):**

Current:
```tsx
if (appState === 'checking') {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

Replace:
```tsx
if (appState === 'checking') {
  return (
    <div className="fixed inset-0 canvas-area flex items-center justify-center">
      <div className="glass floating-panel p-8 rounded-2xl flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}
```

### File: `src/components/permission-required.tsx`

**Update background (line 168):**

Current:
```tsx
<div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
```

Replace:
```tsx
<div className="fixed inset-0 canvas-area flex items-center justify-center p-6">
```

**Update card container (line 169):**

Current:
```tsx
<div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
```

Replace:
```tsx
<div className="max-w-lg w-full glass-heavy rounded-3xl overflow-hidden">
```

**Update header gradient (lines 171-176):**
```tsx
<div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
  <h1 className="text-2xl font-bold mb-1">Permissions Required</h1>
  <p className="text-orange-100 text-sm">
    beautiFULLshot needs these permissions to work properly
  </p>
</div>
```

**Update PermissionItem component (lines 49-83):**

Update the container:
```tsx
<div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${granted
  ? 'bg-green-500/10 border border-green-500/30'
  : 'glass-flat'
}`}>
```

Update status icon container:
```tsx
<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${granted
  ? 'bg-green-500'
  : 'bg-gray-300/50 dark:bg-gray-600/50'
}`}>
```

Update Enable button:
```tsx
<button
  onClick={onOpenSettings}
  className="px-4 py-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10 text-sm font-medium rounded-xl transition-all shrink-0"
>
  Enable
</button>
```

**Update warning box (lines 196-205):**
```tsx
<div className="glass-flat rounded-2xl p-4 mt-4 border border-amber-500/20">
  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
    After enabling permissions:
  </p>
  <p className="text-sm text-amber-600 dark:text-amber-400">
    macOS requires an app restart for permission changes to take effect. Click <strong>"Restart App"</strong> below after enabling.
  </p>
</div>
```

**Update action buttons (lines 208-234):**

Restart button:
```tsx
className="flex-1 px-4 py-3 border-2 border-orange-500 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50 font-medium rounded-2xl transition-all"
```

Recheck button:
```tsx
className="px-4 py-3 glass-btn text-gray-700 dark:text-gray-200 font-medium rounded-2xl transition-all"
```

Check Again button:
```tsx
className="w-full px-4 py-3 glass-btn text-gray-700 dark:text-gray-200 font-medium rounded-2xl transition-all"
```

**Update footer (lines 239-245):**
```tsx
<div className="px-6 pb-6">
  <p className="text-xs text-center text-gray-500 dark:text-gray-400 opacity-75">
    These permissions are only used for screenshot capture and keyboard shortcuts.
    <br />
    Your privacy is respected - no data is collected.
  </p>
</div>
```

## Final Polish Checklist

### Consistent Border Radius
- Buttons: `rounded-xl` (12px)
- Panels: `rounded-2xl` (16px)
- Cards: `rounded-2xl` or `rounded-3xl` (20px)
- Small elements: `rounded-lg` (8px)

### Consistent Transitions
- All interactive elements: `transition-all`
- Duration: default (150ms) or `duration-200`

### Consistent Shadows
- Small floating elements: `var(--panel-shadow)`
- Large panels: `var(--panel-shadow-lg)`

### Color Accents
- Primary action: `border-orange-500 text-orange-500`
- Secondary action: `border-amber-500 text-amber-500`
- Neutral action: `glass-btn`
- Active state: `glass-btn-active`

### Dark Mode Verification
- [ ] Toolbar glass effect visible
- [ ] Sidebar glass effect visible
- [ ] Modal backdrops have blur
- [ ] Text contrast sufficient
- [ ] Orange accent visible

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/App.tsx` | Modify | Glass loading screen |
| `src/components/permission-required.tsx` | Modify | Glass permission screen |

## Todo List
- [ ] Update App.tsx loading screen
- [ ] Update permission-required container
- [ ] Update permission items styling
- [ ] Update warning boxes
- [ ] Update action buttons
- [ ] Final review of all components
- [ ] Test complete user flow
- [ ] Verify dark mode throughout
- [ ] Check performance (backdrop-blur)
- [ ] Cross-browser test (Safari, Chrome, Firefox)

## Success Criteria
- Loading screen matches design language
- Permission screen has glass aesthetic
- All components follow consistent patterns
- No visual regressions
- Performance acceptable

## Risk Assessment
- **Low**: Final polish phase, no structural changes
- **Consideration**: Total backdrop-filter usage - monitor performance

## Post-Implementation
- Run `npm run build` to verify no errors
- Test in development mode
- Visual QA in both themes
- Document any browser-specific issues
