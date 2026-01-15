// ToolButtons - Annotation tool selection buttons with Draw dropdown

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAnnotationStore } from '../../stores/annotation-store';
import type { ToolType } from '../../types/annotations';

interface Tool {
  type: ToolType;
  icon: React.ReactNode;
  label: string;
}

// SVG Icons for consistent styling
const SelectIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z" />
  </svg>
);

const RectangleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="1" />
  </svg>
);

const EllipseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="12" rx="9" ry="9" />
  </svg>
);

const LineIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="5" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="14 7 19 12 14 17" />
  </svg>
);

const TextIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 5v3h5.5v12h3V8H19V5H5z" />
  </svg>
);

const NumberIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none">1</text>
  </svg>
);

const FreehandIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
  </svg>
);

const SpotlightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" stroke="none" />
  </svg>
);

// Chevron down icon for dropdown
const ChevronDownIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Draw tools grouped in dropdown
const DRAW_TOOLS: Tool[] = [
  { type: 'rectangle', icon: <RectangleIcon />, label: 'Rectangle' },
  { type: 'ellipse', icon: <EllipseIcon />, label: 'Ellipse' },
  { type: 'line', icon: <LineIcon />, label: 'Line' },
  { type: 'arrow', icon: <ArrowIcon />, label: 'Arrow' },
  { type: 'freehand', icon: <FreehandIcon />, label: 'Freehand' },
];

export function ToolButtons() {
  const { currentTool, setTool } = useAnnotationStore();
  const [showDrawMenu, setShowDrawMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update menu position when opening
  useEffect(() => {
    if (showDrawMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [showDrawMenu]);

  // Close menu handler
  const closeMenu = () => setShowDrawMenu(false);

  // Check if current tool is a draw tool
  const isDrawToolActive = DRAW_TOOLS.some((t) => t.type === currentTool);
  const activeDrawTool = DRAW_TOOLS.find((t) => t.type === currentTool);

  // Handle draw tool selection
  const handleDrawToolSelect = (tool: Tool) => {
    setTool(tool.type);
    setShowDrawMenu(false);
  };

  return (
    <div className="flex gap-1">
      {/* Select tool */}
      <button
        onClick={() => setTool('select')}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
          currentTool === 'select'
            ? 'glass-btn glass-btn-active text-orange-500'
            : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
        }`}
        title="Select"
        aria-label="Select"
        aria-pressed={currentTool === 'select'}
      >
        <SelectIcon />
      </button>

      {/* Draw tools dropdown */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowDrawMenu(!showDrawMenu)}
          className={`h-9 px-2 flex items-center gap-1 rounded-xl text-base font-medium transition-all ${
            isDrawToolActive
              ? 'glass-btn glass-btn-active text-orange-500'
              : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          title="Draw tools"
          aria-label="Draw tools"
          aria-expanded={showDrawMenu}
        >
          {activeDrawTool ? activeDrawTool.icon : <RectangleIcon />}
          <ChevronDownIcon />
        </button>

        {/* Dropdown menu - Using Portal to avoid overflow/transform issues */}
        {showDrawMenu && createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={closeMenu}
            />
            <div
              className="fixed glass-heavy floating-panel rounded-xl p-1 z-[9999] min-w-[140px]"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              {DRAW_TOOLS.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => handleDrawToolSelect(tool)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    currentTool === tool.type
                      ? 'bg-orange-500/20 text-orange-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Text tool */}
      <button
        onClick={() => setTool('text')}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
          currentTool === 'text'
            ? 'glass-btn glass-btn-active text-orange-500'
            : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
        }`}
        title="Text"
        aria-label="Text"
        aria-pressed={currentTool === 'text'}
      >
        <TextIcon />
      </button>

      {/* Number tool */}
      <button
        onClick={() => setTool('number')}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
          currentTool === 'number'
            ? 'glass-btn glass-btn-active text-orange-500'
            : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
        }`}
        title="Number"
        aria-label="Number"
        aria-pressed={currentTool === 'number'}
      >
        <NumberIcon />
      </button>

      {/* Spotlight tool */}
      <button
        onClick={() => setTool('spotlight')}
        className={`w-9 h-9 flex items-center justify-center rounded-xl text-base font-medium transition-all ${
          currentTool === 'spotlight'
            ? 'glass-btn glass-btn-active text-orange-500'
            : 'glass-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
        }`}
        title="Spotlight"
        aria-label="Spotlight"
        aria-pressed={currentTool === 'spotlight'}
      >
        <SpotlightIcon />
      </button>
    </div>
  );
}
