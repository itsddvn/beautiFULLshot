// Export store - Zustand state for export settings with persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExportFormat = 'png' | 'jpeg';

export type ExportOperation = 'idle' | 'quickSave' | 'saveAs' | 'clipboard';

interface ExportState {
  // Persisted settings
  format: ExportFormat;
  quality: number; // 0.1 - 1.0 for JPEG
  pixelRatio: number; // 1, 2, 3 for resolution
  autoName: boolean;
  lastSavePath: string | null;

  // Transient UI state (not persisted)
  isExporting: boolean;
  exportOperation: ExportOperation;

  // Settings actions
  setFormat: (format: ExportFormat) => void;
  setQuality: (quality: number) => void;
  setPixelRatio: (ratio: number) => void;
  setAutoName: (auto: boolean) => void;
  setLastSavePath: (path: string) => void;

  // Export state actions
  startExport: (operation: ExportOperation) => void;
  finishExport: () => void;
}

export const useExportStore = create<ExportState>()(
  persist(
    (set) => ({
      format: 'png',
      quality: 0.9,
      pixelRatio: 1,
      autoName: true,
      lastSavePath: null,

      // Transient state
      isExporting: false,
      exportOperation: 'idle',

      setFormat: (format) => set({ format }),
      setQuality: (quality) =>
        set({ quality: Math.max(0.1, Math.min(1, quality)) }),
      setPixelRatio: (ratio) =>
        set({ pixelRatio: Math.max(1, Math.min(3, ratio)) }),
      setAutoName: (auto) => set({ autoName: auto }),
      setLastSavePath: (path) => set({ lastSavePath: path }),

      startExport: (operation) =>
        set({ isExporting: true, exportOperation: operation }),
      finishExport: () =>
        set({ isExporting: false, exportOperation: 'idle' }),
    }),
    {
      name: 'beautyshot-export-settings',
      // Exclude transient state from persistence
      partialize: (state) => ({
        format: state.format,
        quality: state.quality,
        pixelRatio: state.pixelRatio,
        autoName: state.autoName,
        lastSavePath: state.lastSavePath,
      }),
    }
  )
);
