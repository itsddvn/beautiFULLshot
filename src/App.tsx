// App - Root application component

import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { EditorLayout } from "./components/layout/editor-layout";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useHotkeys } from "./hooks/use-hotkeys";
import { useSettingsStore } from "./stores/settings-store";

/** Warning banner for shortcut errors */
function ShortcutWarning({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 flex items-center justify-between z-50"
    >
      <span className="text-yellow-800 text-sm">
        <strong>Warning:</strong> Global shortcuts unavailable. {message}
      </span>
      <button
        onClick={onDismiss}
        className="text-yellow-800 hover:text-yellow-900 text-lg leading-none"
        aria-label="Dismiss warning"
      >
        ×
      </button>
    </div>
  );
}

function App() {
  const { closeToTray } = useSettingsStore();

  // Initialize global keyboard shortcuts (in-app)
  useKeyboardShortcuts();

  // Initialize global hotkeys listener (system-wide from Tauri)
  const { shortcutError, dismissError } = useHotkeys();

  // Handle window close - minimize to tray if enabled
  useEffect(() => {
    const appWindow = getCurrentWindow();

    const unlisten = appWindow.onCloseRequested(async (event) => {
      if (closeToTray) {
        event.preventDefault();
        await appWindow.hide();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [closeToTray]);

  return (
    <>
      {shortcutError && (
        <ShortcutWarning message={shortcutError} onDismiss={dismissError} />
      )}
      <EditorLayout />
    </>
  );
}

export default App;
