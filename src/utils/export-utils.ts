// Export utilities - Konva stage export functions

import type Konva from 'konva';
import type { ExportFormat } from '../stores/export-store';
import { OUTPUT_ASPECT_RATIOS } from '../data/aspect-ratios';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  pixelRatio: number;
  cropRect?: { x: number; y: number; width: number; height: number } | null;
  outputAspectRatio?: string; // 'auto' or ratio id like '1:1', '16:9'
  canvasWidth?: number; // Total canvas width (image + padding)
  canvasHeight?: number; // Total canvas height (image + padding)
}

/**
 * Calculate extended canvas dimensions based on output aspect ratio.
 * EXTENDS the canvas (adds more background) to fit the ratio while keeping
 * the entire original content visible. Returns null for 'auto'.
 */
export function calculateAspectRatioExtend(
  canvasWidth: number,
  canvasHeight: number,
  aspectRatioId: string
): { width: number; height: number; offsetX: number; offsetY: number } | null {
  // Auto = no extension, use original canvas size
  if (aspectRatioId === 'auto' || !aspectRatioId) {
    return null;
  }

  const ratioConfig = OUTPUT_ASPECT_RATIOS.find((r) => r.id === aspectRatioId);
  if (!ratioConfig || ratioConfig.ratio === null) {
    return null;
  }

  const targetRatio = ratioConfig.ratio;
  const currentRatio = canvasWidth / canvasHeight;

  let newWidth: number;
  let newHeight: number;

  if (currentRatio > targetRatio) {
    // Canvas is wider than target - extend height (make taller)
    newWidth = canvasWidth;
    newHeight = canvasWidth / targetRatio;
  } else if (currentRatio < targetRatio) {
    // Canvas is taller than target - extend width (make wider)
    newHeight = canvasHeight;
    newWidth = canvasHeight * targetRatio;
  } else {
    // Already at target ratio
    return null;
  }

  // Calculate offset to center original content within extended canvas
  const offsetX = (newWidth - canvasWidth) / 2;
  const offsetY = (newHeight - canvasHeight) / 2;

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
  };
}

/**
 * Generate timestamped filename for exports
 */
export function generateFilename(format: ExportFormat): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .slice(0, 15);
  return `beautyshot_${timestamp}.${format}`;
}

/**
 * Export Konva stage to data URL
 * When aspect ratio is set, the stage is already extended - export full stage
 */
export function stageToDataURL(
  stage: Konva.Stage,
  options: ExportOptions
): string {
  const { format, quality, pixelRatio, cropRect } = options;

  const exportConfig: Parameters<typeof stage.toDataURL>[0] = {
    mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    quality: format === 'jpeg' ? quality : undefined,
    pixelRatio,
  };

  // If cropping (crop tool), export specific region
  if (cropRect) {
    exportConfig.x = cropRect.x;
    exportConfig.y = cropRect.y;
    exportConfig.width = cropRect.width;
    exportConfig.height = cropRect.height;
  }
  // Otherwise export full stage (aspect ratio extension is handled by canvas size)

  return stage.toDataURL(exportConfig);
}

/**
 * Export Konva stage to Blob (async)
 */
export function stageToBlob(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { format, quality, pixelRatio, cropRect } = options;

    const exportConfig: Parameters<typeof stage.toBlob>[0] = {
      mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality: format === 'jpeg' ? quality : undefined,
      pixelRatio,
      callback: (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from stage'));
        }
      },
    };

    if (cropRect) {
      exportConfig.x = cropRect.x;
      exportConfig.y = cropRect.y;
      exportConfig.width = cropRect.width;
      exportConfig.height = cropRect.height;
    }

    stage.toBlob(exportConfig);
  });
}

/**
 * Custom error for export operations
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Convert data URL to Uint8Array bytes for file saving
 * @throws ExportError if data URL is invalid or decoding fails
 */
export function dataURLToBytes(dataURL: string): Uint8Array {
  if (!dataURL || typeof dataURL !== 'string') {
    throw new ExportError('Invalid data URL: empty or not a string', 'INVALID_INPUT');
  }

  const parts = dataURL.split(',');
  if (parts.length !== 2) {
    throw new ExportError('Invalid data URL format: missing comma separator', 'INVALID_FORMAT');
  }

  const base64 = parts[1];
  if (!base64) {
    throw new ExportError('Invalid data URL: empty base64 content', 'EMPTY_CONTENT');
  }

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    throw new ExportError(
      `Failed to decode base64: ${e instanceof Error ? e.message : 'Unknown error'}`,
      'DECODE_ERROR'
    );
  }
}
