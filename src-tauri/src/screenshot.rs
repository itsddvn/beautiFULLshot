// Screenshot capture module using xcap crate
// Provides fullscreen, region, and window capture functionality

use image::ImageEncoder;
use serde::{Deserialize, Serialize};
use xcap::{Monitor, Window as XcapWindow};

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

/// Convert RgbaImage to PNG bytes
fn image_to_png_bytes(img: &image::RgbaImage) -> Result<Vec<u8>, String> {
    let mut bytes: Vec<u8> = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut bytes);
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;
    Ok(bytes)
}

/// Capture primary monitor
#[tauri::command]
pub fn capture_fullscreen() -> Result<Vec<u8>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or("No primary monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;
    image_to_png_bytes(&image)
}

/// Capture specific region from primary monitor
#[tauri::command]
pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<Vec<u8>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or("No primary monitor")?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    // Validate region bounds
    let img_width = image.width();
    let img_height = image.height();
    let start_x = x.max(0) as u32;
    let start_y = y.max(0) as u32;
    let crop_width = width.min(img_width.saturating_sub(start_x));
    let crop_height = height.min(img_height.saturating_sub(start_y));

    if crop_width == 0 || crop_height == 0 {
        return Err("Invalid region dimensions".to_string());
    }

    // Crop to region
    let cropped = image::imageops::crop_imm(&image, start_x, start_y, crop_width, crop_height).to_image();

    image_to_png_bytes(&cropped)
}

/// Get list of capturable windows
#[tauri::command]
pub fn get_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for w in windows {
        let title = w.title().unwrap_or_default();
        if title.is_empty() {
            continue;
        }
        result.push(WindowInfo {
            id: w.id().unwrap_or(0),
            app_name: w.app_name().unwrap_or_default(),
            title,
            x: w.x().unwrap_or(0),
            y: w.y().unwrap_or(0),
            width: w.width().unwrap_or(0),
            height: w.height().unwrap_or(0),
        });
    }
    Ok(result)
}

/// Capture specific window by ID
#[tauri::command]
pub fn capture_window(window_id: u32) -> Result<Vec<u8>, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;
    let window = windows
        .into_iter()
        .find(|w| w.id().unwrap_or(0) == window_id)
        .ok_or("Window not found")?;

    let image = window.capture_image().map_err(|e| e.to_string())?;
    image_to_png_bytes(&image)
}

/// Get monitor list
#[tauri::command]
pub fn get_monitors() -> Result<Vec<MonitorInfo>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for m in monitors {
        result.push(MonitorInfo {
            id: m.id().unwrap_or(0),
            name: m.name().unwrap_or_default(),
            width: m.width().unwrap_or(0),
            height: m.height().unwrap_or(0),
            x: m.x().unwrap_or(0),
            y: m.y().unwrap_or(0),
            is_primary: m.is_primary().unwrap_or(false),
        });
    }
    Ok(result)
}
