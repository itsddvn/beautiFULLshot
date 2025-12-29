// useTransformHandler - Shared transform logic for annotation shapes

import { useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';
import { ANNOTATION_DEFAULTS } from '../constants/annotations';
import type { Annotation } from '../types/annotations';

type ShapeType = 'rect' | 'ellipse' | 'text' | 'spotlight';

interface ShapeContext {
  radiusX?: number;
  radiusY?: number;
  fontSize?: number;
}

/**
 * Shared hook for handling shape transformation (resize/rotate)
 * Reduces code duplication across shape components
 */
export function useTransformHandler(
  annotationId: string,
  shapeType: ShapeType,
  context?: ShapeContext
) {
  const { updateAnnotation } = useAnnotationStore();

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const updates: Partial<Annotation> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      // Shape-specific updates
      switch (shapeType) {
        case 'rect':
          Object.assign(updates, {
            width: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SHAPE_SIZE,
              node.width() * node.scaleX()
            ),
            height: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SHAPE_SIZE,
              node.height() * node.scaleY()
            ),
          });
          break;

        case 'ellipse':
          Object.assign(updates, {
            radiusX: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SHAPE_SIZE,
              (context?.radiusX ?? 50) * node.scaleX()
            ),
            radiusY: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SHAPE_SIZE,
              (context?.radiusY ?? 50) * node.scaleY()
            ),
          });
          break;

        case 'text':
          Object.assign(updates, {
            fontSize: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_FONT_SIZE,
              (context?.fontSize ?? 16) * node.scaleY()
            ),
          });
          break;

        case 'spotlight':
          Object.assign(updates, {
            width: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SPOTLIGHT_SIZE,
              node.width() * node.scaleX()
            ),
            height: Math.max(
              ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SPOTLIGHT_SIZE,
              node.height() * node.scaleY()
            ),
          });
          break;
      }

      updateAnnotation(annotationId, updates);

      // Reset scale after applying to dimensions
      node.scaleX(1);
      node.scaleY(1);
    },
    [annotationId, shapeType, context?.radiusX, context?.radiusY, context?.fontSize, updateAnnotation]
  );

  return handleTransformEnd;
}
