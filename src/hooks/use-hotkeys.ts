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

// Helper: Crop base64 image to specified region using Canvas
function cropBase64Image(
  base64Data: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Create canvas with region dimensions
        const canvas = document.createElement('canvas');
        canvas.width = region.width;
        canvas.height = region.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw cropped region onto canvas
        ctx.drawImage(
          img,
          region.x, region.y, region.width, region.height,  // Source region
          0, 0, region.width, region.height                  // Destination (full canvas)
        );

        // Convert canvas to PNG bytes
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then((buffer) => {
              resolve(new Uint8Array(buffer));
            });
          } else {
            resolve(null);
          }
        }, 'image/png');
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };

    // Load image from base64
    img.src = `data:image/png;base64,${base64Data}`;
  });
}

/**
 * Hook that listens for global hotkeys and tray capture events
 * Triggers fullscreen capture when hotkey or tray menu is activated
 * Returns shortcut registration errors for UI display
 */
export function useHotkeys(): void {
  const { setImageFromBytes, fitToView } = useCanvasStore();
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
        // Auto-fit to view after capture
        setTimeout(() => fitToView(), 50);
      }
    } catch (e) {
      logError('useHotkeys:capture', e);
      // Emit permission error event if permission denied
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes('permission')) {
        const appWindow = getCurrentWindow();
        appWindow.emit('permission-denied', {});
      }
    }
  }, [clearCrop, setImageFromBytes, fitToView]);

  // Capture region handler - opens fullscreen overlay for selection
  const handleCaptureRegion = useCallback(async () => {
    try {
      // Hide main window first so screenshot captures other apps
      const appWindow = getCurrentWindow();
      await appWindow.hide();

      // Delay for window hide animation
      // Windows DWM needs more time (150ms) than macOS (50ms)
      const isWindows = navigator.userAgent.includes('Windows');
      await new Promise(resolve => setTimeout(resolve, isWindows ? 150 : 50));

      // Create fullscreen overlay window for region selection
      await screenshotApi.createOverlayWindow();
    } catch (e) {
      logError('useHotkeys:captureRegion', e);
      // Show main window again on error (likely permission denied)
      const appWindow = getCurrentWindow();
      await appWindow.show();
      await appWindow.setFocus();
      // Emit permission error event for App.tsx to handle
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes('permission')) {
        appWindow.emit('permission-denied', {});
      }
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
  // Uses stored screenshot data and crops to selection (instead of taking new screenshot)
  const handleRegionSelected = useCallback(async (region: CaptureRegion) => {
    try {
      // Get stored screenshot data (the same image shown in overlay)
      const screenshotBase64 = await screenshotApi.getScreenshotData();

      if (screenshotBase64) {
        // Crop the stored screenshot to the selected region using Canvas
        const croppedBytes = await cropBase64Image(screenshotBase64, region);
        if (croppedBytes) {
          const { width, height } = await getImageDimensions(croppedBytes);
          clearCrop();
          setImageFromBytes(croppedBytes, width, height);
          // Auto-fit to view after capture
          setTimeout(() => fitToView(), 50);
        }
      }

      // Clear stored screenshot data after extraction
      await screenshotApi.clearScreenshotData();
    } catch (e) {
      logError('useHotkeys:regionSelected', e);
    } finally {
      // Show main window again
      const appWindow = getCurrentWindow();
      await appWindow.show();
      appWindow.setFocus();
    }
  }, [clearCrop, setImageFromBytes, fitToView]);

  // Handle region selection cancelled
  const handleRegionCancelled = useCallback(async () => {
    // Show main window again
    const appWindow = getCurrentWindow();
    await appWindow.show();
    appWindow.setFocus();
  }, []);

  useEffect(() => {
    // Use variables to track unlisten functions for cleaner cleanup
    let unlistenTrayScreen: (() => void) | null = null;
    let unlistenTrayRegion: (() => void) | null = null;
    let unlistenTrayWindow: (() => void) | null = null;
    let unlistenHotkey: (() => void) | null = null;
    let unlistenHotkeyRegion: (() => void) | null = null;
    let unlistenHotkeyWindow: (() => void) | null = null;
    let unlistenRegionSelected: (() => void) | null = null;
    let unlistenRegionCancelled: (() => void) | null = null;

    // Listen for tray capture menu events
    listen('tray-capture-screen', () => handleCapture()).then((fn) => {
      unlistenTrayScreen = fn;
    });

    listen('tray-capture-region', () => handleCaptureRegion()).then((fn) => {
      unlistenTrayRegion = fn;
    });

    listen('tray-capture-window', () => handleCaptureWindow()).then((fn) => {
      unlistenTrayWindow = fn;
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
      unlistenTrayScreen?.();
      unlistenTrayRegion?.();
      unlistenTrayWindow?.();
      unlistenHotkey?.();
      unlistenHotkeyRegion?.();
      unlistenHotkeyWindow?.();
      unlistenRegionSelected?.();
      unlistenRegionCancelled?.();
    };
  }, [handleCapture, handleCaptureRegion, handleCaptureWindow, handleRegionSelected, handleRegionCancelled]);
}
