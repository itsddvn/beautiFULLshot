// Canvas store - Zustand state management for canvas editor
// Single source of truth for image data and URL lifecycle

import { create } from 'zustand';
import type Konva from 'konva';
import { ZOOM } from '../constants/canvas';
import { useAnnotationStore } from './annotation-store';
import { useBackgroundStore } from './background-store';
import { useExportStore } from './export-store';
import { calculateAspectRatioExtend } from '../utils/export-utils';
import type { ImageSnapshot } from './history-store';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasState {
  // Stage ref for export
  stageRef: React.RefObject<Konva.Stage | null> | null;
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
  setStageRef: (ref: React.RefObject<Konva.Stage | null>) => void;
  setImageFromBytes: (bytes: Uint8Array, width: number, height: number) => void;
  setStageSize: (width: number, height: number) => void;
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  resetView: () => void;
  fitToView: () => void;
  clearCanvas: () => void;
  cropImage: (rect: CropRect) => Promise<void>;
  restoreFromSnapshot: (snapshot: ImageSnapshot) => void;
  getImageSnapshot: () => ImageSnapshot;
  initHistoryCallbacks: () => void;
}

// Helper: Create blob URL from bytes
function bytesToUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  stageRef: null,
  imageUrl: null,
  imageBytes: null,
  originalWidth: 0,
  originalHeight: 0,
  stageWidth: 800,
  stageHeight: 600,
  scale: 1,
  position: { x: 0, y: 0 },

  setStageRef: (ref) => set({ stageRef: ref }),

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

  fitToView: () => {
    const { originalWidth, originalHeight, stageWidth, stageHeight } = get();
    if (!originalWidth || !originalHeight || !stageWidth || !stageHeight) return;

    // Get padding from background store (percentage-based)
    const bgPadding = useBackgroundStore.getState().getPaddingPx(originalWidth, originalHeight);

    // Base canvas size (image + padding)
    const baseWidth = originalWidth + bgPadding * 2;
    const baseHeight = originalHeight + bgPadding * 2;

    // Check for aspect ratio extension
    const outputAspectRatio = useExportStore.getState().outputAspectRatio;
    const aspectExtension = calculateAspectRatioExtend(baseWidth, baseHeight, outputAspectRatio);

    // Total canvas size including aspect ratio extension
    const totalWidth = aspectExtension?.width || baseWidth;
    const totalHeight = aspectExtension?.height || baseHeight;

    // Add some margin from stage edges
    const margin = 20;
    const availableWidth = stageWidth - margin * 2;
    const availableHeight = stageHeight - margin * 2;

    // Calculate scale to fit
    const scaleX = availableWidth / totalWidth;
    const scaleY = availableHeight / totalHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

    // Center the image
    const scaledWidth = totalWidth * newScale;
    const scaledHeight = totalHeight * newScale;
    const newX = (stageWidth - scaledWidth) / 2;
    const newY = (stageHeight - scaledHeight) / 2;

    set({
      scale: Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, newScale)),
      position: { x: newX, y: newY },
    });
  },

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

  cropImage: async (rect: CropRect) => {
    const { imageUrl, imageBytes, originalWidth, originalHeight } = get();
    if (!imageUrl) return;

    // Save current state to history before cropping (includes image data)
    useAnnotationStore.getState().saveToHistory({
      imageBytes: imageBytes ? new Uint8Array(imageBytes) : null,
      originalWidth,
      originalHeight,
    });

    // Load current image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });

    // Create canvas and crop
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cropped region
    ctx.drawImage(
      img,
      Math.round(rect.x),
      Math.round(rect.y),
      Math.round(rect.width),
      Math.round(rect.height),
      0,
      0,
      Math.round(rect.width),
      Math.round(rect.height)
    );

    // Convert to blob and bytes
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return;

    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Revoke old URL and update state
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    const newUrl = bytesToUrl(bytes);
    set({
      imageUrl: newUrl,
      imageBytes: bytes,
      originalWidth: Math.round(rect.width),
      originalHeight: Math.round(rect.height),
    });
  },

  restoreFromSnapshot: (snapshot: ImageSnapshot) => {
    // Revoke current URL
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    if (snapshot.imageBytes) {
      const newUrl = bytesToUrl(new Uint8Array(snapshot.imageBytes));
      set({
        imageUrl: newUrl,
        imageBytes: new Uint8Array(snapshot.imageBytes),
        originalWidth: snapshot.originalWidth,
        originalHeight: snapshot.originalHeight,
      });
    } else {
      set({
        imageUrl: null,
        imageBytes: null,
        originalWidth: 0,
        originalHeight: 0,
      });
    }
  },

  getImageSnapshot: () => {
    const { imageBytes, originalWidth, originalHeight } = get();
    return {
      imageBytes: imageBytes ? new Uint8Array(imageBytes) : null,
      originalWidth,
      originalHeight,
    };
  },

  initHistoryCallbacks: () => {
    const store = get();
    useAnnotationStore.getState().setRestoreImageCallback(store.restoreFromSnapshot);
    useAnnotationStore.getState().setGetImageSnapshotCallback(store.getImageSnapshot);
  },
}));
