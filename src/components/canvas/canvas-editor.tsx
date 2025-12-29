// CanvasEditor - Main canvas component with zoom/pan and annotation support

import { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvas-store';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useBackgroundStore } from '../../stores/background-store';
import { useImage } from '../../hooks/use-image';
import { useDrawing } from '../../hooks/use-drawing';
import { ZOOM } from '../../constants/canvas';
import { AnnotationLayer } from './annotation-layer';
import { BackgroundLayer } from './background-layer';
import { CropOverlay } from './crop-overlay';

export function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    imageUrl,
    stageWidth,
    stageHeight,
    scale,
    position,
    setStageRef,
    setStageSize,
    setScale,
    setPosition,
  } = useCanvasStore();

  const { currentTool } = useAnnotationStore();
  const { padding } = useBackgroundStore();
  const [image] = useImage(imageUrl || '');
  const { handleMouseDown, handleMouseUp, handleStageClick } = useDrawing();

  // Determine if stage should be draggable (only in select mode)
  const isDraggable = currentTool === 'select';

  // Register stageRef in store for export panel access
  useEffect(() => {
    setStageRef(stageRef);
  }, [setStageRef]);

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
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
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
      const newScale =
        direction > 0 ? oldScale * ZOOM.FACTOR : oldScale / ZOOM.FACTOR;

      const clampedScale = Math.max(
        ZOOM.MIN_SCALE,
        Math.min(ZOOM.MAX_SCALE, newScale)
      );

      setScale(clampedScale);
      setPosition(
        pointer.x - mousePointTo.x * clampedScale,
        pointer.y - mousePointTo.y * clampedScale
      );
    },
    [scale, position, setScale, setPosition]
  );

  // Pan with drag (only when draggable)
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (isDraggable) {
        setPosition(e.target.x(), e.target.y());
      }
    },
    [setPosition, isDraggable]
  );

  // Cursor style based on current tool
  const getCursorStyle = () => {
    if (currentTool === 'select') return 'default';
    if (currentTool === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-100 overflow-hidden"
      style={{ cursor: getCursorStyle() }}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={isDraggable}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        {/* Background layer (gradient/solid/transparent) */}
        <Layer>
          <BackgroundLayer />
          {image && <KonvaImage image={image} x={padding} y={padding} />}
        </Layer>
        <AnnotationLayer />
        <CropOverlay />
      </Stage>
    </div>
  );
}
