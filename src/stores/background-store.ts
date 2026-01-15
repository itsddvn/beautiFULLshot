// Background store - Zustand state for background beautification

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GRADIENT_PRESETS, type GradientPreset } from '../data/gradients';
import { WALLPAPER_PRESETS, type WallpaperPreset } from '../data/wallpapers';
import {
  addImageToDB,
  getAllImagesFromDB,
  getImageFromDB,
  removeImageFromDB,
  clearAllImagesFromDB,
  trimOldestImages,
  type StoredImage,
} from '../utils/image-db';

// Constants - padding stored as percentage (0-50% of smaller image dimension)
const MIN_PADDING_PERCENT = 0;
const MAX_PADDING_PERCENT = 50;
const DEFAULT_PADDING_PERCENT = 5; // 5% default

// Image library constants
const MAX_LIBRARY_IMAGES = 12; 

// Blur constants for background
const MIN_BLUR = 0;
const MAX_BLUR = 500;
const DEFAULT_BLUR = 0;

// Shadow constants for screenshot
const MIN_SHADOW = 0;
const MAX_SHADOW = 500;
const DEFAULT_SHADOW = 50; // Increased from 20 for more visible effect

// Corner radius constants for screenshot
const MIN_CORNER_RADIUS = 0;
const MAX_CORNER_RADIUS = 100;
const DEFAULT_CORNER_RADIUS = 12; // Default rounded corners

// Border constants for screenshot
const MIN_BORDER_WIDTH = 0;
const MAX_BORDER_WIDTH = 50;
const DEFAULT_BORDER_WIDTH = 0;
const DEFAULT_BORDER_COLOR = '#000000';
const DEFAULT_BORDER_OPACITY = 100;

// Recent colors constants
const MAX_RECENT_COLORS = 8;

// Preset colors (same as toolbar)
export const BORDER_PRESET_COLORS = [
  '#ff0000', // Red
  '#ff6600', // Orange
  '#ffcc00', // Yellow
  '#00cc00', // Green
  '#0066ff', // Blue
  '#9933ff', // Purple
  '#000000', // Black
  '#ffffff', // White
];

export type BackgroundType = 'gradient' | 'solid' | 'transparent' | 'wallpaper' | 'image' | 'auto';

export interface LibraryImage {
  id: string;
  thumbnail: string;
  timestamp: number;
}

interface BackgroundState {
  type: BackgroundType;
  gradient: GradientPreset | null;
  solidColor: string;
  wallpaper: WallpaperPreset | null;
  customImageUrl: string | null; // User-uploaded image URL
  customImageBytes: Uint8Array | null; // Store bytes for persistence
  selectedImageId: string | null; // ID of selected image from library (for persistence)
  autoColor: string | null; // Auto-calculated dominant color from screenshot
  blurAmount: number; // 0-500px blur for background
  shadowBlur: number; // 0-500 shadow blur for screenshot image
  cornerRadius: number; // 0-100px corner radius for screenshot
  paddingPercent: number; // percentage of smaller image dimension
  borderWidth: number; // 0-50px border width for screenshot
  borderColor: string; // Border color (hex)
  borderOpacity: number; // 0-100 border opacity
  recentBorderColors: string[]; // Recent border colors

  // Image library (persisted)
  imageLibrary: LibraryImage[];

  // Actions
  setGradient: (gradient: GradientPreset) => void;
  setSolidColor: (color: string) => void;
  setTransparent: () => void;
  setAuto: () => void;
  setAutoColor: (color: string) => void;
  setWallpaper: (wallpaper: WallpaperPreset) => void;
  setCustomImage: (url: string, bytes?: Uint8Array) => void;
  clearCustomImage: () => void;
  setBlurAmount: (amount: number) => void;
  setShadowBlur: (blur: number) => void;
  setCornerRadius: (radius: number) => void;
  setPaddingPercent: (percent: number) => void;
  setBorderWidth: (width: number) => void;
  setBorderColor: (color: string, addToRecent?: boolean) => void;
  setBorderOpacity: (opacity: number) => void;
  // Helper to get pixel padding based on image dimensions
  getPaddingPx: (imageWidth: number, imageHeight: number) => number;
  // Image library actions (using IndexedDB)
  loadLibrary: () => Promise<void>;
  addToLibrary: (fullDataUrl: string, thumbnail: string) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
  selectFromLibrary: (id: string) => Promise<void>;
  clearLibrary: () => Promise<void>;
  reset: () => void;
}

// Helper to generate unique ID
const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to resize image for library storage (thumbnail)
const resizeImageForLibrary = (dataUrl: string, maxSize: number = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if larger than maxSize
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      type: 'gradient',
      gradient: GRADIENT_PRESETS[0], // Default to first gradient
      solidColor: '#ffffff',
      wallpaper: null,
      customImageUrl: null,
      customImageBytes: null,
      selectedImageId: null,
      autoColor: null,
      blurAmount: DEFAULT_BLUR,
      shadowBlur: DEFAULT_SHADOW,
      cornerRadius: DEFAULT_CORNER_RADIUS,
      paddingPercent: DEFAULT_PADDING_PERCENT,
      borderWidth: DEFAULT_BORDER_WIDTH,
      borderColor: DEFAULT_BORDER_COLOR,
      borderOpacity: DEFAULT_BORDER_OPACITY,
      recentBorderColors: [],
      imageLibrary: [],

  setGradient: (gradient) => set({ type: 'gradient', gradient }),

  setSolidColor: (color) => set({ type: 'solid', solidColor: color }),

  setTransparent: () => set({ type: 'transparent' }),

  setAuto: () => set({ type: 'auto' }),

  setAutoColor: (color) => set({ autoColor: color }),

  setWallpaper: (wallpaper) => set({ type: 'wallpaper', wallpaper }),

  setCustomImage: (url, bytes) => {
    // Revoke previous custom image URL to prevent memory leak
    const oldUrl = get().customImageUrl;
    if (oldUrl && oldUrl.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
    }
    set({
      type: 'image',
      customImageUrl: url,
      customImageBytes: bytes || null,
    });

    // Auto-save to library if we have bytes
    if (bytes) {
      // Convert bytes to base64 data URL
      const blob = new Blob([bytes], { type: 'image/png' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullDataUrl = reader.result as string;
        // Create small thumbnail for UI preview
        const thumbnailDataUrl = await resizeImageForLibrary(fullDataUrl, 150);
        await get().addToLibrary(fullDataUrl, thumbnailDataUrl);
      };
      reader.readAsDataURL(blob);
    }
  },

      clearCustomImage: () => {
    const oldUrl = get().customImageUrl;
    if (oldUrl && oldUrl.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
    }
    set({
      customImageUrl: null,
      customImageBytes: null,
      // Switch back to gradient if currently on image
      type: get().type === 'image' ? 'gradient' : get().type,
    });
  },

  setBlurAmount: (amount) =>
    set({ blurAmount: Math.max(MIN_BLUR, Math.min(MAX_BLUR, amount)) }),

  setShadowBlur: (blur) =>
    set({ shadowBlur: Math.max(MIN_SHADOW, Math.min(MAX_SHADOW, blur)) }),

  setCornerRadius: (radius) =>
    set({ cornerRadius: Math.max(MIN_CORNER_RADIUS, Math.min(MAX_CORNER_RADIUS, radius)) }),

  setPaddingPercent: (percent) =>
    set({ paddingPercent: Math.max(MIN_PADDING_PERCENT, Math.min(MAX_PADDING_PERCENT, percent)) }),

  setBorderWidth: (width) =>
    set({ borderWidth: Math.max(MIN_BORDER_WIDTH, Math.min(MAX_BORDER_WIDTH, width)) }),

  setBorderColor: (color, addToRecent = false) => {
    if (addToRecent) {
      const recent = get().recentBorderColors;
      // Add to front, remove duplicates, limit to MAX_RECENT_COLORS
      const updated = [color, ...recent.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, MAX_RECENT_COLORS);
      set({ borderColor: color, recentBorderColors: updated });
    } else {
      set({ borderColor: color });
    }
  },

  setBorderOpacity: (opacity) =>
    set({ borderOpacity: Math.max(0, Math.min(100, opacity)) }),

  getPaddingPx: (imageWidth, imageHeight) => {
    const smallerDimension = Math.min(imageWidth, imageHeight);
    return Math.round((get().paddingPercent / 100) * smallerDimension);
  },

  // Load library from IndexedDB on app start
  loadLibrary: async () => {
    try {
      const images = await getAllImagesFromDB();
      const libraryImages: LibraryImage[] = images.map((img) => ({
        id: img.id,
        thumbnail: img.thumbnail,
        timestamp: img.timestamp,
      }));
      set({ imageLibrary: libraryImages });

      // If there was a selected image and type is 'image', restore it
      const { type, selectedImageId } = get();
      if (type === 'image' && selectedImageId) {
        // Check if the image still exists in library
        const exists = libraryImages.some((img) => img.id === selectedImageId);
        if (exists) {
          // Load the full image from IndexedDB
          const image = await getImageFromDB(selectedImageId);
          if (image) {
            const response = await fetch(image.dataUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            set({ customImageUrl: url });
          }
        } else {
          // Image was deleted, reset to gradient
          set({ type: 'gradient', selectedImageId: null });
        }
      }
    } catch (error) {
      console.error('Failed to load image library:', error);
    }
  },

  // Add image to IndexedDB library
  addToLibrary: async (fullDataUrl, thumbnail) => {
    try {
      const id = generateId();
      const timestamp = Date.now();

      // Store in IndexedDB (full quality image + thumbnail)
      const storedImage: StoredImage = {
        id,
        dataUrl: fullDataUrl,
        thumbnail,
        timestamp,
      };
      await addImageToDB(storedImage);

      // Trim to max count
      await trimOldestImages(MAX_LIBRARY_IMAGES);

      // Update state with just thumbnail for UI
      const newImage: LibraryImage = { id, thumbnail, timestamp };
      const library = get().imageLibrary;
      const updatedLibrary = [newImage, ...library].slice(0, MAX_LIBRARY_IMAGES);
      set({
        imageLibrary: updatedLibrary,
        selectedImageId: id, // Save ID for persistence
      });
    } catch (error) {
      console.error('Failed to add image to library:', error);
    }
  },

  // Remove image from IndexedDB
  removeFromLibrary: async (id) => {
    try {
      await removeImageFromDB(id);
      const library = get().imageLibrary;
      set({ imageLibrary: library.filter((img) => img.id !== id) });
    } catch (error) {
      console.error('Failed to remove image:', error);
    }
  },

  // Select image from library - loads full quality from IndexedDB
  selectFromLibrary: async (id) => {
    try {
      const image = await getImageFromDB(id);
      if (!image) return;

      // Revoke previous custom image URL
      const oldUrl = get().customImageUrl;
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }

      // Convert full quality data URL to blob URL for display
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      set({
        type: 'image',
        customImageUrl: url,
        customImageBytes: null,
        selectedImageId: id, // Save ID for persistence
      });
    } catch (error) {
      console.error('Failed to select image:', error);
    }
  },

  // Clear all images from IndexedDB
  clearLibrary: async () => {
    try {
      await clearAllImagesFromDB();
      set({ imageLibrary: [] });
    } catch (error) {
      console.error('Failed to clear library:', error);
    }
  },

      reset: () => {
        // Clean up custom image URL
        const oldUrl = get().customImageUrl;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }
        set({
          type: 'gradient',
          gradient: GRADIENT_PRESETS[0],
          solidColor: '#ffffff',
          wallpaper: WALLPAPER_PRESETS[0],
          customImageUrl: null,
          customImageBytes: null,
          selectedImageId: null,
          autoColor: null,
          blurAmount: DEFAULT_BLUR,
          shadowBlur: DEFAULT_SHADOW,
          cornerRadius: DEFAULT_CORNER_RADIUS,
          paddingPercent: DEFAULT_PADDING_PERCENT,
          borderWidth: DEFAULT_BORDER_WIDTH,
          borderColor: DEFAULT_BORDER_COLOR,
          borderOpacity: DEFAULT_BORDER_OPACITY,
          // Note: imageLibrary is NOT reset - it persists in IndexedDB
        });
      },
    }),
    {
      name: 'background-settings',
      // Only persist settings values, not runtime state like images/blobs
      partialize: (state) => ({
        type: state.type,
        gradient: state.gradient,
        solidColor: state.solidColor,
        wallpaper: state.wallpaper,
        selectedImageId: state.selectedImageId,
        blurAmount: state.blurAmount,
        shadowBlur: state.shadowBlur,
        cornerRadius: state.cornerRadius,
        paddingPercent: state.paddingPercent,
        borderWidth: state.borderWidth,
        borderColor: state.borderColor,
        borderOpacity: state.borderOpacity,
        recentBorderColors: state.recentBorderColors,
      }),
    }
  )
);
