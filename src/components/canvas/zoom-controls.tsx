// ZoomControls - Zoom in/out, fit controls, and quick copy button

import { useCanvasStore } from '../../stores/canvas-store';
import { useExport } from '../../hooks/use-export';
import { ZOOM } from '../../constants/canvas';

/** Copy icon SVG */
function CopyIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/** Loading spinner for copy button */
function CopySpinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function ZoomControls() {
  const { scale, setScale, fitToView } = useCanvasStore();
  const { copyToClipboard, isExporting, exportOperation } = useExport();

  const zoomIn = () => setScale(scale * ZOOM.FACTOR);
  const zoomOut = () => setScale(scale / ZOOM.FACTOR);
  const zoomFit = () => fitToView();

  const zoomPercent = Math.round(scale * 100);
  const isCopying = exportOperation === 'clipboard';

  return (
    <div
      role="group"
      aria-label="Zoom controls"
      className="absolute bottom-4 right-4 flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-2"
    >
      {/* Quick copy button */}
      <button
        onClick={copyToClipboard}
        disabled={isExporting}
        aria-label="Copy to clipboard"
        title="Copy to Clipboard"
        className={`w-8 h-8 flex items-center justify-center rounded text-orange-600 dark:text-orange-400 ${
          isExporting
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-orange-50 dark:hover:bg-orange-900/30'
        }`}
      >
        {isCopying ? <CopySpinner /> : <CopyIcon />}
      </button>

      {/* Separator */}
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />

      <button
        onClick={zoomOut}
        aria-label="Zoom out"
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-200"
      >
        -
      </button>
      <span
        aria-live="polite"
        aria-label={`Zoom level ${zoomPercent} percent`}
        className="w-16 text-center text-sm leading-8 text-gray-700 dark:text-gray-200"
      >
        {zoomPercent}%
      </span>
      <button
        onClick={zoomIn}
        aria-label="Zoom in"
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-200"
      >
        +
      </button>
      <button
        onClick={zoomFit}
        aria-label="Fit image to screen"
        className="px-2 h-8 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-200"
      >
        Fit
      </button>
    </div>
  );
}
