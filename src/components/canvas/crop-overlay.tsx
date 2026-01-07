// CropOverlay - Non-destructive crop selection with aspect ratio support

import { useRef, useEffect, useCallback } from 'react';
import { Rect, Transformer, Group, Layer, Shape } from 'react-konva';
import type Konva from 'konva';
import { useCropStore } from '../../stores/crop-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { useBackgroundStore } from '../../stores/background-store';
import { useExportStore } from '../../stores/export-store';

// Minimum crop size
const MIN_CROP_SIZE = 50;

interface CropOverlayProps {
  offsetX?: number;
  offsetY?: number;
}

export function CropOverlay({ offsetX = 0, offsetY = 0 }: CropOverlayProps) {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Use selectors for proper Zustand 5.0 subscription
  const isCropping = useCropStore((state) => state.isCropping);
  const cropRect = useCropStore((state) => state.cropRect);
  const aspectRatio = useCropStore((state) => state.aspectRatio);
  const setCropRect = useCropStore((state) => state.setCropRect);
  const originalWidth = useCanvasStore((state) => state.originalWidth);
  const originalHeight = useCanvasStore((state) => state.originalHeight);
  const getPaddingPx = useBackgroundStore((state) => state.getPaddingPx);
  const isExporting = useExportStore((state) => state.isExporting);
  const padding = getPaddingPx(originalWidth, originalHeight);

  // Total offset includes aspect ratio extension offset + padding
  const totalOffsetX = offsetX + padding;
  const totalOffsetY = offsetY + padding;

  // Default crop rect: 80% of image centered
  const currentRect = cropRect || {
    x: originalWidth * 0.1,
    y: originalHeight * 0.1,
    width: originalWidth * 0.8,
    height: originalHeight * 0.8,
  };

  // Attach transformer to crop rect
  useEffect(() => {
    if (isCropping && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }

    return () => {
      if (trRef.current) {
        trRef.current.nodes([]);
      }
    };
  }, [isCropping]);

  // Sync rectRef position when cropRect changes externally
  useEffect(() => {
    if (rectRef.current && cropRect) {
      rectRef.current.position({ x: cropRect.x, y: cropRect.y });
      rectRef.current.size({ width: cropRect.width, height: cropRect.height });
      rectRef.current.getLayer()?.batchDraw();
    }
  }, [cropRect]);

  // Handle drag to move crop area
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      let x = node.x();
      let y = node.y();
      const width = node.width();
      const height = node.height();

      // Constrain to image bounds
      x = Math.max(0, Math.min(originalWidth - width, x));
      y = Math.max(0, Math.min(originalHeight - height, y));

      node.position({ x, y });
    },
    [originalWidth, originalHeight]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      setCropRect({
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
      });
    },
    [setCropRect]
  );

  // Hide overlay when not cropping, no image, or during export
  if (!isCropping || originalWidth === 0 || isExporting) return null;

  return (
    <Layer>
      {/* Offset by aspect ratio extension + padding to align with image */}
      <Group x={totalOffsetX} y={totalOffsetY}>
        {/* Dimmed overlay with cutout for crop area */}
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            // Outer rectangle (full image)
            ctx.rect(0, 0, originalWidth, originalHeight);
            // Inner rectangle (crop area) - counter-clockwise for cutout
            ctx.moveTo(currentRect.x, currentRect.y);
            ctx.lineTo(currentRect.x, currentRect.y + currentRect.height);
            ctx.lineTo(currentRect.x + currentRect.width, currentRect.y + currentRect.height);
            ctx.lineTo(currentRect.x + currentRect.width, currentRect.y);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
          }}
          fill="rgba(0,0,0,0.5)"
          listening={false}
        />

        {/* Crop selection rectangle - draggable and resizable */}
        <Rect
          ref={rectRef}
          x={currentRect.x}
          y={currentRect.y}
          width={currentRect.width}
          height={currentRect.height}
          fill="transparent"
          stroke="white"
          strokeWidth={2}
          dash={[10, 5]}
          draggable={true}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransformEnd={(e) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // Reset scale and apply to dimensions
            node.scaleX(1);
            node.scaleY(1);

            // Calculate new dimensions
            let x = node.x();
            let y = node.y();
            let width = Math.max(MIN_CROP_SIZE, node.width() * scaleX);
            let height = Math.max(MIN_CROP_SIZE, node.height() * scaleY);

            // Clamp to image bounds - only count the part inside the image
            if (x < 0) {
              width += x; // Reduce width by the overflow
              x = 0;
            }
            if (y < 0) {
              height += y; // Reduce height by the overflow
              y = 0;
            }
            if (x + width > originalWidth) {
              width = originalWidth - x;
            }
            if (y + height > originalHeight) {
              height = originalHeight - y;
            }

            // Ensure minimum size after clamping
            width = Math.max(MIN_CROP_SIZE, width);
            height = Math.max(MIN_CROP_SIZE, height);

            // Update node position to match clamped values
            node.position({ x, y });
            node.size({ width, height });

            setCropRect({ x, y, width, height });
          }}
        />

        <Transformer
          ref={trRef}
          keepRatio={aspectRatio !== null}
          rotateEnabled={false}
          borderStroke="white"
          borderStrokeWidth={0}
          anchorStroke="#0ea5e9"
          anchorFill="white"
          anchorSize={10}
          anchorCornerRadius={2}
          boundBoxFunc={(oldBox, newBox) => {
            // boundBoxFunc receives coordinates relative to parent (the Group)
            // So bounds are simply [0, originalWidth] and [0, originalHeight]
            let { x, y, width, height } = newBox;

            // Clamp left edge (min x = 0)
            if (x < 0) {
              width += x; // x is negative, so this reduces width
              x = 0;
            }

            // Clamp top edge (min y = 0)
            if (y < 0) {
              height += y; // y is negative, so this reduces height
              y = 0;
            }

            // Clamp right edge
            if (x + width > originalWidth) {
              width = originalWidth - x;
            }

            // Clamp bottom edge
            if (y + height > originalHeight) {
              height = originalHeight - y;
            }

            // Enforce aspect ratio if set
            if (aspectRatio !== null) {
              const targetRatio = aspectRatio;
              if (width / height > targetRatio) {
                height = width / targetRatio;
                // Re-check bottom bound after aspect ratio adjustment
                if (y + height > originalHeight) {
                  height = originalHeight - y;
                  width = height * targetRatio;
                }
              } else {
                width = height * targetRatio;
                // Re-check right bound after aspect ratio adjustment
                if (x + width > originalWidth) {
                  width = originalWidth - x;
                  height = width / targetRatio;
                }
              }
            }

            // Enforce minimum size - reject if too small
            if (width < MIN_CROP_SIZE || height < MIN_CROP_SIZE) {
              return oldBox;
            }

            return { x, y, width, height, rotation: newBox.rotation };
          }}
        />
      </Group>
    </Layer>
  );
}
