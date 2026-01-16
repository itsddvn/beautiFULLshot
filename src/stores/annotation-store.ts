// Annotation store - Zustand state management for annotations

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Annotation, ToolType } from '../types/annotations';
import {
  useHistoryStore,
  pushToFuture,
  pushToPast,
  type ImageSnapshot,
} from './history-store';

// Type for creating annotations without id (will be auto-generated)
type CreateAnnotation = Omit<Annotation, 'id'>;

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  editingTextId: string | null;
  currentTool: ToolType;

  // Tool settings
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';

  // Text effect settings (simplified: none or stroke)
  textEffect: 'none' | 'stroke';
  textStroke: string;
  textStrokeWidth: number;

  // Number tool counter
  numberCounter: number;

  // Actions
  addAnnotation: (annotation: CreateAnnotation) => string;
  getNextNumber: () => number;
  resetNumberCounter: () => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  setSelected: (id: string | null) => void;
  setEditingTextId: (id: string | null) => void;
  updateTextContent: (id: string, text: string) => void;
  setTool: (tool: ToolType) => void;

  // Settings
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setFontWeight: (weight: 'normal' | 'bold') => void;
  setFontStyle: (style: 'normal' | 'italic') => void;
  setTextDecoration: (decoration: 'none' | 'underline' | 'line-through') => void;
  setTextEffect: (effect: 'none' | 'stroke') => void;
  applyTextEffectPreset: (preset: { effect: 'none' | 'stroke'; stroke?: string; strokeWidth?: number }) => void;
  applyTextStylePreset: (preset: { fontFamily: string; fontSize: number; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic' }) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // History helpers for canvas integration
  saveToHistory: (imageSnapshot?: ImageSnapshot) => void;
  restoreImageFromHistory: ((snapshot: ImageSnapshot) => void) | null;
  setRestoreImageCallback: (callback: (snapshot: ImageSnapshot) => void) => void;
  getCurrentImageSnapshot: (() => ImageSnapshot) | null;
  setGetImageSnapshotCallback: (callback: () => ImageSnapshot) => void;

  clearAnnotations: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  editingTextId: null,
  currentTool: 'select',

  strokeColor: '#ff0000',
  fillColor: 'transparent',
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',

  // Text effect defaults (simplified)
  textEffect: 'none',
  textStroke: '#ffffff',
  textStrokeWidth: 4,

  // Number tool counter
  numberCounter: 1,

  // Callbacks for canvas integration (set by canvas-store)
  restoreImageFromHistory: null,
  getCurrentImageSnapshot: null,

  setRestoreImageCallback: (callback) => set({ restoreImageFromHistory: callback }),
  setGetImageSnapshotCallback: (callback) => set({ getCurrentImageSnapshot: callback }),

  saveToHistory: (imageSnapshot?: ImageSnapshot) => {
    const state = get();
    useHistoryStore.getState().pushState({
      annotations: [...state.annotations],
      image: imageSnapshot,
    });
  },

  addAnnotation: (annotation: CreateAnnotation) => {
    const id = nanoid();
    const newAnnotation = { ...annotation, id } as Annotation;
    // Save current state before modification
    get().saveToHistory();
    set((state) => ({
      annotations: [...state.annotations, newAnnotation],
    }));
    return id;
  },

  getNextNumber: () => {
    const current = get().numberCounter;
    set({ numberCounter: current + 1 });
    return current;
  },

  resetNumberCounter: () => {
    set({ numberCounter: 1 });
  },

  updateAnnotation: (id, updates) => {
    // Save current state before modification
    get().saveToHistory();
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? ({ ...a, ...updates } as Annotation) : a
      ),
    }));
  },

  deleteAnnotation: (id) => {
    // Save current state before modification
    get().saveToHistory();
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

  duplicateSelected: () => {
    const { selectedId, annotations } = get();
    if (!selectedId) return;

    const selected = annotations.find((a) => a.id === selectedId);
    if (!selected) return;

    // 1cm ≈ 38px at 96dpi
    const OFFSET_PX = 38;

    // Clone annotation with new id and offset position
    const { id: _id, ...rest } = selected;
    const duplicated = {
      ...rest,
      x: (selected.x || 0) + OFFSET_PX,
    } as Omit<Annotation, 'id'>;

    // Add the duplicated annotation and select it
    const newId = get().addAnnotation(duplicated);
    set({ selectedId: newId });
  },

  setSelected: (id) => set({ selectedId: id, editingTextId: null }),

  setEditingTextId: (id) => set({ editingTextId: id }),

  updateTextContent: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      // Delete annotation if text is empty
      get().deleteAnnotation(id);
    } else {
      get().updateAnnotation(id, { text: trimmed });
    }
    set({ editingTextId: null });
  },

  setTool: (tool) => set({ currentTool: tool, selectedId: null, editingTextId: null }),

  setStrokeColor: (color) => {
    const { selectedId, annotations } = get();
    // Update selected annotation if exists
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected) {
        get().saveToHistory();
        set((state) => ({
          strokeColor: color,
          annotations: state.annotations.map((a) => {
            if (a.id !== selectedId) return a;
            // Update appropriate color property based on annotation type
            if (a.type === 'text') return { ...a, fill: color } as Annotation;
            if (a.type === 'number') return { ...a, fill: color } as Annotation;
            return { ...a, stroke: color } as Annotation;
          }),
        }));
        return;
      }
    }
    set({ strokeColor: color });
  },
  setFillColor: (color) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && (selected.type === 'rectangle' || selected.type === 'ellipse')) {
        get().saveToHistory();
        set((state) => ({
          fillColor: color,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, fill: color } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ fillColor: color });
  },
  setStrokeWidth: (width) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && 'strokeWidth' in selected) {
        get().saveToHistory();
        set((state) => ({
          strokeWidth: width,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, strokeWidth: width } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ strokeWidth: width });
  },
  setFontSize: (size) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          fontSize: size,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, fontSize: size } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ fontSize: size });
  },
  setFontFamily: (family) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          fontFamily: family,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, fontFamily: family } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ fontFamily: family });
  },

  setFontWeight: (weight) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          fontWeight: weight,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, fontWeight: weight } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ fontWeight: weight });
  },

  setFontStyle: (style) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          fontStyle: style,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, fontStyle: style } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ fontStyle: style });
  },

  setTextDecoration: (decoration) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          textDecoration: decoration,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, textDecoration: decoration } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({ textDecoration: decoration });
  },

  setTextEffect: (effect) => set({ textEffect: effect }),

  applyTextEffectPreset: (preset) => {
    const { selectedId, annotations } = get();
    // Build effect properties based on preset
    const effectProps: Record<string, unknown> = preset.effect === 'stroke'
      ? { stroke: preset.stroke ?? '#ffffff', strokeWidth: preset.strokeWidth ?? 2 }
      : { stroke: undefined, strokeWidth: undefined };

    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          textEffect: preset.effect,
          textStroke: preset.stroke ?? state.textStroke,
          textStrokeWidth: preset.strokeWidth ?? state.textStrokeWidth,
          annotations: state.annotations.map((a) =>
            a.id === selectedId ? { ...a, ...effectProps } as Annotation : a
          ),
        }));
        return;
      }
    }
    set({
      textEffect: preset.effect,
      textStroke: preset.stroke ?? get().textStroke,
      textStrokeWidth: preset.strokeWidth ?? get().textStrokeWidth,
    });
  },

  applyTextStylePreset: (preset) => {
    const { selectedId, annotations } = get();
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        get().saveToHistory();
        set((state) => ({
          fontSize: preset.fontSize,
          fontFamily: preset.fontFamily,
          fontWeight: preset.fontWeight,
          fontStyle: preset.fontStyle,
          annotations: state.annotations.map((a) =>
            a.id === selectedId
              ? {
                  ...a,
                  fontSize: preset.fontSize,
                  fontFamily: preset.fontFamily,
                  fontWeight: preset.fontWeight,
                  fontStyle: preset.fontStyle,
                } as Annotation
              : a
          ),
        }));
        return;
      }
    }
    set({
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle,
    });
  },

  undo: () => {
    const historyStore = useHistoryStore.getState();
    if (!historyStore.canUndo()) return;

    const current = get();
    // Build current snapshot including image if callback available
    const currentSnapshot: Parameters<typeof pushToFuture>[0] = {
      annotations: [...current.annotations],
    };
    if (current.getCurrentImageSnapshot) {
      currentSnapshot.image = current.getCurrentImageSnapshot();
    }

    // Save current state to future before undoing
    pushToFuture(currentSnapshot);

    // Get previous state
    const previous = historyStore.undo();
    if (previous) {
      set({
        annotations: previous.annotations,
        selectedId: null,
      });
      // Restore image if snapshot contains image data
      if (previous.image && current.restoreImageFromHistory) {
        current.restoreImageFromHistory(previous.image);
      }
    }
  },

  redo: () => {
    const historyStore = useHistoryStore.getState();
    if (!historyStore.canRedo()) return;

    const current = get();
    // Build current snapshot including image if callback available
    const currentSnapshot: Parameters<typeof pushToPast>[0] = {
      annotations: [...current.annotations],
    };
    if (current.getCurrentImageSnapshot) {
      currentSnapshot.image = current.getCurrentImageSnapshot();
    }

    // Save current state to past before redoing
    pushToPast(currentSnapshot);

    // Get next state
    const next = historyStore.redo();
    if (next) {
      set({
        annotations: next.annotations,
        selectedId: null,
      });
      // Restore image if snapshot contains image data
      if (next.image && current.restoreImageFromHistory) {
        current.restoreImageFromHistory(next.image);
      }
    }
  },

  canUndo: () => useHistoryStore.getState().canUndo(),
  canRedo: () => useHistoryStore.getState().canRedo(),

  clearAnnotations: () => {
    // Save current state before clearing
    get().saveToHistory();
    useHistoryStore.getState().clear();
    set({ annotations: [], selectedId: null, numberCounter: 1 });
  },
}));
