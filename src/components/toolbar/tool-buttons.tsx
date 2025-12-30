// ToolButtons - Annotation tool selection buttons

import { useAnnotationStore } from '../../stores/annotation-store';
import type { ToolType } from '../../types/annotations';

// SVG icon components for crisp rendering
const Icons = {
  select: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  rectangle: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  ellipse: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="8" />
    </svg>
  ),
  freehand: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  line: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="10 5 19 5 19 14" />
    </svg>
  ),
  text: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  spotlight: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" fillOpacity="0.3" />
    </svg>
  ),
};

interface Tool {
  type: ToolType;
  icon: React.ReactNode;
  label: string;
}

const TOOLS: Tool[] = [
  { type: 'select', icon: Icons.select, label: 'Select' },
  { type: 'rectangle', icon: Icons.rectangle, label: 'Rectangle' },
  { type: 'ellipse', icon: Icons.ellipse, label: 'Ellipse' },
  { type: 'freehand', icon: Icons.freehand, label: 'Freehand' },
  { type: 'line', icon: Icons.line, label: 'Line' },
  { type: 'arrow', icon: Icons.arrow, label: 'Arrow' },
  { type: 'text', icon: Icons.text, label: 'Text' },
  { type: 'spotlight', icon: Icons.spotlight, label: 'Spotlight' },
];

export function ToolButtons() {
  const { currentTool, setTool } = useAnnotationStore();

  return (
    <div className="flex gap-1">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setTool(tool.type)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg ${
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
