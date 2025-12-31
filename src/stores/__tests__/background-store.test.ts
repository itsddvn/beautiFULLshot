import { describe, it, expect, beforeEach } from 'vitest';
import { useBackgroundStore } from '../background-store';
import { GRADIENT_PRESETS } from '../../data/gradients';
import { WALLPAPER_PRESETS } from '../../data/wallpapers';

describe('Background Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useBackgroundStore.setState({
      type: 'gradient',
      gradient: GRADIENT_PRESETS[0],
      solidColor: '#ffffff',
      wallpaper: null,
      customImageUrl: null,
      customImageBytes: null,
      blurAmount: 0,
      shadowBlur: 50,
      cornerRadius: 12,
      paddingPercent: 5,
    });
  });

  describe('Initial State', () => {
    it('should have default gradient background', () => {
      const state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
      expect(state.gradient).toEqual(GRADIENT_PRESETS[0]);
    });

    it('should have default padding of 5%', () => {
      const state = useBackgroundStore.getState();
      expect(state.paddingPercent).toBe(5);
    });

    it('should have default solid color as white', () => {
      const state = useBackgroundStore.getState();
      expect(state.solidColor).toBe('#ffffff');
    });

    it('should have default blur amount of 0', () => {
      const state = useBackgroundStore.getState();
      expect(state.blurAmount).toBe(0);
    });

    it('should have default shadow blur of 50', () => {
      const state = useBackgroundStore.getState();
      expect(state.shadowBlur).toBe(50);
    });

    it('should have default corner radius of 12', () => {
      const state = useBackgroundStore.getState();
      expect(state.cornerRadius).toBe(12);
    });

    it('should have null wallpaper initially', () => {
      const state = useBackgroundStore.getState();
      expect(state.wallpaper).toBeNull();
    });

    it('should have null custom image initially', () => {
      const state = useBackgroundStore.getState();
      expect(state.customImageUrl).toBeNull();
      expect(state.customImageBytes).toBeNull();
    });
  });

  describe('setGradient', () => {
    it('should set gradient and type to gradient', () => {
      const gradient = GRADIENT_PRESETS[1]; // Royal gradient
      useBackgroundStore.getState().setGradient(gradient);

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
      expect(state.gradient).toEqual(gradient);
    });

    it('should replace previous gradient', () => {
      const gradient1 = GRADIENT_PRESETS[0];
      const gradient2 = GRADIENT_PRESETS[5];

      useBackgroundStore.getState().setGradient(gradient1);
      expect(useBackgroundStore.getState().gradient).toEqual(gradient1);

      useBackgroundStore.getState().setGradient(gradient2);
      expect(useBackgroundStore.getState().gradient).toEqual(gradient2);
    });

    it('should preserve gradient properties', () => {
      const gradient = GRADIENT_PRESETS[3]; // Velvet
      useBackgroundStore.getState().setGradient(gradient);

      const state = useBackgroundStore.getState();
      expect(state.gradient?.id).toBe(gradient.id);
      expect(state.gradient?.name).toBe(gradient.name);
      expect(state.gradient?.colors).toEqual(gradient.colors);
      expect(state.gradient?.direction).toBe(gradient.direction);
    });
  });

  describe('setSolidColor', () => {
    it('should set solid color and type to solid', () => {
      useBackgroundStore.getState().setSolidColor('#000000');

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('solid');
      expect(state.solidColor).toBe('#000000');
    });

    it('should accept hex color codes', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#ABCDEF'];

      colors.forEach(color => {
        useBackgroundStore.getState().setSolidColor(color);
        expect(useBackgroundStore.getState().solidColor).toBe(color);
      });
    });

    it('should replace previous solid color', () => {
      useBackgroundStore.getState().setSolidColor('#FF0000');
      expect(useBackgroundStore.getState().solidColor).toBe('#FF0000');

      useBackgroundStore.getState().setSolidColor('#0000FF');
      expect(useBackgroundStore.getState().solidColor).toBe('#0000FF');
    });
  });

  describe('setTransparent', () => {
    it('should set type to transparent', () => {
      useBackgroundStore.getState().setTransparent();

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('transparent');
    });

    it('should work after setting gradient', () => {
      useBackgroundStore.getState().setGradient(GRADIENT_PRESETS[2]);
      expect(useBackgroundStore.getState().type).toBe('gradient');

      useBackgroundStore.getState().setTransparent();
      expect(useBackgroundStore.getState().type).toBe('transparent');
    });

    it('should work after setting solid color', () => {
      useBackgroundStore.getState().setSolidColor('#FF0000');
      expect(useBackgroundStore.getState().type).toBe('solid');

      useBackgroundStore.getState().setTransparent();
      expect(useBackgroundStore.getState().type).toBe('transparent');
    });
  });

  describe('setWallpaper', () => {
    it('should set wallpaper and type to wallpaper', () => {
      const wallpaper = WALLPAPER_PRESETS[0];
      useBackgroundStore.getState().setWallpaper(wallpaper);

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('wallpaper');
      expect(state.wallpaper).toEqual(wallpaper);
    });

    it('should replace previous wallpaper', () => {
      const wallpaper1 = WALLPAPER_PRESETS[0];
      const wallpaper2 = WALLPAPER_PRESETS[1];

      useBackgroundStore.getState().setWallpaper(wallpaper1);
      expect(useBackgroundStore.getState().wallpaper).toEqual(wallpaper1);

      useBackgroundStore.getState().setWallpaper(wallpaper2);
      expect(useBackgroundStore.getState().wallpaper).toEqual(wallpaper2);
    });

    it('should preserve wallpaper properties', () => {
      const wallpaper = WALLPAPER_PRESETS[0];
      useBackgroundStore.getState().setWallpaper(wallpaper);

      const state = useBackgroundStore.getState();
      expect(state.wallpaper?.id).toBe(wallpaper.id);
      expect(state.wallpaper?.name).toBe(wallpaper.name);
      expect(state.wallpaper?.categoryId).toBe(wallpaper.categoryId);
      expect(state.wallpaper?.url).toBe(wallpaper.url);
    });
  });

  describe('setCustomImage', () => {
    it('should set custom image URL and type to image', () => {
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('image');
      expect(state.customImageUrl).toBe('https://example.com/image.jpg');
    });

    it('should set custom image bytes if provided', () => {
      const bytes = new Uint8Array([1, 2, 3, 4]);
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg', bytes);

      const state = useBackgroundStore.getState();
      expect(state.customImageBytes).toEqual(bytes);
    });

    it('should set bytes to null if not provided', () => {
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');

      const state = useBackgroundStore.getState();
      expect(state.customImageBytes).toBeNull();
    });
  });

  describe('clearCustomImage', () => {
    it('should clear custom image URL and bytes', () => {
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg', new Uint8Array([1, 2, 3]));
      useBackgroundStore.getState().clearCustomImage();

      const state = useBackgroundStore.getState();
      expect(state.customImageUrl).toBeNull();
      expect(state.customImageBytes).toBeNull();
    });

    it('should switch to gradient type when clearing from image type', () => {
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      expect(useBackgroundStore.getState().type).toBe('image');

      useBackgroundStore.getState().clearCustomImage();
      expect(useBackgroundStore.getState().type).toBe('gradient');
    });

    it('should not change type when clearing from non-image type', () => {
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      useBackgroundStore.getState().setSolidColor('#FF0000');
      expect(useBackgroundStore.getState().type).toBe('solid');

      useBackgroundStore.getState().clearCustomImage();
      expect(useBackgroundStore.getState().type).toBe('solid');
    });
  });

  describe('setBlurAmount', () => {
    it('should set blur amount', () => {
      useBackgroundStore.getState().setBlurAmount(10);
      expect(useBackgroundStore.getState().blurAmount).toBe(10);
    });

    it('should clamp blur to minimum 0', () => {
      useBackgroundStore.getState().setBlurAmount(-5);
      expect(useBackgroundStore.getState().blurAmount).toBe(0);
    });

    it('should clamp blur to maximum 500', () => {
      useBackgroundStore.getState().setBlurAmount(600);
      expect(useBackgroundStore.getState().blurAmount).toBe(500);
    });

    it('should accept values within valid range', () => {
      const validValues = [0, 10, 25, 40, 50];

      validValues.forEach(value => {
        useBackgroundStore.getState().setBlurAmount(value);
        expect(useBackgroundStore.getState().blurAmount).toBe(value);
      });
    });
  });

  describe('setShadowBlur', () => {
    it('should set shadow blur amount', () => {
      useBackgroundStore.getState().setShadowBlur(30);
      expect(useBackgroundStore.getState().shadowBlur).toBe(30);
    });

    it('should clamp shadow blur to minimum 0', () => {
      useBackgroundStore.getState().setShadowBlur(-10);
      expect(useBackgroundStore.getState().shadowBlur).toBe(0);
    });

    it('should clamp shadow blur to maximum 500', () => {
      useBackgroundStore.getState().setShadowBlur(600);
      expect(useBackgroundStore.getState().shadowBlur).toBe(500);
    });

    it('should accept values within valid range', () => {
      const validValues = [0, 100, 250, 400, 500];

      validValues.forEach(value => {
        useBackgroundStore.getState().setShadowBlur(value);
        expect(useBackgroundStore.getState().shadowBlur).toBe(value);
      });
    });
  });

  describe('setCornerRadius', () => {
    it('should set corner radius', () => {
      useBackgroundStore.getState().setCornerRadius(20);
      expect(useBackgroundStore.getState().cornerRadius).toBe(20);
    });

    it('should clamp corner radius to minimum 0', () => {
      useBackgroundStore.getState().setCornerRadius(-5);
      expect(useBackgroundStore.getState().cornerRadius).toBe(0);
    });

    it('should clamp corner radius to maximum 100', () => {
      useBackgroundStore.getState().setCornerRadius(150);
      expect(useBackgroundStore.getState().cornerRadius).toBe(100);
    });

    it('should accept values within valid range', () => {
      const validValues = [0, 12, 24, 50, 100];

      validValues.forEach(value => {
        useBackgroundStore.getState().setCornerRadius(value);
        expect(useBackgroundStore.getState().cornerRadius).toBe(value);
      });
    });
  });

  describe('setPaddingPercent', () => {
    it('should set padding percentage value', () => {
      useBackgroundStore.getState().setPaddingPercent(10);
      expect(useBackgroundStore.getState().paddingPercent).toBe(10);
    });

    it('should clamp padding to minimum 0%', () => {
      useBackgroundStore.getState().setPaddingPercent(-10);
      expect(useBackgroundStore.getState().paddingPercent).toBe(0);
    });

    it('should clamp padding to maximum 50%', () => {
      useBackgroundStore.getState().setPaddingPercent(80);
      expect(useBackgroundStore.getState().paddingPercent).toBe(50);
    });

    it('should accept values within valid range', () => {
      const validValues = [0, 5, 10, 25, 40, 50];

      validValues.forEach(value => {
        useBackgroundStore.getState().setPaddingPercent(value);
        expect(useBackgroundStore.getState().paddingPercent).toBe(value);
      });
    });

    it('should handle edge cases', () => {
      useBackgroundStore.getState().setPaddingPercent(0);
      expect(useBackgroundStore.getState().paddingPercent).toBe(0);

      useBackgroundStore.getState().setPaddingPercent(50);
      expect(useBackgroundStore.getState().paddingPercent).toBe(50);
    });
  });

  describe('getPaddingPx', () => {
    it('should calculate pixel padding based on smaller dimension', () => {
      useBackgroundStore.getState().setPaddingPercent(10);

      // 10% of 800 (smaller) = 80px
      expect(useBackgroundStore.getState().getPaddingPx(1000, 800)).toBe(80);

      // 10% of 600 (smaller) = 60px
      expect(useBackgroundStore.getState().getPaddingPx(600, 1200)).toBe(60);
    });

    it('should return 0 when padding is 0%', () => {
      useBackgroundStore.getState().setPaddingPercent(0);
      expect(useBackgroundStore.getState().getPaddingPx(1000, 800)).toBe(0);
    });

    it('should handle square images', () => {
      useBackgroundStore.getState().setPaddingPercent(20);
      // 20% of 500 = 100px
      expect(useBackgroundStore.getState().getPaddingPx(500, 500)).toBe(100);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      useBackgroundStore.getState().setGradient(GRADIENT_PRESETS[5]);
      useBackgroundStore.getState().setPaddingPercent(25);
      useBackgroundStore.getState().setBlurAmount(20);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
      expect(state.gradient).toEqual(GRADIENT_PRESETS[0]);
      expect(state.solidColor).toBe('#ffffff');
      expect(state.paddingPercent).toBe(5);
      expect(state.blurAmount).toBe(0);
    });

    it('should reset from transparent state', () => {
      useBackgroundStore.getState().setTransparent();
      useBackgroundStore.getState().setPaddingPercent(30);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
      expect(state.paddingPercent).toBe(5);
    });

    it('should reset from solid color state', () => {
      useBackgroundStore.getState().setSolidColor('#FF0000');
      useBackgroundStore.getState().setPaddingPercent(15);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
      expect(state.solidColor).toBe('#ffffff');
      expect(state.paddingPercent).toBe(5);
    });

    it('should reset wallpaper and custom image', () => {
      useBackgroundStore.getState().setWallpaper(WALLPAPER_PRESETS[0]);
      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      useBackgroundStore.getState().setBlurAmount(30);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.customImageUrl).toBeNull();
      expect(state.customImageBytes).toBeNull();
      expect(state.blurAmount).toBe(0);
    });

    it('should reset shadow blur to default 50', () => {
      useBackgroundStore.getState().setShadowBlur(80);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.shadowBlur).toBe(50);
    });

    it('should reset corner radius to default 12', () => {
      useBackgroundStore.getState().setCornerRadius(50);

      useBackgroundStore.getState().reset();

      const state = useBackgroundStore.getState();
      expect(state.cornerRadius).toBe(12);
    });
  });

  describe('Type switching', () => {
    it('should switch between all five types correctly', () => {
      let state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');

      useBackgroundStore.getState().setSolidColor('#FF0000');
      state = useBackgroundStore.getState();
      expect(state.type).toBe('solid');

      useBackgroundStore.getState().setTransparent();
      state = useBackgroundStore.getState();
      expect(state.type).toBe('transparent');

      useBackgroundStore.getState().setWallpaper(WALLPAPER_PRESETS[0]);
      state = useBackgroundStore.getState();
      expect(state.type).toBe('wallpaper');

      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      state = useBackgroundStore.getState();
      expect(state.type).toBe('image');

      useBackgroundStore.getState().setGradient(GRADIENT_PRESETS[3]);
      state = useBackgroundStore.getState();
      expect(state.type).toBe('gradient');
    });

    it('should maintain padding across type switches', () => {
      useBackgroundStore.getState().setPaddingPercent(20);

      useBackgroundStore.getState().setSolidColor('#FF0000');
      expect(useBackgroundStore.getState().paddingPercent).toBe(20);

      useBackgroundStore.getState().setTransparent();
      expect(useBackgroundStore.getState().paddingPercent).toBe(20);

      useBackgroundStore.getState().setWallpaper(WALLPAPER_PRESETS[0]);
      expect(useBackgroundStore.getState().paddingPercent).toBe(20);

      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      expect(useBackgroundStore.getState().paddingPercent).toBe(20);

      useBackgroundStore.getState().setGradient(GRADIENT_PRESETS[2]);
      expect(useBackgroundStore.getState().paddingPercent).toBe(20);
    });

    it('should maintain blur amount across type switches', () => {
      useBackgroundStore.getState().setBlurAmount(15);

      useBackgroundStore.getState().setSolidColor('#FF0000');
      expect(useBackgroundStore.getState().blurAmount).toBe(15);

      useBackgroundStore.getState().setWallpaper(WALLPAPER_PRESETS[0]);
      expect(useBackgroundStore.getState().blurAmount).toBe(15);

      useBackgroundStore.getState().setCustomImage('https://example.com/image.jpg');
      expect(useBackgroundStore.getState().blurAmount).toBe(15);
    });
  });
});
