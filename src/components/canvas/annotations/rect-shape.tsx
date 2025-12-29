// RectShape - Rectangle annotation component

import { Rect } from 'react-konva';
import type { RectAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';
import { useTransformHandler } from '../../../hooks/use-transform-handler';

interface Props {
  annotation: RectAnnotation;
}

export function RectShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();
  const handleTransformEnd = useTransformHandler(annotation.id, 'rect');

  return (
    <Rect
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      width={annotation.width}
      height={annotation.height}
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
