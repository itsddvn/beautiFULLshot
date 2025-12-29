// Export hook - handles all export operations for Konva stage

import { useCallback } from 'react';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { useExportStore } from '../stores/export-store';
import { useCropStore } from '../stores/crop-store';
import { useCanvasStore } from '../stores/canvas-store';
import { useSettingsStore } from '../stores/settings-store';
import {
  stageToDataURL,
  dataURLToBytes,
  generateFilename,
  ExportError,
} from '../utils/export-utils';
import {
  saveFile,
  getPicturesDir,
  showSaveDialog,
} from '../utils/file-api';
import { logError } from '../utils/logger';

export function useExport() {
  const {
    format,
    quality,
    pixelRatio,
    isExporting,
    exportOperation,
    setLastSavePath,
    startExport,
    finishExport,
  } = useExportStore();
  const { cropRect } = useCropStore();
  const { stageRef } = useCanvasStore();
  const { showNotifications } = useSettingsStore();

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
   * Export stage to data URL string
   */
  const exportToDataURL = useCallback(() => {
    if (!stageRef?.current) return null;

    return stageToDataURL(stageRef.current, {
      format,
      quality,
      pixelRatio,
      cropRect,
    });
  }, [stageRef, format, quality, pixelRatio, cropRect]);

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
      const blob = await fetch(dataURL).then((r) => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);

      await notify('Copied!', 'Image copied to clipboard');

      return true;
    } catch (e) {
      logError('copyToClipboard', e);
      await notify('Copy Failed', 'Could not copy to clipboard. Check browser permissions.');
      return false;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, startExport, finishExport, notify]);

  /**
   * Quick save to Pictures/BeautyShot folder with loading state
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
      const picturesDir = await getPicturesDir();
      const filename = generateFilename(format);
      const fullPath = `${picturesDir}/${filename}`;

      const savedPath = await saveFile(fullPath, bytes);
      setLastSavePath(savedPath);

      await notify('Saved!', `Image saved to ${filename}`);

      return savedPath;
    } catch (e) {
      logError('quickSave', e);
      await notify('Save Failed', getErrorMessage(e));
      return null;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, format, setLastSavePath, startExport, finishExport, notify]);

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
      setLastSavePath(savedPath);

      await notify('Saved!', 'Image saved successfully');

      return savedPath;
    } catch (e) {
      logError('saveAs', e);
      await notify('Save Failed', getErrorMessage(e));
      return null;
    } finally {
      finishExport();
    }
  }, [isExporting, exportToDataURL, format, setLastSavePath, startExport, finishExport, notify]);

  return {
    exportToDataURL,
    copyToClipboard,
    quickSave,
    saveAs,
    isExporting,
    exportOperation,
  };
}
