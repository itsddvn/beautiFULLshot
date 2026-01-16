// Overlay window management for region selection
// Screenshot is captured after frontend hides main window (same timing as fullscreen)

use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

// Store screenshot data for overlay background
static OVERLAY_SCREENSHOT: Mutex<Option<String>> = Mutex::new(None);

/// Get stored screenshot data
#[tauri::command]
pub fn get_screenshot_data() -> Option<String> {
    let data = OVERLAY_SCREENSHOT
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    data.clone()
}

/// Clear stored screenshot data
#[tauri::command]
pub fn clear_screenshot_data() {
    let mut data = OVERLAY_SCREENSHOT
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    *data = None;
}

/// Capture screenshot and show overlay in one call (for speed)
/// Frontend already hid main window and waited for DWM
#[tauri::command]
pub async fn capture_and_show_overlay(app: AppHandle) -> Result<(), String> {
    // Capture screenshot using same function as fullscreen
    let screenshot_base64 = crate::screenshot::capture_fullscreen()?;

    // Store screenshot
    {
        let mut data = OVERLAY_SCREENSHOT
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *data = Some(screenshot_base64);
    }

    // Get or create overlay window (always starts hidden)
    let window = match app.get_webview_window("region-overlay") {
        Some(w) => {
            let _ = w.hide();
            w
        }
        None => {
            WebviewWindowBuilder::new(
                &app,
                "region-overlay",
                WebviewUrl::App("overlay.html".into()),
            )
            .title("")
            .fullscreen(true)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .focused(true)
            .closable(true)
            .resizable(false)
            .visible(false)
            .build()
            .map_err(|e| {
                let mut data = OVERLAY_SCREENSHOT
                    .lock()
                    .unwrap_or_else(|poisoned| poisoned.into_inner());
                *data = None;
                format!("{}", e)
            })?
        }
    };

    let _ = window.set_fullscreen(true);
    let _ = window.emit("overlay-activate", ());

    Ok(())
}

/// Hide overlay window
#[tauri::command]
pub async fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("region-overlay") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Compatibility aliases for existing code
#[tauri::command]
pub async fn create_overlay_window(app: AppHandle) -> Result<(), String> {
    capture_and_show_overlay(app).await
}

#[tauri::command]
pub async fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    hide_overlay_window(app).await
}
