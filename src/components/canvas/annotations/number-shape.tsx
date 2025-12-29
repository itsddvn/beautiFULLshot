// NumberShape - Numbered annotation component (circled number)

import { Circle, Text, Group } from 'react-konva';
import type { NumberAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: NumberAnnotation;
}

export function NumberShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();

  return (
    <Group
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onTap={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      <Circle radius={annotation.radius} fill={annotation.fill} />
      <Text
        text={String(annotation.number)}
        fontSize={annotation.fontSize}
        fill={annotation.textColor}
        x={-annotation.radius}
        y={-annotation.fontSize / 2}
        width={annotation.radius * 2}
        align="center"
      />
    </Group>
  );
}
