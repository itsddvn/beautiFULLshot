// FreehandShape - Freehand drawing annotation component

import { Line } from 'react-konva';
import type { FreehandAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: FreehandAnnotation;
}

export function FreehandShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();

  return (
    <Line
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      points={annotation.points}
      stroke={annotation.stroke}
      strokeWidth={annotation.strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onTap={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    />
  );
}
