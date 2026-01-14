// useDrawing hook - Handles mouse events for creating annotations

import { useState, useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';
import { useBackgroundStore } from '../stores/background-store';
import { useCanvasStore } from '../stores/canvas-store';
import { useExportStore } from '../stores/export-store';
import { ANNOTATION_DEFAULTS } from '../constants/annotations';
import { calculateAspectRatioExtend } from '../utils/export-utils';
import type {
  RectAnnotation,
  EllipseAnnotation,
  LineAnnotation,
  FreehandAnnotation,
  TextAnnotation,
  NumberAnnotation,
  SpotlightAnnotation,
} from '../types/annotations';

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
  textInputPos: { x: number; y: number; screenX: number; screenY: number } | null;
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
      const tool = useAnnotationStore.getState().currentTool;
      // Only handle left click and when using a drawing tool
      if (e.evt.button !== 0 || tool === 'select' || !tool) {
        return;
      }

      const target = e.target;
      const isAnnotation = target.draggable() && target.id();
      if (isAnnotation) {
        // When clicking on existing annotation while in drawing mode,
        // switch to select mode and select the clicked annotation
        const annotationId = target.id();
        setTool('select');
        useAnnotationStore.getState().setSelected(annotationId);
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) return;

      // Click-to-place tools
      if (tool === 'text') {
        if (state.textInputPos) {
          return;
        }
        const stage = e.target.getStage();
        const screenPos = stage?.getPointerPosition();
        setState((prev) => ({
          ...prev,
          textInputPos: {
            x: pos.x,
            y: pos.y,
            screenX: screenPos?.x ?? 0,
            screenY: screenPos?.y ?? 0,
          },
        }));
        return;
      }

      if (tool === 'number') {
        const { getNextNumber, strokeColor: numberColor } = useAnnotationStore.getState();
        const numberAnnotation: Omit<NumberAnnotation, 'id'> = {
          type: 'number',
          x: pos.x,
          y: pos.y,
          number: getNextNumber(),
          radius: 16,
          fill: numberColor,
          textColor: '#ffffff',
          fontSize: 14,
          rotation: 0,
          draggable: true,
        };
        addAnnotation(numberAnnotation);
        return;
      }

      if (tool === 'freehand') {
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
      setState({
        isDrawing: true,
        startPos: pos,
        preview: {
          type: tool as PreviewShape['type'],
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
        },
        freehandPoints: [],
        textInputPos: null,
      });
    },
    [getPointerPosition, state.textInputPos]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const tool = useAnnotationStore.getState().currentTool;
      if (!state.isDrawing || tool === 'select' || !tool) return;

      const pos = getPointerPosition(e);
      if (!pos) return;

      if (tool === 'freehand') {
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
    [state.isDrawing, state.freehandPoints, getPointerPosition]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const tool = useAnnotationStore.getState().currentTool;
      if (!state.isDrawing || tool === 'select' || !tool) {
        setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
        return;
      }

      const pos = getPointerPosition(e);
      if (!pos) {
        setState((prev) => ({ ...prev, isDrawing: false, preview: null }));
        return;
      }

      const { startPos, freehandPoints } = state;

      if (tool === 'freehand') {
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

      switch (tool) {
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
            type: tool,
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
      const tool = useAnnotationStore.getState().currentTool;
      if (tool === 'select') {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          useAnnotationStore.getState().setSelected(null);
        }
      }
    },
    []
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
        setTool('select');
      }
      setState((prev) => ({ ...prev, textInputPos: null }));
    },
    [state.textInputPos, addAnnotation, fontSize, fontFamily, strokeColor, setTool]
  );

  const cancelTextInput = useCallback(() => {
    setState((prev) => ({ ...prev, textInputPos: null }));
    setTool('select');
  }, [setTool]);

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
