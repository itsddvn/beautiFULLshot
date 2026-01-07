// WindowPickerModal - Modal for selecting a window to capture

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WindowInfo } from '../../types/screenshot';
import * as screenshotApi from '../../utils/screenshot-api';
import { logError } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (bytes: Uint8Array, width: number, height: number) => void;
}

export function WindowPickerModal({ isOpen, onClose, onCapture }: Props) {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch windows list
  const fetchWindows = useCallback(async () => {
    setLoading(true);
    try {
      const list = await screenshotApi.getWindows();
      // Filter out windows with empty titles and sort by app name
      const filtered = list
        .filter((w) => w.title.trim() !== '' && w.width > 0 && w.height > 0)
        .sort((a, b) => a.app_name.localeCompare(b.app_name));
      setWindows(filtered);
    } catch (e) {
      logError('WindowPickerModal:fetchWindows', e);
      setWindows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load windows when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWindows();
      setSelectedId(null);
    }
  }, [isOpen, fetchWindows]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Capture selected window (no need to hide app - capturing specific window)
  const handleCapture = async () => {
    if (selectedId === null) return;

    setCapturing(true);
    try {
      // Capture window directly without hiding app
      const bytes = await screenshotApi.captureWindow(selectedId);

      if (bytes) {
        // Get dimensions from the captured image
        const { width, height } = await getImageDimensions(bytes);
        onCapture(bytes, width, height);
        onClose();
      }
    } catch (e) {
      logError('WindowPickerModal:capture', e);
    } finally {
      setCapturing(false);
    }
  };

  // Double-click to capture
  const handleDoubleClick = (windowId: number) => {
    setSelectedId(windowId);
    // Capture immediately after selection
    setTimeout(handleCapture, 0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-[600px] max-h-[80vh] flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="window-picker-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2
            id="window-picker-title"
            className="text-lg font-medium text-gray-800 dark:text-gray-100"
          >
            Select Window to Capture
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWindows}
              disabled={loading}
              className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"
              aria-label="Refresh window list"
            >
              ↻ Refresh
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              aria-label="Close (Escape)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Window List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              Loading windows...
            </div>
          ) : windows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              No windows found
            </div>
          ) : (
            <div className="space-y-1">
              {windows.map((win) => (
                <button
                  key={win.id}
                  onClick={() => setSelectedId(win.id)}
                  onDoubleClick={() => handleDoubleClick(win.id)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedId === win.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div className="font-medium truncate">{win.title}</div>
                  <div
                    className={`text-sm truncate ${
                      selectedId === win.id
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {win.app_name} • {win.width}×{win.height}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Double-click to capture instantly
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={selectedId === null || capturing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {capturing ? 'Capturing...' : 'Capture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Get image dimensions from bytes
function getImageDimensions(
  bytes: Uint8Array
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
