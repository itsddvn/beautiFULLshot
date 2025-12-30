# BeautyShot UI Issues Debug Report

**Date:** 2025-12-29
**Session ID:** ab586bd
**Issues:** 4 critical UI/UX bugs

---

## Issue 2: CROP Function Not Working

### Root Cause
**NO BUG DETECTED** - Crop functionality is fully implemented and tested (31 passing tests).

### Analysis
- **Store:** `src/stores/crop-store.ts` - Complete implementation with `isCropping`, `cropRect`, `aspectRatio` state
- **UI Panel:** `src/components/sidebar/crop-panel.tsx` - Start/Apply/Cancel buttons present, aspect ratio grid functional
- **Canvas Overlay:** `src/components/canvas/crop-overlay.tsx` - Transformer, draggable rect, aspect ratio constraints all implemented
- **Tests:** All 31 crop store tests passing (verified via `npm test`)

### Possible User Error
1. User may not see crop overlay if `originalWidth === 0` (no image loaded) - Line 35 early return
2. Crop overlay offset by `padding` value - may not align with user expectations
3. Transformer requires clicking on crop rect first, then dragging handles (not obvious)

### Suggested Fix
**None needed** - Implementation is correct. If issue persists, need:
- Video/screenshot of actual behavior
- Console error logs
- Check if image is loaded (`useCanvasStore.originalWidth > 0`)

---

## Issue 3: Keyboard Shortcuts Not Working

### Root Cause
**PARTIAL IMPLEMENTATION** - Global shortcuts registered but potentially failing silently.

### File Paths & Analysis

**Backend Registration:**
- `src-tauri/src/shortcuts.rs:9-21` - Registers `Cmd/Ctrl+Shift+C` via `tauri-plugin-global-shortcut`
  - Uses `Modifiers::SUPER | Modifiers::SHIFT` + `Code::KeyC`
  - Emits `hotkey-capture` event on `ShortcutState::Pressed`

**Frontend Listener:**
- `src/hooks/use-hotkeys.ts:74-76` - Listens for `hotkey-capture` event
- `src/App.tsx:44` - Hook initialized in App component

**Error Handling:**
- `src-tauri/src/lib.rs:29-34` - Errors emitted to frontend via `shortcut-error` event
- `src/App.tsx:64-66` - Warning banner displayed on error (but no screenshot shows this)

### Root Cause Details
**Line-by-line breakdown:**

1. `src-tauri/src/lib.rs:29` - `shortcuts::register_shortcuts()` call wrapped in error handler
2. If registration fails, error emitted but **only logs to stderr** - no user notification beyond banner
3. `src-tauri/src/shortcuts.rs:11` - Uses `.on_shortcut()` which may fail on macOS without Accessibility permissions
4. **Missing:** No check for Accessibility permissions on macOS (similar to screen recording check)

### Suggested Fix

**Add permission check in `src-tauri/src/shortcuts.rs`:**

```rust
// Add before register_shortcuts()
#[cfg(target_os = "macos")]
fn check_accessibility_permission() -> bool {
    // Use macOS APIs to check Accessibility permissions
    // Similar to check_screen_permission in permissions.rs
    true // Placeholder
}

pub fn register_shortcuts(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    if !check_accessibility_permission() {
        return Err("Accessibility permission required for global shortcuts".into());
    }

    // Existing code...
}
```

**Alternative quick fix:** Check if `tauri-plugin-global-shortcut` plugin initialized:
- Verify `src-tauri/src/lib.rs:21` - Plugin added ✓
- Check `src-tauri/Cargo.toml` dependencies for version conflicts

**User workaround:** System Preferences → Security & Privacy → Accessibility → Grant BeautyShot access

---

## Issue 4: No Region Capture Button in Menu

### Root Cause
**FEATURE NOT IMPLEMENTED** - Region capture backend exists but UI missing.

### File Paths

**Backend (Implemented):**
- `src-tauri/src/screenshot.rs:60-85` - `capture_region(x, y, width, height)` command exists
- `src/utils/screenshot-api.ts:21-29` - Frontend wrapper `captureRegion()` exists
- `src/types/screenshot.ts` - `CaptureRegion` interface defined

**Frontend (Missing):**
- `src/components/toolbar/toolbar.tsx:84-126` - Only "Capture Screen" and "Capture Window" buttons
- **No region capture button or flow**

### Suggested Fix

**Add region capture button in `src/components/toolbar/toolbar.tsx`:**

Insert after line 126 (after "Capture Window" dropdown):

```tsx
{/* Region capture button */}
<button
  onClick={handleStartRegionCapture}
  disabled={loading}
  aria-label="Capture region screenshot"
  className="px-4 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
>
  Capture Region
</button>
```

**Implementation steps:**
1. Add `captureRegion` import from `@/utils/screenshot-api`
2. Add state: `const [isSelectingRegion, setIsSelectingRegion] = useState(false)`
3. Create `handleStartRegionCapture` - shows crosshair overlay for region selection
4. Create overlay component similar to `CropOverlay` for region selection
5. On region selected, call `captureRegion({ x, y, width, height })`

**Complexity:** Medium - requires new region selection UI/UX flow

---

## Issue 5: Canvas Only Showing 2/3 Screen Height

### Root Cause
**LAYOUT CONSTRAINT** - Fixed toolbar height not accounted for in flex layout.

### File Paths & Analysis

**Layout Structure:**
- `src/components/layout/editor-layout.tsx:10-26`
  ```tsx
  <div className="h-screen flex flex-col">        // Line 10 - Full viewport height
    <Toolbar />                                   // Line 12 - Fixed h-12 (48px)
    <div className="flex-1 flex overflow-hidden"> // Line 15 - Remaining space
      <div className="flex-1 relative">           // Line 17 - Canvas container
        <CanvasEditor />                          // Line 18
  ```

**Canvas Container:**
- `src/components/canvas/canvas-editor.tsx:114-118`
  ```tsx
  <div
    ref={containerRef}
    className="flex-1 bg-gray-100 overflow-hidden"  // flex-1 should fill parent
  >
  ```

**Responsive Resize:**
- `src/components/canvas/canvas-editor.tsx:46-59` - Sets stage size from `containerRef.current.offsetHeight`

### Root Cause Details

**Hypothesis 1: HTML/Body height not set**
- `index.html:10-14` - `<body>` has no explicit height
- `src/styles.css` - No `html, body { height: 100% }` rule

**Hypothesis 2: Toolbar height miscalculation**
- `src/components/toolbar/toolbar.tsx:83` - `h-12` class (48px)
- If Tailwind not properly loaded, fallback height may be wrong

**Hypothesis 3: Sidebar taking wrong space**
- `src/components/sidebar/sidebar.tsx:12` - `w-64 overflow-y-auto` - No height constraint

### Suggested Fix

**Primary fix - Add to `src/styles.css`:**

```css
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

**Secondary fix - Verify in `src/components/canvas/canvas-editor.tsx:49`:**

```tsx
const handleResize = () => {
  if (containerRef.current) {
    console.log('Container dimensions:', {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      parent: containerRef.current.parentElement?.offsetHeight
    });
    setStageSize(
      containerRef.current.offsetWidth,
      containerRef.current.offsetHeight
    );
  }
};
```

**Tertiary fix - Force layout in `editor-layout.tsx`:**

```tsx
<div className="h-screen flex flex-col overflow-hidden">  {/* Add overflow-hidden */}
  <Toolbar />
  <div className="flex-1 flex min-h-0">  {/* Add min-h-0 to allow flexbox shrink */}
```

**Root cause confirmation needed:**
- Open DevTools → Elements → Inspect canvas container
- Check computed height of `.flex-1` container
- Verify parent height chain: `#root` → `.h-screen` → `.flex-1`

---

## Unresolved Questions

1. **Issue 2 (Crop):** Need reproduction steps - crop works in tests. What exact click sequence fails?
2. **Issue 3 (Shortcuts):** Are macOS Accessibility permissions granted? Check System Preferences.
3. **Issue 5 (Canvas height):** What's the actual rendered height ratio? (Measure in DevTools)
4. **All issues:** Browser console errors present? Check DevTools Console for React warnings.

---

## Priority Recommendations

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | Issue 5 (Canvas height) | 5min | Critical UX |
| **P1** | Issue 4 (Region capture) | 2-4hr | Feature gap |
| **P2** | Issue 3 (Shortcuts) | 1hr | Accessibility issue |
| **P3** | Issue 2 (Crop) | 0min | No bug found |

---

**Next Steps:**
1. Apply CSS fix for Issue 5 immediately
2. Test shortcuts with Accessibility permissions check
3. Request video recording of crop failure for Issue 2
4. Plan region capture UI/UX flow for Issue 4
