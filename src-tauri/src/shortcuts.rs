// Global shortcuts - register system-wide keyboard shortcuts

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Parse hotkey string to Shortcut
/// Format: "Modifier+Modifier+Key" (e.g., "CommandOrControl+Shift+C")
fn parse_hotkey(hotkey: &str) -> Option<Shortcut> {
    let parts: Vec<&str> = hotkey.split('+').map(|s| s.trim()).collect();
    if parts.len() < 2 {
        return None;
    }

    let key_str = parts.last()?;
    let modifier_strs = &parts[..parts.len() - 1];

    // Parse modifiers
    let mut modifiers = Modifiers::empty();
    for m in modifier_strs {
        match m.to_lowercase().as_str() {
            "commandorcontrol" | "control" | "ctrl" => modifiers |= Modifiers::CONTROL,
            "command" | "cmd" | "super" | "meta" => modifiers |= Modifiers::SUPER,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" => modifiers |= Modifiers::ALT,
            _ => return None,
        }
    }

    // Parse key code
    let code = match key_str.to_uppercase().as_str() {
        "A" => Code::KeyA,
        "B" => Code::KeyB,
        "C" => Code::KeyC,
        "D" => Code::KeyD,
        "E" => Code::KeyE,
        "F" => Code::KeyF,
        "G" => Code::KeyG,
        "H" => Code::KeyH,
        "I" => Code::KeyI,
        "J" => Code::KeyJ,
        "K" => Code::KeyK,
        "L" => Code::KeyL,
        "M" => Code::KeyM,
        "N" => Code::KeyN,
        "O" => Code::KeyO,
        "P" => Code::KeyP,
        "Q" => Code::KeyQ,
        "R" => Code::KeyR,
        "S" => Code::KeyS,
        "T" => Code::KeyT,
        "U" => Code::KeyU,
        "V" => Code::KeyV,
        "W" => Code::KeyW,
        "X" => Code::KeyX,
        "Y" => Code::KeyY,
        "Z" => Code::KeyZ,
        "0" => Code::Digit0,
        "1" => Code::Digit1,
        "2" => Code::Digit2,
        "3" => Code::Digit3,
        "4" => Code::Digit4,
        "5" => Code::Digit5,
        "6" => Code::Digit6,
        "7" => Code::Digit7,
        "8" => Code::Digit8,
        "9" => Code::Digit9,
        "F1" => Code::F1,
        "F2" => Code::F2,
        "F3" => Code::F3,
        "F4" => Code::F4,
        "F5" => Code::F5,
        "F6" => Code::F6,
        "F7" => Code::F7,
        "F8" => Code::F8,
        "F9" => Code::F9,
        "F10" => Code::F10,
        "F11" => Code::F11,
        "F12" => Code::F12,
        "SPACE" => Code::Space,
        "ENTER" => Code::Enter,
        "ESCAPE" => Code::Escape,
        "TAB" => Code::Tab,
        "BACKSPACE" => Code::Backspace,
        "DELETE" => Code::Delete,
        "INSERT" => Code::Insert,
        "HOME" => Code::Home,
        "END" => Code::End,
        "PAGEUP" => Code::PageUp,
        "PAGEDOWN" => Code::PageDown,
        "ARROWUP" => Code::ArrowUp,
        "ARROWDOWN" => Code::ArrowDown,
        "ARROWLEFT" => Code::ArrowLeft,
        "ARROWRIGHT" => Code::ArrowRight,
        "PRINTSCREEN" => Code::PrintScreen,
        _ => return None,
    };

    Some(Shortcut::new(Some(modifiers), code))
}

/// Register a single global shortcut with an event name
fn register_shortcut(
    app: &tauri::AppHandle,
    hotkey: &str,
    event_name: &'static str,
) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(shortcut) = parse_hotkey(hotkey) {
        app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit(event_name, ());
                }
            }
        })?;
    }
    Ok(())
}

/// Registers global keyboard shortcuts for the application
pub fn register_shortcuts(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Register default shortcuts
    register_shortcut(app, "CommandOrControl+Shift+C", "hotkey-capture")?;
    register_shortcut(app, "CommandOrControl+Shift+R", "hotkey-capture-region")?;
    register_shortcut(app, "CommandOrControl+Shift+W", "hotkey-capture-window")?;

    Ok(())
}

/// Tauri command to update shortcuts from frontend settings
/// Returns list of shortcuts that failed to register (empty if all succeeded)
#[tauri::command]
pub fn update_shortcuts(
    app: tauri::AppHandle,
    capture: String,
    capture_region: String,
    capture_window: String,
) -> Result<Vec<String>, String> {
    // Unregister all existing shortcuts
    let _ = app.global_shortcut().unregister_all();

    let mut errors: Vec<String> = Vec::new();

    // Register new shortcuts - continue even if one fails
    if !capture.is_empty() {
        if let Err(e) = register_shortcut(&app, &capture, "hotkey-capture") {
            errors.push(format!("Capture ({}): {}", capture, e));
        }
    }
    if !capture_region.is_empty() {
        if let Err(e) = register_shortcut(&app, &capture_region, "hotkey-capture-region") {
            errors.push(format!("Capture Region ({}): {}", capture_region, e));
        }
    }
    if !capture_window.is_empty() {
        if let Err(e) = register_shortcut(&app, &capture_window, "hotkey-capture-window") {
            errors.push(format!("Capture Window ({}): {}", capture_window, e));
        }
    }

    Ok(errors)
}
