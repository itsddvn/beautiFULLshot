// Platform-specific permission handling
// macOS requires Screen Recording permission for screenshot capture

use xcap::Monitor;

/// Check if screen capture permission is granted
/// macOS: Returns false if Screen Recording permission not granted
/// Other platforms: Always returns true
#[tauri::command]
pub fn check_screen_permission() -> bool {
    // xcap internally handles permission check
    // Attempt to list monitors - if it fails, permission likely denied
    Monitor::all().is_ok()
}

/// Detect if running on Wayland (Linux)
/// Returns warning message if Wayland detected
#[tauri::command]
pub fn check_wayland() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            return Some(
                "Wayland detected. Screenshot capture may have limited functionality. \
                 For best results, use X11 or XWayland."
                    .to_string(),
            );
        }
    }
    None
}
