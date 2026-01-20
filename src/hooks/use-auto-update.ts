// Auto-update hook for checking and installing app updates
// Uses Tauri's plugin-updater to check GitHub releases for new versions

import { useEffect, useState, useCallback, useRef } from 'react';
import { check, Update, DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch, exit } from '@tauri-apps/plugin-process';

interface UpdateState {
  checking: boolean;
  updateAvailable: boolean;
  update: Update | null;
  downloading: boolean;
  progress: number;
  error: string | null;
}

const initialState: UpdateState = {
  checking: false,
  updateAvailable: false,
  update: null,
  downloading: false,
  progress: 0,
  error: null,
};

// Check interval: 5 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function useAutoUpdate() {
  const [state, setState] = useState<UpdateState>(initialState);
  const dismissedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    // Skip if already checking or dismissed this session
    if (state.checking) return null;

    setState(s => ({ ...s, checking: true, error: null }));

    try {
      const update = await check();

      // Only show update if not dismissed and update exists
      const shouldShow = !!update && !dismissedRef.current;

      setState(s => ({
        ...s,
        checking: false,
        updateAvailable: shouldShow,
        update: shouldShow ? update : null,
      }));

      return update;
    } catch (err) {
      console.error('[Updater] Check failed:', err);
      setState(s => ({
        ...s,
        checking: false,
        error: err instanceof Error ? err.message : 'Update check failed',
      }));
      return null;
    }
  }, [state.checking]);

  const installUpdate = useCallback(async () => {
    if (!state.update) return;

    setState(s => ({ ...s, downloading: true, progress: 0, error: null }));

    try {
      let downloaded = 0;
      let contentLength = 0;

      console.log('[Updater] Starting download and install...');

      await state.update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log('[Updater] Download started, size:', contentLength);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0
              ? Math.round((downloaded / contentLength) * 100)
              : 0;
            setState(s => ({ ...s, progress }));
            break;
          case 'Finished':
            console.log('[Updater] Download finished, installing...');
            setState(s => ({ ...s, progress: 100 }));
            break;
        }
      });

      console.log('[Updater] Install complete, restarting app...');

      // Mark that we're about to restart
      setState(s => ({ ...s, progress: 100, downloading: false }));

      // Small delay to ensure installation is fully complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try relaunch first, fall back to exit
      try {
        console.log('[Updater] Attempting relaunch...');
        await relaunch();
      } catch (relaunchErr) {
        console.error('[Updater] Relaunch failed, trying exit:', relaunchErr);
        // If relaunch fails, exit and let user restart manually
        // On macOS, the updated app should start automatically after exit
        await exit(0);
      }
    } catch (err) {
      console.error('[Updater] Install failed:', err);
      setState(s => ({
        ...s,
        downloading: false,
        error: err instanceof Error ? err.message : 'Update installation failed',
      }));
    }
  }, [state.update]);

  const dismissUpdate = useCallback(() => {
    dismissedRef.current = true;
    setState(s => ({ ...s, updateAvailable: false, update: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  // Check on mount + periodic background checks
  useEffect(() => {
    // Initial check after short delay (let app settle)
    const initialTimeout = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    // Periodic checks
    const interval = setInterval(() => {
      if (!dismissedRef.current) {
        checkForUpdate();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    installUpdate,
    dismissUpdate,
    clearError,
  };
}
