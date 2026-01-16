// ToolSettings - Color and stroke settings for annotation tools

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAnnotationStore } from '../../stores/annotation-store';
import { ColorPicker } from '../ui/color-picker';

const PRESET_COLORS = [
  '#ff0000', // Red
  '#ff6600', // Orange
  '#ffcc00', // Yellow
  '#00cc00', // Green
  '#0066ff', // Blue
  '#000000', // Black
  '#ffffff', // White
];

export function ToolSettings() {
  const {
    strokeColor,
    strokeWidth,
    setStrokeColor,
    setStrokeWidth,
  } = useAnnotationStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  const closeColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Stroke color - single row */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 dark:text-gray-400">Color:</label>
        <div className="flex gap-0.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={`stroke-${color}`}
              onClick={() => setStrokeColor(color)}
              className={`w-5 h-5 rounded border cursor-pointer ${
                strokeColor === color ? 'ring-2 ring-orange-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Stroke color ${color}`}
            />
          ))}
          {/* Custom color picker button */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`w-5 h-5 rounded border-2 border-dashed flex items-center justify-center transition-all hover:scale-105 cursor-pointer ${
              !PRESET_COLORS.includes(strokeColor)
                ? 'ring-2 ring-orange-500 border-orange-500'
                : 'border-gray-400 dark:border-gray-500'
            }`}
            style={{
              backgroundColor: !PRESET_COLORS.includes(strokeColor) ? strokeColor : 'transparent',
            }}
            title="Custom color"
            aria-label="Pick custom color"
          >
            {PRESET_COLORS.includes(strokeColor) && (
              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Color Picker Modal - Using Portal */}
      {showColorPicker && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={closeColorPicker}
          />
          <div
            className="fixed z-[9999] glass-heavy rounded-2xl shadow-2xl w-[260px] p-4"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Pick Color</p>
              <button
                onClick={closeColorPicker}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ColorPicker color={strokeColor} onChange={setStrokeColor} />
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={`picker-${color}`}
                    onClick={() => setStrokeColor(color)}
                    className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 cursor-pointer ${
                      strokeColor === color ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            {/* OK Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeColorPicker}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Stroke width - horizontal slider */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 dark:text-gray-400">Width:</label>
        <input
          type="range"
          min="1"
          max="100"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-20 h-1.5 cursor-pointer"
          title={`${strokeWidth}px`}
        />
        <span className="text-xs text-gray-600 dark:text-gray-300 w-8 text-right">{strokeWidth}px</span>
      </div>
    </div>
  );
}
