// SpotlightShape - Spotlight/dimming effect annotation component

import { Group, Rect, Shape } from 'react-konva';
import type { SpotlightAnnotation } from '../../../types/annotations';
import { useCanvasStore } from '../../../stores/canvas-store';
import { useBackgroundStore } from '../../../stores/background-store';
import { useAnnotationStore } from '../../../stores/annotation-store';
import { useTransformHandler } from '../../../hooks/use-transform-handler';
import { ANNOTATION_DEFAULTS, CANVAS_FALLBACK } from '../../../constants/annotations';

interface Props {
  annotation: SpotlightAnnotation;
}

export function SpotlightShape({ annotation }: Props) {
  const { originalWidth, originalHeight, stageWidth, stageHeight } = useCanvasStore();
  const { cornerRadius } = useBackgroundStore();
  const { updateAnnotation, setSelected } = useAnnotationStore();
  const handleTransformEnd = useTransformHandler(annotation.id, 'spotlight');

  // Use actual stage dimensions, then original image, then fallback
  const canvasWidth = originalWidth || stageWidth || CANVAS_FALLBACK.WIDTH;
  const canvasHeight = originalHeight || stageHeight || CANVAS_FALLBACK.HEIGHT;

  return (
    <Group>
      {/* Dimmed overlay with cutout - respects image corner radius */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();

          // Draw rounded rectangle for canvas (matching image corner radius)
          if (cornerRadius > 0) {
            const r = cornerRadius;
            ctx.moveTo(r, 0);
            ctx.lineTo(canvasWidth - r, 0);
            ctx.arcTo(canvasWidth, 0, canvasWidth, r, r);
            ctx.lineTo(canvasWidth, canvasHeight - r);
            ctx.arcTo(canvasWidth, canvasHeight, canvasWidth - r, canvasHeight, r);
            ctx.lineTo(r, canvasHeight);
            ctx.arcTo(0, canvasHeight, 0, canvasHeight - r, r);
            ctx.lineTo(0, r);
            ctx.arcTo(0, 0, r, 0, r);
          } else {
            // No corner radius - use simple rectangle
            ctx.rect(0, 0, canvasWidth, canvasHeight);
          }

          // Cutout (spotlight area) - uses even-odd fill rule
          if (annotation.shape === 'ellipse') {
            ctx.ellipse(
              annotation.x + annotation.width / 2,
              annotation.y + annotation.height / 2,
              annotation.width / 2,
              annotation.height / 2,
              0,
              0,
              Math.PI * 2,
              true
            );
          } else {
            // Rectangle cutout - draw counter-clockwise
            ctx.moveTo(annotation.x, annotation.y);
            ctx.lineTo(annotation.x, annotation.y + annotation.height);
            ctx.lineTo(annotation.x + annotation.width, annotation.y + annotation.height);
            ctx.lineTo(annotation.x + annotation.width, annotation.y);
            ctx.closePath();
          }
          ctx.fillStrokeShape(shape);
        }}
        fill={ANNOTATION_DEFAULTS.SPOTLIGHT.DIMMED_COLOR}
        listening={false}
      />

      {/* Invisible draggable handle for the spotlight area */}
      <Rect
        id={annotation.id}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        fill="rgba(255,255,255,0.01)"
        stroke="white"
        strokeWidth={2}
        dash={[5, 5]}
        draggable={annotation.draggable}
        onClick={(e) => {
          e.cancelBubble = true;
          setSelected(annotation.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          setSelected(annotation.id);
        }}
        onDragEnd={(e) => {
          updateAnnotation(annotation.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={handleTransformEnd}
      />
    </Group>
  );
}
