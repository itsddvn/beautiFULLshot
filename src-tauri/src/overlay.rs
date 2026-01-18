// Overlay window management for region selection
// Screenshot is captured after frontend hides main window (same timing as fullscreen)

use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use base64::{engine::general_purpose::STANDARD, Engine};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use serde::{Deserialize, Serialize};
use xcap::Monitor;

// Store screenshot data for overlay background
static OVERLAY_SCREENSHOT: Mutex<Option<String>> = Mutex::new(None);
// Store monitor info for the current overlay
static OVERLAY_MONITOR: Mutex<Option<OverlayMonitorInfo>> = Mutex::new(None);

/// Monitor info for overlay positioning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayMonitorInfo {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

/// Wait for Windows DWM animation to complete
#[cfg(target_os = "windows")]
fn wait_for_dwm_animation() {
    for _ in 0..10 {
        unsafe {
            let _ = windows::Win32::Graphics::Dwm::DwmFlush();
        }
        thread::sleep(Duration::from_millis(10));
    }
}



/// Capture specific monitor screenshot and convert to base64
fn capture_monitor_for_overlay(monitor_id: u32) -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.id().unwrap_or(0) == monitor_id)
        .ok_or("Monitor not found")?;

    capture_monitor_to_base64(&monitor)
}

/// Capture a monitor and encode as base64 PNG
fn capture_monitor_to_base64(monitor: &Monitor) -> Result<String, String> {
    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    let width = image.width();
    let height = image.height();

    if width == 0 || height == 0 {
        return Err("Screen recording permission not granted".to_string());
    }

    // Fast PNG encoding
    let estimated_size = (width * height * 4) as usize + 1024;
    let mut bytes: Vec<u8> = Vec::with_capacity(estimated_size);
    let encoder =
        PngEncoder::new_with_quality(&mut bytes, CompressionType::Fast, FilterType::NoFilter);
    encoder
        .write_image(
            image.as_raw(),
            width,
            height,
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;

    Ok(STANDARD.encode(&bytes))
}

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
    // Clear monitor info
    {
        let mut data = OVERLAY_MONITOR
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *data = None;
    }
    Ok(())
}

/// Show overlay window on a specific monitor for region selection
#[tauri::command]
pub async fn show_overlay_window_on_monitor(
    app: AppHandle,
    monitor_id: u32,
) -> Result<(), String> {
    // Get monitor info first
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .iter()
        .find(|m| m.id().unwrap_or(0) == monitor_id)
        .ok_or("Monitor not found")?;

    let monitor_info = OverlayMonitorInfo {
        id: monitor_id,
        width: monitor.width().unwrap_or(0),
        height: monitor.height().unwrap_or(0),
        x: monitor.x().unwrap_or(0),
        y: monitor.y().unwrap_or(0),
    };

    // Hide main window first
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.hide();
    }

    // Wait for window hide animation
    #[cfg(target_os = "windows")]
    wait_for_dwm_animation();

    #[cfg(not(target_os = "windows"))]
    thread::sleep(Duration::from_millis(50));

    // Capture screenshot from specific monitor
    let screenshot_base64 = capture_monitor_for_overlay(monitor_id)?;

    // Store screenshot and monitor info
    {
        let mut data = OVERLAY_SCREENSHOT
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *data = Some(screenshot_base64);
    }
    {
        let mut data = OVERLAY_MONITOR
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *data = Some(monitor_info.clone());
    }

    // Close existing overlay if any (to recreate with new position)
    if let Some(existing) = app.get_webview_window("region-overlay") {
        let _ = existing.close();
        // Brief wait for window to close
        thread::sleep(Duration::from_millis(50));
    }

    // Create overlay window positioned on the specific monitor
    let window = WebviewWindowBuilder::new(
        &app,
        "region-overlay",
        WebviewUrl::App("overlay.html".into()),
    )
    .title("")
    .position(monitor_info.x as f64, monitor_info.y as f64)
    .inner_size(monitor_info.width as f64, monitor_info.height as f64)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .focused(true)
    .closable(true)
    .resizable(false)
    .visible(true)
    .build()
    .map_err(|e| {
        // Clear data on failure
        let mut screenshot = OVERLAY_SCREENSHOT
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *screenshot = None;
        let mut monitor = OVERLAY_MONITOR
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *monitor = None;
        format!("{}", e)
    })?;

    let _ = window.emit("overlay-activate", ());

    Ok(())
}

/// Get overlay monitor info
#[tauri::command]
pub fn get_overlay_monitor() -> Option<OverlayMonitorInfo> {
    let data = OVERLAY_MONITOR
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    data.clone()
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
