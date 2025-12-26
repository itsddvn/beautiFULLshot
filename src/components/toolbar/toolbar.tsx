// Toolbar - Main toolbar with capture and tool buttons

import { useState, useEffect, useCallback } from 'react';
import { useScreenshot } from '../../hooks/use-screenshot';
import { useCanvasStore } from '../../stores/canvas-store';
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
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [showWindows, setShowWindows] = useState(false);

  // Fetch windows when dropdown is opened
  useEffect(() => {
    if (showWindows) {
      getWindows().then(setWindows).catch(console.error);
    }
  }, [showWindows, getWindows]);

  const handleCaptureFullscreen = useCallback(async () => {
    const bytes = await captureFullscreen();
    if (bytes) {
      try {
        const { width, height } = await getImageDimensions(bytes);
        setImageFromBytes(bytes, width, height);
      } catch (e) {
        console.error('Failed to get image dimensions:', e);
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
        console.error('Failed to get image dimensions:', e);
      }
    }
    setShowWindows(false);
  }, [captureWindow, setImageFromBytes]);

  return (
    <div className="h-12 bg-white border-b flex items-center px-4 gap-4">
      {/* Capture buttons */}
      <button
        onClick={handleCaptureFullscreen}
        disabled={loading}
        className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Capturing...' : 'Capture Screen'}
      </button>

      {/* Window capture dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowWindows(!showWindows)}
          className="px-4 py-1.5 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Capture Window
        </button>

        {showWindows && windows.length > 0 && (
          <div className="absolute top-full mt-2 left-0 w-64 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {windows.map((w) => (
              <button
                key={w.id}
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
          onClick={clearCanvas}
          className="px-4 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      )}

      {/* Error display */}
      {error && (
        <span className="text-red-600 text-sm">{error}</span>
      )}

      {/* Wayland warning */}
      {waylandWarning && (
        <span className="text-yellow-600 text-sm">{waylandWarning}</span>
      )}

      {/* Tool buttons will be added in Phase 04 */}
      <div className="flex-1" />

      <span className="text-sm text-gray-500">BeautyShot</span>
    </div>
  );
}
