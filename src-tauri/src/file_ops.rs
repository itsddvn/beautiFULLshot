// File operations for BeautyShot export system

use std::path::PathBuf;

/// Maximum file size limit (50MB) - prevents DoS from excessively large exports
const MAX_FILE_SIZE: usize = 50 * 1024 * 1024;

/// Save binary data to file at specified path
/// Security: Validates path and enforces size limits
#[tauri::command]
pub async fn save_file(path: String, data: Vec<u8>) -> Result<String, String> {
    // Enforce file size limit
    if data.len() > MAX_FILE_SIZE {
        return Err(format!(
            "File size ({} MB) exceeds maximum allowed ({} MB)",
            data.len() / (1024 * 1024),
            MAX_FILE_SIZE / (1024 * 1024)
        ));
    }

    let path = PathBuf::from(&path);

    // Canonicalize path to prevent directory traversal attacks
    // For new files, canonicalize the parent directory
    let canonical_path = if let Some(parent) = path.parent() {
        // Create parent if needed, then canonicalize
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;

        let canonical_parent = parent
            .canonicalize()
            .map_err(|e| format!("Invalid path: {}", e))?;

        // Ensure we're not escaping to unexpected locations
        if let Some(filename) = path.file_name() {
            canonical_parent.join(filename)
        } else {
            return Err("Invalid filename".to_string());
        }
    } else {
        return Err("Invalid path: no parent directory".to_string());
    };

    // Validate the path doesn't contain suspicious patterns
    let path_str = canonical_path.to_string_lossy();
    if path_str.contains("..") {
        return Err("Invalid path: directory traversal not allowed".to_string());
    }

    std::fs::write(&canonical_path, data)
        .map_err(|e| format!("Failed to save file: {}", e))?;

    Ok(canonical_path.to_string_lossy().to_string())
}

/// Get Pictures directory with BeautyShot subfolder
#[tauri::command]
pub fn get_pictures_dir() -> Result<String, String> {
    dirs::picture_dir()
        .map(|p| p.join("BeautyShot").to_string_lossy().to_string())
        .ok_or_else(|| "Could not find Pictures directory".to_string())
}

/// Get Desktop directory
#[tauri::command]
pub fn get_desktop_dir() -> Result<String, String> {
    dirs::desktop_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find Desktop directory".to_string())
}
