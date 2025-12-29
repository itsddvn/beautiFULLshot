// Global shortcuts - register system-wide keyboard shortcuts

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Registers global keyboard shortcuts for the application
pub fn register_shortcuts(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Cmd/Ctrl + Shift + C for capture
    let capture_shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyC);

    app.global_shortcut().on_shortcut(
        capture_shortcut,
        |app, _shortcut, event| {
            // Only trigger on key down
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("hotkey-capture", ());
                }
            }
        },
    )?;

    Ok(())
}
