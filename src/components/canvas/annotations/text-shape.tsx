// TextShape - Text annotation component with double-click editing

import { Text } from 'react-konva';
import type { TextAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';
import { useTransformHandler } from '../../../hooks/use-transform-handler';

interface Props {
  annotation: TextAnnotation;
}

export function TextShape({ annotation }: Props) {
  const { updateAnnotation, setSelected, setEditingTextId, editingTextId } = useAnnotationStore();
  const handleTransformEnd = useTransformHandler(annotation.id, 'text', {
    fontSize: annotation.fontSize,
  });

  // Hide text when editing (overlay will show input)
  if (editingTextId === annotation.id) {
    return null;
  }

  // Build fontStyle string for Konva (combines weight and style)
  const fontStyle = [
    annotation.fontWeight === 'bold' ? 'bold' : '',
    annotation.fontStyle === 'italic' ? 'italic' : '',
  ].filter(Boolean).join(' ') || 'normal';

  return (
    <Text
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      text={annotation.text}
      fontSize={annotation.fontSize}
      fontFamily={annotation.fontFamily}
      fontStyle={fontStyle}
      textDecoration={annotation.textDecoration !== 'none' ? annotation.textDecoration : ''}
      fill={annotation.fill}
      // Text effect: stroke (white outline) - width = 1/20 of fontSize
      stroke={annotation.stroke}
      strokeWidth={annotation.stroke ? Math.max(1, Math.round(annotation.fontSize / 20)) : undefined}
      // Draw fill AFTER stroke so fill appears on top of stroke outline
      fillAfterStrokeEnabled={!!annotation.stroke}
      rotation={annotation.rotation}
      draggable={annotation.draggable}
      onClick={(e) => {
        e.cancelBubble = true;
        setSelected(annotation.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelected(annotation.id);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        setEditingTextId(annotation.id);
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        setEditingTextId(annotation.id);
      }}
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
