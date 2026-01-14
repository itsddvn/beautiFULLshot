# Scout Report: Permission System Analysis

**Date:** 2026-01-14  
**Scope:** Permission-related files, permission checking, startup initialization  
**Environment:** Tauri v2 app (Cross-platform: macOS, Windows, Linux)

---

## Summary

BeautyShot implements a comprehensive permission system primarily for macOS, with graceful fallbacks for Windows/Linux. The system uses native APIs to check and request Screen Recording and Accessibility permissions before app launch. Permission state is checked during startup and blocks the app UI until permissions are granted.

---

## Core Permission Files

### 1. **Rust Backend: Permission Module**
**File:** `/Users/dcppsw/Projects/beautyshot/src-tauri/src/permissions.rs` (130 LOC)

Handles platform-specific permission checking and system settings integration.

**Functions:**
- `check_screen_permission()` - Checks if screen recording permission is granted
  - macOS: Uses `CGPreflightScreenCaptureAccess()` (CoreGraphics framework)
  - Other platforms: Returns `true` (always granted)
  - No prompts triggered (safe for UX)

- `check_accessibility_permission()` - Checks if accessibility permission is granted
  - macOS: Uses `macos_accessibility_client::application_is_trusted()`
  - Other platforms: Returns `true`
  - Used for global keyboard shortcuts

- `request_accessibility_permission()` - Requests accessibility permission
  - macOS: Uses `application_is_trusted_with_prompt()` (shows system dialog)
  - Other platforms: No-op (returns `true`)

- `request_screen_permission()` - Requests screen recording permission
  - macOS: Uses `CGRequestScreenCaptureAccess()` (may trigger dialogs)
  - Falls back to `open_screen_recording_settings()` if not granted
  - Other platforms: Returns `true`

- `open_screen_recording_settings()` - Opens macOS Privacy & Security settings
  - Executes: `open x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`
  - Other platforms: No-op

- `open_accessibility_settings()` - Opens macOS Privacy & Security settings
  - Executes: `open x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility`
  - Other platforms: No-op

- `check_wayland()` - Detects Wayland display server on Linux
  - Checks `WAYLAND_DISPLAY` environment variable
  - Returns warning message if Wayland detected (limited screenshot support)
  - Returns `None` if X11 or other platforms

**Key Design Decisions:**
- Uses `CGPreflightScreenCaptureAccess()` instead of `CGRequestScreenCaptureAccess()` for checks to avoid triggering system prompts during verification
- macOS requires app restart after granting permissions (cached at launch)
- Cross-platform compatible: non-macOS platforms return `true` by default

---

### 2. **Frontend: Permission UI Component**
**File:** `/Users/dcppsw/Projects/beautyshot/src/components/permission-required.tsx` (250 LOC)

Displays permission status screen and handles user interaction.

**Interface:**
```typescript
interface PermissionStatus {
  screenRecording: boolean;
  accessibility: boolean;
}

interface PermissionRequiredProps {
  onAllGranted: () => void;
}
```

**Features:**
- Responsive glass-morphism UI with gradient header
- Two permission items (Screen Recording, Accessibility)
- Visual status indicators (✓ green for granted, ✗ gray for denied)
- "Enable" button for each permission (opens settings or triggers request)
- Restart/Recheck action buttons
- Permission-specific instructions and warnings
- Dark mode support
- Privacy notice footer

**Flow:**
1. Mount: Calls `checkPermissions()` which invokes Rust commands
2. If all granted: Calls `onAllGranted()` callback
3. If partial grant: Shows "Restart App" button (macOS requirement)
4. User actions trigger Rust permission request/settings commands
5. Automatic recheck after enabling permissions

**Key Methods:**
- `checkPermissions()` - Parallel Promise.all() for both permission checks
- `openScreenSettings()` - Invokes `request_screen_permission`, falls back to settings
- `openAccessibilitySettings()` - Invokes `request_accessibility_permission`
- `restartApp()` - Uses `relaunch()` from `@tauri-apps/plugin-process`

---

### 3. **Frontend: App Startup Integration**
**File:** `/Users/dcppsw/Projects/beautyshot/src/App.tsx` (130+ LOC)

Root component that orchestrates permission checking on startup.

**App States:**
```typescript
type AppState = 'checking' | 'permissions_required' | 'ready';
```

**Startup Flow:**
1. `useEffect` on mount checks for dev mode (bypassed in DEV)
2. Calls Rust commands: `check_screen_permission()`, `check_accessibility_permission()`
3. Sets `appState` based on permission results:
   - Both granted → `'ready'`
   - Any denied → `'permissions_required'`
   - Error → `'ready'` (fallback on non-macOS)
4. Renders appropriate UI based on state

**UI States:**
- `'checking'` - Loading spinner with "Loading..." text
- `'permissions_required'` - Full-screen `<PermissionRequired />` component
- `'ready'` - Main `<EditorLayout />` with toolbar, canvas, sidebar

**Dev Mode:** Skips permission checks entirely for faster development iteration

---

### 4. **Tauri Capabilities Configuration**
**File:** `/Users/dcppsw/Projects/beautyshot/src-tauri/capabilities/default.json` (27 LOC)

Tauri v2 permission manifest for API access control.

**Declared Permissions:**
```json
[
  "core:default",
  "core:window:default",
  "core:window:allow-hide",
  "core:window:allow-show",
  "core:window:allow-set-focus",
  "core:window:allow-close",
  "core:window:allow-scale-factor",
  "core:window:allow-set-fullscreen",
  "core:event:default",
  "core:event:allow-emit",
  "core:event:allow-emit-to",
  "core:event:allow-listen",
  "opener:default",
  "global-shortcut:default",
  "notification:default",
  "dialog:default",
  "clipboard-manager:default",
  "clipboard-manager:allow-write-image",
  "process:default"
]
```

**Scope:** Applied to windows: `["main", "region-overlay"]`

**Notably Excluded:** File system permissions (not needed; uses file dialogs instead)

---

### 5. **macOS Platform Configuration**
**File:** `/Users/dcppsw/Projects/beautyshot/src-tauri/Info.plist` (10 LOC)

macOS-specific app metadata and privacy descriptions.

**Contents:**
```xml
<key>NSScreenCaptureDescription</key>
<string>BeautyFullShot needs screen recording permission to capture screenshots.</string>
<key>LSUIElement</key>
<true/>
```

**Notes:**
- `NSScreenCaptureDescription`: Privacy policy shown when requesting screen recording permission
- `LSUIElement`: Hides dock icon (supplementary app)
- No accessibility permission description in plist (handled by system)

---

### 6. **Rust Command Registration**
**File:** `/Users/dcppsw/Projects/beautyshot/src-tauri/src/lib.rs` (175 LOC)

Backend entry point that registers all Tauri commands.

**Permission Commands Registered (lines 123-129):**
```rust
permissions::check_screen_permission,
permissions::check_accessibility_permission,
permissions::request_accessibility_permission,
permissions::request_screen_permission,
permissions::check_wayland,
permissions::open_screen_recording_settings,
permissions::open_accessibility_settings,
```

**Exposed to Frontend:** All permission commands are public Tauri commands available via `invoke()`

---

## Platform-Specific Behavior

| Platform | Screen Recording | Accessibility | Behavior |
|----------|------------------|----------------|----------|
| **macOS** | Native API check/request required | Native API check/request required | Blocks app until both granted; requires restart after enabling |
| **Windows** | Always granted | Always granted | Skips permission screen; app launches directly |
| **Linux** | Always granted | Always granted | Checks for Wayland; shows warning if detected |

---

## Data Flow

```
App Startup
  ↓
App.tsx useEffect (checkStartupPermissions)
  ↓
isDev? → Skip permissions → state='ready'
     → Check permissions (parallel):
         - invoke('check_screen_permission')
         - invoke('check_accessibility_permission')
  ↓
[Rust Backend]
  - CGPreflightScreenCaptureAccess() on macOS
  - application_is_trusted() on macOS
  ↓
Both granted? → state='ready' → render EditorLayout
         → App blocks → state='permissions_required' → render PermissionRequired
  ↓
User clicks "Enable"
  ↓
PermissionRequired component:
  - openScreenSettings() → invoke('request_screen_permission')
  - openAccessibilitySettings() → invoke('request_accessibility_permission')
  ↓
[Rust Backend]
  - CGRequestScreenCaptureAccess() or application_is_trusted_with_prompt()
  ↓
User grants in system dialog
  ↓
PermissionRequired shows "Restart App" button
  ↓
User clicks "Restart App" → relaunch() → app restarts → permissions re-checked
```

---

## Key Integration Points

### Frontend-Backend Communication
- **All permission checks** use `invoke()` from `@tauri-apps/api/core`
- **All native dialogs** triggered from Rust (not frontend)
- **App restart** uses `relaunch()` from `@tauri-apps/plugin-process`

### Startup Initialization
- Permission check is the **first thing** in App.tsx
- Dev mode bypasses checks for fast iteration
- Non-macOS platforms skip to 'ready' state (no native permissions)

### Error Handling
- Permission check errors default to 'ready' state (allows app to run)
- Fallback to settings button if request dialog fails
- Try-catch blocks prevent app crash on invoke errors

---

## Security Considerations

1. **Native APIs Only:** Uses system frameworks for permission queries (no side effects)
2. **No Data Leakage:** Permission descriptions in Info.plist explain use case
3. **Cross-Platform Safe:** Non-macOS platforms default to `true` (no security risk)
4. **Accessibility Limited:** Only used for global keyboard shortcuts (not system-wide monitoring)
5. **Privacy Notice:** Footer in permission screen explains data usage

---

## Files Summary Table

| File | Lines | Purpose |
|------|-------|---------|
| `permissions.rs` | 130 | Platform-specific permission APIs |
| `permission-required.tsx` | 250 | Permission status UI screen |
| `App.tsx` | 130+ | Startup permission orchestration |
| `capabilities/default.json` | 27 | Tauri v2 API permission manifest |
| `Info.plist` | 10 | macOS privacy descriptions |
| `lib.rs` | 175 | Backend initialization & command registration |

---

## Notes & Unresolved Questions

- **Question:** Why is `LSUIElement=true` set in Info.plist? (Makes app supplementary - no dock icon)
  - **Answer:** By design - app hides to system tray and doesn't need permanent dock presence

- **Observation:** macOS requires app restart after enabling permissions (Apple security design)
  - Mitigated by providing clear "Restart App" button and instructions

- **Observation:** No entitlements.plist file found - using default sandbox settings
  - Sandbox disabled in tauri.conf.json for screen capture access (standard for Tauri screenshot apps)

---

**Report Generated:** 2026-01-14  
**Codebase Version:** v1.0.0 (Production Release)

