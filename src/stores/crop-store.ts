// Crop store - Zustand state for non-destructive cropping

import { create } from 'zustand';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropState {
  isCropping: boolean;
  cropRect: CropRect | null;
  aspectRatio: number | null; // null = freeform

  startCrop: (ratio?: number | null) => void;
  setCropRect: (rect: CropRect) => void;
  applyCrop: () => void;
  clearCrop: () => void;
  cancelCrop: () => void;
  setAspectRatio: (ratio: number | null) => void;
}

export const useCropStore = create<CropState>((set) => ({
  isCropping: false,
  cropRect: null,
  aspectRatio: null,

  startCrop: (ratio = null) =>
    set({
      isCropping: true,
      aspectRatio: ratio,
      cropRect: null,
    }),

  setCropRect: (rect) => set({ cropRect: rect }),

  applyCrop: () => {
    // After cropImage() is called, the image is actually cropped
    // Clear cropRect since it's no longer valid for the new cropped image
    set({ isCropping: false, cropRect: null, aspectRatio: null });
  },

  clearCrop: () =>
    set({
      isCropping: false,
      cropRect: null,
      aspectRatio: null,
    }),

  cancelCrop: () =>
    set({
      isCropping: false,
      cropRect: null,
    }),

  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
}));
