// useDrawing hook - Handles mouse events for creating annotations with real-time preview

import { useState, useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';
import { useBackgroundStore } from '../stores/background-store';
import { useCanvasStore } from '../stores/canvas-store';
import { ANNOTATION_DEFAULTS } from '../constants/annotations';
import type {
  RectAnnotation,
  EllipseAnnotation,
  LineAnnotation,
  FreehandAnnotation,
  TextAnnotation,
  SpotlightAnnotation,
} from '../types/annotations';

// Preview shape state for real-time feedback
export interface PreviewShape {
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'freehand' | 'spotlight';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points?: number[]; // For freehand
}

interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  preview: PreviewShape | null;
  freehandPoints: number[];
  textInputPos: { x: number; y: number } | null;
}

export function useDrawing() {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    preview: null,
    freehandPoints: [],
    textInputPos: null,
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

      // Text tool - show input position
      if (currentTool === 'text') {
        setState((prev) => ({
          ...prev,
          textInputPos: pos,
        }));
        return;
      }

      // Freehand tool - start collecting points
      if (currentTool === 'freehand') {
        setState({
          isDrawing: true,
          startPos: pos,
          preview: {
            type: 'freehand',
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            points: [pos.x, pos.y],
          },
          freehandPoints: [pos.x, pos.y],
          textInputPos: null,
        });
        return;
      }

      // Drag-to-draw tools - start with preview
      setState({
        isDrawing: true,
        startPos: pos,
        preview: {
          type: currentTool as PreviewShape['type'],
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
        },
        freehandPoints: [],
        textInputPos: null,
      });
    },
    [currentTool, getPointerPosition]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!state.isDrawing || currentTool === 'select' || !currentTool) return;

      const pos = getPointerPosition(e);
      if (!pos) return;

      // Update preview shape position
      if (currentTool === 'freehand') {
        const newPoints = [...state.freehandPoints, pos.x, pos.y];
        setState((prev) => ({
          ...prev,
          freehandPoints: newPoints,
          preview: prev.preview
            ? {
                ...prev.preview,
                currentX: pos.x,
                currentY: pos.y,
                points: newPoints,
              }
            : null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          preview: prev.preview
            ? {
                ...prev.preview,
                currentX: pos.x,
                currentY: pos.y,
              }
            : null,
        }));
      }
    },
    [state.isDrawing, state.freehandPoints, currentTool, getPointerPosition]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!state.isDrawing || currentTool === 'select' || !currentTool) {
        setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) {
        setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
        return;
      }

      const { startPos, freehandPoints } = state;

      // Handle freehand
      if (currentTool === 'freehand') {
        const finalPoints = [...freehandPoints, pos.x, pos.y];
        if (finalPoints.length >= 4) {
          const freehandAnnotation: Omit<FreehandAnnotation, 'id'> = {
            type: 'freehand',
            x: 0,
            y: 0,
            points: finalPoints,
            stroke: strokeColor,
            strokeWidth,
            rotation: 0,
            draggable: true,
          };
          addAnnotation(freehandAnnotation);
        }
        setState((prev) => ({ ...prev, isDrawing: false, preview: null, freehandPoints: [] }));
        return;
      }

      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);

      // Ignore too small shapes
      const minSize = ANNOTATION_DEFAULTS.SHAPE.MIN_DRAW_SIZE;
      if (width < minSize && height < minSize) {
        setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
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

      setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
    },
    [
      state.isDrawing,
      state.startPos,
      state.freehandPoints,
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

  // Submit text from input
  const submitText = useCallback(
    (text: string) => {
      if (!state.textInputPos) return;
      const trimmed = text.trim();
      if (trimmed) {
        const textAnnotation: Omit<TextAnnotation, 'id'> = {
          type: 'text',
          x: state.textInputPos.x,
          y: state.textInputPos.y,
          text: trimmed,
          fontSize,
          fontFamily,
          fill: strokeColor,
          rotation: 0,
          draggable: true,
        };
        addAnnotation(textAnnotation);
      }
      setState((prev) => ({ ...prev, textInputPos: null }));
      setTool('select');
    },
    [state.textInputPos, addAnnotation, fontSize, fontFamily, strokeColor, setTool]
  );

  // Cancel text input
  const cancelTextInput = useCallback(() => {
    setState((prev) => ({ ...prev, textInputPos: null }));
  }, []);

  return {
    isDrawing: state.isDrawing,
    preview: state.preview,
    textInputPos: state.textInputPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
    submitText,
    cancelTextInput,
  };
}
