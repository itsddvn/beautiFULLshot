// UndoRedoButtons - Undo and redo action buttons

import { useAnnotationStore } from '../../stores/annotation-store';
import { useHistoryStore } from '../../stores/history-store';

export function UndoRedoButtons() {
  const { undo, redo } = useAnnotationStore();
  // Subscribe to history store changes
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  return (
    <div className="flex gap-1">
      {/* Undo button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo (Ctrl+Z / Cmd+Z)"
        title="Undo (Ctrl+Z / Cmd+Z)"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          canUndo
            ? 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            : 'glass-flat text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a5 5 0 0 1 5 5v2M3 10l4-4M3 10l4 4"
          />
        </svg>
      </button>

      {/* Redo button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
        title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z)"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          canRedo
            ? 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            : 'glass-flat text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10H11a5 5 0 0 0-5 5v2M21 10l-4-4M21 10l-4 4"
          />
        </svg>
      </button>
    </div>
  );
}
