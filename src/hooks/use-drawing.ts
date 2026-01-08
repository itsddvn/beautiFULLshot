// useDrawing hook - Handles mouse events for creating annotations

import { useState, useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';
import { useBackgroundStore } from '../stores/background-store';
import { useCanvasStore } from '../stores/canvas-store';
import { useExportStore } from '../stores/export-store';
import { validateTextInput } from '../utils/sanitize';
import { ANNOTATION_DEFAULTS } from '../constants/annotations';
import { calculateAspectRatioExtend } from '../utils/export-utils';
import type {
  TextAnnotation,
  RectAnnotation,
  EllipseAnnotation,
  LineAnnotation,
  SpotlightAnnotation,
} from '../types/annotations';

interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}

export function useDrawing() {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
  });

  const {
    currentTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    addAnnotation,
    setTool,
  } = useAnnotationStore();

  // Get content offset (padding + aspect ratio extension offset)
  const getContentOffset = () => {
    const { originalWidth, originalHeight } = useCanvasStore.getState();
    const { outputAspectRatio } = useExportStore.getState();
    const padding = useBackgroundStore.getState().getPaddingPx(originalWidth, originalHeight);

    // Calculate aspect ratio extension offset
    const baseWidth = originalWidth + padding * 2;
    const baseHeight = originalHeight + padding * 2;
    const aspectExtension = calculateAspectRatioExtend(baseWidth, baseHeight, outputAspectRatio);

    const contentOffsetX = aspectExtension?.offsetX || 0;
    const contentOffsetY = aspectExtension?.offsetY || 0;

    return {
      padding,
      contentOffsetX,
      contentOffsetY,
    };
  };

  const getPointerPosition = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos || !stage) return null;

      // Adjust for stage transform (zoom/pan)
      const transform = stage.getAbsoluteTransform().copy().invert();
      const transformed = transform.point(pos);

      // Adjust for content offset (aspect ratio extension + padding)
      const { padding, contentOffsetX, contentOffsetY } = getContentOffset();
      return {
        x: transformed.x - contentOffsetX - padding,
        y: transformed.y - contentOffsetY - padding,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only handle left click and when using a drawing tool
      if (e.evt.button !== 0 || currentTool === 'select' || !currentTool) return;

      // Skip if clicking on existing shape
      const clickedOnEmpty = e.target === e.target.getStage();
      if (!clickedOnEmpty && e.target.name() !== 'background') return;

      const pos = getPointerPosition(e);
      if (!pos) return;

      // Click-to-place tools
      if (currentTool === 'text') {
        const rawText = prompt('Enter text:');
        const text = validateTextInput(rawText);
        if (text) {
          const textAnnotation: Omit<TextAnnotation, 'id'> = {
            type: 'text',
            x: pos.x,
            y: pos.y,
            text,
            fontSize,
            fontFamily,
            fill: strokeColor,
            rotation: 0,
            draggable: true,
          };
          addAnnotation(textAnnotation);
        }
        setTool('select');
        return;
      }

      // Drag-to-draw tools
      setState({ isDrawing: true, startPos: pos, currentPos: pos });
    },
    [
      currentTool,
      getPointerPosition,
      addAnnotation,
      strokeColor,
      fontSize,
      fontFamily,
      setTool,
    ]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!state.isDrawing || currentTool === 'select' || !currentTool) {
        setState((prev) => ({ ...prev, isDrawing: false }));
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) {
        setState((prev) => ({ ...prev, isDrawing: false }));
        return;
      }

      const { startPos } = state;
      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);

      // Ignore too small shapes
      const minSize = ANNOTATION_DEFAULTS.SHAPE.MIN_DRAW_SIZE;
      if (width < minSize && height < minSize) {
        setState((prev) => ({ ...prev, isDrawing: false }));
        return;
      }

      switch (currentTool) {
        case 'rectangle': {
          const rectAnnotation: Omit<RectAnnotation, 'id'> = {
            type: 'rectangle',
            x,
            y,
            width,
            height,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            rotation: 0,
            draggable: true,
          };
          addAnnotation(rectAnnotation);
          break;
        }

        case 'ellipse': {
          const ellipseAnnotation: Omit<EllipseAnnotation, 'id'> = {
            type: 'ellipse',
            x: x + width / 2,
            y: y + height / 2,
            radiusX: width / 2,
            radiusY: height / 2,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            rotation: 0,
            draggable: true,
          };
          addAnnotation(ellipseAnnotation);
          break;
        }

        case 'line':
        case 'arrow': {
          const lineAnnotation: Omit<LineAnnotation, 'id'> = {
            type: currentTool,
            x: 0,
            y: 0,
            points: [startPos.x, startPos.y, pos.x, pos.y],
            stroke: strokeColor,
            strokeWidth,
            pointerLength: ANNOTATION_DEFAULTS.ARROW.POINTER_LENGTH,
            pointerWidth: ANNOTATION_DEFAULTS.ARROW.POINTER_WIDTH,
            rotation: 0,
            draggable: true,
          };
          addAnnotation(lineAnnotation);
          break;
        }

        case 'spotlight': {
          const spotlightAnnotation: Omit<SpotlightAnnotation, 'id'> = {
            type: 'spotlight',
            x,
            y,
            width,
            height,
            shape: 'rectangle',
            rotation: 0,
            draggable: true,
          };
          addAnnotation(spotlightAnnotation);
          break;
        }
      }

      setState((prev) => ({ ...prev, isDrawing: false }));
    },
    [
      state.isDrawing,
      state.startPos,
      currentTool,
      getPointerPosition,
      addAnnotation,
      fillColor,
      strokeColor,
      strokeWidth,
    ]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!state.isDrawing) return;

      const pos = getPointerPosition(e);
      if (!pos) return;

      setState((prev) => ({ ...prev, currentPos: pos }));
    },
    [state.isDrawing, getPointerPosition]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect when clicking on empty area in select mode
      if (currentTool === 'select') {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          useAnnotationStore.getState().setSelected(null);
        }
      }
    },
    [currentTool]
  );

  // Calculate preview shape dimensions
  const getPreviewRect = () => {
    if (!state.isDrawing) return null;

    const { startPos, currentPos } = state;
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);

    return { x, y, width, height, startPos, currentPos };
  };

  return {
    isDrawing: state.isDrawing,
    currentTool,
    previewRect: getPreviewRect(),
    strokeColor,
    fillColor,
    strokeWidth,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
  };
}
