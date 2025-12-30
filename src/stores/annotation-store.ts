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
  currentTool: ToolType;

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

  // Settings
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;

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
  currentTool: 'select',

  strokeColor: '#ff0000',
  fillColor: 'rgba(255,0,0,0.3)',
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'Arial',

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

  setSelected: (id) => set({ selectedId: id }),

  setTool: (tool) => set({ currentTool: tool, selectedId: null }),

  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),

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
    set({ annotations: [], selectedId: null });
  },
}));
