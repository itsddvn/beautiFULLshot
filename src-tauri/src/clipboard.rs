// Clipboard operations - copy image to system clipboard

use arboard::{Clipboard, ImageData};
use base64::{engine::general_purpose::STANDARD, Engine};
use image::GenericImageView;

// Maximum allowed image size: 50MB (prevents memory DoS attacks)
const MAX_IMAGE_SIZE: usize = 50 * 1024 * 1024;

/// Copy PNG image data to system clipboard
/// Accepts base64-encoded PNG data (without data URL prefix)
#[tauri::command]
pub fn copy_image_to_clipboard(base64_data: &str) -> Result<(), String> {
    // Validate size before decoding (base64 is ~33% larger than binary)
    let estimated_size = base64_data.len() * 3 / 4;
    if estimated_size > MAX_IMAGE_SIZE {
        return Err(format!(
            "Image too large: {} bytes (max {} bytes)",
            estimated_size, MAX_IMAGE_SIZE
        ));
    }

    // Decode base64 to bytes
    let png_bytes = STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Double-check actual decoded size
    if png_bytes.len() > MAX_IMAGE_SIZE {
        return Err(format!(
            "Decoded image too large: {} bytes (max {} bytes)",
            png_bytes.len(),
            MAX_IMAGE_SIZE
        ));
    }

    // Load image to get dimensions and RGBA data
    let img = image::load_from_memory(&png_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    let (width, height) = img.dimensions();
    let rgba = img.to_rgba8();

    // Create clipboard image data
    let img_data = ImageData {
        width: width as usize,
        height: height as usize,
        bytes: rgba.into_raw().into(),
    };

    // Copy to clipboard
    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;

    clipboard
        .set_image(img_data)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

    Ok(())
}
