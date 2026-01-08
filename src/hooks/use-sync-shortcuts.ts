// useSyncShortcuts - Sync frontend hotkey settings with Rust backend on startup

import { useEffect, useCallback, useState } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { updateShortcuts } from '../utils/screenshot-api';

interface UseSyncShortcutsReturn {
  syncErrors: string[];
}

/**
 * Syncs hotkey settings from localStorage to Rust backend on app startup.
 * This ensures global shortcuts match user's saved preferences.
 */
export function useSyncShortcuts(): UseSyncShortcutsReturn {
  const { hotkeys } = useSettingsStore();
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  const syncShortcuts = useCallback(async () => {
    try {
      const errors = await updateShortcuts(
        hotkeys.capture,
        hotkeys.captureRegion,
        hotkeys.captureWindow
      );
      setSyncErrors(errors);
    } catch (e) {
      console.error('Failed to sync shortcuts:', e);
      setSyncErrors([String(e)]);
    }
  }, [hotkeys.capture, hotkeys.captureRegion, hotkeys.captureWindow]);

  useEffect(() => {
    syncShortcuts();
  }, [syncShortcuts]);

  return { syncErrors };
}
