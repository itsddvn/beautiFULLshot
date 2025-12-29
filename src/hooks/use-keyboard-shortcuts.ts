// useKeyboardShortcuts - Global keyboard shortcuts for canvas operations

import { useEffect } from 'react';
import { useAnnotationStore } from '../stores/annotation-store';

export function useKeyboardShortcuts() {
  const { selectedId, deleteSelected, setSelected, setTool } = useAnnotationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
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

        // Tool shortcuts
        case 'v':
        case 'V':
          setTool('select');
          break;
        case 'r':
        case 'R':
          setTool('rectangle');
          break;
        case 'e':
        case 'E':
          setTool('ellipse');
          break;
        case 'l':
        case 'L':
          setTool('line');
          break;
        case 'a':
        case 'A':
          if (!e.metaKey && !e.ctrlKey) {
            setTool('arrow');
          }
          break;
        case 't':
        case 'T':
          setTool('text');
          break;
        case 'n':
        case 'N':
          setTool('number');
          break;
        case 's':
        case 'S':
          if (!e.metaKey && !e.ctrlKey) {
            setTool('spotlight');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelected, setSelected, setTool]);
}
