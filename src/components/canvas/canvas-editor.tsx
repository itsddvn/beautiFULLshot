// CanvasEditor - Main canvas component with zoom/pan and annotation support

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Rect, Ellipse, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../stores/canvas-store';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useBackgroundStore } from '../../stores/background-store';
import { useExportStore } from '../../stores/export-store';
import { useImage } from '../../hooks/use-image';
import { useDrawing } from '../../hooks/use-drawing';
import { ZOOM } from '../../constants/canvas';
import { calculateAspectRatioExtend } from '../../utils/export-utils';
import { AnnotationLayer } from './annotation-layer';
import { BackgroundLayer } from './background-layer';
import { CropOverlay } from './crop-overlay';
import { TextInputOverlay } from './text-input-overlay';
import { ANNOTATION_DEFAULTS } from '../../constants/annotations';

export function CanvasEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    imageUrl,
    originalWidth,
    originalHeight,
    stageWidth,
    stageHeight,
    scale,
    position,
    setStageRef,
    setStageSize,
    setScale,
    setPosition,
    initHistoryCallbacks,
  } = useCanvasStore();

  const { currentTool, strokeColor, fillColor, strokeWidth } = useAnnotationStore();
  const { getPaddingPx, shadowBlur, cornerRadius } = useBackgroundStore();
  const { outputAspectRatio } = useExportStore();
  const padding = getPaddingPx(originalWidth, originalHeight);
  const [image] = useImage(imageUrl || '');
  const {
    preview,
    textInputPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
    submitText,
    cancelTextInput,
  } = useDrawing();

  // Calculate canvas dimensions with aspect ratio extension
  const baseCanvasWidth = originalWidth + padding * 2;
  const baseCanvasHeight = originalHeight + padding * 2;

  // Get extended dimensions based on output aspect ratio
  const aspectExtension = useMemo(() => {
    if (!originalWidth || !originalHeight) return null;
    return calculateAspectRatioExtend(baseCanvasWidth, baseCanvasHeight, outputAspectRatio);
  }, [baseCanvasWidth, baseCanvasHeight, outputAspectRatio, originalWidth, originalHeight]);

  // Final canvas dimensions (extended or base)
  const canvasWidth = aspectExtension?.width || baseCanvasWidth;
  const canvasHeight = aspectExtension?.height || baseCanvasHeight;

  // Offset for centering content when aspect ratio extends the canvas
  const contentOffsetX = aspectExtension?.offsetX || 0;
  const contentOffsetY = aspectExtension?.offsetY || 0;

  // Determine if stage should be draggable (only in select mode)
  const isDraggable = currentTool === 'select';

  // Register stageRef in store for export panel access
  useEffect(() => {
    setStageRef(stageRef);
  }, [setStageRef]);

  // Initialize history callbacks for undo/redo of image state
  useEffect(() => {
    initHistoryCallbacks();
  }, [initHistoryCallbacks]);

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
      className="h-full w-full bg-gray-100 dark:bg-gray-800 overflow-hidden"
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        {/* Background layer - renders at full extended canvas size */}
        <Layer>
          <BackgroundLayer
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
          {/* Content group - offset to center when aspect ratio extends canvas */}
          <Group x={contentOffsetX} y={contentOffsetY} listening={false}>
            {image && (
              <Group
                x={padding}
                y={padding}
                listening={false}
                clipFunc={cornerRadius > 0 ? (ctx) => {
                  const w = originalWidth;
                  const h = originalHeight;
                  const r = Math.min(cornerRadius, w / 2, h / 2);
                  ctx.beginPath();
                  ctx.moveTo(r, 0);
                  ctx.lineTo(w - r, 0);
                  ctx.quadraticCurveTo(w, 0, w, r);
                  ctx.lineTo(w, h - r);
                  ctx.quadraticCurveTo(w, h, w - r, h);
                  ctx.lineTo(r, h);
                  ctx.quadraticCurveTo(0, h, 0, h - r);
                  ctx.lineTo(0, r);
                  ctx.quadraticCurveTo(0, 0, r, 0);
                  ctx.closePath();
                } : undefined}
              >
                <KonvaImage
                  image={image}
                  x={0}
                  y={0}
                  shadowColor="rgba(0, 0, 0, 0.8)"
                  shadowBlur={shadowBlur * 1.5}
                  shadowOffset={{ x: 0, y: shadowBlur / 3 }}
                  shadowOpacity={shadowBlur > 0 ? 0.8 : 0}
                  listening={false}
                />
              </Group>
            )}
          </Group>
        </Layer>
        {/* Annotation layer - also offset by aspect ratio extension */}
        <AnnotationLayer offsetX={contentOffsetX} offsetY={contentOffsetY} />
        {/* Preview layer for real-time drawing feedback */}
        {preview && (
          <Layer>
            <Group x={contentOffsetX + padding} y={contentOffsetY + padding}>
              {preview.type === 'rectangle' && (
                <Rect
                  x={Math.min(preview.startX, preview.currentX)}
                  y={Math.min(preview.startY, preview.currentY)}
                  width={Math.abs(preview.currentX - preview.startX)}
                  height={Math.abs(preview.currentY - preview.startY)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {preview.type === 'ellipse' && (
                <Ellipse
                  x={(preview.startX + preview.currentX) / 2}
                  y={(preview.startY + preview.currentY) / 2}
                  radiusX={Math.abs(preview.currentX - preview.startX) / 2}
                  radiusY={Math.abs(preview.currentY - preview.startY) / 2}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {preview.type === 'line' && (
                <Line
                  points={[preview.startX, preview.startY, preview.currentX, preview.currentY]}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {preview.type === 'arrow' && (
                <Arrow
                  points={[preview.startX, preview.startY, preview.currentX, preview.currentY]}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  pointerLength={ANNOTATION_DEFAULTS.ARROW.POINTER_LENGTH}
                  pointerWidth={ANNOTATION_DEFAULTS.ARROW.POINTER_WIDTH}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              {preview.type === 'freehand' && preview.points && (
                <Line
                  points={preview.points}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              )}
              {preview.type === 'spotlight' && (
                <Rect
                  x={Math.min(preview.startX, preview.currentX)}
                  y={Math.min(preview.startY, preview.currentY)}
                  width={Math.abs(preview.currentX - preview.startX)}
                  height={Math.abs(preview.currentY - preview.startY)}
                  fill="rgba(255,255,255,0.3)"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
            </Group>
          </Layer>
        )}
        <CropOverlay offsetX={contentOffsetX} offsetY={contentOffsetY} />
      </Stage>
      {/* Text input overlay - positioned over canvas */}
      {textInputPos && (
        <TextInputOverlay
          position={textInputPos}
          padding={padding}
          scale={scale}
          stagePosition={position}
          offsetX={contentOffsetX}
          offsetY={contentOffsetY}
          onSubmit={submitText}
          onCancel={cancelTextInput}
        />
      )}
    </div>
  );
}
