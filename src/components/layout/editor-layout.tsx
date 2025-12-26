// EditorLayout - Main application layout with toolbar and canvas

import { CanvasEditor } from '../canvas/canvas-editor';
import { ZoomControls } from '../canvas/zoom-controls';
import { Toolbar } from '../toolbar/toolbar';

export function EditorLayout() {
  return (
    <div className="h-screen flex flex-col">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main canvas area */}
      <div className="flex-1 relative">
        <CanvasEditor />
        <ZoomControls />
      </div>
    </div>
  );
}
