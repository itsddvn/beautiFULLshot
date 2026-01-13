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

// Track URLs pending revocation (deferred to avoid race conditions)
const pendingRevocations = new Set<string>();

// Safely revoke URL after a delay to ensure no component is using it
function safeRevokeURL(url: string | null) {
  if (!url) return;

  // Add to pending set to prevent double revocation
  if (pendingRevocations.has(url)) return;
  pendingRevocations.add(url);

  // Delay revocation to allow React to finish rendering with new URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
    pendingRevocations.delete(url);
  }, 100);
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
    const oldUrl = get().imageUrl;
    const url = bytesToUrl(bytes);

    // Clear annotations from previous screenshot
    useAnnotationStore.getState().clearAnnotations();

    // Set new state first, then safely revoke old URL
    set({
      imageUrl: url,
      imageBytes: bytes,
      originalWidth: width,
      originalHeight: height,
    });

    // Revoke old URL after state update to prevent race condition
    safeRevokeURL(oldUrl);
  },

  setStageSize: (width, height) => set({ stageWidth: width, stageHeight: height }),

  setScale: (scale) => set({ scale: Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, scale)) }),

  setPosition: (x, y) => set({ position: { x, y } }),

  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),

  fitToView: () => {
    const { originalWidth, originalHeight, stageWidth, stageHeight, stageRef } = get();
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

    // Also sync stage position directly via Konva API (in case it was dragged)
    const stage = stageRef?.current;
    if (stage) {
      stage.position({ x: newX, y: newY });
      stage.scale({ x: newScale, y: newScale });
      stage.draggable(false); // Reset draggable state
    }

    set({
      scale: Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, newScale)),
      position: { x: newX, y: newY },
    });
  },

  clearCanvas: () => {
    const oldUrl = get().imageUrl;

    // Clear state first, then safely revoke old URL
    set({
      imageUrl: null,
      imageBytes: null,
      originalWidth: 0,
      originalHeight: 0,
    });

    safeRevokeURL(oldUrl);
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

    // Get current URL at this point (may have changed during async ops)
    const currentUrl = get().imageUrl;
    const newUrl = bytesToUrl(bytes);

    // Update state first, then safely revoke
    set({
      imageUrl: newUrl,
      imageBytes: bytes,
      originalWidth: Math.round(rect.width),
      originalHeight: Math.round(rect.height),
    });

    // Safely revoke the URL that was current before this update
    safeRevokeURL(currentUrl);
  },

  restoreFromSnapshot: (snapshot: ImageSnapshot) => {
    const oldUrl = get().imageUrl;

    if (snapshot.imageBytes) {
      const newUrl = bytesToUrl(new Uint8Array(snapshot.imageBytes));
      // Set new state first
      set({
        imageUrl: newUrl,
        imageBytes: new Uint8Array(snapshot.imageBytes),
        originalWidth: snapshot.originalWidth,
        originalHeight: snapshot.originalHeight,
      });
    } else {
      // Restoring to empty state
      set({
        imageUrl: null,
        imageBytes: null,
        originalWidth: 0,
        originalHeight: 0,
      });
    }

    // Safely revoke old URL after state update
    safeRevokeURL(oldUrl);
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
