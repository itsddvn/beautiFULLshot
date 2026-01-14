// BeautyFullShot - Screenshot Beautification App
// Tauri commands: https://tauri.app/develop/calling-rust/

use tauri::{Manager, RunEvent};

mod clipboard;
mod file_ops;
mod overlay;
mod permissions;
mod screenshot;
mod shortcuts;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            // Create system tray
            tray::create_tray(app.handle())?;

            // Note: Overlay window is created on-demand when needed
            // to avoid fullscreen white screen at startup

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            screenshot::capture_fullscreen,
            screenshot::capture_region,
            screenshot::capture_window,
            screenshot::get_windows,
            screenshot::get_window_thumbnail,
            screenshot::get_monitors,
            permissions::check_screen_permission,
            permissions::check_wayland,
            file_ops::save_file,
            file_ops::get_pictures_dir,
            file_ops::get_desktop_dir,
            shortcuts::update_shortcuts,
            overlay::create_overlay_window,
            overlay::close_overlay_window,
            overlay::get_screenshot_data,
            overlay::clear_screenshot_data,
            clipboard::copy_image_to_clipboard,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Handle macOS dock click to reopen window
            if let RunEvent::Reopen { .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        });
}
