// Toolbar - Main toolbar with capture, annotation tools, and settings

import { useState, useCallback } from 'react';
import { emit } from '@tauri-apps/api/event';
import { useScreenshot } from '../../hooks/use-screenshot';
import { useCanvasStore } from '../../stores/canvas-store';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useCropStore } from '../../stores/crop-store';
import { useUIStore } from '../../stores/ui-store';
import { ToolButtons } from './tool-buttons';
import { ToolSettings } from './tool-settings';
import { UndoRedoButtons } from './undo-redo-buttons';
import { SettingsModal } from '../settings/settings-modal';
import { logError } from '../../utils/logger';

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
  const { captureFullscreen, loading, error, waylandWarning } = useScreenshot();
  const { setImageFromBytes, clearCanvas, imageUrl, fitToView } = useCanvasStore();
  const { clearAnnotations } = useAnnotationStore();
  const { clearCrop } = useCropStore();
  const { openWindowPicker } = useUIStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleCaptureFullscreen = useCallback(async () => {
    const bytes = await captureFullscreen();
    if (bytes) {
      try {
        const { width, height } = await getImageDimensions(bytes);
        clearCrop(); // Clear any existing crop when loading new image
        setImageFromBytes(bytes, width, height);
        // Auto-fit to view after capture
        setTimeout(() => fitToView(), 50);
      } catch (e) {
        logError('Toolbar:captureFullscreen', e);
      }
    }
  }, [captureFullscreen, clearCrop, setImageFromBytes, fitToView]);

  return (
    <div className="h-14 glass floating-panel flex items-center px-3 gap-2 overflow-visible">
      {/* Capture buttons group */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Capture fullscreen button */}
        <button
          onClick={handleCaptureFullscreen}
          disabled={loading}
          aria-label="Capture full screen screenshot"
          title="Capture Screen"
          className="w-10 h-10 flex items-center justify-center glass-btn rounded-xl text-orange-500 hover:text-orange-600 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Region capture button */}
        <button
          onClick={() => emit('hotkey-capture-region')}
          disabled={loading}
          aria-label="Capture screen region"
          title="Capture Region (Ctrl+Shift+R)"
          className="w-10 h-10 flex items-center justify-center glass-btn rounded-xl text-orange-500 hover:text-orange-600 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v3a1 1 0 01-2 0V5zM20 5a1 1 0 00-1-1h-4a1 1 0 000 2h3v3a1 1 0 002 0V5zM4 19a1 1 0 001 1h4a1 1 0 000-2H6v-3a1 1 0 00-2 0v4zM20 19a1 1 0 01-1 1h-4a1 1 0 010-2h3v-3a1 1 0 012 0v4z" />
          </svg>
        </button>

        <button
          onClick={openWindowPicker}
          aria-label="Select window to capture"
          title="Capture Window"
          className="w-10 h-10 flex items-center justify-center glass-btn rounded-xl text-orange-500 hover:text-orange-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h16" />
          </svg>
        </button>
      </div>

      {/* Clear button */}
      {imageUrl && (
        <button
          onClick={() => {
            clearCanvas();
            clearAnnotations();
          }}
          aria-label="Clear current screenshot and annotations"
          className="px-4 py-2 glass-btn rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium text-sm flex-shrink-0"
        >
          Clear
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-7 bg-gray-300/50 dark:bg-gray-500/30 flex-shrink-0" />

      {/* Undo/Redo buttons */}
      <div className="flex-shrink-0">
        <UndoRedoButtons />
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-gray-300/50 dark:bg-gray-500/30 flex-shrink-0" />

      {/* Annotation Tools */}
      <div className="flex-shrink-0">
        <ToolButtons />
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-gray-300/50 dark:bg-gray-500/30 flex-shrink-0" />

      {/* Tool Settings */}
      <div className="flex-shrink-0">
        <ToolSettings />
      </div>

      {/* Error display */}
      {error && (
        <span role="alert" className="text-red-500 text-sm glass-flat px-2 py-1 rounded-lg">{error}</span>
      )}

      {/* Wayland warning */}
      {waylandWarning && (
        <span role="status" className="text-yellow-600 dark:text-yellow-400 text-sm glass-flat px-2 py-1 rounded-lg">{waylandWarning}</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        aria-label="Open settings"
        className="w-9 h-9 flex items-center justify-center glass-btn rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
        title="Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
