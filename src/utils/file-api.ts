// File API - TypeScript wrappers for Tauri file operations

import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import type { ExportFormat } from '../stores/export-store';

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
