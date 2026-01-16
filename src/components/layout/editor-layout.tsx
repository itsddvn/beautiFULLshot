// EditorLayout - Main application layout with toolbar, canvas, and sidebar

import { useCallback, useEffect, useState } from 'react';
import { CanvasEditor } from '../canvas/canvas-editor';
import { ZoomControls } from '../canvas/zoom-controls';
import { Toolbar } from '../toolbar/toolbar';
import { Sidebar } from '../sidebar/sidebar';
import { WindowPickerModal } from '../capture/window-picker-modal';
import { MonitorPickerModal } from '../capture/monitor-picker-modal';
import { useUIStore } from '../../stores/ui-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { useCropStore } from '../../stores/crop-store';
import { logError } from '../../utils/logger';

// Helper: Load image and get dimensions
function loadImageFromBytes(bytes: Uint8Array): Promise<{ width: number; height: number }> {
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

export function EditorLayout() {
  const { isWindowPickerOpen, closeWindowPicker, isMonitorPickerOpen, closeMonitorPicker } = useUIStore();
  const { setImageFromBytes, fitToView } = useCanvasStore();
  const { clearCrop } = useCropStore();
  const [isDragging, setIsDragging] = useState(false);

  // Handle window capture with auto-fit
  const handleWindowCapture = useCallback(
    (bytes: Uint8Array, width: number, height: number) => {
      setImageFromBytes(bytes, width, height);
      // Auto-fit to view after capture
      setTimeout(() => fitToView(), 50);
    },
    [setImageFromBytes, fitToView]
  );

  // Handle image load from File/Blob
  const handleImageFile = useCallback(async (file: File | Blob) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const { width, height } = await loadImageFromBytes(bytes);
      clearCrop();
      setImageFromBytes(bytes, width, height);
      setTimeout(() => fitToView(), 50);
    } catch (e) {
      logError('EditorLayout:handleImageFile', e);
    }
  }, [clearCrop, setImageFromBytes, fitToView]);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleImageFile(file);
          }
          return;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImageFile]);

  // Handle drag-drop events (using native DOM events for Tauri compatibility)
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: globalThis.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        // Check MIME type or file extension (macOS Finder may not set MIME)
        const isImage = file.type.startsWith('image/') ||
          /\.(png|jpg|jpeg|gif|webp|bmp|svg|ico|tiff?)$/i.test(file.name);
        if (isImage) {
          await handleImageFile(file);
        }
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleImageFile]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden canvas-area spatial-gap">
      {/* Top toolbar - floating glass panel */}
      <Toolbar />

      {/* Main content area with spatial gaps */}
      <div className="flex-1 flex min-h-0 overflow-hidden gap-3">
        {/* Canvas area - central focus with rounded corners */}
        <div className="flex-1 relative min-w-0 overflow-hidden rounded-2xl">
          <CanvasEditor />
          <ZoomControls />
        </div>

        {/* Right sidebar - floating glass panel */}
        <Sidebar />
      </div>

      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="fixed inset-0 z-[9999] bg-orange-500/20 border-4 border-dashed border-orange-500 flex items-center justify-center pointer-events-none">
          <div className="glass-heavy rounded-2xl px-8 py-6 text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Drop image here</p>
          </div>
        </div>
      )}

      {/* Window picker modal */}
      <WindowPickerModal
        isOpen={isWindowPickerOpen}
        onClose={closeWindowPicker}
        onCapture={handleWindowCapture}
      />

      {/* Monitor picker modal for region capture */}
      <MonitorPickerModal
        isOpen={isMonitorPickerOpen}
        onClose={closeMonitorPicker}
      />
    </div>
  );
}
