// CanvasEditor - Main canvas component with zoom/pan and annotation support

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
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
import { TextEditOverlay } from './text-edit-overlay';
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
  const { getPaddingPx, shadowBlur, cornerRadius, borderWidth, borderColor, borderOpacity } = useBackgroundStore();
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

  // Track if dragging on empty area (not on annotation)
  // Use ref for immediate value (stage draggable) + state for cursor re-render
  const isDraggingRef = useRef(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);


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

  // Note: Stage draggable is controlled via Konva API in mouse handlers
  // to allow immediate response (React state is async)

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

  // Check if click target is an annotation or transformer
  const isAnnotationTarget = useCallback((target: Konva.Node | null): boolean => {
    if (!target) return false;

    // Stage itself is not an annotation
    if (target === stageRef.current) return false;

    // Walk up the parent chain to check if any node is draggable (annotation)
    // or is a Transformer anchor
    let node: Konva.Node | null = target;
    while (node && node !== stageRef.current) {
      // Check if it's a draggable shape (annotation) with an id
      if (node.draggable() && node.id()) {
        return true;
      }
      // Check for Transformer class name
      const className = node.getClassName();
      if (className === 'Transformer' || (className === 'Rect' && node.name()?.includes('anchor'))) {
        return true;
      }
      node = node.parent;
    }
    return false;
  }, []);

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

  // Handle stage mouse down - enable canvas drag if clicking empty area
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const tool = useAnnotationStore.getState().currentTool;
      // Only in select mode
      if (tool !== 'select') {
        handleMouseDown(e);
        return;
      }

      // Check if clicking on annotation
      const clickedOnAnnotation = isAnnotationTarget(e.target);
      const shouldDragCanvas = !clickedOnAnnotation;

      // Set stage draggable immediately via Konva API
      const stage = stageRef.current;
      if (stage) {
        stage.draggable(shouldDragCanvas);
      }

      // Update ref and state
      isDraggingRef.current = shouldDragCanvas;
      setIsDraggingCanvas(shouldDragCanvas);

      // Still call the drawing handler
      handleMouseDown(e);
    },
    [isAnnotationTarget, handleMouseDown]
  );

  // Handle stage mouse up - disable canvas drag
  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Disable stage draggable via Konva API
      const stage = stageRef.current;
      if (stage) {
        stage.draggable(false);
      }

      isDraggingRef.current = false;
      setIsDraggingCanvas(false);
      handleMouseUp(e);
    },
    [handleMouseUp]
  );

  // Pan with drag (only when draggable)
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (isDraggingRef.current) {
        setPosition(e.target.x(), e.target.y());
      }

      // Disable stage draggable via Konva API
      const stage = stageRef.current;
      if (stage) {
        stage.draggable(false);
      }

      isDraggingRef.current = false;
      setIsDraggingCanvas(false);
    },
    [setPosition]
  );

  // Cursor style based on current tool and drag state
  const getCursorStyle = () => {
    // Show grab cursor when dragging canvas
    if (isDraggingCanvas) return 'grabbing';
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
        draggable={false}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
      >
        {/* Background layer - renders at full extended canvas size */}
        <Layer>
          <BackgroundLayer
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
          {/* Content group - offset to center when aspect ratio extends canvas */}
          <Group x={contentOffsetX} y={contentOffsetY}>
            {image && (
              <Group>
                {/* Shadow layer - shadow starts from outside border */}
                {shadowBlur > 0 && (
                  <Group
                    clipFunc={(ctx) => {
                      const outerSize = Math.max(originalWidth, originalHeight) + padding * 2 + shadowBlur * 2;
                      const bw = borderWidth;
                      const cr = cornerRadius + bw;
                      const x = padding - bw;
                      const y = padding - bw;
                      const w = originalWidth + bw * 2;
                      const h = originalHeight + bw * 2;

                      // Draw outer rect (large area) - winding order matters for clip
                      ctx.moveTo(-outerSize, -outerSize);
                      ctx.lineTo(outerSize * 2, -outerSize);
                      ctx.lineTo(outerSize * 2, outerSize * 2);
                      ctx.lineTo(-outerSize, outerSize * 2);
                      ctx.closePath();

                      // Cut out inner area (image + border) with rounded corners - opposite winding
                      ctx.moveTo(x + cr, y);
                      ctx.arcTo(x, y, x, y + cr, cr);
                      ctx.lineTo(x, y + h - cr);
                      ctx.arcTo(x, y + h, x + cr, y + h, cr);
                      ctx.lineTo(x + w - cr, y + h);
                      ctx.arcTo(x + w, y + h, x + w, y + h - cr, cr);
                      ctx.lineTo(x + w, y + cr);
                      ctx.arcTo(x + w, y, x + w - cr, y, cr);
                      ctx.closePath();
                    }}
                  >
                    <Rect
                      x={padding - borderWidth}
                      y={padding - borderWidth}
                      width={originalWidth + borderWidth * 2}
                      height={originalHeight + borderWidth * 2}
                      fill="#000"
                      cornerRadius={cornerRadius + borderWidth}
                      shadowColor="rgba(0, 0, 0, 0.6)"
                      shadowBlur={shadowBlur * 0.6}
                      shadowOffset={{ x: shadowBlur * -0.3, y: shadowBlur * 0.8 }}
                      shadowOpacity={0.8}
                      listening={false}
                    />
                  </Group>
                )}
                {/* Image */}
                <KonvaImage
                  image={image}
                  x={padding}
                  y={padding}
                  cornerRadius={cornerRadius}
                  listening={false}
                />
                {/* Border rect - drawn outside the image */}
                {borderWidth > 0 && (
                  <Rect
                    x={padding - borderWidth / 2}
                    y={padding - borderWidth / 2}
                    width={originalWidth + borderWidth}
                    height={originalHeight + borderWidth}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    cornerRadius={cornerRadius + borderWidth / 2}
                    opacity={borderOpacity / 100}
                    listening={false}
                  />
                )}
              </Group>
            )}
          </Group>
        </Layer>
        {/* Annotation layer - also offset by aspect ratio extension */}
        <AnnotationLayer offsetX={contentOffsetX} offsetY={contentOffsetY} />
        <CropOverlay offsetX={contentOffsetX} offsetY={contentOffsetY} />
        {/* Drawing preview layer */}
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
      </Stage>
      {/* Text input overlay - positioned over canvas */}
      {textInputPos && (
        <TextInputOverlay
          position={textInputPos}
          scale={scale}
          onSubmit={submitText}
          onCancel={cancelTextInput}
        />
      )}
      {/* Text edit overlay - for editing existing text annotations */}
      <TextEditOverlay />
    </div>
  );
}
