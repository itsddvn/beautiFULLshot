// Overlay window management for region selection
// Creates persistent overlay window at startup, shows/hides as needed

use base64::{engine::general_purpose::STANDARD, Engine};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageEncoder;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use xcap::Monitor;

// Store screenshot data for overlay background
static OVERLAY_SCREENSHOT: Mutex<Option<String>> = Mutex::new(None);

/// Wait for Windows DWM animation to complete
/// Uses DwmFlush to sync with Desktop Window Manager composition cycles
#[cfg(target_os = "windows")]
fn wait_for_dwm_animation() {
    // Sync with multiple DWM composition cycles
    // Each DwmFlush waits for next VBlank (~16ms at 60Hz)
    // 10 cycles with 10ms sleep = ~260ms total, enough for most animations
    for _ in 0..10 {
        unsafe {
            let _ = windows::Win32::Graphics::Dwm::DwmFlush();
        }
        thread::sleep(Duration::from_millis(10));
    }
}

/// Capture screenshot and convert to base64 for overlay background
fn capture_for_overlay() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or("No primary monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;

    let width = image.width();
    let height = image.height();

    // Verify we got a valid image
    if width == 0 || height == 0 {
        return Err("Screen recording permission not granted".to_string());
    }

    // Convert to PNG with fast compression
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

/// Initialize overlay window at app startup (hidden)
/// Call this from setup() in lib.rs
/// Note: Currently unused - overlay created on-demand via create_overlay_window
#[allow(dead_code)]
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
/// Creates overlay on-demand if not exists, captures screenshot, then shows
#[tauri::command]
pub async fn show_overlay_window(app: AppHandle) -> Result<(), String> {
    // Hide main window FIRST (so screenshot doesn't include app window)
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.hide();
    }

    // Wait for window hide animation to complete
    #[cfg(target_os = "windows")]
    wait_for_dwm_animation();

    #[cfg(not(target_os = "windows"))]
    thread::sleep(Duration::from_millis(50));

    // Capture screenshot AFTER window is fully hidden
    let screenshot_base64 = capture_for_overlay()?;

    // Store screenshot for overlay to retrieve (recover from poisoned Mutex)
    {
        let mut data = OVERLAY_SCREENSHOT
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        *data = Some(screenshot_base64);
    }

    // Get or create overlay window
    let window = match app.get_webview_window("region-overlay") {
        Some(w) => w,
        None => {
            // Create overlay window on-demand (invisible until frontend shows it)
            match WebviewWindowBuilder::new(
                &app,
                "region-overlay",
                WebviewUrl::App("overlay.html".into()),
            )
            .title("")
            .fullscreen(true)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .focused(false)
            .closable(true)
            .resizable(false)
            .visible(false) // Keep hidden until frontend loads screenshot
            .build()
            {
                Ok(w) => w,
                Err(e) => {
                    // Clear screenshot data on window creation failure to prevent memory leak
                    let mut data = OVERLAY_SCREENSHOT
                        .lock()
                        .unwrap_or_else(|poisoned| poisoned.into_inner());
                    *data = None;
                    return Err(format!("{}", e));
                }
            }
        }
    };

    // Ensure fullscreen mode is set (don't show yet - frontend will show after screenshot loads)
    let _ = window.set_fullscreen(true);

    // Notify overlay to load screenshot and show itself
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

// Compatibility aliases
#[tauri::command]
pub async fn create_overlay_window(app: AppHandle) -> Result<(), String> {
    show_overlay_window(app).await
}

#[tauri::command]
pub async fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    hide_overlay_window(app).await
}
