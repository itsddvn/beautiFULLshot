// BeautyFullShot - Screenshot Beautification App
// Tauri commands: https://tauri.app/develop/calling-rust/

mod permissions;
mod screenshot;

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
        .invoke_handler(tauri::generate_handler![
            greet,
            screenshot::capture_fullscreen,
            screenshot::capture_region,
            screenshot::capture_window,
            screenshot::get_windows,
            screenshot::get_monitors,
            permissions::check_screen_permission,
            permissions::check_wayland,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
