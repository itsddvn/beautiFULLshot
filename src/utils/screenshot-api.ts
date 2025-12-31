// Screenshot capture API - Tauri IPC wrapper
// Communicates with Rust backend for screenshot functionality

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import type { MonitorInfo, WindowInfo, CaptureRegion } from "../types/screenshot";

// Minimal delay for window hide - allows OS to process hide before capture
const HIDE_DELAY_MS = 10;

/**
 * Decode base64 string to Uint8Array (fast binary conversion)
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Capture the primary monitor's full screen
 * @returns PNG image bytes as Uint8Array
 */
export async function captureFullscreen(): Promise<Uint8Array> {
  const base64 = await invoke<string>("capture_fullscreen");
  return base64ToBytes(base64);
}

/**
 * Capture a specific region from the primary monitor
 * @param region - The region coordinates and dimensions
 * @returns PNG image bytes as Uint8Array
 */
export async function captureRegion(region: CaptureRegion): Promise<Uint8Array> {
  const base64 = await invoke<string>("capture_region", {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
  });
  return base64ToBytes(base64);
}

/**
 * Capture a specific window by ID
 * @param windowId - The window ID to capture
 * @returns PNG image bytes as Uint8Array
 */
export async function captureWindow(windowId: number): Promise<Uint8Array> {
  const base64 = await invoke<string>("capture_window", { windowId });
  return base64ToBytes(base64);
}

/**
 * Get list of all capturable windows
 * @returns Array of WindowInfo objects
 */
export async function getWindows(): Promise<WindowInfo[]> {
  return await invoke<WindowInfo[]>("get_windows");
}

/**
 * Get list of all monitors
 * @returns Array of MonitorInfo objects
 */
export async function getMonitors(): Promise<MonitorInfo[]> {
  return await invoke<MonitorInfo[]>("get_monitors");
}

/**
 * Check if screen capture permission is granted (macOS)
 * @returns true if permission granted, false otherwise
 */
export async function checkScreenPermission(): Promise<boolean> {
  return await invoke<boolean>("check_screen_permission");
}

/**
 * Check if running on Wayland (Linux)
 * @returns Warning message if Wayland detected, null otherwise
 */
export async function checkWayland(): Promise<string | null> {
  return await invoke<string | null>("check_wayland");
}

/**
 * Convert PNG bytes to a displayable image URL
 * @param bytes - PNG image bytes
 * @returns Object URL for the image (remember to revoke when done)
 */
export function bytesToImageUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: "image/png" });
  return URL.createObjectURL(blob);
}

/**
 * Helper: Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hide the current app window, execute capture, then show the window again
 * Ensures screenshots don't include the app itself
 * @param captureFunc - The capture function to execute while hidden
 * @returns PNG image bytes as Uint8Array
 */
export async function captureWithHiddenWindow<T>(
  captureFunc: () => Promise<T>
): Promise<T> {
  const appWindow = getCurrentWindow();

  // Hide window before capture (minimal wait for OS to process)
  await appWindow.hide();
  await delay(HIDE_DELAY_MS);

  try {
    // Perform the capture
    const result = await captureFunc();
    return result;
  } finally {
    // Show window non-blocking for faster perceived response
    appWindow.show();
    appWindow.setFocus();
  }
}

/**
 * Capture fullscreen with window hidden
 * @returns PNG image bytes as Uint8Array
 */
export async function captureFullscreenHidden(): Promise<Uint8Array> {
  return captureWithHiddenWindow(captureFullscreen);
}

/**
 * Capture region with window hidden
 * @param region - The region coordinates and dimensions
 * @returns PNG image bytes as Uint8Array
 */
export async function captureRegionHidden(region: CaptureRegion): Promise<Uint8Array> {
  return captureWithHiddenWindow(() => captureRegion(region));
}

/**
 * Start interactive region capture flow with overlay
 * @returns Selected region coordinates or null if cancelled
 */
export async function startRegionCapture(): Promise<CaptureRegion | null> {
  const appWindow = getCurrentWindow();

  // Hide main window before showing overlay
  await appWindow.hide();
  await delay(HIDE_DELAY_MS);

  return new Promise(async (resolve) => {
    let cleanupCalled = false;

    const cleanup = async () => {
      if (cleanupCalled) return;
      cleanupCalled = true;
      unlistenSelected();
      unlistenCancelled();
      // Show main window after overlay closes
      await appWindow.show();
      await appWindow.setFocus();
    };

    // Listen for selection result
    const unlistenSelected = await listen<CaptureRegion>('region-selected', async (event) => {
      await cleanup();
      resolve(event.payload);
    });

    // Listen for cancellation
    const unlistenCancelled = await listen('region-selection-cancelled', async () => {
      await cleanup();
      resolve(null);
    });

    // Create overlay window
    try {
      await invoke('create_overlay_window');
    } catch (e) {
      await cleanup();
      throw e;
    }
  });
}

/**
 * Capture region with interactive overlay selection
 * Shows fullscreen overlay, user drags to select region, captures that region
 * @returns PNG image bytes or null if cancelled
 */
export async function captureRegionInteractive(): Promise<Uint8Array | null> {
  // Get region from overlay selection
  const region = await startRegionCapture();
  if (!region) return null;

  // Capture the selected region (window already shown by cleanup)
  const base64 = await invoke<string>("capture_region", {
    x: Math.round(region.x),
    y: Math.round(region.y),
    width: Math.round(region.width),
    height: Math.round(region.height),
  });

  return base64ToBytes(base64);
}
