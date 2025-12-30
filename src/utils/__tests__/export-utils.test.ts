import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFilename,
  stageToDataURL,
  stageToBlob,
  dataURLToBytes,
  calculateAspectRatioExtend,
  ExportError,
  type ExportOptions,
} from '../export-utils';
import type Konva from 'konva';

// Typed mock config interface for better type safety
interface MockStageConfig {
  mimeType?: string;
  quality?: number;
  pixelRatio?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  callback?: (blob: Blob | null) => void;
}

// Mock stage structure type
interface MockStage {
  toDataURL: ReturnType<typeof vi.fn>;
  toBlob: ReturnType<typeof vi.fn>;
}

// Mock Konva Stage for testing
const createMockStage = (): Konva.Stage & MockStage => {
  const mockStage = {
    toDataURL: vi.fn().mockReturnValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
    ),
    toBlob: vi.fn((config: MockStageConfig) => {
      if (config.callback) {
        const blob = new Blob(['fake image data'], { type: 'image/png' });
        config.callback(blob);
      }
    }),
  };
  return mockStage as Konva.Stage & MockStage;
};

// Helper to get mock call config - accepts a mock with .mock.calls
const getMockCallConfig = (mockStage: MockStage, method: 'toDataURL' | 'toBlob'): MockStageConfig => {
  return mockStage[method].mock.calls[0]?.[0] as MockStageConfig;
};

describe('Export Utils', () => {
  describe('generateFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-25T10:30:45.123Z'));
    });

    it('should generate PNG filename with timestamp', () => {
      const filename = generateFilename('png');
      expect(filename).toMatch(/^beautyshot_\d{8}_\d{6}\.png$/);
      expect(filename).toContain('beautyshot_');
      expect(filename).toMatch(/\.png$/);
    });

    it('should generate JPEG filename with timestamp', () => {
      const filename = generateFilename('jpeg');
      expect(filename).toMatch(/^beautyshot_\d{8}_\d{6}\.jpeg$/);
      expect(filename).toContain('beautyshot_');
      expect(filename).toMatch(/\.jpeg$/);
    });

    it('should use ISO timestamp format (YYYYMMDD_HHMMSS)', () => {
      const filename = generateFilename('png');
      // Timestamp should be 20241225_103045
      expect(filename).toContain('beautyshot_20241225_103045');
    });

    it('should generate different filenames for different times', () => {
      const filename1 = generateFilename('png');

      vi.setSystemTime(new Date('2024-12-25T10:30:46.123Z'));
      const filename2 = generateFilename('png');

      expect(filename1).not.toBe(filename2);
    });

    it('should handle different formats consistently', () => {
      const pngName = generateFilename('png');
      const jpegName = generateFilename('jpeg');

      // Both should have same timestamp but different extension
      const pngTime = pngName.split('.')[0];
      const jpegTime = jpegName.split('.')[0];
      expect(pngTime).toBe(jpegTime);
      expect(pngName).toMatch(/\.png$/);
      expect(jpegName).toMatch(/\.jpeg$/);
    });
  });

  describe('stageToDataURL', () => {
    let mockStage: Konva.Stage;

    beforeEach(() => {
      mockStage = createMockStage();
    });

    it('should export stage as PNG data URL', () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 1,
      };

      const dataURL = stageToDataURL(mockStage, options);

      expect(dataURL).toMatch(/^data:image\/png;base64,/);
      expect(mockStage.toDataURL).toHaveBeenCalled();
    });

    it('should export stage as JPEG data URL', () => {
      const options: ExportOptions = {
        format: 'jpeg',
        quality: 0.85,
        pixelRatio: 1,
      };

      const dataURL = stageToDataURL(mockStage, options);

      expect(dataURL).toMatch(/^data:image\/png;base64,/);
      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toDataURL');
      expect(callConfig.mimeType).toBe('image/jpeg');
      expect(callConfig.quality).toBe(0.85);
    });

    it('should respect pixelRatio option', () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 2,
      };

      stageToDataURL(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toDataURL');
      expect(callConfig.pixelRatio).toBe(2);
    });

    it('should export with crop rect if provided', () => {
      const cropRect = { x: 10, y: 20, width: 300, height: 250 };
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 1,
        cropRect,
      };

      stageToDataURL(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toDataURL');
      expect(callConfig.x).toBe(10);
      expect(callConfig.y).toBe(20);
      expect(callConfig.width).toBe(300);
      expect(callConfig.height).toBe(250);
    });

    it('should not include quality for PNG format', () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.8,
        pixelRatio: 1,
      };

      stageToDataURL(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toDataURL');
      expect(callConfig.quality).toBeUndefined();
      expect(callConfig.mimeType).toBe('image/png');
    });

    it('should include quality for JPEG format', () => {
      const options: ExportOptions = {
        format: 'jpeg',
        quality: 0.75,
        pixelRatio: 1,
      };

      stageToDataURL(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toDataURL');
      expect(callConfig.quality).toBe(0.75);
      expect(callConfig.mimeType).toBe('image/jpeg');
    });
  });

  describe('stageToBlob', () => {
    let mockStage: Konva.Stage;

    beforeEach(() => {
      mockStage = createMockStage();
    });

    it('should export stage to blob', async () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 1,
      };

      const blob = await stageToBlob(mockStage, options);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle JPEG format', async () => {
      const options: ExportOptions = {
        format: 'jpeg',
        quality: 0.8,
        pixelRatio: 1,
      };

      const blob = await stageToBlob(mockStage, options);

      expect(blob).toBeInstanceOf(Blob);
      expect(mockStage.toBlob).toHaveBeenCalled();
    });

    it('should respect pixelRatio', async () => {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 3,
      };

      await stageToBlob(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toBlob');
      expect(callConfig.pixelRatio).toBe(3);
    });

    it('should export with crop rect if provided', async () => {
      const cropRect = { x: 5, y: 15, width: 400, height: 300 };
      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 1,
        cropRect,
      };

      await stageToBlob(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toBlob');
      expect(callConfig.x).toBe(5);
      expect(callConfig.y).toBe(15);
      expect(callConfig.width).toBe(400);
      expect(callConfig.height).toBe(300);
    });

    it('should reject on blob creation failure', async () => {
      const failStage = {
        toDataURL: vi.fn(),
        toBlob: vi.fn((config: MockStageConfig) => {
          if (config.callback) {
            config.callback(null); // Simulate failure
          }
        }),
      };

      const options: ExportOptions = {
        format: 'png',
        quality: 0.9,
        pixelRatio: 1,
      };

      await expect(
        stageToBlob(failStage as unknown as Konva.Stage, options)
      ).rejects.toThrow('Failed to create blob from stage');
    });

    it('should include quality for JPEG in blob export', async () => {
      const options: ExportOptions = {
        format: 'jpeg',
        quality: 0.7,
        pixelRatio: 1,
      };

      await stageToBlob(mockStage, options);

      const callConfig = getMockCallConfig(mockStage as unknown as MockStage, 'toBlob');
      expect(callConfig.quality).toBe(0.7);
      expect(callConfig.mimeType).toBe('image/jpeg');
    });
  });

  describe('dataURLToBytes', () => {
    it('should convert PNG data URL to bytes', () => {
      const pngDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';

      const bytes = dataURLToBytes(pngDataURL);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('should convert JPEG data URL to bytes', () => {
      // Simple minimal JPEG base64
      const jpegDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const bytes = dataURLToBytes(jpegDataURL);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('should handle complex data URLs with charset', () => {
      // Valid base64 data for minimal PNG
      const dataURL = 'data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUg==';
      const bytes = dataURLToBytes(dataURL);

      expect(bytes).toBeInstanceOf(Uint8Array);
    });

    it('should preserve binary data integrity', () => {
      // Create a simple test: "Hello World!" in base64 is "SGVsbG8gV29ybGQh"
      const testString = 'Hello World!';
      const testBase64 = 'SGVsbG8gV29ybGQh';
      const testDataURL = `data:text/plain;base64,${testBase64}`;

      const bytes = dataURLToBytes(testDataURL);
      const decoded = new TextDecoder().decode(bytes);

      expect(decoded).toBe(testString);
    });

    it('should extract correct portion after comma', () => {
      // Valid base64 data after comma: "test data" in base64 is "dGVzdCBkYXRh"
      const testBase64 = 'dGVzdCBkYXRh';
      const dataURL = `data:image/png;base64,${testBase64}`;
      const bytes = dataURLToBytes(dataURL);

      // Should only process the base64 part after comma
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('should throw ExportError for empty input', () => {
      expect(() => dataURLToBytes('')).toThrow(ExportError);
      expect(() => dataURLToBytes('')).toThrow('Invalid data URL: empty or not a string');
    });

    it('should throw ExportError for invalid format (no comma)', () => {
      expect(() => dataURLToBytes('invalidbase64data')).toThrow(ExportError);
      expect(() => dataURLToBytes('invalidbase64data')).toThrow('missing comma separator');
    });

    it('should throw ExportError for empty base64 content', () => {
      expect(() => dataURLToBytes('data:image/png;base64,')).toThrow(ExportError);
      expect(() => dataURLToBytes('data:image/png;base64,')).toThrow('empty base64 content');
    });

    it('should throw ExportError for invalid base64', () => {
      // Invalid base64 characters
      expect(() => dataURLToBytes('data:image/png;base64,!!invalid!!')).toThrow(ExportError);
      expect(() => dataURLToBytes('data:image/png;base64,!!invalid!!')).toThrow('Failed to decode base64');
    });

    it('should have correct error code for each error type', () => {
      try {
        dataURLToBytes('');
      } catch (e) {
        expect(e).toBeInstanceOf(ExportError);
        expect((e as ExportError).code).toBe('INVALID_INPUT');
      }

      try {
        dataURLToBytes('nocolon');
      } catch (e) {
        expect(e).toBeInstanceOf(ExportError);
        expect((e as ExportError).code).toBe('INVALID_FORMAT');
      }

      try {
        dataURLToBytes('data:image/png;base64,');
      } catch (e) {
        expect(e).toBeInstanceOf(ExportError);
        expect((e as ExportError).code).toBe('EMPTY_CONTENT');
      }
    });
  });

  describe('Export Options Validation', () => {
    let mockStage: Konva.Stage;

    beforeEach(() => {
      mockStage = createMockStage();
    });

    it('should handle all valid combinations', () => {
      const formats: Array<'png' | 'jpeg'> = ['png', 'jpeg'];
      const ratios = [1, 2, 3];
      const qualities = [0.1, 0.5, 0.9];

      formats.forEach(format => {
        ratios.forEach(ratio => {
          qualities.forEach(quality => {
            const options: ExportOptions = {
              format,
              quality,
              pixelRatio: ratio,
            };

            const dataURL = stageToDataURL(mockStage, options);
            expect(dataURL).toBeTruthy();
          });
        });
      });
    });
  });

  describe('calculateAspectRatioExtend', () => {
    it('should return null for auto aspect ratio', () => {
      const result = calculateAspectRatioExtend(1920, 1080, 'auto');
      expect(result).toBeNull();
    });

    it('should return null for empty aspect ratio', () => {
      const result = calculateAspectRatioExtend(1920, 1080, '');
      expect(result).toBeNull();
    });

    it('should return null for unknown aspect ratio id', () => {
      const result = calculateAspectRatioExtend(1920, 1080, 'unknown');
      expect(result).toBeNull();
    });

    it('should return null when already at target ratio', () => {
      // 1920x1080 is already 16:9
      const result = calculateAspectRatioExtend(1920, 1080, '16:9');
      expect(result).toBeNull();
    });

    it('should extend height for 1:1 from landscape', () => {
      // 1920x1080 -> 1:1 should extend to 1920x1920
      const result = calculateAspectRatioExtend(1920, 1080, '1:1');
      expect(result).not.toBeNull();
      expect(result!.width).toBe(1920);
      expect(result!.height).toBe(1920);
      expect(result!.offsetX).toBe(0);
      expect(result!.offsetY).toBe(420); // (1920 - 1080) / 2 = 420
    });

    it('should extend width for 1:1 from portrait', () => {
      // 1080x1920 -> 1:1 should extend to 1920x1920
      const result = calculateAspectRatioExtend(1080, 1920, '1:1');
      expect(result).not.toBeNull();
      expect(result!.width).toBe(1920);
      expect(result!.height).toBe(1920);
      expect(result!.offsetX).toBe(420); // (1920 - 1080) / 2 = 420
      expect(result!.offsetY).toBe(0);
    });

    it('should extend width for 16:9 from square', () => {
      // 1000x1000 -> 16:9 should extend to 1778x1000
      // target ratio = 16/9 = 1.777...
      // newWidth = 1000 * 1.777... = 1777.77... ~= 1778
      const result = calculateAspectRatioExtend(1000, 1000, '16:9');
      expect(result).not.toBeNull();
      expect(result!.width).toBe(1778);
      expect(result!.height).toBe(1000);
      expect(result!.offsetX).toBe(389); // (1778 - 1000) / 2 = 389
      expect(result!.offsetY).toBe(0);
    });

    it('should extend height for 9:16 portrait from landscape', () => {
      // 1920x1080 -> 9:16 should extend height significantly
      // target ratio = 9/16 = 0.5625
      // newHeight = 1920 / 0.5625 = 3413.33... ~= 3413
      const result = calculateAspectRatioExtend(1920, 1080, '9:16');
      expect(result).not.toBeNull();
      expect(result!.width).toBe(1920);
      expect(result!.height).toBe(3413);
      expect(result!.offsetX).toBe(0);
      expect(result!.offsetY).toBe(1167); // (3413 - 1080) / 2 = 1166.5 ~= 1167
    });

    it('should extend height for 4:5 Instagram from landscape', () => {
      // 1000x800 -> 4:5 (0.8) should extend height
      // current ratio = 1.25, target = 0.8
      // newHeight = 1000 / 0.8 = 1250
      const result = calculateAspectRatioExtend(1000, 800, '4:5');
      expect(result).not.toBeNull();
      expect(result!.width).toBe(1000);
      expect(result!.height).toBe(1250);
      expect(result!.offsetY).toBe(225); // (1250 - 800) / 2 = 225
    });

    it('should center content horizontally when extending width', () => {
      const result = calculateAspectRatioExtend(1000, 2000, '1:1');
      expect(result).not.toBeNull();
      // newWidth = 2000, offsetX = (2000 - 1000) / 2 = 500
      expect(result!.offsetX).toBe(500);
    });

    it('should center content vertically when extending height', () => {
      const result = calculateAspectRatioExtend(2000, 1000, '1:1');
      expect(result).not.toBeNull();
      // newHeight = 2000, offsetY = (2000 - 1000) / 2 = 500
      expect(result!.offsetY).toBe(500);
    });

    it('should return rounded values', () => {
      // Dimensions that would result in floating point values
      const result = calculateAspectRatioExtend(1001, 1001, '16:9');
      expect(result).not.toBeNull();
      expect(Number.isInteger(result!.offsetX)).toBe(true);
      expect(Number.isInteger(result!.offsetY)).toBe(true);
      expect(Number.isInteger(result!.width)).toBe(true);
      expect(Number.isInteger(result!.height)).toBe(true);
    });
  });
});
