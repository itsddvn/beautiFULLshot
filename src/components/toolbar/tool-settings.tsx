// ToolSettings - Color and stroke settings for annotation tools

import { useAnnotationStore } from '../../stores/annotation-store';

const PRESET_COLORS = [
  '#ff0000', // Red
  '#ff6600', // Orange
  '#ffcc00', // Yellow
  '#00cc00', // Green
  '#0066ff', // Blue
  '#9933ff', // Purple
  '#000000', // Black
  '#ffffff', // White
];

const STROKE_WIDTHS = [3, 6, 9, 12, 15];

export function ToolSettings() {
  const {
    strokeColor,
    strokeWidth,
    setStrokeColor,
    setStrokeWidth,
  } = useAnnotationStore();

  return (
    <div className="flex items-center gap-3">
      {/* Stroke color */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 dark:text-gray-400">Color:</label>
        <div className="flex gap-0.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={`stroke-${color}`}
              onClick={() => setStrokeColor(color)}
              className={`w-6 h-6 rounded-md border ${
                strokeColor === color ? 'ring-2 ring-orange-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Stroke color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500 dark:text-gray-400">Width:</label>
        <div className="flex gap-0.5">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={`width-${width}`}
              onClick={() => setStrokeWidth(width)}
              className={`w-7 h-7 flex items-center justify-center rounded-md border ${
                strokeWidth === width
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-transparent bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={`${width}px`}
              aria-label={`Stroke width ${width}px`}
            >
              <span
                className={`rounded-full ${
                  strokeWidth === width ? 'bg-orange-500' : 'bg-gray-700 dark:bg-gray-200'
                }`}
                style={{
                  // Scale from 6px (for 3) to 18px (for 15) proportionally
                  width: `${6 + (width / 15) * 12}px`,
                  height: `${6 + (width / 15) * 12}px`,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
