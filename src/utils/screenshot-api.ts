// Screenshot capture API - Tauri IPC wrapper
// Communicates with Rust backend for screenshot functionality

import { invoke } from "@tauri-apps/api/core";
import type { MonitorInfo, WindowInfo, CaptureRegion } from "../types/screenshot";

/**
 * Capture the primary monitor's full screen
 * @returns PNG image bytes as Uint8Array
 */
export async function captureFullscreen(): Promise<Uint8Array> {
  const arr = await invoke<number[]>("capture_fullscreen");
  return new Uint8Array(arr);
}

/**
 * Capture a specific region from the primary monitor
 * @param region - The region coordinates and dimensions
 * @returns PNG image bytes as Uint8Array
 */
export async function captureRegion(region: CaptureRegion): Promise<Uint8Array> {
  const arr = await invoke<number[]>("capture_region", {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
  });
  return new Uint8Array(arr);
}

/**
 * Capture a specific window by ID
 * @param windowId - The window ID to capture
 * @returns PNG image bytes as Uint8Array
 */
export async function captureWindow(windowId: number): Promise<Uint8Array> {
  const arr = await invoke<number[]>("capture_window", { windowId });
  return new Uint8Array(arr);
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
