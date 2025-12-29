// ArrowShape - Line and Arrow annotation component

import { Arrow, Line } from 'react-konva';
import type { LineAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: LineAnnotation;
}

export function ArrowShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();
  const isArrow = annotation.type === 'arrow';

  const Component = isArrow ? Arrow : Line;

  return (
    <Component
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      points={annotation.points}
      stroke={annotation.stroke}
      strokeWidth={annotation.strokeWidth}
      pointerLength={isArrow ? annotation.pointerLength || 10 : undefined}
      pointerWidth={isArrow ? annotation.pointerWidth || 10 : undefined}
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
