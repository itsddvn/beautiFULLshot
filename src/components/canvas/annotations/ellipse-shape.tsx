// EllipseShape - Ellipse annotation component

import { Ellipse } from 'react-konva';
import type { EllipseAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';
import { useTransformHandler } from '../../../hooks/use-transform-handler';

interface Props {
  annotation: EllipseAnnotation;
}

export function EllipseShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();
  const handleTransformEnd = useTransformHandler(annotation.id, 'ellipse', {
    radiusX: annotation.radiusX,
    radiusY: annotation.radiusY,
  });

  return (
    <Ellipse
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      radiusX={annotation.radiusX}
      radiusY={annotation.radiusY}
      fill={annotation.fill}
      stroke={annotation.stroke}
      strokeWidth={annotation.strokeWidth}
      rotation={annotation.rotation}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onTap={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={handleTransformEnd}
    />
  );
}
