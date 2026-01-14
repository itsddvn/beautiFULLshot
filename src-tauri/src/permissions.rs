// Platform-specific permission handling
// macOS requires Screen Recording permission for screenshot capture
// and Accessibility permission for global shortcuts

/// Check if screen capture permission is granted
/// macOS: Uses CGPreflightScreenCaptureAccess (no prompts triggered)
/// Other platforms: Always returns true
#[tauri::command]
pub fn check_screen_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        // Use native API only - DO NOT attempt capture here
        // Capture attempts can trigger system prompts which is bad UX
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGPreflightScreenCaptureAccess() -> bool;
        }
        let granted = unsafe { CGPreflightScreenCaptureAccess() };
        println!("CGPreflightScreenCaptureAccess returned: {}", granted);
        granted
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

/// Check if accessibility permission is granted (for global shortcuts)
/// macOS: Uses macos-accessibility-client to check trust status
/// Other platforms: Always returns true
#[tauri::command]
pub fn check_accessibility_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        let trusted = macos_accessibility_client::accessibility::application_is_trusted();
        println!("Accessibility trusted: {}", trusted);
        trusted
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

/// Request accessibility permission (opens system prompt)
/// macOS: Uses macos-accessibility-client to prompt user
/// Other platforms: No-op
#[tauri::command]
pub fn request_accessibility_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

/// Request screen recording permission - opens system settings if needed
/// Note: CGRequestScreenCaptureAccess can trigger unwanted dialogs
#[tauri::command]
pub fn request_screen_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        println!("Requesting screen capture access...");
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGRequestScreenCaptureAccess() -> bool;
        }
        let granted = unsafe { CGRequestScreenCaptureAccess() };
        println!("CGRequestScreenCaptureAccess returned: {}", granted);

        if granted {
            return true;
        }

        // If not granted, open settings
        open_screen_recording_settings();
        false
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

/// Open system settings for screen recording permission
/// macOS: Opens Privacy & Security > Screen Recording
/// Other platforms: No-op
#[tauri::command]
pub fn open_screen_recording_settings() {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .spawn();
    }
}

/// Open system settings for accessibility permission
/// macOS: Opens Privacy & Security > Accessibility
/// Other platforms: No-op
#[tauri::command]
pub fn open_accessibility_settings() {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn();
    }
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
