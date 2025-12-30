// useDrawing hook - Handles mouse events for creating annotations

import { useState, useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';
import { useBackgroundStore } from '../stores/background-store';
import { useCanvasStore } from '../stores/canvas-store';
import { validateTextInput } from '../utils/sanitize';
import { ANNOTATION_DEFAULTS } from '../constants/annotations';
import type {
  TextAnnotation,
  NumberAnnotation,
  RectAnnotation,
  EllipseAnnotation,
  LineAnnotation,
  SpotlightAnnotation,
} from '../types/annotations';

interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
}

export function useDrawing() {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    startPos: { x: 0, y: 0 },
  });

  const {
    currentTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    addAnnotation,
    incrementNumber,
    setTool,
  } = useAnnotationStore();

  // Get padding for position offset (uses image dimensions from canvas store)
  const getPadding = () => {
    const { originalWidth, originalHeight } = useCanvasStore.getState();
    return useBackgroundStore.getState().getPaddingPx(originalWidth, originalHeight);
  };

  const getPointerPosition = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos || !stage) return null;

      // Adjust for stage transform (zoom/pan)
      const transform = stage.getAbsoluteTransform().copy().invert();
      const transformed = transform.point(pos);

      // Adjust for padding offset (annotations are in a Group offset by padding)
      const padding = getPadding();
      return {
        x: transformed.x - padding,
        y: transformed.y - padding,
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

      if (currentTool === 'number') {
        const num = incrementNumber();
        const numberAnnotation: Omit<NumberAnnotation, 'id'> = {
          type: 'number',
          x: pos.x,
          y: pos.y,
          number: num,
          radius: ANNOTATION_DEFAULTS.NUMBER.RADIUS,
          fill: strokeColor,
          textColor: ANNOTATION_DEFAULTS.NUMBER.TEXT_COLOR,
          fontSize: ANNOTATION_DEFAULTS.NUMBER.FONT_SIZE,
          rotation: 0,
          draggable: true,
        };
        addAnnotation(numberAnnotation);
        return;
      }

      // Drag-to-draw tools
      setState({ isDrawing: true, startPos: pos });
    },
    [
      currentTool,
      getPointerPosition,
      addAnnotation,
      incrementNumber,
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

  return {
    isDrawing: state.isDrawing,
    handleMouseDown,
    handleMouseUp,
    handleStageClick,
  };
}
