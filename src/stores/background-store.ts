// Background store - Zustand state for background beautification

import { create } from 'zustand';
import { GRADIENT_PRESETS, type GradientPreset } from '../data/gradients';
import { WALLPAPER_PRESETS, type WallpaperPreset } from '../data/wallpapers';

// Constants - padding stored as percentage (0-50% of smaller image dimension)
const MIN_PADDING_PERCENT = 0;
const MAX_PADDING_PERCENT = 50;
const DEFAULT_PADDING_PERCENT = 5; // 5% default

// Blur constants for background
const MIN_BLUR = 0;
const MAX_BLUR = 500;
const DEFAULT_BLUR = 0;

// Shadow constants for screenshot
const MIN_SHADOW = 0;
const MAX_SHADOW = 500;
const DEFAULT_SHADOW = 20;

export type BackgroundType = 'gradient' | 'solid' | 'transparent' | 'wallpaper' | 'image';

interface BackgroundState {
  type: BackgroundType;
  gradient: GradientPreset | null;
  solidColor: string;
  wallpaper: WallpaperPreset | null;
  customImageUrl: string | null; // User-uploaded image URL
  customImageBytes: Uint8Array | null; // Store bytes for persistence
  blurAmount: number; // 0-500px blur for background
  shadowBlur: number; // 0-500 shadow blur for screenshot image
  paddingPercent: number; // percentage of smaller image dimension

  // Actions
  setGradient: (gradient: GradientPreset) => void;
  setSolidColor: (color: string) => void;
  setTransparent: () => void;
  setWallpaper: (wallpaper: WallpaperPreset) => void;
  setCustomImage: (url: string, bytes?: Uint8Array) => void;
  clearCustomImage: () => void;
  setBlurAmount: (amount: number) => void;
  setShadowBlur: (blur: number) => void;
  setPaddingPercent: (percent: number) => void;
  // Helper to get pixel padding based on image dimensions
  getPaddingPx: (imageWidth: number, imageHeight: number) => number;
  reset: () => void;
}

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
  type: 'gradient',
  gradient: GRADIENT_PRESETS[0], // Default to first gradient
  solidColor: '#ffffff',
  wallpaper: null,
  customImageUrl: null,
  customImageBytes: null,
  blurAmount: DEFAULT_BLUR,
  shadowBlur: DEFAULT_SHADOW,
  paddingPercent: DEFAULT_PADDING_PERCENT,

  setGradient: (gradient) => set({ type: 'gradient', gradient }),

  setSolidColor: (color) => set({ type: 'solid', solidColor: color }),

  setTransparent: () => set({ type: 'transparent' }),

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

  setPaddingPercent: (percent) =>
    set({ paddingPercent: Math.max(MIN_PADDING_PERCENT, Math.min(MAX_PADDING_PERCENT, percent)) }),

  getPaddingPx: (imageWidth, imageHeight) => {
    const smallerDimension = Math.min(imageWidth, imageHeight);
    return Math.round((get().paddingPercent / 100) * smallerDimension);
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
      blurAmount: DEFAULT_BLUR,
      shadowBlur: DEFAULT_SHADOW,
      paddingPercent: DEFAULT_PADDING_PERCENT,
    });
  },
}));
