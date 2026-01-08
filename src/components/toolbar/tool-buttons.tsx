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
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-medium ${
            currentTool === tool.type
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
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
