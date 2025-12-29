// Annotation store - Zustand state management for annotations

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Annotation, ToolType } from '../types/annotations';

// Type for creating annotations without id (will be auto-generated)
type CreateAnnotation = Omit<Annotation, 'id'>;

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  currentTool: ToolType;
  numberCounter: number;

  // Tool settings
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;

  // Actions
  addAnnotation: (annotation: CreateAnnotation) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  deleteSelected: () => void;
  setSelected: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
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

  addAnnotation: (annotation: CreateAnnotation) => {
    const id = nanoid();
    const newAnnotation = { ...annotation, id } as Annotation;
    set((state) => ({
      annotations: [...state.annotations, newAnnotation],
    }));
    return id;
  },

  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? ({ ...a, ...updates } as Annotation) : a
      ),
    }));
  },

  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  deleteSelected: () => {
    const { selectedId } = get();
    if (selectedId) {
      get().deleteAnnotation(selectedId);
    }
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

  clearAnnotations: () =>
    set({ annotations: [], numberCounter: 0, selectedId: null }),
}));
