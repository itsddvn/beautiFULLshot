// CanvasEditor - Main canvas component with zoom/pan support

import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvas-store';
import { useImage } from '../../hooks/use-image';
import { ZOOM } from '../../constants/canvas';

export function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    imageUrl,
    stageWidth,
    stageHeight,
    scale,
    position,
    setStageSize,
    setScale,
    setPosition,
  } = useCanvasStore();

  const [image] = useImage(imageUrl || '');

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight
        );
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStageSize]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0
      ? oldScale * ZOOM.FACTOR
      : oldScale / ZOOM.FACTOR;

    const clampedScale = Math.max(ZOOM.MIN_SCALE, Math.min(ZOOM.MAX_SCALE, newScale));

    setScale(clampedScale);
    setPosition(
      pointer.x - mousePointTo.x * clampedScale,
      pointer.y - mousePointTo.y * clampedScale
    );
  }, [scale, position, setScale, setPosition]);

  // Pan with drag
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition(e.target.x(), e.target.y());
  }, [setPosition]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 overflow-hidden"
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
            />
          )}
        </Layer>
        {/* Annotation layer will be added in Phase 04 */}
        <Layer name="annotations" />
      </Stage>
    </div>
  );
}
