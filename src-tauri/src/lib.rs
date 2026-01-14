// BeautyFullShot - Screenshot Beautification App
// Tauri commands: https://tauri.app/develop/calling-rust/

use tauri::{Manager, RunEvent, WindowEvent};

#[cfg(target_os = "macos")]
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};

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
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Create system tray
            tray::create_tray(app.handle())?;

            // On macOS, create custom app menu to override Cmd+Q behavior
            #[cfg(target_os = "macos")]
            {
                let handle = app.handle();

                // Create "Hide" menu item with Cmd+Q shortcut (replaces default Quit)
                let hide_item = MenuItemBuilder::with_id("hide_to_tray", "Hide to Tray")
                    .accelerator("CmdOrCtrl+Q")
                    .build(handle)?;

                // Create app submenu (first menu on macOS)
                let app_submenu = SubmenuBuilder::new(handle, "beautiFULLshot")
                    .item(&PredefinedMenuItem::about(handle, Some("About beautiFULLshot"), None)?)
                    .separator()
                    .item(&hide_item)
                    .separator()
                    .item(&PredefinedMenuItem::hide(handle, Some("Hide"))?)
                    .item(&PredefinedMenuItem::hide_others(handle, Some("Hide Others"))?)
                    .item(&PredefinedMenuItem::show_all(handle, Some("Show All"))?)
                    .build()?;

                // Create Edit submenu for standard text editing shortcuts
                let edit_submenu = SubmenuBuilder::new(handle, "Edit")
                    .item(&PredefinedMenuItem::undo(handle, Some("Undo"))?)
                    .item(&PredefinedMenuItem::redo(handle, Some("Redo"))?)
                    .separator()
                    .item(&PredefinedMenuItem::cut(handle, Some("Cut"))?)
                    .item(&PredefinedMenuItem::copy(handle, Some("Copy"))?)
                    .item(&PredefinedMenuItem::paste(handle, Some("Paste"))?)
                    .item(&PredefinedMenuItem::select_all(handle, Some("Select All"))?)
                    .build()?;

                // Create Window submenu
                let window_submenu = SubmenuBuilder::new(handle, "Window")
                    .item(&PredefinedMenuItem::minimize(handle, Some("Minimize"))?)
                    .item(&PredefinedMenuItem::maximize(handle, Some("Zoom"))?)
                    .separator()
                    .item(&PredefinedMenuItem::close_window(handle, Some("Close"))?)
                    .build()?;

                // Build and set the menu
                let menu = MenuBuilder::new(handle)
                    .item(&app_submenu)
                    .item(&edit_submenu)
                    .item(&window_submenu)
                    .build()?;

                app.set_menu(menu)?;

                // Handle custom menu events
                let handle_clone = handle.clone();
                app.on_menu_event(move |_app, event| {
                    if event.id().as_ref() == "hide_to_tray" {
                        // Hide window instead of quitting
                        if let Some(window) = handle_clone.get_webview_window("main") {
                            let _ = window.hide();
                        }
                        // Hide from dock
                        let _ = handle_clone.set_activation_policy(tauri::ActivationPolicy::Accessory);
                    }
                });
            }

            // Note: Overlay window is created on-demand when needed
            // to avoid fullscreen white screen at startup

            Ok(())
        })
        .on_window_event(|window, event| {
            // Intercept close request on main window - hide instead of quit
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent default close behavior
                    api.prevent_close();
                    // Hide window instead
                    let _ = window.hide();

                    // On macOS, also hide from dock when window is hidden
                    #[cfg(target_os = "macos")]
                    {
                        let app = window.app_handle();
                        let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            screenshot::capture_fullscreen,
            screenshot::capture_region,
            screenshot::capture_window,
            screenshot::get_windows,
            screenshot::get_window_thumbnail,
            screenshot::get_monitors,
            permissions::check_screen_permission,
            permissions::check_accessibility_permission,
            permissions::request_accessibility_permission,
            permissions::request_screen_permission,
            permissions::check_wayland,
            permissions::open_screen_recording_settings,
            permissions::open_accessibility_settings,
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
            match &event {
                // Handle Cmd+Q (macOS) - hide to tray instead of quit
                #[cfg(target_os = "macos")]
                RunEvent::ExitRequested { api, .. } => {
                    // Prevent app from quitting
                    api.prevent_exit();

                    // Hide main window to tray
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }

                    // Hide from dock
                    let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                }

                // Handle macOS dock click to reopen window
                #[cfg(target_os = "macos")]
                RunEvent::Reopen { .. } => {
                    // Restore dock icon
                    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }

                _ => {}
            }
        });
}
