// ExportPanel - UI for export settings and actions

import { useExportStore } from '../../stores/export-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { useExport } from '../../hooks/use-export';
import { OUTPUT_ASPECT_RATIOS } from '../../data/aspect-ratios';

/** Loading spinner component */
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 inline-block mr-1"
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

export function ExportPanel() {
  const {
    format,
    quality,
    pixelRatio,
    outputAspectRatio,
    setFormat,
    setQuality,
    setPixelRatio,
    setOutputAspectRatio,
  } = useExportStore();

  const fitToView = useCanvasStore((state) => state.fitToView);

  const { copyToClipboard, quickSave, saveAs, isExporting, exportOperation } =
    useExport();

  // Handle aspect ratio change with auto-fit
  const handleAspectRatioChange = (ratioId: string) => {
    setOutputAspectRatio(ratioId);
    // Auto-fit view after aspect ratio changes
    setTimeout(() => fitToView(), 0);
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Export</h3>

      {/* Format selection */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFormat('png')}
            disabled={isExporting}
            className={`flex-1 py-1 rounded text-sm font-medium transition-colors border ${
              format === 'png'
                ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            PNG
          </button>
          <button
            onClick={() => setFormat('jpeg')}
            disabled={isExporting}
            className={`flex-1 py-1 rounded text-sm font-medium transition-colors border ${
              format === 'jpeg'
                ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            JPEG
          </button>
        </div>
      </div>

      {/* JPEG quality slider */}
      {format === 'jpeg' && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={quality * 100}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            disabled={isExporting}
            className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>
      )}

      {/* Resolution (pixelRatio) */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Resolution</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((ratio) => (
            <button
              key={ratio}
              onClick={() => setPixelRatio(ratio)}
              disabled={isExporting}
              className={`flex-1 py-1 rounded text-sm font-medium transition-colors border ${
                pixelRatio === ratio
                  ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ratio}x
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
          Higher = sharper on Retina displays
        </span>
      </div>

      {/* Output aspect ratio selection */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Output Ratio
        </label>
        <div className="grid grid-cols-4 gap-1">
          {OUTPUT_ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => handleAspectRatioChange(ratio.id)}
              disabled={isExporting}
              className={`py-1.5 px-1 rounded text-xs font-medium transition-colors border ${
                outputAspectRatio === ratio.id
                  ? 'border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={ratio.name}
            >
              {ratio.id === 'auto' ? 'Auto' : ratio.id}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
          {OUTPUT_ASPECT_RATIOS.find((r) => r.id === outputAspectRatio)?.name || 'Auto'}
        </span>
      </div>

      {/* Action buttons with loading states */}
      <div className="space-y-2">
        <button
          onClick={quickSave}
          disabled={isExporting}
          className={`w-full py-2 border-2 border-orange-500 text-orange-500 rounded text-sm font-medium transition-colors ${
            isExporting
              ? 'opacity-70 cursor-not-allowed'
              : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
          }`}
        >
          {exportOperation === 'quickSave' ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            'Quick Save (Pictures)'
          )}
        </button>
        <button
          onClick={saveAs}
          disabled={isExporting}
          className={`w-full py-2 border-2 border-amber-600 text-amber-600 rounded text-sm font-medium transition-colors ${
            isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
        >
          {exportOperation === 'saveAs' ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            'Save As...'
          )}
        </button>
        <button
          onClick={copyToClipboard}
          disabled={isExporting}
          className={`w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors ${
            isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {exportOperation === 'clipboard' ? (
            <>
              <Spinner />
              Copying...
            </>
          ) : (
            'Copy to Clipboard'
          )}
        </button>
      </div>
    </div>
  );
}
