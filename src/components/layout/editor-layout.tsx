// EditorLayout - Main application layout with toolbar, canvas, and sidebar

import { useCallback } from 'react';
import { CanvasEditor } from '../canvas/canvas-editor';
import { ZoomControls } from '../canvas/zoom-controls';
import { Toolbar } from '../toolbar/toolbar';
import { Sidebar } from '../sidebar/sidebar';
import { WindowPickerModal } from '../capture/window-picker-modal';
import { useUIStore } from '../../stores/ui-store';
import { useCanvasStore } from '../../stores/canvas-store';

export function EditorLayout() {
  const { isWindowPickerOpen, closeWindowPicker } = useUIStore();
  const { setImageFromBytes, fitToView } = useCanvasStore();

  // Handle window capture with auto-fit
  const handleWindowCapture = useCallback(
    (bytes: Uint8Array, width: number, height: number) => {
      setImageFromBytes(bytes, width, height);
      // Auto-fit to view after capture
      setTimeout(() => fitToView(), 50);
    },
    [setImageFromBytes, fitToView]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          <CanvasEditor />
          <ZoomControls />
        </div>

        {/* Right sidebar */}
        <Sidebar />
      </div>

      {/* Window picker modal */}
      <WindowPickerModal
        isOpen={isWindowPickerOpen}
        onClose={closeWindowPicker}
        onCapture={handleWindowCapture}
      />
    </div>
  );
}
