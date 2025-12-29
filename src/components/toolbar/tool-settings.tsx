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

const STROKE_WIDTHS = [1, 2, 3, 5, 8];

export function ToolSettings() {
  const {
    strokeColor,
    fillColor,
    strokeWidth,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
  } = useAnnotationStore();

  return (
    <div className="flex items-center gap-3">
      {/* Stroke color */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Stroke:</label>
        <div className="flex gap-0.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={`stroke-${color}`}
              onClick={() => setStrokeColor(color)}
              className={`w-5 h-5 rounded border ${
                strokeColor === color ? 'ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Stroke color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Fill color */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Fill:</label>
        <div className="flex gap-0.5">
          <button
            onClick={() => setFillColor('transparent')}
            className={`w-5 h-5 rounded border ${
              fillColor === 'transparent' ? 'ring-2 ring-blue-500' : 'border-gray-300'
            }`}
            style={{
              background:
                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
            }}
            title="Transparent"
            aria-label="Transparent fill"
          />
          {PRESET_COLORS.slice(0, 6).map((color) => (
            <button
              key={`fill-${color}`}
              onClick={() => setFillColor(color + '40')} // 25% opacity
              className={`w-5 h-5 rounded border ${
                fillColor.startsWith(color) ? 'ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color + '40' }}
              title={color}
              aria-label={`Fill color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Width:</label>
        <div className="flex gap-0.5">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={`width-${width}`}
              onClick={() => setStrokeWidth(width)}
              className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                strokeWidth === width
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={`${width}px`}
              aria-label={`Stroke width ${width}px`}
            >
              {width}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
