// ExportPanel - UI for export settings and actions

import { useExportStore } from '../../stores/export-store';
import { useExport } from '../../hooks/use-export';

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
  const { format, quality, pixelRatio, setFormat, setQuality, setPixelRatio } =
    useExportStore();

  const { copyToClipboard, quickSave, saveAs, isExporting, exportOperation } =
    useExport();

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="font-medium mb-3 text-gray-800">Export</h3>

      {/* Format selection */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Format</label>
        <div className="flex gap-2">
          <button
            onClick={() => setFormat('png')}
            disabled={isExporting}
            className={`flex-1 py-1 rounded text-sm transition-colors ${
              format === 'png'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            PNG
          </button>
          <button
            onClick={() => setFormat('jpeg')}
            disabled={isExporting}
            className={`flex-1 py-1 rounded text-sm transition-colors ${
              format === 'jpeg'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            JPEG
          </button>
        </div>
      </div>

      {/* JPEG quality slider */}
      {format === 'jpeg' && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">
            Quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={quality * 100}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            disabled={isExporting}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>
      )}

      {/* Resolution (pixelRatio) */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Resolution</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((ratio) => (
            <button
              key={ratio}
              onClick={() => setPixelRatio(ratio)}
              disabled={isExporting}
              className={`flex-1 py-1 rounded text-sm transition-colors ${
                pixelRatio === ratio
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ratio}x
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 mt-1 block">
          Higher = sharper on Retina displays
        </span>
      </div>

      {/* Action buttons with loading states */}
      <div className="space-y-2">
        <button
          onClick={quickSave}
          disabled={isExporting}
          className={`w-full py-2 bg-green-500 text-white rounded text-sm font-medium transition-colors ${
            isExporting
              ? 'opacity-70 cursor-not-allowed'
              : 'hover:bg-green-600'
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
          className={`w-full py-2 bg-blue-500 text-white rounded text-sm font-medium transition-colors ${
            isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
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
          className={`w-full py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors ${
            isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-300'
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
