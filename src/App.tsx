// App - Root application component
// Checks permissions on startup and blocks until both Screen Recording
// and Accessibility permissions are granted (macOS only)

import { useEffect, useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { EditorLayout } from "./components/layout/editor-layout";
import { ToastContainer } from "./components/common/toast";
import { PermissionRequired } from "./components/permission-required";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useHotkeys } from "./hooks/use-hotkeys";
import { useSyncShortcuts } from "./hooks/use-sync-shortcuts";
import { useSettingsStore } from "./stores/settings-store";
import { useToastStore } from "./stores/toast-store";
import type { ThemeMode } from "./stores/settings-store";

/** Determine if dark mode should be active based on theme setting */
function shouldUseDarkMode(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

type AppState = 'checking' | 'permissions_required' | 'ready';

function App() {
  const { closeToTray, theme } = useSettingsStore();
  const { toasts, removeToast } = useToastStore();
  const [appState, setAppState] = useState<AppState>('checking');

  // Check permissions on startup
  useEffect(() => {
    async function checkStartupPermissions() {
      // Skip permission check in dev mode for faster iteration
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('[DEV] Bypassing permission check');
        setAppState('ready');
        return;
      }

      try {
        const [screenPermission, accessibilityPermission] = await Promise.all([
          invoke<boolean>('check_screen_permission'),
          invoke<boolean>('check_accessibility_permission'),
        ]);

        if (screenPermission && accessibilityPermission) {
          setAppState('ready');
        } else {
          setAppState('permissions_required');
        }
      } catch (error) {
        console.error('Failed to check permissions:', error);
        // On non-macOS or error, allow app to proceed
        setAppState('ready');
      }
    }

    checkStartupPermissions();
  }, []);

  // Callback when all permissions are granted
  const handlePermissionsGranted = useCallback(() => {
    setAppState('ready');
  }, []);

  // Initialize global keyboard shortcuts (in-app)
  useKeyboardShortcuts();

  // Sync hotkey settings with backend on startup
  useSyncShortcuts();

  // Initialize global hotkeys listener (system-wide from Tauri)
  useHotkeys();

  // Apply dark mode class to document
  useEffect(() => {
    const isDark = shouldUseDarkMode(theme);
    document.documentElement.classList.toggle('dark', isDark);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

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

  // Show loading spinner while checking permissions
  if (appState === 'checking') {
    return (
      <div className="fixed inset-0 canvas-area flex items-center justify-center">
        <div className="glass floating-panel p-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  // Show permission screen if permissions not granted
  if (appState === 'permissions_required') {
    return <PermissionRequired onAllGranted={handlePermissionsGranted} />;
  }

  return (
    <>
      <EditorLayout />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

export default App;
