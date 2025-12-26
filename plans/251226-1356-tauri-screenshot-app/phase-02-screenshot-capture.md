# Phase 02: Core Screenshot Functionality

**Status**: completed | **Effort**: 4h | **Priority**: P1 | **Reviewed**: 2025-12-27

## Objective

Implement screenshot capture using xcap crate with IPC commands for fullscreen, region, and window capture modes.

---

## Tasks

### 2.1 Rust Screenshot Commands

**src-tauri/src/screenshot.rs:**
```rust
use xcap::{Monitor, Window as XcapWindow};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowInfo {
    pub id: u32,
    pub app_name: String,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Capture primary monitor
#[tauri::command]
pub fn capture_fullscreen() -> Result<Vec<u8>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors.into_iter()
        .find(|m| m.is_primary())
        .ok_or("No primary monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;
    Ok(image.to_png().map_err(|e| e.to_string())?)
}

/// Capture specific region
#[tauri::command]
pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<Vec<u8>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.into_iter()
        .find(|m| m.is_primary())
        .ok_or("No primary monitor")?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    // Crop to region
    let cropped = image::imageops::crop_imm(
        &image,
        x as u32,
        y as u32,
        width,
        height
    ).to_image();

    let mut bytes = Vec::new();
    cropped.write_to(&mut std::io::Cursor::new(&mut bytes), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(bytes)
}

/// Get list of capturable windows
#[tauri::command]
pub fn get_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;

    Ok(windows.into_iter()
        .filter(|w| !w.title().is_empty())
        .map(|w| WindowInfo {
            id: w.id(),
            app_name: w.app_name().to_string(),
            title: w.title().to_string(),
            x: w.x(),
            y: w.y(),
            width: w.width(),
            height: w.height(),
        })
        .collect())
}

/// Capture specific window by ID
#[tauri::command]
pub fn capture_window(window_id: u32) -> Result<Vec<u8>, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;
    let window = windows.into_iter()
        .find(|w| w.id() == window_id)
        .ok_or("Window not found")?;

    let image = window.capture_image().map_err(|e| e.to_string())?;
    Ok(image.to_png().map_err(|e| e.to_string())?)
}

/// Get monitor list
#[tauri::command]
pub fn get_monitors() -> Result<Vec<MonitorInfo>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    Ok(monitors.into_iter().map(|m| MonitorInfo {
        id: m.id(),
        name: m.name().to_string(),
        width: m.width(),
        height: m.height(),
        x: m.x(),
        y: m.y(),
        is_primary: m.is_primary(),
    }).collect())
}
```

### 2.2 Register Commands in main.rs

**src-tauri/src/main.rs:**
```rust
mod screenshot;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            screenshot::capture_fullscreen,
            screenshot::capture_region,
            screenshot::capture_window,
            screenshot::get_windows,
            screenshot::get_monitors,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.3 TypeScript Types & API

**src/types/screenshot.ts:**
```typescript
export interface MonitorInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  is_primary: boolean;
}

export interface WindowInfo {
  id: number;
  app_name: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

**src/utils/screenshot-api.ts:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { MonitorInfo, WindowInfo } from '../types/screenshot';

export async function captureFullscreen(): Promise<Uint8Array> {
  return await invoke<number[]>('capture_fullscreen')
    .then(arr => new Uint8Array(arr));
}

export async function captureRegion(
  x: number, y: number, width: number, height: number
): Promise<Uint8Array> {
  return await invoke<number[]>('capture_region', { x, y, width, height })
    .then(arr => new Uint8Array(arr));
}

export async function captureWindow(windowId: number): Promise<Uint8Array> {
  return await invoke<number[]>('capture_window', { windowId })
    .then(arr => new Uint8Array(arr));
}

export async function getWindows(): Promise<WindowInfo[]> {
  return await invoke('get_windows');
}

export async function getMonitors(): Promise<MonitorInfo[]> {
  return await invoke('get_monitors');
}

export function bytesToImageUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: 'image/png' });
  return URL.createObjectURL(blob);
}
```

### 2.4 Screenshot Hook

**src/hooks/use-screenshot.ts:**
```typescript
import { useState, useCallback } from 'react';
import * as api from '../utils/screenshot-api';
import type { WindowInfo } from '../types/screenshot';

export function useScreenshot() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureFullscreen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await api.captureFullscreen();
      setImageBytes(bytes);
      setImageUrl(api.bytesToImageUrl(bytes));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const captureWindow = useCallback(async (windowId: number) => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await api.captureWindow(windowId);
      setImageBytes(bytes);
      setImageUrl(api.bytesToImageUrl(bytes));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageBytes(null);
  }, [imageUrl]);

  return {
    imageUrl,
    imageBytes,
    loading,
    error,
    captureFullscreen,
    captureWindow,
    clearImage,
  };
}
```

---

## macOS Permissions Handling

**Important**: macOS requires Screen Recording permission.

**src-tauri/src/permissions.rs:**
```rust
#[cfg(target_os = "macos")]
#[tauri::command]
pub fn check_screen_permission() -> bool {
    // xcap internally handles permission check
    // Returns true if permission granted
    xcap::Monitor::all().is_ok()
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
pub fn check_screen_permission() -> bool {
    true // Other platforms don't need explicit permission
}
```

**User flow**: On first capture attempt, macOS shows permission dialog. If denied, show error message guiding user to System Preferences → Privacy → Screen Recording.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src-tauri/src/screenshot.rs` | Create |
| `src-tauri/src/permissions.rs` | Create |
| `src-tauri/src/main.rs` | Modify |
| `src/types/screenshot.ts` | Create |
| `src/utils/screenshot-api.ts` | Create |
| `src/hooks/use-screenshot.ts` | Create |

---

## Verification

```typescript
// In App.tsx for testing
import { useScreenshot } from './hooks/use-screenshot';

function App() {
  const { imageUrl, loading, error, captureFullscreen } = useScreenshot();

  return (
    <div>
      <button onClick={captureFullscreen} disabled={loading}>
        {loading ? 'Capturing...' : 'Capture Screen'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {imageUrl && <img src={imageUrl} alt="Screenshot" />}
    </div>
  );
}
```

---

## Success Criteria

- [x] `capture_fullscreen` returns PNG bytes
- [x] `get_windows` returns window list with titles
- [x] `capture_window` captures specific window
- [x] Binary data transfers to frontend correctly
- [x] Image displays in React app
- [x] macOS permission prompt appears on first use

**Review Report**: [code-reviewer-251227-0345-phase02-screenshot-capture.md](../reports/code-reviewer-251227-0345-phase02-screenshot-capture.md)

---

## Platform Notes

| Platform | Notes |
|----------|-------|
| macOS | Screen Recording permission required |
| Windows | Works without special permissions |
| Linux X11 | Works out of box |
| Linux Wayland | May require portal, test carefully |

---

## Next Phase

[Phase 03: Canvas Editor Foundation](./phase-03-canvas-editor.md)
