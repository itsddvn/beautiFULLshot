// useHotkeys - Listen for global hotkeys and tray events from Tauri

import { useEffect, useCallback, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useCanvasStore } from '../stores/canvas-store';
import { useCropStore } from '../stores/crop-store';
import { useUIStore } from '../stores/ui-store';
import * as screenshotApi from '../utils/screenshot-api';
import { logError } from '../utils/logger';

// Helper: Get image dimensions from bytes
function getImageDimensions(
  bytes: Uint8Array
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

interface UseHotkeysReturn {
  shortcutError: string | null;
  dismissError: () => void;
}

/**
 * Hook that listens for global hotkeys and tray capture events
 * Triggers fullscreen capture when hotkey or tray menu is activated
 * Returns shortcut registration errors for UI display
 */
export function useHotkeys(): UseHotkeysReturn {
  const { setImageFromBytes } = useCanvasStore();
  const { clearCrop } = useCropStore();
  const { openWindowPicker } = useUIStore();
  const [shortcutError, setShortcutError] = useState<string | null>(null);

  // Dismiss error handler
  const dismissError = useCallback(() => setShortcutError(null), []);

  // Capture fullscreen handler
  const handleCapture = useCallback(async () => {
    try {
      const bytes = await screenshotApi.captureFullscreenHidden();
      if (bytes) {
        const { width, height } = await getImageDimensions(bytes);
        clearCrop(); // Clear any existing crop when loading new image
        setImageFromBytes(bytes, width, height);
      }
    } catch (e) {
      logError('useHotkeys:capture', e);
    }
  }, [clearCrop, setImageFromBytes]);

  // Capture region handler - TODO: implement region selection UI
  const handleCaptureRegion = useCallback(async () => {
    // For now, fallback to fullscreen capture
    // Region selection requires overlay UI implementation
    try {
      const bytes = await screenshotApi.captureFullscreenHidden();
      if (bytes) {
        const { width, height } = await getImageDimensions(bytes);
        setImageFromBytes(bytes, width, height);
      }
    } catch (e) {
      logError('useHotkeys:captureRegion', e);
    }
  }, [setImageFromBytes]);

  // Capture window handler - opens window picker modal
  const handleCaptureWindow = useCallback(() => {
    openWindowPicker();
  }, [openWindowPicker]);

  useEffect(() => {
    // Use variables to track unlisten functions for cleaner cleanup
    let unlistenTray: (() => void) | null = null;
    let unlistenHotkey: (() => void) | null = null;
    let unlistenHotkeyRegion: (() => void) | null = null;
    let unlistenHotkeyWindow: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    // Listen for tray capture menu event
    listen('tray-capture', () => handleCapture()).then((fn) => {
      unlistenTray = fn;
    });

    // Listen for global hotkey events
    listen('hotkey-capture', () => handleCapture()).then((fn) => {
      unlistenHotkey = fn;
    });

    listen('hotkey-capture-region', () => handleCaptureRegion()).then((fn) => {
      unlistenHotkeyRegion = fn;
    });

    listen('hotkey-capture-window', () => handleCaptureWindow()).then((fn) => {
      unlistenHotkeyWindow = fn;
    });

    // Listen for shortcut registration errors from Rust
    listen<string>('shortcut-error', (event) => {
      setShortcutError(event.payload);
      logError('useHotkeys:shortcut-error', event.payload);
    }).then((fn) => {
      unlistenError = fn;
    });

    // Cleanup listeners on unmount
    return () => {
      unlistenTray?.();
      unlistenHotkey?.();
      unlistenHotkeyRegion?.();
      unlistenHotkeyWindow?.();
      unlistenError?.();
    };
  }, [handleCapture, handleCaptureRegion, handleCaptureWindow]);

  return { shortcutError, dismissError };
}
