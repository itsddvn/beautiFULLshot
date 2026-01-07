// BeautyFullShot - Screenshot Beautification App
// Tauri commands: https://tauri.app/develop/calling-rust/

use tauri::{Emitter, Manager};

mod file_ops;
mod permissions;
mod screenshot;
mod shortcuts;
mod tray;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Create system tray
            tray::create_tray(app.handle())?;

            // Register global shortcuts
            if let Err(e) = shortcuts::register_shortcuts(app.handle()) {
                eprintln!("Failed to register shortcuts: {}", e);
                // Notify frontend about shortcut registration failure
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("shortcut-error", e.to_string());
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            screenshot::capture_fullscreen,
            screenshot::capture_region,
            screenshot::capture_window,
            screenshot::get_windows,
            screenshot::get_monitors,
            permissions::check_screen_permission,
            permissions::check_wayland,
            file_ops::save_file,
            file_ops::get_pictures_dir,
            file_ops::get_desktop_dir,
            shortcuts::update_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
