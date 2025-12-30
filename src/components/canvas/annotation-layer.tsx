// AnnotationLayer - Renders all annotations with Transformer support

import { useRef, useEffect } from 'react';
import { Layer, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useBackgroundStore } from '../../stores/background-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { ANNOTATION_DEFAULTS } from '../../constants/annotations';
import { logger } from '../../utils/logger';
import type { Annotation } from '../../types/annotations';
import { RectShape } from './annotations/rect-shape';
import { EllipseShape } from './annotations/ellipse-shape';
import { ArrowShape } from './annotations/arrow-shape';
import { FreehandShape } from './annotations/freehand-shape';
import { TextShape } from './annotations/text-shape';
import { SpotlightShape } from './annotations/spotlight-shape';

interface AnnotationLayerProps {
  offsetX?: number;
  offsetY?: number;
}

export function AnnotationLayer({ offsetX = 0, offsetY = 0 }: AnnotationLayerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const { annotations, selectedId } = useAnnotationStore();
  const { originalWidth, originalHeight } = useCanvasStore();
  const { getPaddingPx } = useBackgroundStore();
  const padding = getPaddingPx(originalWidth, originalHeight);

  // Total offset includes aspect ratio extension offset + padding
  const totalOffsetX = offsetX + padding;
  const totalOffsetY = offsetY + padding;

  // Attach transformer to selected shape with cleanup
  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;

    if (!transformer || !layer) return;

    if (selectedId) {
      const node = layer.findOne(`#${selectedId}`);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
    }

    // Cleanup: detach nodes on unmount or selection change
    return () => {
      if (transformer) {
        transformer.nodes([]);
      }
    };
  }, [selectedId]);

  const renderAnnotation = (annotation: Annotation): React.ReactNode => {
    switch (annotation.type) {
      case 'rectangle':
        return <RectShape key={annotation.id} annotation={annotation} />;
      case 'ellipse':
        return <EllipseShape key={annotation.id} annotation={annotation} />;
      case 'line':
      case 'arrow':
        return <ArrowShape key={annotation.id} annotation={annotation} />;
      case 'freehand':
        return <FreehandShape key={annotation.id} annotation={annotation} />;
      case 'text':
        return <TextShape key={annotation.id} annotation={annotation} />;
      case 'spotlight':
        return <SpotlightShape key={annotation.id} annotation={annotation} />;
      default: {
        // Exhaustiveness check - TypeScript will error if a case is missed
        const _exhaustive: never = annotation;
        logger.warn('Unknown annotation type encountered', {
          context: 'AnnotationLayer',
          data: _exhaustive,
        });
        return null;
      }
    }
  };

  return (
    <Layer ref={layerRef}>
      {/* Offset annotations by aspect ratio extension + padding to align with image */}
      <Group x={totalOffsetX} y={totalOffsetY}>
        {annotations.map(renderAnnotation)}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraint
            const minSize = ANNOTATION_DEFAULTS.TRANSFORMER.MIN_SIZE;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]}
        />
      </Group>
    </Layer>
  );
}
