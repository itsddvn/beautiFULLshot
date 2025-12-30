// useKeyboardShortcuts - Keyboard shortcuts for canvas operations and export

import { useEffect } from 'react';
import { useAnnotationStore } from '../stores/annotation-store';
import { useExport } from './use-export';

export function useKeyboardShortcuts() {
  const { selectedId, deleteSelected, setSelected, setTool, undo, redo } = useAnnotationStore();
  const { quickSave, copyToClipboard } = useExport();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl shortcuts
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 's':
            // Cmd/Ctrl+S - Quick save
            e.preventDefault();
            quickSave();
            return;
          case 'v':
            // Cmd/Ctrl+Shift+V - Copy to clipboard
            if (e.shiftKey) {
              e.preventDefault();
              copyToClipboard();
              return;
            }
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              // Cmd/Ctrl+Shift+Z - Redo
              redo();
            } else {
              // Cmd/Ctrl+Z - Undo
              undo();
            }
            return;
          case 'y':
            // Cmd/Ctrl+Y - Redo (Windows alternative)
            e.preventDefault();
            redo();
            return;
        }
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedId) {
            e.preventDefault();
            deleteSelected();
          }
          break;

        case 'Escape':
          setSelected(null);
          setTool('select');
          break;

        // Tool shortcuts (only when no modifier)
        case 'v':
        case 'V':
          if (!isMod) setTool('select');
          break;
        case 'r':
        case 'R':
          if (!isMod) setTool('rectangle');
          break;
        case 'e':
        case 'E':
          if (!isMod) setTool('ellipse');
          break;
        case 'l':
        case 'L':
          if (!isMod) setTool('line');
          break;
        case 'a':
        case 'A':
          if (!isMod) setTool('arrow');
          break;
        case 't':
        case 'T':
          if (!isMod) setTool('text');
          break;
        case 'n':
        case 'N':
          if (!isMod) setTool('number');
          break;
        case 's':
        case 'S':
          if (!isMod) setTool('spotlight');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelected, setSelected, setTool, quickSave, copyToClipboard, undo, redo]);
}
