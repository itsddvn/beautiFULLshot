// System tray - tray icon and menu for BeautyShot

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

/// Creates and configures the system tray icon with menu
pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    // Menu items
    let capture_item = MenuItem::with_id(app, "capture", "Capture Screen", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit BeautyShot", true, None::<&str>)?;

    // Build menu
    let menu = Menu::with_items(app, &[&capture_item, &separator, &show_item, &quit_item])?;

    // Get app icon with fallback
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".to_string()))?;

    // Build tray icon
    let _tray = TrayIconBuilder::<R>::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("BeautyShot")
        .on_menu_event(|app: &AppHandle<R>, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "capture" => {
                // Emit event to frontend to trigger capture
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-capture", ());
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray: &TrayIcon<R>, event| {
            // Left click on tray icon shows window
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
