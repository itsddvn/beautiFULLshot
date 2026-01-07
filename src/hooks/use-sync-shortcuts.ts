// useSyncShortcuts - Sync frontend hotkey settings with Rust backend on startup

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { updateShortcuts } from '../utils/screenshot-api';

/**
 * Syncs hotkey settings from localStorage to Rust backend on app startup.
 * This ensures global shortcuts match user's saved preferences.
 */
export function useSyncShortcuts() {
  const { hotkeys } = useSettingsStore();

  const syncShortcuts = useCallback(async () => {
    try {
      await updateShortcuts(
        hotkeys.capture,
        hotkeys.captureRegion,
        hotkeys.captureWindow
      );
    } catch (e) {
      console.error('Failed to sync shortcuts:', e);
    }
  }, [hotkeys.capture, hotkeys.captureRegion, hotkeys.captureWindow]);

  useEffect(() => {
    syncShortcuts();
  }, [syncShortcuts]);
}
