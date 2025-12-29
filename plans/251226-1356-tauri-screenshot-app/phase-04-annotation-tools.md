# Phase 04: Annotation Tools

**Status**: completed | **Effort**: 6h | **Priority**: P1 | **Review**: code-reviewer-251227-0516

## Objective

Implement full annotation toolkit: shapes (rect, ellipse, line, arrow), text with fonts, numbered annotations, spotlight/dimming effect, and Transformer for move/resize/rotate.

---

## Tasks

### 4.1 Annotation Types & Store

**src/types/annotations.ts:**
```typescript
export type AnnotationType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'number'
  | 'spotlight';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  rotation: number;
  draggable: boolean;
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line' | 'arrow';
  points: number[]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
  pointerLength?: number; // for arrow
  pointerWidth?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface NumberAnnotation extends BaseAnnotation {
  type: 'number';
  number: number;
  radius: number;
  fill: string;
  textColor: string;
  fontSize: number;
}

export interface SpotlightAnnotation extends BaseAnnotation {
  type: 'spotlight';
  width: number;
  height: number;
  shape: 'rectangle' | 'ellipse';
}

export type Annotation =
  | RectAnnotation
  | EllipseAnnotation
  | LineAnnotation
  | TextAnnotation
  | NumberAnnotation
  | SpotlightAnnotation;
```

**src/stores/annotation-store.ts:**
```typescript
import { create } from 'zustand';
import type { Annotation, AnnotationType } from '../types/annotations';
import { nanoid } from 'nanoid';

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  currentTool: AnnotationType | 'select' | null;
  numberCounter: number;

  // Tool settings
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;

  // Actions
  addAnnotation: (annotation: Omit<Annotation, 'id'>) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  setSelected: (id: string | null) => void;
  setTool: (tool: AnnotationType | 'select' | null) => void;
  incrementNumber: () => number;

  // Settings
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;

  clearAnnotations: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  currentTool: 'select',
  numberCounter: 0,

  strokeColor: '#ff0000',
  fillColor: 'rgba(255,0,0,0.3)',
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'Arial',

  addAnnotation: (annotation) => {
    const id = nanoid();
    set(state => ({
      annotations: [...state.annotations, { ...annotation, id } as Annotation]
    }));
    return id;
  },

  updateAnnotation: (id, updates) => {
    set(state => ({
      annotations: state.annotations.map(a =>
        a.id === id ? { ...a, ...updates } : a
      )
    }));
  },

  deleteAnnotation: (id) => {
    set(state => ({
      annotations: state.annotations.filter(a => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    }));
  },

  setSelected: (id) => set({ selectedId: id }),
  setTool: (tool) => set({ currentTool: tool, selectedId: null }),

  incrementNumber: () => {
    const next = get().numberCounter + 1;
    set({ numberCounter: next });
    return next;
  },

  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),

  clearAnnotations: () => set({ annotations: [], numberCounter: 0, selectedId: null }),
}));
```

### 4.2 Shape Components

**src/components/canvas/annotations/rect-shape.tsx:**
```typescript
import { Rect } from 'react-konva';
import type { RectAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: RectAnnotation;
}

export function RectShape({ annotation }: Props) {
  const { updateAnnotation, setSelected, selectedId } = useAnnotationStore();

  return (
    <Rect
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      width={annotation.width}
      height={annotation.height}
      fill={annotation.fill}
      stroke={annotation.stroke}
      strokeWidth={annotation.strokeWidth}
      rotation={annotation.rotation}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onTap={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        updateAnnotation(annotation.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * node.scaleX()),
          height: Math.max(5, node.height() * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
```

**src/components/canvas/annotations/arrow-shape.tsx:**
```typescript
import { Arrow, Line } from 'react-konva';
import type { LineAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: LineAnnotation;
}

export function ArrowShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();
  const isArrow = annotation.type === 'arrow';

  const Component = isArrow ? Arrow : Line;

  return (
    <Component
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      points={annotation.points}
      stroke={annotation.stroke}
      strokeWidth={annotation.strokeWidth}
      pointerLength={isArrow ? annotation.pointerLength || 10 : undefined}
      pointerWidth={isArrow ? annotation.pointerWidth || 10 : undefined}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    />
  );
}
```

**src/components/canvas/annotations/text-shape.tsx:**
```typescript
import { Text } from 'react-konva';
import type { TextAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: TextAnnotation;
}

export function TextShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();

  return (
    <Text
      id={annotation.id}
      x={annotation.x}
      y={annotation.y}
      text={annotation.text}
      fontSize={annotation.fontSize}
      fontFamily={annotation.fontFamily}
      fill={annotation.fill}
      rotation={annotation.rotation}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onDblClick={() => {
        // TODO: Inline text editing
      }}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        updateAnnotation(annotation.id, {
          x: node.x(),
          y: node.y(),
          fontSize: Math.max(8, annotation.fontSize * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
```

**src/components/canvas/annotations/number-shape.tsx:**
```typescript
import { Circle, Text, Group } from 'react-konva';
import type { NumberAnnotation } from '../../../types/annotations';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: NumberAnnotation;
}

export function NumberShape({ annotation }: Props) {
  const { updateAnnotation, setSelected } = useAnnotationStore();

  return (
    <Group
      x={annotation.x}
      y={annotation.y}
      draggable={annotation.draggable}
      onClick={() => setSelected(annotation.id)}
      onDragEnd={(e) => {
        updateAnnotation(annotation.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
    >
      <Circle
        radius={annotation.radius}
        fill={annotation.fill}
      />
      <Text
        text={String(annotation.number)}
        fontSize={annotation.fontSize}
        fill={annotation.textColor}
        x={-annotation.radius}
        y={-annotation.fontSize / 2}
        width={annotation.radius * 2}
        align="center"
      />
    </Group>
  );
}
```

### 4.3 Spotlight Effect

**src/components/canvas/annotations/spotlight-shape.tsx:**
```typescript
import { Group, Rect, Shape } from 'react-konva';
import type { SpotlightAnnotation } from '../../../types/annotations';
import { useCanvasStore } from '../../../stores/canvas-store';
import { useAnnotationStore } from '../../../stores/annotation-store';

interface Props {
  annotation: SpotlightAnnotation;
}

export function SpotlightShape({ annotation }: Props) {
  const { originalWidth, originalHeight } = useCanvasStore();
  const { updateAnnotation, setSelected } = useAnnotationStore();

  return (
    <Group>
      {/* Dimmed overlay with cutout */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          // Full canvas
          ctx.rect(0, 0, originalWidth, originalHeight);
          // Cutout (spotlight area)
          if (annotation.shape === 'ellipse') {
            ctx.ellipse(
              annotation.x + annotation.width / 2,
              annotation.y + annotation.height / 2,
              annotation.width / 2,
              annotation.height / 2,
              0, 0, Math.PI * 2, true
            );
          } else {
            ctx.rect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          ctx.fillStrokeShape(shape);
        }}
        fill="rgba(0,0,0,0.5)"
        listening={false}
      />

      {/* Invisible draggable handle */}
      <Rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        fill="transparent"
        stroke="white"
        strokeWidth={2}
        dash={[5, 5]}
        draggable
        onClick={() => setSelected(annotation.id)}
        onDragEnd={(e) => {
          updateAnnotation(annotation.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          updateAnnotation(annotation.id, {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
    </Group>
  );
}
```

### 4.4 Annotation Layer with Transformer

**src/components/canvas/annotation-layer.tsx:**
```typescript
import { useRef, useEffect } from 'react';
import { Layer, Transformer } from 'react-konva';
import Konva from 'konva';
import { useAnnotationStore } from '../../stores/annotation-store';
import { RectShape } from './annotations/rect-shape';
import { ArrowShape } from './annotations/arrow-shape';
import { TextShape } from './annotations/text-shape';
import { NumberShape } from './annotations/number-shape';
import { SpotlightShape } from './annotations/spotlight-shape';
import { EllipseShape } from './annotations/ellipse-shape';

export function AnnotationLayer() {
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const { annotations, selectedId } = useAnnotationStore();

  // Attach transformer to selected shape
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;

    if (selectedId) {
      const node = layerRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.type) {
      case 'rectangle':
        return <RectShape key={annotation.id} annotation={annotation} />;
      case 'ellipse':
        return <EllipseShape key={annotation.id} annotation={annotation} />;
      case 'line':
      case 'arrow':
        return <ArrowShape key={annotation.id} annotation={annotation} />;
      case 'text':
        return <TextShape key={annotation.id} annotation={annotation} />;
      case 'number':
        return <NumberShape key={annotation.id} annotation={annotation} />;
      case 'spotlight':
        return <SpotlightShape key={annotation.id} annotation={annotation} />;
      default:
        return null;
    }
  };

  return (
    <Layer ref={layerRef}>
      {annotations.map(renderAnnotation)}
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          // Minimum size constraint
          if (newBox.width < 10 || newBox.height < 10) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Layer>
  );
}
```

### 4.5 Drawing Handler (Create shapes on canvas)

**src/hooks/use-drawing.ts:**
```typescript
import { useState, useCallback } from 'react';
import Konva from 'konva';
import { useAnnotationStore } from '../stores/annotation-store';

export function useDrawing() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const {
    currentTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    addAnnotation,
    incrementNumber,
  } = useAnnotationStore();

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'select' || !currentTool) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    // Adjust for stage transform
    const transform = stage.getAbsoluteTransform().copy().invert();
    const realPos = transform.point(pos);

    setIsDrawing(true);
    setStartPos(realPos);

    // For click-to-place tools
    if (currentTool === 'text') {
      const text = prompt('Enter text:') || 'Text';
      addAnnotation({
        type: 'text',
        x: realPos.x,
        y: realPos.y,
        text,
        fontSize,
        fontFamily,
        fill: strokeColor,
        rotation: 0,
        draggable: true,
      });
      setIsDrawing(false);
    } else if (currentTool === 'number') {
      const num = incrementNumber();
      addAnnotation({
        type: 'number',
        x: realPos.x,
        y: realPos.y,
        number: num,
        radius: 15,
        fill: strokeColor,
        textColor: '#ffffff',
        fontSize: 14,
        rotation: 0,
        draggable: true,
      });
      setIsDrawing(false);
    }
  }, [currentTool, addAnnotation, strokeColor, fontSize, fontFamily, incrementNumber]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || currentTool === 'select' || !currentTool) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const endPos = transform.point(pos);

    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);

    if (width < 5 && height < 5) {
      setIsDrawing(false);
      return; // Too small, ignore
    }

    switch (currentTool) {
      case 'rectangle':
        addAnnotation({
          type: 'rectangle',
          x, y, width, height,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          rotation: 0,
          draggable: true,
        });
        break;
      case 'ellipse':
        addAnnotation({
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
        });
        break;
      case 'line':
      case 'arrow':
        addAnnotation({
          type: currentTool,
          x: 0,
          y: 0,
          points: [startPos.x, startPos.y, endPos.x, endPos.y],
          stroke: strokeColor,
          strokeWidth,
          pointerLength: 10,
          pointerWidth: 10,
          rotation: 0,
          draggable: true,
        });
        break;
      case 'spotlight':
        addAnnotation({
          type: 'spotlight',
          x, y, width, height,
          shape: 'rectangle',
          rotation: 0,
          draggable: true,
        });
        break;
    }

    setIsDrawing(false);
  }, [isDrawing, currentTool, startPos, addAnnotation, fillColor, strokeColor, strokeWidth]);

  return {
    isDrawing,
    handleMouseDown,
    handleMouseUp,
  };
}
```

### 4.6 Toolbar Tools

**src/components/toolbar/tool-buttons.tsx:**
```typescript
import { useAnnotationStore } from '../../stores/annotation-store';
import type { AnnotationType } from '../../types/annotations';

const TOOLS: { type: AnnotationType | 'select'; icon: string; label: string }[] = [
  { type: 'select', icon: '↖', label: 'Select' },
  { type: 'rectangle', icon: '▢', label: 'Rectangle' },
  { type: 'ellipse', icon: '○', label: 'Ellipse' },
  { type: 'line', icon: '/', label: 'Line' },
  { type: 'arrow', icon: '→', label: 'Arrow' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'number', icon: '#', label: 'Number' },
  { type: 'spotlight', icon: '◐', label: 'Spotlight' },
];

export function ToolButtons() {
  const { currentTool, setTool } = useAnnotationStore();

  return (
    <div className="flex gap-1">
      {TOOLS.map(tool => (
        <button
          key={tool.type}
          onClick={() => setTool(tool.type)}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            currentTool === tool.type
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
```

---

## Install nanoid

```bash
npm install nanoid
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/annotations.ts` | Create |
| `src/stores/annotation-store.ts` | Create |
| `src/components/canvas/annotations/*.tsx` | Create (6 files) |
| `src/components/canvas/annotation-layer.tsx` | Create |
| `src/components/toolbar/tool-buttons.tsx` | Create |
| `src/hooks/use-drawing.ts` | Create |
| `src/components/canvas/canvas-editor.tsx` | Modify |

---

## Success Criteria

- [x] Rectangle tool: draw, move, resize, rotate
- [x] Ellipse tool: draw, move, resize
- [x] Arrow tool: draw, move endpoints
- [x] Text tool: click to add, edit text (using prompt - UX improvement needed Phase 05)
- [x] Number tool: auto-increment counter
- [x] Spotlight: dims outside, movable highlight
- [x] Transformer handles on selected shapes
- [x] Delete key removes selected shape

---

## Known Limitations

- Arrow + Transformer has issues (Konva bug) → use bounding box drag instead
- Stars not included (not in requirements)
- Inline text editing requires custom implementation

---

## Code Review Summary

**Date:** 2025-12-27 05:16
**Report:** plans/reports/code-reviewer-251227-0516-phase04-annotation-tools.md
**Grade:** B+ (85/100) → **A- (92/100)** after fixes

### Key Findings
- ✅ No critical security issues
- ✅ Type safety excellent (strict mode passes)
- ✅ Clean architecture, KISS/DRY principles followed
- ✅ Console logging → `src/utils/logger.ts` created
- ✅ Text input sanitization → `src/utils/sanitize.ts` created
- ✅ DRY violations → `src/hooks/use-transform-handler.ts` created
- ✅ Magic numbers → `src/constants/annotations.ts` created
- ✅ Transformer cleanup → useEffect cleanup added
- ✅ Exhaustiveness check → added to renderAnnotation
- ⚠️ UX: Browser prompt() for text input (defer to Phase 05)

### Tech Debt for Phase 05
1. Replace prompt() with proper text input dialog/modal

### Status
**Phase 04: COMPLETE** - All success criteria met. All code review issues resolved except text dialog UX.

---

## Next Phase

[Phase 05: Beautification Features](./phase-05-beautification.md)
