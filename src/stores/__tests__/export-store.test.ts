import { describe, it, expect, beforeEach } from 'vitest';
import { useExportStore } from '../export-store';

describe('Export Store', () => {
  beforeEach(() => {
    // Reset store before each test (including transient state)
    useExportStore.setState({
      format: 'png',
      quality: 0.9,
      pixelRatio: 1,
      outputAspectRatio: 'auto',
      autoName: true,
      lastSavePath: null,
      isExporting: false,
      exportOperation: 'idle',
    });
  });

  describe('Initial State', () => {
    it('should have default PNG format', () => {
      const state = useExportStore.getState();
      expect(state.format).toBe('png');
    });

    it('should have default quality of 0.9', () => {
      const state = useExportStore.getState();
      expect(state.quality).toBe(0.9);
    });

    it('should have default pixelRatio of 1', () => {
      const state = useExportStore.getState();
      expect(state.pixelRatio).toBe(1);
    });

    it('should have autoName enabled by default', () => {
      const state = useExportStore.getState();
      expect(state.autoName).toBe(true);
    });

    it('should have null lastSavePath initially', () => {
      const state = useExportStore.getState();
      expect(state.lastSavePath).toBeNull();
    });

    it('should have default outputAspectRatio of auto', () => {
      const state = useExportStore.getState();
      expect(state.outputAspectRatio).toBe('auto');
    });
  });

  describe('setFormat', () => {
    it('should set format to png', () => {
      useExportStore.getState().setFormat('png');
      expect(useExportStore.getState().format).toBe('png');
    });

    it('should set format to jpeg', () => {
      useExportStore.getState().setFormat('jpeg');
      expect(useExportStore.getState().format).toBe('jpeg');
    });

    it('should replace previous format', () => {
      useExportStore.getState().setFormat('jpeg');
      expect(useExportStore.getState().format).toBe('jpeg');

      useExportStore.getState().setFormat('png');
      expect(useExportStore.getState().format).toBe('png');
    });
  });

  describe('setQuality', () => {
    it('should set quality value', () => {
      useExportStore.getState().setQuality(0.85);
      expect(useExportStore.getState().quality).toBe(0.85);
    });

    it('should clamp quality to minimum 0.1', () => {
      useExportStore.getState().setQuality(0.05);
      expect(useExportStore.getState().quality).toBe(0.1);
    });

    it('should clamp quality to maximum 1.0', () => {
      useExportStore.getState().setQuality(1.5);
      expect(useExportStore.getState().quality).toBe(1);
    });

    it('should accept valid quality values', () => {
      const validValues = [0.1, 0.25, 0.5, 0.75, 0.9, 1];

      validValues.forEach(value => {
        useExportStore.getState().setQuality(value);
        expect(useExportStore.getState().quality).toBe(value);
      });
    });

    it('should handle edge case: minimum', () => {
      useExportStore.getState().setQuality(0.1);
      expect(useExportStore.getState().quality).toBe(0.1);
    });

    it('should handle edge case: maximum', () => {
      useExportStore.getState().setQuality(1);
      expect(useExportStore.getState().quality).toBe(1);
    });
  });

  describe('setPixelRatio', () => {
    it('should set pixelRatio to 1', () => {
      useExportStore.getState().setPixelRatio(1);
      expect(useExportStore.getState().pixelRatio).toBe(1);
    });

    it('should set pixelRatio to 2', () => {
      useExportStore.getState().setPixelRatio(2);
      expect(useExportStore.getState().pixelRatio).toBe(2);
    });

    it('should set pixelRatio to 3', () => {
      useExportStore.getState().setPixelRatio(3);
      expect(useExportStore.getState().pixelRatio).toBe(3);
    });

    it('should clamp pixelRatio to minimum 1', () => {
      useExportStore.getState().setPixelRatio(0);
      expect(useExportStore.getState().pixelRatio).toBe(1);
    });

    it('should clamp pixelRatio to maximum 3', () => {
      useExportStore.getState().setPixelRatio(5);
      expect(useExportStore.getState().pixelRatio).toBe(3);
    });

    it('should accept all valid resolution ratios', () => {
      const validRatios = [1, 2, 3];

      validRatios.forEach(ratio => {
        useExportStore.getState().setPixelRatio(ratio);
        expect(useExportStore.getState().pixelRatio).toBe(ratio);
      });
    });
  });

  describe('setOutputAspectRatio', () => {
    it('should set output aspect ratio to auto', () => {
      useExportStore.getState().setOutputAspectRatio('auto');
      expect(useExportStore.getState().outputAspectRatio).toBe('auto');
    });

    it('should set output aspect ratio to 1:1', () => {
      useExportStore.getState().setOutputAspectRatio('1:1');
      expect(useExportStore.getState().outputAspectRatio).toBe('1:1');
    });

    it('should set output aspect ratio to 16:9', () => {
      useExportStore.getState().setOutputAspectRatio('16:9');
      expect(useExportStore.getState().outputAspectRatio).toBe('16:9');
    });

    it('should set social media aspect ratios', () => {
      const socialRatios = ['4:5', '9:16', '2:1', '1.91:1', '3:4'];

      socialRatios.forEach((ratio) => {
        useExportStore.getState().setOutputAspectRatio(ratio);
        expect(useExportStore.getState().outputAspectRatio).toBe(ratio);
      });
    });

    it('should replace previous output aspect ratio', () => {
      useExportStore.getState().setOutputAspectRatio('1:1');
      expect(useExportStore.getState().outputAspectRatio).toBe('1:1');

      useExportStore.getState().setOutputAspectRatio('16:9');
      expect(useExportStore.getState().outputAspectRatio).toBe('16:9');
    });
  });

  describe('setAutoName', () => {
    it('should enable autoName', () => {
      useExportStore.getState().setAutoName(true);
      expect(useExportStore.getState().autoName).toBe(true);
    });

    it('should disable autoName', () => {
      useExportStore.getState().setAutoName(false);
      expect(useExportStore.getState().autoName).toBe(false);
    });

    it('should toggle autoName', () => {
      useExportStore.getState().setAutoName(false);
      expect(useExportStore.getState().autoName).toBe(false);

      useExportStore.getState().setAutoName(true);
      expect(useExportStore.getState().autoName).toBe(true);
    });
  });

  describe('setLastSavePath', () => {
    it('should set lastSavePath', () => {
      const path = '/Users/test/Pictures/BeautyShot/image.png';
      useExportStore.getState().setLastSavePath(path);
      expect(useExportStore.getState().lastSavePath).toBe(path);
    });

    it('should replace previous lastSavePath', () => {
      const path1 = '/path/to/image1.png';
      const path2 = '/path/to/image2.jpeg';

      useExportStore.getState().setLastSavePath(path1);
      expect(useExportStore.getState().lastSavePath).toBe(path1);

      useExportStore.getState().setLastSavePath(path2);
      expect(useExportStore.getState().lastSavePath).toBe(path2);
    });

    it('should handle windows paths', () => {
      const windowsPath = 'C:\\Users\\test\\Pictures\\image.png';
      useExportStore.getState().setLastSavePath(windowsPath);
      expect(useExportStore.getState().lastSavePath).toBe(windowsPath);
    });
  });

  describe('Combined Actions', () => {
    it('should allow setting all properties independently', () => {
      useExportStore.getState().setFormat('jpeg');
      useExportStore.getState().setQuality(0.8);
      useExportStore.getState().setPixelRatio(2);
      useExportStore.getState().setOutputAspectRatio('16:9');
      useExportStore.getState().setAutoName(false);
      useExportStore.getState().setLastSavePath('/test/path.jpeg');

      const state = useExportStore.getState();
      expect(state.format).toBe('jpeg');
      expect(state.quality).toBe(0.8);
      expect(state.pixelRatio).toBe(2);
      expect(state.outputAspectRatio).toBe('16:9');
      expect(state.autoName).toBe(false);
      expect(state.lastSavePath).toBe('/test/path.jpeg');
    });

    it('should preserve other values when updating one', () => {
      const originalPath = '/original/path.png';

      useExportStore.getState().setLastSavePath(originalPath);
      useExportStore.getState().setFormat('jpeg');

      const state = useExportStore.getState();
      expect(state.lastSavePath).toBe(originalPath);
      expect(state.quality).toBe(0.9); // Unchanged
      expect(state.pixelRatio).toBe(1); // Unchanged
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid export formats', () => {
      useExportStore.getState().setFormat('png');
      expect(useExportStore.getState().format).toBe('png');

      useExportStore.getState().setFormat('jpeg');
      expect(useExportStore.getState().format).toBe('jpeg');
    });

    it('should have proper bounds for numeric values', () => {
      // Quality bounds
      useExportStore.getState().setQuality(0);
      expect(useExportStore.getState().quality).toBeGreaterThanOrEqual(0.1);

      useExportStore.getState().setQuality(2);
      expect(useExportStore.getState().quality).toBeLessThanOrEqual(1);

      // PixelRatio bounds
      useExportStore.getState().setPixelRatio(-1);
      expect(useExportStore.getState().pixelRatio).toBeGreaterThanOrEqual(1);

      useExportStore.getState().setPixelRatio(10);
      expect(useExportStore.getState().pixelRatio).toBeLessThanOrEqual(3);
    });
  });

  describe('Export State (Transient)', () => {
    it('should have idle export state by default', () => {
      const state = useExportStore.getState();
      expect(state.isExporting).toBe(false);
      expect(state.exportOperation).toBe('idle');
    });

    it('should set isExporting to true when startExport is called', () => {
      useExportStore.getState().startExport('quickSave');
      const state = useExportStore.getState();
      expect(state.isExporting).toBe(true);
      expect(state.exportOperation).toBe('quickSave');
    });

    it('should reset to idle when finishExport is called', () => {
      useExportStore.getState().startExport('saveAs');
      useExportStore.getState().finishExport();
      const state = useExportStore.getState();
      expect(state.isExporting).toBe(false);
      expect(state.exportOperation).toBe('idle');
    });

    it('should handle clipboard operation', () => {
      useExportStore.getState().startExport('clipboard');
      expect(useExportStore.getState().exportOperation).toBe('clipboard');
    });

    it('should handle all export operation types', () => {
      const operations = ['quickSave', 'saveAs', 'clipboard'] as const;

      operations.forEach((op) => {
        useExportStore.getState().startExport(op);
        expect(useExportStore.getState().exportOperation).toBe(op);
        useExportStore.getState().finishExport();
      });
    });

    it('should not affect persisted state when modifying export state', () => {
      useExportStore.getState().setFormat('jpeg');
      useExportStore.getState().setQuality(0.7);

      useExportStore.getState().startExport('quickSave');

      const state = useExportStore.getState();
      expect(state.format).toBe('jpeg');
      expect(state.quality).toBe(0.7);
      expect(state.isExporting).toBe(true);
    });
  });
});
