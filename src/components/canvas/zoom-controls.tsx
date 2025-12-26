// ZoomControls - Zoom in/out and fit controls

import { useCanvasStore } from '../../stores/canvas-store';
import { ZOOM } from '../../constants/canvas';

export function ZoomControls() {
  const { scale, setScale, resetView } = useCanvasStore();

  const zoomIn = () => setScale(scale * ZOOM.FACTOR);
  const zoomOut = () => setScale(scale / ZOOM.FACTOR);
  const zoomFit = () => resetView();

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      role="group"
      aria-label="Zoom controls"
      className="absolute bottom-4 right-4 flex gap-2 bg-white rounded-lg shadow p-2"
    >
      <button
        onClick={zoomOut}
        aria-label="Zoom out"
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
      >
        -
      </button>
      <span
        aria-live="polite"
        aria-label={`Zoom level ${zoomPercent} percent`}
        className="w-16 text-center text-sm leading-8"
      >
        {zoomPercent}%
      </span>
      <button
        onClick={zoomIn}
        aria-label="Zoom in"
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
      >
        +
      </button>
      <button
        onClick={zoomFit}
        aria-label="Fit image to screen"
        className="px-2 h-8 text-sm hover:bg-gray-100 rounded"
      >
        Fit
      </button>
    </div>
  );
}
