// EditorLayout - Main application layout with toolbar, canvas, and sidebar

import { CanvasEditor } from '../canvas/canvas-editor';
import { ZoomControls } from '../canvas/zoom-controls';
import { Toolbar } from '../toolbar/toolbar';
import { Sidebar } from '../sidebar/sidebar';

export function EditorLayout() {
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
    </div>
  );
}
