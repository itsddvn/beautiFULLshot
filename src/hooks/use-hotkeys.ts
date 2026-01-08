// useHotkeys - Listen for global hotkeys and tray events from Tauri

import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCanvasStore } from '../stores/canvas-store';
import { useCropStore } from '../stores/crop-store';
import { useUIStore } from '../stores/ui-store';
import * as screenshotApi from '../utils/screenshot-api';
import { logError } from '../utils/logger';
import type { CaptureRegion } from '../types/screenshot';

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

/**
 * Hook that listens for global hotkeys and tray capture events
 * Triggers fullscreen capture when hotkey or tray menu is activated
 * Returns shortcut registration errors for UI display
 */
export function useHotkeys(): void {
  const { setImageFromBytes } = useCanvasStore();
  const { clearCrop } = useCropStore();
  const { openWindowPicker } = useUIStore();

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

  // Capture region handler - opens fullscreen overlay for selection
  const handleCaptureRegion = useCallback(async () => {
    try {
      // Create fullscreen overlay window for region selection
      await screenshotApi.createOverlayWindow();
    } catch (e) {
      logError('useHotkeys:captureRegion', e);
    }
  }, []);

  // Capture window handler - shows app and opens window picker modal
  const handleCaptureWindow = useCallback(async () => {
    const appWindow = getCurrentWindow();
    await appWindow.show();
    await appWindow.setFocus();
    openWindowPicker();
  }, [openWindowPicker]);

  // Handle region selected from overlay
  const handleRegionSelected = useCallback(async (region: CaptureRegion) => {
    try {
      // Capture the selected region
      const bytes = await screenshotApi.captureRegion(region);
      if (bytes) {
        const { width, height } = await getImageDimensions(bytes);
        clearCrop();
        setImageFromBytes(bytes, width, height);
      }
    } catch (e) {
      logError('useHotkeys:regionSelected', e);
    } finally {
      // Show main window again
      const appWindow = getCurrentWindow();
      await appWindow.show();
      appWindow.setFocus();
    }
  }, [clearCrop, setImageFromBytes]);

  // Handle region selection cancelled
  const handleRegionCancelled = useCallback(async () => {
    // Show main window again
    const appWindow = getCurrentWindow();
    await appWindow.show();
    appWindow.setFocus();
  }, []);

  useEffect(() => {
    // Use variables to track unlisten functions for cleaner cleanup
    let unlistenTray: (() => void) | null = null;
    let unlistenHotkey: (() => void) | null = null;
    let unlistenHotkeyRegion: (() => void) | null = null;
    let unlistenHotkeyWindow: (() => void) | null = null;
    let unlistenRegionSelected: (() => void) | null = null;
    let unlistenRegionCancelled: (() => void) | null = null;

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

    // Listen for region selection events from overlay window
    listen<CaptureRegion>('region-selected', (event) => {
      handleRegionSelected(event.payload);
    }).then((fn) => {
      unlistenRegionSelected = fn;
    });

    listen('region-selection-cancelled', () => {
      handleRegionCancelled();
    }).then((fn) => {
      unlistenRegionCancelled = fn;
    });

    // Cleanup listeners on unmount
    return () => {
      unlistenTray?.();
      unlistenHotkey?.();
      unlistenHotkeyRegion?.();
      unlistenHotkeyWindow?.();
      unlistenRegionSelected?.();
      unlistenRegionCancelled?.();
    };
  }, [handleCapture, handleCaptureRegion, handleCaptureWindow, handleRegionSelected, handleRegionCancelled]);
}
