// ZoomControls - Zoom in/out and fit controls

import { useCanvasStore } from '../../stores/canvas-store';

const ZOOM_FACTOR = 1.1; // Consistent with canvas-editor

export function ZoomControls() {
  const { scale, setScale, resetView } = useCanvasStore();

  const zoomIn = () => setScale(scale * ZOOM_FACTOR);
  const zoomOut = () => setScale(scale / ZOOM_FACTOR);
  const zoomFit = () => resetView();

  return (
    <div className="absolute bottom-4 right-4 flex gap-2 bg-white rounded-lg shadow p-2">
      <button
        onClick={zoomOut}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="Zoom Out"
      >
        -
      </button>
      <span className="w-16 text-center text-sm leading-8">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={zoomIn}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={zoomFit}
        className="px-2 h-8 text-sm hover:bg-gray-100 rounded"
        title="Fit to Screen"
      >
        Fit
      </button>
    </div>
  );
}
