// Screenshot capture module using xcap crate
// Provides fullscreen, region, and window capture functionality

use base64::{engine::general_purpose::STANDARD, Engine};
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
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

/// Convert RgbaImage to base64-encoded PNG string (maximum speed)
fn image_to_base64_png(img: &image::RgbaImage) -> Result<String, String> {
    // Pre-allocate buffer for speed (estimate: width * height * 4 bytes + overhead)
    let estimated_size = (img.width() * img.height() * 4) as usize + 1024;
    let mut bytes: Vec<u8> = Vec::with_capacity(estimated_size);
    // NoFilter = fastest encoding (no per-row analysis), Fast compression
    let encoder = PngEncoder::new_with_quality(&mut bytes, CompressionType::Fast, FilterType::NoFilter);
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;
    Ok(STANDARD.encode(&bytes))
}

/// Capture primary monitor - returns base64-encoded PNG
#[tauri::command]
pub fn capture_fullscreen() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or("No primary monitor found")?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;

    // Verify we got a valid image
    if image.width() == 0 || image.height() == 0 {
        return Err("Screen recording permission not granted".to_string());
    }

    image_to_base64_png(&image)
}

/// Capture specific region from primary monitor - returns base64-encoded PNG
#[tauri::command]
pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<String, String> {
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

    image_to_base64_png(&cropped)
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

/// Capture window thumbnail (small preview) - returns base64-encoded PNG
#[tauri::command]
pub fn get_window_thumbnail(window_id: u32, max_size: u32) -> Result<String, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;
    let window = windows
        .into_iter()
        .find(|w| w.id().unwrap_or(0) == window_id)
        .ok_or("Window not found")?;

    let image = window.capture_image().map_err(|e| e.to_string())?;

    // Resize to thumbnail
    let (width, height) = (image.width(), image.height());
    let (new_width, new_height) = if width > height {
        let ratio = max_size as f32 / width as f32;
        (max_size, (height as f32 * ratio) as u32)
    } else {
        let ratio = max_size as f32 / height as f32;
        ((width as f32 * ratio) as u32, max_size)
    };

    let thumbnail = image::imageops::resize(&image, new_width, new_height, image::imageops::FilterType::Lanczos3);
    image_to_base64_png(&thumbnail)
}

/// Capture specific window by ID - returns base64-encoded PNG
#[tauri::command]
pub fn capture_window(window_id: u32) -> Result<String, String> {
    let windows = XcapWindow::all().map_err(|e| e.to_string())?;
    let window = windows
        .into_iter()
        .find(|w| w.id().unwrap_or(0) == window_id)
        .ok_or("Window not found")?;

    let image = window.capture_image().map_err(|e| e.to_string())?;
    image_to_base64_png(&image)
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
