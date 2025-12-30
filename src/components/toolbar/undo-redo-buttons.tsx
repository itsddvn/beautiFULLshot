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
        className={`w-9 h-9 flex items-center justify-center rounded-lg ${
          canUndo
            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
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
        className={`w-9 h-9 flex items-center justify-center rounded-lg ${
          canRedo
            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
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
