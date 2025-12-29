// Toolbar - Main toolbar with capture, annotation tools, and settings

import { useState, useEffect, useCallback, useRef } from 'react';
import { useScreenshot } from '../../hooks/use-screenshot';
import { useCanvasStore } from '../../stores/canvas-store';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useClickAway } from '../../hooks/use-click-away';
import { ToolButtons } from './tool-buttons';
import { ToolSettings } from './tool-settings';
import { logError } from '../../utils/logger';
import type { WindowInfo } from '../../types/screenshot';

// Helper: Get image dimensions from bytes
function getImageDimensions(bytes: Uint8Array): Promise<{ width: number; height: number }> {
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

export function Toolbar() {
  const { captureFullscreen, captureWindow, getWindows, loading, error, waylandWarning } = useScreenshot();
  const { setImageFromBytes, clearCanvas, imageUrl } = useCanvasStore();
  const { clearAnnotations } = useAnnotationStore();
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [showWindows, setShowWindows] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or ESC
  const closeDropdown = useCallback(() => setShowWindows(false), []);
  useClickAway(dropdownRef, closeDropdown, showWindows);

  // Fetch windows when dropdown is opened
  useEffect(() => {
    if (showWindows) {
      getWindows()
        .then(setWindows)
        .catch((e) => logError('Toolbar:getWindows', e));
    }
  }, [showWindows, getWindows]);

  const handleCaptureFullscreen = useCallback(async () => {
    const bytes = await captureFullscreen();
    if (bytes) {
      try {
        const { width, height } = await getImageDimensions(bytes);
        setImageFromBytes(bytes, width, height);
      } catch (e) {
        logError('Toolbar:captureFullscreen', e);
      }
    }
  }, [captureFullscreen, setImageFromBytes]);

  const handleCaptureWindow = useCallback(async (windowId: number) => {
    const bytes = await captureWindow(windowId);
    if (bytes) {
      try {
        const { width, height } = await getImageDimensions(bytes);
        setImageFromBytes(bytes, width, height);
      } catch (e) {
        logError('Toolbar:captureWindow', e);
      }
    }
    setShowWindows(false);
  }, [captureWindow, setImageFromBytes]);

  return (
    <div className="h-12 bg-white border-b flex items-center px-4 gap-4">
      {/* Capture fullscreen button */}
      <button
        onClick={handleCaptureFullscreen}
        disabled={loading}
        aria-label="Capture full screen screenshot"
        className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Capturing...' : 'Capture Screen'}
      </button>

      {/* Window capture dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setShowWindows(!showWindows)}
          aria-expanded={showWindows}
          aria-haspopup="listbox"
          aria-label="Select window to capture"
          className="px-4 py-1.5 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Capture Window
        </button>

        {showWindows && windows.length > 0 && (
          <div
            role="listbox"
            aria-label="Available windows"
            className="absolute top-full mt-2 left-0 w-64 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10"
          >
            {windows.map((w) => (
              <button
                key={w.id}
                role="option"
                aria-selected={false}
                onClick={() => handleCaptureWindow(w.id)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm truncate"
              >
                <span className="font-medium">{w.app_name}</span>
                <span className="text-gray-500 ml-2">{w.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
      {imageUrl && (
        <button
          onClick={() => {
            clearCanvas();
            clearAnnotations();
          }}
          aria-label="Clear current screenshot and annotations"
          className="px-4 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Annotation Tools */}
      <ToolButtons />

      {/* Tool Settings */}
      <ToolSettings />

      {/* Error display */}
      {error && (
        <span role="alert" className="text-red-600 text-sm">{error}</span>
      )}

      {/* Wayland warning */}
      {waylandWarning && (
        <span role="status" className="text-yellow-600 text-sm">{waylandWarning}</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      <span className="text-sm text-gray-500">BeautyShot</span>
    </div>
  );
}
