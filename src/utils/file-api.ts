// File API - TypeScript wrappers for Tauri file operations

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import type { ExportFormat } from '../stores/export-store';

/**
 * Normalize Windows extended-length path prefix (\\?\)
 * Windows dialog can return paths like \\?\C:\Users\... which need cleanup for display
 */
export function normalizePath(path: string): string {
  // Remove Windows extended-length path prefix
  if (path.startsWith('\\\\?\\')) {
    return path.slice(4);
  }
  return path;
}

/**
 * Extract filename from path (cross-platform)
 */
export function extractFilename(path: string): string {
  // Normalize first to handle \\?\ prefix
  const normalized = normalizePath(path);
  // Handle both Windows (\) and Unix (/) separators
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || 'image';
}

/**
 * Save file using Tauri backend
 */
export async function saveFile(
  path: string,
  data: Uint8Array
): Promise<string> {
  return await invoke('save_file', {
    path,
    data: Array.from(data),
  });
}

/**
 * Get Pictures directory with BeautyShot subfolder
 */
export async function getPicturesDir(): Promise<string> {
  return await invoke('get_pictures_dir');
}

/**
 * Get Desktop directory
 */
export async function getDesktopDir(): Promise<string> {
  return await invoke('get_desktop_dir');
}

/**
 * Show native save dialog
 */
export async function showSaveDialog(
  defaultName: string,
  format: ExportFormat
): Promise<string | null> {
  const filters =
    format === 'png'
      ? [{ name: 'PNG Image', extensions: ['png'] }]
      : [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }];

  const path = await save({
    defaultPath: defaultName,
    filters,
  });

  return path;
}
