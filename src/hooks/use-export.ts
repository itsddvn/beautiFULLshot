// Export hook - handles all export operations for Konva stage

import { useCallback } from 'react';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { useExportStore } from '../stores/export-store';
import { toast } from '../stores/toast-store';
import { useCanvasStore } from '../stores/canvas-store';
import { useBackgroundStore } from '../stores/background-store';
import { useSettingsStore } from '../stores/settings-store';
import {
  stageToDataURL,
  dataURLToBytes,
  generateFilename,
  calculateAspectRatioExtend,
  ExportError,
} from '../utils/export-utils';
import {
  saveFile,
  getPicturesDir,
  getDesktopDir,
  showSaveDialog,
  normalizePath,
  extractFilename,
} from '../utils/file-api';
import { logError } from '../utils/logger';
import { useCropStore } from '../stores/crop-store';

export function useExport() {
  const {
    format,
    quality,
    pixelRatio,
    outputAspectRatio,
    isExporting,
    exportOperation,
    setLastSavePath,
    startExport,
    finishExport,
  } = useExportStore();
  const { cropRect } = useCropStore();
  const { stageRef, originalWidth, originalHeight } = useCanvasStore();
  const { getPaddingPx } = useBackgroundStore();
  const { showNotifications, saveLocation, customSavePath } = useSettingsStore();

  /**
   * Send notification if enabled in settings
   */
  const notify = useCallback(
    async (title: string, body: string) => {
      if (showNotifications) {
        await sendNotification({ title, body });
      }
    },
    [showNotifications]
  );

  /**
   * Show in-app toast notification for saved files with "Show in Folder" action
   */
  const notifyFileSaved = useCallback(
    (title: string, body: string, filePath: string) => {
      // Show in-app toast with action button (replaces system notification)
      toast.success(title, body, filePath);
    },
    []
  );

  /**
   * Export stage to data URL string
   * Note: Aspect ratio is applied via canvas extension, not export-time cropping
   */
  const exportToDataURL = useCallback(() => {
    if (!stageRef?.current) return null;

    // Calculate canvas dimensions (image + padding + aspect ratio extension)
    let canvasWidth: number | undefined;
    let canvasHeight: number | undefined;

    if (originalWidth > 0 && originalHeight > 0) {
      const padding = getPaddingPx(originalWidth, originalHeight);
      const baseWidth = originalWidth + padding * 2;
      const baseHeight = originalHeight + padding * 2;

      // Check for aspect ratio extension
      const aspectExtension = calculateAspectRatioExtend(baseWidth, baseHeight, outputAspectRatio);
      canvasWidth = aspectExtension?.width || baseWidth;
      canvasHeight = aspectExtension?.height || baseHeight;
    }

    return stageToDataURL(stageRef.current, {
      format,
      quality,
      pixelRatio,
      cropRect: null,
      canvasWidth,
      canvasHeight,
    });
  }, [stageRef, format, quality, pixelRatio, cropRect, originalWidth, originalHeight, getPaddingPx, outputAspectRatio]);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (e: unknown): string => {
    if (e instanceof ExportError) {
      switch (e.code) {
        case 'INVALID_INPUT':
          return 'No image to export';
        case 'DECODE_ERROR':
          return 'Failed to process image data';
        default:
          return e.message;
      }
    }
    if (e instanceof Error) {
      // Check for file size limit error from Rust
      if (e.message.includes('exceeds maximum')) {
        return 'Image is too large to export. Try reducing resolution.';
      }
      return e.message;
    }
    return 'An unexpected error occurred';
  };

  /**
   * Copy image to clipboard with loading state
   * Uses custom Rust command with arboard for reliable clipboard access on macOS
   */
  const copyToClipboard = useCallback(async () => {
    if (isExporting) return false;

    startExport('clipboard');
    const dataURL = exportToDataURL();
    if (!dataURL) {
      finishExport();
      await notify('Copy Failed', 'No image to copy. Take a screenshot first.');
      return false;
    }

    try {
      // Convert data URL to base64 (remove data:image/png;base64, prefix)
      const base64Data = dataURL.split(',')[1];

      // Use custom Rust command with arboard crate for reliable clipboard
      await invoke('copy_image_to_clipboard', { base64Data });

      await notify('Copied!', 'Image copied to clipboard');

      return true;
    } catch (e) {
      logError('copyToClipboard', e);
      await notify('Copy Failed', 'Could not copy to clipboard.');
      return false;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, startExport, finishExport, notify]);

  /**
   * Get save directory based on settings
   */
  const getSaveDir = useCallback(async (): Promise<string> => {
    switch (saveLocation) {
      case 'desktop':
        return await getDesktopDir();
      case 'custom':
        if (customSavePath) {
          return customSavePath;
        }
        // Fallback to pictures if custom path not set
        return await getPicturesDir();
      case 'pictures':
      default:
        return await getPicturesDir();
    }
  }, [saveLocation, customSavePath]);

  /**
   * Quick save to configured folder with loading state
   */
  const quickSave = useCallback(async () => {
    if (isExporting) return null;

    startExport('quickSave');
    const dataURL = exportToDataURL();
    if (!dataURL) {
      finishExport();
      await notify('Save Failed', 'No image to save. Take a screenshot first.');
      return null;
    }

    try {
      const bytes = dataURLToBytes(dataURL);
      const saveDir = await getSaveDir();
      const filename = generateFilename(format);
      const fullPath = `${saveDir}/${filename}`;

      const savedPath = await saveFile(fullPath, bytes);
      // Normalize path for display (removes Windows \\?\ prefix)
      const displayPath = normalizePath(savedPath);
      setLastSavePath(displayPath);

      await notifyFileSaved('Saved!', `Image saved to ${filename}`, displayPath);

      return savedPath;
    } catch (e) {
      logError('quickSave', e);
      await notify('Save Failed', getErrorMessage(e));
      return null;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, format, setLastSavePath, startExport, finishExport, notify, notifyFileSaved, getSaveDir]);

  /**
   * Save with dialog for location selection with loading state
   */
  const saveAs = useCallback(async () => {
    if (isExporting) return null;

    startExport('saveAs');
    const dataURL = exportToDataURL();
    if (!dataURL) {
      finishExport();
      await notify('Save Failed', 'No image to save. Take a screenshot first.');
      return null;
    }

    try {
      const defaultName = generateFilename(format);
      const path = await showSaveDialog(defaultName, format);

      if (!path) {
        finishExport();
        return null; // User cancelled
      }

      const bytes = dataURLToBytes(dataURL);
      const savedPath = await saveFile(path, bytes);
      // Normalize path for display (removes Windows \\?\ prefix)
      const displayPath = normalizePath(savedPath);
      setLastSavePath(displayPath);

      // Extract filename for display message (handles cross-platform separators)
      const filename = extractFilename(savedPath);
      await notifyFileSaved('Saved!', `Image saved to ${filename}`, displayPath);

      return savedPath;
    } catch (e) {
      logError('saveAs', e);
      await notify('Save Failed', getErrorMessage(e));
      return null;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, format, setLastSavePath, startExport, finishExport, notify, notifyFileSaved]);

  return {
    exportToDataURL,
    copyToClipboard,
    quickSave,
    saveAs,
    isExporting,
    exportOperation,
  };
}
