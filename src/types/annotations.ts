// Annotation types for canvas shapes and tools

export type AnnotationType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'text'
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
  pointerLength?: number;
  pointerWidth?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  points: number[]; // [x1, y1, x2, y2, ...]
  stroke: string;
  strokeWidth: number;
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
  | FreehandAnnotation
  | TextAnnotation
  | SpotlightAnnotation;

export type ToolType = AnnotationType | 'select';
