// Screenshot capture API - Tauri IPC wrapper
// Communicates with Rust backend for screenshot functionality

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MonitorInfo, WindowInfo, CaptureRegion } from "../types/screenshot";

// Delay for window hide - allows OS to process hide before capture
const MACOS_HIDE_DELAY_MS = 10;
const WINDOWS_HIDE_DELAY_MS = 200;

// Detect platform via userAgent
const userAgent = navigator.userAgent.toLowerCase();
const isWindows = userAgent.includes("win");

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

  // Hide window before capture
  await appWindow.hide();

  // Wait for hide animation to complete
  // Windows DWM needs more time than macOS/Linux
  const hideDelay = isWindows ? WINDOWS_HIDE_DELAY_MS : MACOS_HIDE_DELAY_MS;
  await delay(hideDelay);

  try {
    // Perform the capture
    const result = await captureFunc();
    return result;
  } finally {
    // Show window immediately, focus in background (non-blocking)
    await appWindow.show();
    appWindow.setFocus(); // Fire and forget
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
 * Update global keyboard shortcuts in the backend
 * @param capture - Hotkey for fullscreen capture
 * @param captureRegion - Hotkey for region capture
 * @param captureWindow - Hotkey for window capture
 * @returns Array of error messages for shortcuts that failed to register
 */
export async function updateShortcuts(
  capture: string,
  captureRegion: string,
  captureWindow: string
): Promise<string[]> {
  return await invoke<string[]>("update_shortcuts", { capture, captureRegion, captureWindow });
}
