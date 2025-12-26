// Canvas store - Zustand state management for canvas editor
// Single source of truth for image data and URL lifecycle

import { create } from 'zustand';
import { ZOOM } from '../constants/canvas';

interface CanvasState {
  // Image data
  imageUrl: string | null;
  imageBytes: Uint8Array | null;
  originalWidth: number;
  originalHeight: number;

  // Canvas viewport
  stageWidth: number;
  stageHeight: number;
  scale: number;
  position: { x: number; y: number };

  // Actions
  setImageFromBytes: (bytes: Uint8Array, width: number, height: number) => void;
  setStageSize: (width: number, height: number) => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  resetView: () => void;
  clearCanvas: () => void;
}

// Helper: Create blob URL from bytes
function bytesToUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  imageUrl: null,
  imageBytes: null,
  originalWidth: 0,
  originalHeight: 0,
  stageWidth: 800,
  stageHeight: 600,
  scale: 1,
  position: { x: 0, y: 0 },

  setImageFromBytes: (bytes, width, height) => {
    // Revoke previous URL to prevent memory leak
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    const url = bytesToUrl(bytes);
    set({
      imageUrl: url,
      imageBytes: bytes,
      originalWidth: width,
      originalHeight: height,
    });
  },

  setStageSize: (width, height) => set({ stageWidth: width, stageHeight: height }),

  setScale: (scale) => set({ scale: Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, scale)) }),

  setPosition: (x, y) => set({ position: { x, y } }),

  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),

  clearCanvas: () => {
    // Revoke URL before clearing
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    set({
      imageUrl: null,
      imageBytes: null,
      originalWidth: 0,
      originalHeight: 0,
    });
  },
}));
