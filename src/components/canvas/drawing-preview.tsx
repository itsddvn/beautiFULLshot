// DrawingPreview - Shows preview shape while drawing

import { Rect, Ellipse, Line, Arrow } from 'react-konva';
import { ANNOTATION_DEFAULTS } from '../../constants/annotations';

interface PreviewRect {
  x: number;
  y: number;
  width: number;
  height: number;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}

interface DrawingPreviewProps {
  tool: string | null;
  previewRect: PreviewRect | null;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export function DrawingPreview({
  tool,
  previewRect,
  strokeColor,
  fillColor,
  strokeWidth,
}: DrawingPreviewProps) {
  if (!previewRect || !tool) return null;

  const { x, y, width, height, startPos, currentPos } = previewRect;

  // Common style for preview (slightly transparent)
  const previewOpacity = 0.6;

  switch (tool) {
    case 'rectangle':
      return (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={previewOpacity}
          listening={false}
          dash={[5, 5]}
        />
      );

    case 'ellipse':
      return (
        <Ellipse
          x={x + width / 2}
          y={y + height / 2}
          radiusX={width / 2}
          radiusY={height / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={previewOpacity}
          listening={false}
          dash={[5, 5]}
        />
      );

    case 'line':
      return (
        <Line
          points={[startPos.x, startPos.y, currentPos.x, currentPos.y]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={previewOpacity}
          listening={false}
          dash={[5, 5]}
        />
      );

    case 'arrow':
      return (
        <Arrow
          points={[startPos.x, startPos.y, currentPos.x, currentPos.y]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          pointerLength={ANNOTATION_DEFAULTS.ARROW.POINTER_LENGTH}
          pointerWidth={ANNOTATION_DEFAULTS.ARROW.POINTER_WIDTH}
          fill={strokeColor}
          opacity={previewOpacity}
          listening={false}
          dash={[5, 5]}
        />
      );

    case 'spotlight':
      return (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          stroke="#ffffff"
          strokeWidth={2}
          opacity={previewOpacity}
          listening={false}
          dash={[5, 5]}
        />
      );

    default:
      return null;
  }
}
