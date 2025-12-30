// History store - Undo/redo functionality for annotations and canvas
// Tracks snapshots of annotation and image state for history navigation

import { create } from 'zustand';
import type { Annotation } from '../types/annotations';

// Image state snapshot for undo/redo
export interface ImageSnapshot {
  imageBytes: Uint8Array | null;
  originalWidth: number;
  originalHeight: number;
}

// Snapshot of state that can be undone/redone
export interface HistorySnapshot {
  annotations: Annotation[];
  image?: ImageSnapshot; // Optional - only included when image changes
}

interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  maxHistory: number;

  // Actions
  pushState: (snapshot: HistorySnapshot) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: MAX_HISTORY,

  pushState: (snapshot) => {
    set((state) => {
      const newPast = [...state.past, snapshot];
      // Trim history if exceeds max
      if (newPast.length > state.maxHistory) {
        newPast.shift();
      }
      return {
        past: newPast,
        future: [], // Clear redo stack on new action
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: state.future, // Will be updated by caller with current state
    }));
    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[future.length - 1];
    set((state) => ({
      future: state.future.slice(0, -1),
      past: state.past, // Will be updated by caller with current state
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}));

// Helper to push current state to future (for undo operation)
export function pushToFuture(snapshot: HistorySnapshot) {
  useHistoryStore.setState((state) => ({
    future: [...state.future, snapshot],
  }));
}

// Helper to push current state to past (for redo operation)
export function pushToPast(snapshot: HistorySnapshot) {
  useHistoryStore.setState((state) => ({
    past: [...state.past, snapshot],
  }));
}
