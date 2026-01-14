// ToolButtons - Annotation tool selection buttons

import { useAnnotationStore } from '../../stores/annotation-store';
import type { ToolType } from '../../types/annotations';

interface Tool {
  type: ToolType;
  icon: React.ReactNode;
  label: string;
}

// Cursor/pointer SVG icon for Select tool
const CursorIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z" />
  </svg>
);

const TOOLS: Tool[] = [
  { type: 'select', icon: <CursorIcon />, label: 'Select' },
  { type: 'rectangle', icon: '▢', label: 'Rectangle' },
  { type: 'ellipse', icon: '○', label: 'Ellipse' },
  { type: 'line', icon: '/', label: 'Line' },
  { type: 'arrow', icon: '→', label: 'Arrow' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'number', icon: '#', label: 'Number' },
  { type: 'freehand', icon: '✎', label: 'Freehand' },
  { type: 'spotlight', icon: '◐', label: 'Spotlight' },
];

export function ToolButtons() {
  const { currentTool, setTool } = useAnnotationStore();

  return (
    <div className="flex gap-1">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setTool(tool.type)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
            currentTool === tool.type
              ? 'glass-btn glass-btn-active text-orange-500'
              : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          title={tool.label}
          aria-label={tool.label}
          aria-pressed={currentTool === tool.type}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
