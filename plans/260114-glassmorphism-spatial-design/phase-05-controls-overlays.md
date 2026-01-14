---
title: "Phase 5: Controls & Overlays"
status: pending
effort: 1h
---

# Phase 5: Controls & Overlays

## Overview
Apply glass effect to zoom controls, toast notifications, settings modal, and window picker modal.

## Context Links
- [Main Plan](./plan.md)
- [Phase 4: Sidebar Redesign](./phase-04-sidebar-redesign.md)
- Files: zoom-controls.tsx, toast.tsx, settings-modal.tsx, window-picker-modal.tsx

## Key Insights
- Zoom controls: small floating panel, needs prominent visibility
- Toasts: keep distinct colors for type (success/error/info) with glass overlay
- Modals: glass backdrop + glass panel for dialog
- Settings modal: multiple sections need glass treatment

## Requirements

### Functional
- Glass zoom controls with shadow
- Glass toast notifications
- Glass modal dialogs
- Glass modal backdrop

### Non-Functional
- Toasts remain visually distinct by type
- Modals maintain focus trap behavior
- Accessibility preserved

## Implementation

### File: `src/components/canvas/zoom-controls.tsx`

**Update container (lines 64-69):**

Current:
```tsx
<div
  role="group"
  aria-label="Zoom controls"
  className="absolute bottom-4 right-4 flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-2"
>
```

Replace:
```tsx
<div
  role="group"
  aria-label="Zoom controls"
  className="absolute bottom-4 right-4 flex gap-2 glass floating-panel rounded-2xl p-2"
>
```

**Update copy button (lines 71-83):**
```tsx
className={`w-8 h-8 flex items-center justify-center rounded-xl text-orange-500 dark:text-orange-400 transition-all ${
  isExporting
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:bg-orange-500/10'
}`}
```

**Update separator (line 86):**
```tsx
<div className="w-px h-8 bg-black/10 dark:bg-white/10" />
```

**Update zoom buttons (lines 88-115):**
```tsx
className="w-8 h-8 flex items-center justify-center hover:bg-white/50 dark:hover:bg-white/10 rounded-lg text-gray-700 dark:text-gray-200 transition-all"
```

### File: `src/components/common/toast.tsx`

**Update toast container (lines 63-67):**

Current:
```tsx
<div
  className={`flex items-start gap-3 p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${bgColor} ${
    isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
  }`}
>
```

Replace with glass toast:
```tsx
<div
  className={`flex items-start gap-3 p-4 rounded-2xl shadow-lg text-white transition-all duration-300 backdrop-blur-md ${
    isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
  }`}
  style={{
    background: toast.type === 'success'
      ? 'rgba(22, 163, 74, 0.9)'
      : toast.type === 'error'
      ? 'rgba(220, 38, 38, 0.9)'
      : 'rgba(37, 99, 235, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  }}
>
```

**Update ToastContainer (lines 105-110):**
```tsx
<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
```

### File: `src/components/settings/settings-modal.tsx`

**Update backdrop (lines 157-160):**

Current:
```tsx
<div
  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
```

Replace:
```tsx
<div
  className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
```

**Update modal panel (lines 161-167):**

Current:
```tsx
<div
  ref={modalRef}
  className="bg-white dark:bg-gray-800 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
  ...
>
```

Replace:
```tsx
<div
  ref={modalRef}
  className="glass-heavy rounded-2xl w-[500px] max-h-[80vh] overflow-y-auto"
  ...
>
```

**Update header (lines 169-181):**
```tsx
<div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center sticky top-0 glass-heavy rounded-t-2xl z-10">
  <h2 id="settings-title" className="text-lg font-medium text-gray-800 dark:text-gray-100">
    Settings
  </h2>
  <button
    ref={closeButtonRef}
    onClick={onClose}
    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all"
    aria-label="Close settings (Escape)"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
```

**Update section headings:**
```tsx
<h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">
```

**Update theme buttons (lines 188-200):**
```tsx
className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${settings.theme === option.value
  ? 'glass-btn-active border border-orange-500/50 text-orange-500'
  : 'glass-btn text-gray-600 dark:text-gray-300'
}`}
```

**Update hotkey inputs (lines 229-254):**
```tsx
className={`w-48 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 glass-flat ${(isEditing && !isValid) || hasRegistrationError
  ? 'border border-red-300 focus:ring-red-500'
  : hasDuplicate
    ? 'border border-yellow-400 focus:ring-yellow-500'
    : 'border border-transparent focus:ring-orange-500'
}`}
```

**Update checkboxes (lines 287-318):**
```tsx
className="w-4 h-4 rounded border-gray-300/50 dark:border-gray-600/50 text-orange-500 focus:ring-orange-500 bg-white/50 dark:bg-black/30"
```

**Update footer (lines 357-371):**
```tsx
<div className="p-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center sticky bottom-0 glass-heavy rounded-b-2xl">
  <button
    onClick={() => settings.resetToDefaults()}
    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all"
  >
    Reset to Defaults
  </button>
  <button
    onClick={onClose}
    className="px-5 py-2 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-500/10 text-sm font-medium transition-all"
  >
    Done
  </button>
</div>
```

### File: `src/components/capture/window-picker-modal.tsx`

**Update backdrop (lines 149-153):**
```tsx
<div
  className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
```

**Update modal panel (lines 154-160):**
```tsx
<div
  ref={modalRef}
  className="glass-heavy rounded-2xl w-[500px] max-h-[70vh] flex flex-col overflow-hidden"
  role="dialog"
  ...
>
```

**Update header (lines 162-187):**
```tsx
<div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
  <h2 ... className="text-lg font-medium text-gray-800 dark:text-gray-100">
    Select Window to Capture
  </h2>
  <div className="flex items-center gap-2">
    <button
      onClick={fetchWindows}
      disabled={loading}
      className="px-3 py-1.5 text-sm glass-btn rounded-lg disabled:opacity-50"
    >
      Refresh
    </button>
    <button
      ref={closeButtonRef}
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all"
    >
      ...
    </button>
  </div>
</div>
```

**Update window list items (lines 201-238):**
```tsx
className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
  selectedId === win.id
    ? 'glass-btn-active ring-2 ring-orange-500'
    : 'glass-btn'
}`}
```

**Update footer (lines 244-265):**
```tsx
<div className="p-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
  <span className="text-sm text-gray-500 dark:text-gray-400">
    Double-click to capture instantly
  </span>
  <div className="flex gap-2">
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm glass-btn rounded-xl"
    >
      Cancel
    </button>
    <button
      onClick={handleCapture}
      disabled={selectedId === null || capturing}
      className="px-5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {capturing ? 'Capturing...' : 'Capture'}
    </button>
  </div>
</div>
```

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/canvas/zoom-controls.tsx` | Modify | Glass floating controls |
| `src/components/common/toast.tsx` | Modify | Glass notifications |
| `src/components/settings/settings-modal.tsx` | Modify | Glass modal |
| `src/components/capture/window-picker-modal.tsx` | Modify | Glass modal |

## Todo List
- [ ] Update zoom controls with glass class
- [ ] Update toast notifications with glass effect
- [ ] Update settings modal backdrop and panel
- [ ] Update settings modal sections and buttons
- [ ] Update window picker modal
- [ ] Test modal focus trapping still works
- [ ] Verify ESC key handling
- [ ] Test dark mode appearance

## Success Criteria
- All overlays have glass effect
- Modal backdrops have subtle blur
- Toasts maintain type distinction
- All functionality preserved
- Keyboard navigation works

## Risk Assessment
- **Low**: Styling changes only
- **Consideration**: Modal backdrop blur may impact performance on low-end devices

## Next Steps
Proceed to [Phase 6: Screens & Polish](./phase-06-screens-polish.md)
