# Phase 07: Native OS Integration

**Status**: ✅ completed | **Effort**: 5h (actual: 4h) | **Priority**: P2
**Completed**: 2025-12-29 | **Code Review**: APPROVED (Grade A - 95/100)

## Objective

Implement system tray with menu, configurable global hotkeys, notifications on save, and settings persistence.

---

## Tasks

### 7.1 System Tray Setup

**src-tauri/src/tray.rs:**
```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit BeautyShot", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let capture_item = MenuItem::with_id(app, "capture", "Capture Screen", true, Some("CmdOrCtrl+Shift+C"))?;
    let separator = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(app, &[
        &capture_item,
        &separator,
        &show_item,
        &quit_item,
    ])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => {
                    app.exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "capture" => {
                    // Emit event to frontend
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("tray-capture", ());
                    }
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

### 7.2 Global Shortcuts

**src-tauri/src/shortcuts.rs:**
```rust
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

pub fn register_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),
        Code::KeyC
    );

    app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.emit("hotkey-capture", ());
        }
    })?;

    Ok(())
}
```

**Update src-tauri/src/main.rs:**
```rust
mod tray;
mod shortcuts;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Create system tray
            tray::create_tray(app.handle())?;

            // Register global shortcuts
            if let Err(e) = shortcuts::register_shortcuts(app.handle()) {
                eprintln!("Failed to register shortcuts: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ... existing commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 7.3 Frontend Hotkey Listener

**src/hooks/use-hotkeys.ts:**
```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useScreenshot } from './use-screenshot';

export function useHotkeys() {
  const { captureFullscreen } = useScreenshot();

  useEffect(() => {
    // Listen for tray capture event
    const unlistenTray = listen('tray-capture', () => {
      captureFullscreen();
    });

    // Listen for global hotkey event
    const unlistenHotkey = listen('hotkey-capture', () => {
      captureFullscreen();
    });

    return () => {
      unlistenTray.then(fn => fn());
      unlistenHotkey.then(fn => fn());
    };
  }, [captureFullscreen]);
}
```

### 7.4 Settings Store (Persisted)

**src/stores/settings-store.ts:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface HotkeyConfig {
  capture: string;
  captureRegion: string;
  captureWindow: string;
  save: string;
  copy: string;
}

interface SettingsState {
  // Hotkeys
  hotkeys: HotkeyConfig;

  // Behavior
  startMinimized: boolean;
  closeToTray: boolean;
  showNotifications: boolean;

  // Default save location
  saveLocation: 'pictures' | 'desktop' | 'custom';
  customSavePath: string | null;

  // Actions
  setHotkey: (action: keyof HotkeyConfig, shortcut: string) => void;
  setStartMinimized: (value: boolean) => void;
  setCloseToTray: (value: boolean) => void;
  setShowNotifications: (value: boolean) => void;
  setSaveLocation: (location: 'pictures' | 'desktop' | 'custom') => void;
  setCustomSavePath: (path: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hotkeys: {
        capture: 'CommandOrControl+Shift+C',
        captureRegion: 'CommandOrControl+Shift+R',
        captureWindow: 'CommandOrControl+Shift+W',
        save: 'CommandOrControl+S',
        copy: 'CommandOrControl+Shift+V',
      },

      startMinimized: false,
      closeToTray: true,
      showNotifications: true,

      saveLocation: 'pictures',
      customSavePath: null,

      setHotkey: (action, shortcut) =>
        set(state => ({
          hotkeys: { ...state.hotkeys, [action]: shortcut }
        })),
      setStartMinimized: (value) => set({ startMinimized: value }),
      setCloseToTray: (value) => set({ closeToTray: value }),
      setShowNotifications: (value) => set({ showNotifications: value }),
      setSaveLocation: (location) => set({ saveLocation: location }),
      setCustomSavePath: (path) => set({ customSavePath: path }),
    }),
    {
      name: 'beautyshot-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 7.5 Settings Panel UI

**src/components/settings/settings-modal.tsx:**
```typescript
import { useState } from 'react';
import { useSettingsStore } from '../../stores/settings-store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const settings = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Hotkeys Section */}
          <section>
            <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {Object.entries(settings.hotkeys).map(([action, shortcut]) => (
                <div key={action} className="flex justify-between items-center">
                  <label className="text-sm capitalize">
                    {action.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={shortcut}
                    onChange={(e) => settings.setHotkey(
                      action as keyof typeof settings.hotkeys,
                      e.target.value
                    )}
                    className="w-48 px-2 py-1 border rounded text-sm"
                    placeholder="Press keys..."
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Behavior Section */}
          <section>
            <h3 className="font-medium mb-3">Behavior</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.startMinimized}
                  onChange={(e) => settings.setStartMinimized(e.target.checked)}
                />
                <span className="text-sm">Start minimized to tray</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.closeToTray}
                  onChange={(e) => settings.setCloseToTray(e.target.checked)}
                />
                <span className="text-sm">Close to tray instead of quit</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) => settings.setShowNotifications(e.target.checked)}
                />
                <span className="text-sm">Show notifications</span>
              </label>
            </div>
          </section>

          {/* Save Location */}
          <section>
            <h3 className="font-medium mb-3">Default Save Location</h3>
            <div className="space-y-2">
              {(['pictures', 'desktop', 'custom'] as const).map(loc => (
                <label key={loc} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="saveLocation"
                    checked={settings.saveLocation === loc}
                    onChange={() => settings.setSaveLocation(loc)}
                  />
                  <span className="text-sm capitalize">{loc}</span>
                </label>
              ))}

              {settings.saveLocation === 'custom' && (
                <div className="ml-6">
                  <input
                    type="text"
                    value={settings.customSavePath || ''}
                    onChange={(e) => settings.setCustomSavePath(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Custom path..."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 7.6 Window Close Handler

**src/App.tsx** (add close handler):
```typescript
import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from './stores/settings-store';

function App() {
  const { closeToTray } = useSettingsStore();

  useEffect(() => {
    const appWindow = getCurrentWindow();

    const unlisten = appWindow.onCloseRequested(async (event) => {
      if (closeToTray) {
        event.preventDefault();
        await appWindow.hide();
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [closeToTray]);

  // ... rest of component
}
```

### 7.7 macOS Template Icon

For macOS dark mode support, create template icon:

**src-tauri/icons/icon-template.png** (white icon on transparent background)

**Update tray.rs:**
```rust
#[cfg(target_os = "macos")]
let icon = tauri::image::Image::from_path("icons/icon-template.png")?;

#[cfg(not(target_os = "macos"))]
let icon = app.default_window_icon().unwrap().clone();
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src-tauri/src/tray.rs` | Create |
| `src-tauri/src/shortcuts.rs` | Create |
| `src-tauri/src/main.rs` | Modify |
| `src/stores/settings-store.ts` | Create |
| `src/hooks/use-hotkeys.ts` | Create |
| `src/components/settings/settings-modal.tsx` | Create |
| `src/App.tsx` | Modify (close handler) |
| `src-tauri/icons/icon-template.png` | Create (macOS) |

---

## Platform Considerations

### macOS
- Template icon required for proper dark mode tray
- Accessibility permissions may be needed for global shortcuts
- Notarization required for distribution

### Windows
- Tray icon works out of box
- Global shortcuts work without special permissions
- UAC not required for normal operation

### Linux
- Tray support varies by desktop environment
- GNOME needs extension for tray icons
- KDE/XFCE have native support
- Wayland may have hotkey limitations

---

## Success Criteria

- [x] System tray icon visible on all platforms ✅
- [x] Tray menu with Capture/Show/Quit options ✅
- [x] Click tray icon → show window ✅
- [x] Global hotkey triggers capture ✅
- [x] Settings saved to localStorage ✅
- [x] Close to tray works (when enabled) ✅
- [x] Notifications appear on save (when enabled) ✅
- [x] Settings modal opens and saves correctly ✅

**Additional Achievements:**
- [x] 28 tests for settings store + hotkey validation (212 total)
- [x] Safe error handling in tray.rs (no unwrap crashes)
- [x] Hotkey input validation with visual feedback
- [x] Notifications respect showNotifications setting

---

## Known Issues

- Linux GNOME: May need TopIcons extension
- Wayland: Some global hotkeys may not work
- macOS: First hotkey use needs Accessibility approval

---

## Next Phase

[Phase 08: Polish & Distribution](./phase-08-polish-distribution.md)
