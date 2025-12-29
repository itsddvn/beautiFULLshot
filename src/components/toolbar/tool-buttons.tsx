// ToolButtons - Annotation tool selection buttons

import { useAnnotationStore } from '../../stores/annotation-store';
import type { ToolType } from '../../types/annotations';

interface Tool {
  type: ToolType;
  icon: string;
  label: string;
}

const TOOLS: Tool[] = [
  { type: 'select', icon: '↖', label: 'Select' },
  { type: 'rectangle', icon: '▢', label: 'Rectangle' },
  { type: 'ellipse', icon: '○', label: 'Ellipse' },
  { type: 'line', icon: '/', label: 'Line' },
  { type: 'arrow', icon: '→', label: 'Arrow' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'number', icon: '#', label: 'Number' },
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
          className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
            currentTool === tool.type
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
