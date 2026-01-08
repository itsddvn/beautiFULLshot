// Overlay window management for region selection
// Creates persistent overlay window at startup, shows/hides as needed

use base64::{engine::general_purpose::STANDARD, Engine};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use xcap::Monitor;

// Store screenshot data for overlay background
static OVERLAY_SCREENSHOT: Mutex<Option<String>> = Mutex::new(None);

/// Capture screenshot and convert to base64 for overlay background
fn capture_for_overlay() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or("No primary monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;

    // Convert to PNG with fast compression
    let estimated_size = (image.width() * image.height() * 4) as usize + 1024;
    let mut bytes: Vec<u8> = Vec::with_capacity(estimated_size);
    let encoder =
        PngEncoder::new_with_quality(&mut bytes, CompressionType::Fast, FilterType::NoFilter);
    encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;

    Ok(STANDARD.encode(&bytes))
}

/// Initialize overlay window at app startup (hidden)
/// Call this from setup() in lib.rs
pub fn init_overlay_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Create overlay window using fullscreen mode to guarantee full coverage
    let _window = WebviewWindowBuilder::new(
        app,
        "region-overlay",
        WebviewUrl::App("overlay.html".into()),
    )
    .title("")
    .fullscreen(true)
    .decorations(false)
    .transparent(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .focused(false)
    .closable(true)
    .resizable(false)
    .visible(false) // Hidden at startup
    .build()?;

    Ok(())
}

/// Show overlay window for region selection
/// Captures screenshot first, then shows the existing overlay
#[tauri::command]
pub async fn show_overlay_window(app: AppHandle) -> Result<(), String> {
    // Capture screenshot BEFORE showing overlay
    let screenshot_base64 = capture_for_overlay()?;

    // Store screenshot for overlay to retrieve
    {
        let mut data = OVERLAY_SCREENSHOT.lock().map_err(|e| e.to_string())?;
        *data = Some(screenshot_base64);
    }

    // Get overlay window
    let window = app
        .get_webview_window("region-overlay")
        .ok_or("Overlay window not found")?;

    // Ensure fullscreen mode is set
    let _ = window.set_fullscreen(true);

    // Notify overlay to refresh and show
    let _ = window.emit("overlay-activate", ());

    Ok(())
}

/// Hide overlay window (don't destroy, just hide)
#[tauri::command]
pub async fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("region-overlay") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get the stored screenshot data for overlay background
#[tauri::command]
pub fn get_screenshot_data() -> Result<Option<String>, String> {
    let data = OVERLAY_SCREENSHOT.lock().map_err(|e| e.to_string())?;
    Ok(data.clone())
}

/// Clear stored screenshot data
#[tauri::command]
pub fn clear_screenshot_data() -> Result<(), String> {
    let mut data = OVERLAY_SCREENSHOT.lock().map_err(|e| e.to_string())?;
    *data = None;
    Ok(())
}

// Compatibility aliases
#[tauri::command]
pub async fn create_overlay_window(app: AppHandle) -> Result<(), String> {
    show_overlay_window(app).await
}

#[tauri::command]
pub async fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    hide_overlay_window(app).await
}
