// CropOverlay - Non-destructive crop selection with aspect ratio support

import { useRef, useEffect } from 'react';
import { Rect, Transformer, Group, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCropStore } from '../../stores/crop-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { useBackgroundStore } from '../../stores/background-store';

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
  const padding = getPaddingPx(originalWidth, originalHeight);

  // Total offset includes aspect ratio extension offset + padding
  const totalOffsetX = offsetX + padding;
  const totalOffsetY = offsetY + padding;

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

  if (!isCropping || originalWidth === 0) return null;

  // Default crop rect: 80% of image centered
  const defaultRect = cropRect || {
    x: originalWidth * 0.1,
    y: originalHeight * 0.1,
    width: originalWidth * 0.8,
    height: originalHeight * 0.8,
  };

  return (
    <Layer>
      {/* Offset by aspect ratio extension + padding to align with image */}
      <Group x={totalOffsetX} y={totalOffsetY}>
        {/* Dimmed overlay outside crop area */}
        <Rect
          x={0}
          y={0}
          width={originalWidth}
          height={originalHeight}
          fill="rgba(0,0,0,0.5)"
          listening={false}
        />

        {/* Crop selection rectangle - not draggable, only resizable via handles */}
        <Rect
          ref={rectRef}
          x={defaultRect.x}
          y={defaultRect.y}
          width={defaultRect.width}
          height={defaultRect.height}
          fill="transparent"
          stroke="white"
          strokeWidth={2}
          dash={[10, 5]}
          draggable={false}
          onTransformEnd={(e) => {
            const node = e.target;
            setCropRect({
              x: node.x(),
              y: node.y(),
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
            });
            node.scaleX(1);
            node.scaleY(1);
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
            // boundBoxFunc receives absolute stage coordinates
            // Group is at (totalOffsetX, totalOffsetY), so image bounds in stage coords are:
            // x: [totalOffsetX, totalOffsetX + originalWidth]
            // y: [totalOffsetY, totalOffsetY + originalHeight]
            const minX = totalOffsetX;
            const minY = totalOffsetY;
            const maxX = totalOffsetX + originalWidth;
            const maxY = totalOffsetY + originalHeight;

            let { x, y, width, height } = newBox;

            // Clamp left edge
            if (x < minX) {
              const overflow = minX - x;
              x = minX;
              width -= overflow;
            }

            // Clamp top edge
            if (y < minY) {
              const overflow = minY - y;
              y = minY;
              height -= overflow;
            }

            // Clamp right edge
            if (x + width > maxX) {
              width = maxX - x;
            }

            // Clamp bottom edge
            if (y + height > maxY) {
              height = maxY - y;
            }

            // Enforce aspect ratio if set
            if (aspectRatio !== null) {
              const targetRatio = aspectRatio;
              if (width / height > targetRatio) {
                height = width / targetRatio;
                // Re-check bottom bound after aspect ratio adjustment
                if (y + height > maxY) {
                  height = maxY - y;
                  width = height * targetRatio;
                }
              } else {
                width = height * targetRatio;
                // Re-check right bound after aspect ratio adjustment
                if (x + width > maxX) {
                  width = maxX - x;
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
