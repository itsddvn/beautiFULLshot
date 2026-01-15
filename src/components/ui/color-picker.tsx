// ColorPicker - Custom color picker with saturation/brightness canvas and hue slider

import { useRef, useEffect, useCallback, useState } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Convert HSV to hex
function hsvToHex(h: number, s: number, v: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const vNorm = v / 100;

  const i = Math.floor(hNorm * 6);
  const f = hNorm * 6 - i;
  const p = vNorm * (1 - sNorm);
  const q = vNorm * (1 - f * sNorm);
  const t = vNorm * (1 - (1 - f) * sNorm);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = vNorm; g = t; b = p; break;
    case 1: r = q; g = vNorm; b = p; break;
    case 2: r = p; g = vNorm; b = t; break;
    case 3: r = p; g = q; b = vNorm; break;
    case 4: r = t; g = p; b = vNorm; break;
    case 5: r = vNorm; g = p; b = q; break;
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

type ColorMode = 'hex' | 'rgb' | 'hsl';

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#ff0000'));
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('hex');

  // Update HSV when external color changes
  useEffect(() => {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      const newHsv = hexToHsv(color);
      // Only update if significantly different to avoid loops
      if (Math.abs(newHsv.h - hsv.h) > 1 || Math.abs(newHsv.s - hsv.s) > 1 || Math.abs(newHsv.v - hsv.v) > 1) {
        setHsv(newHsv);
      }
    }
  }, [color]);

  // Draw saturation/value canvas
  const drawSVCanvas = useCallback(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create saturation gradient (left to right: white to pure hue)
    const satGradient = ctx.createLinearGradient(0, 0, width, 0);
    satGradient.addColorStop(0, '#ffffff');
    satGradient.addColorStop(1, hsvToHex(hsv.h, 100, 100));

    ctx.fillStyle = satGradient;
    ctx.fillRect(0, 0, width, height);

    // Create value gradient (top to bottom: transparent to black)
    const valGradient = ctx.createLinearGradient(0, 0, 0, height);
    valGradient.addColorStop(0, 'rgba(0,0,0,0)');
    valGradient.addColorStop(1, '#000000');

    ctx.fillStyle = valGradient;
    ctx.fillRect(0, 0, width, height);
  }, [hsv.h]);

  // Draw hue slider
  const drawHueCanvas = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.17, '#ffff00');
    gradient.addColorStop(0.33, '#00ff00');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(0.67, '#0000ff');
    gradient.addColorStop(0.83, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  // Redraw canvases
  useEffect(() => {
    drawSVCanvas();
    drawHueCanvas();
  }, [drawSVCanvas, drawHueCanvas]);

  // Handle SV canvas interaction
  const handleSVInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const newS = x * 100;
    const newV = (1 - y) * 100;

    setHsv(prev => ({ ...prev, s: newS, v: newV }));
    onChange(hsvToHex(hsv.h, newS, newV));
  }, [hsv.h, onChange]);

  // Handle hue slider interaction
  const handleHueInteraction = useCallback((clientX: number) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newH = x * 360;

    setHsv(prev => ({ ...prev, h: newH }));
    onChange(hsvToHex(newH, hsv.s, hsv.v));
  }, [hsv.s, hsv.v, onChange]);

  // Mouse handlers for SV canvas
  const handleSVMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSV(true);
    handleSVInteraction(e.clientX, e.clientY);
  };

  // Mouse handlers for hue slider
  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHue(true);
    handleHueInteraction(e.clientX);
  };

  // Global mouse move/up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSV) {
        handleSVInteraction(e.clientX, e.clientY);
      }
      if (isDraggingHue) {
        handleHueInteraction(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSV(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSV || isDraggingHue) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSV, isDraggingHue, handleSVInteraction, handleHueInteraction]);

  // Calculate picker positions
  const svPickerX = (hsv.s / 100) * 100;
  const svPickerY = (1 - hsv.v / 100) * 100;
  const huePickerX = (hsv.h / 360) * 100;

  // Get RGB and HSL values from current color
  const rgb = hexToRgb(color || '#000000');
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Cycle through color modes
  const cycleColorMode = () => {
    const modes: ColorMode[] = ['hex', 'rgb', 'hsl'];
    const currentIndex = modes.indexOf(colorMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setColorMode(modes[nextIndex]);
  };

  // Handle input changes based on mode
  const handleInputChange = (index: number, value: string) => {
    const num = parseInt(value) || 0;

    if (colorMode === 'rgb') {
      const clamped = Math.max(0, Math.min(255, num));
      const newRgb = { ...rgb };
      if (index === 0) newRgb.r = clamped;
      if (index === 1) newRgb.g = clamped;
      if (index === 2) newRgb.b = clamped;
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    } else if (colorMode === 'hsl') {
      const newHsl = { ...hsl };
      if (index === 0) newHsl.h = Math.max(0, Math.min(360, num));
      if (index === 1) newHsl.s = Math.max(0, Math.min(100, num));
      if (index === 2) newHsl.l = Math.max(0, Math.min(100, num));
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }
  };

  // Handle hex input change
  const handleHexChange = (value: string) => {
    let hex = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      if (hex.length === 7) {
        onChange(hex);
      }
    }
  };

  // Get labels and values for current mode
  const getModeData = () => {
    switch (colorMode) {
      case 'hex':
        return { labels: ['HEX'], values: [color], single: true };
      case 'rgb':
        return { labels: ['R', 'G', 'B'], values: [rgb.r, rgb.g, rgb.b], single: false };
      case 'hsl':
        return { labels: ['H', 'S', 'L'], values: [hsl.h, hsl.s, hsl.l], single: false };
    }
  };

  const modeData = getModeData();

  return (
    <div className="space-y-2">
      {/* Saturation/Value canvas */}
      <div className="relative">
        <canvas
          ref={svCanvasRef}
          width={200}
          height={120}
          className="w-full h-[120px] rounded-lg"
          onMouseDown={handleSVMouseDown}
        />
        {/* SV picker indicator */}
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none"
          style={{
            left: `calc(${svPickerX}% - 8px)`,
            top: `calc(${svPickerY}% - 8px)`,
            backgroundColor: color,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* Hue slider with eyedropper button */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <canvas
            ref={hueCanvasRef}
            width={200}
            height={16}
            className="w-full h-4 rounded-lg cursor-default"
            onMouseDown={handleHueMouseDown}
          />
          {/* Hue picker indicator */}
          <div
            className="absolute top-0 w-2 h-full border-2 border-white rounded pointer-events-none"
            style={{
              left: `calc(${huePickerX}% - 4px)`,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            }}
          />
        </div>
        {/* Eyedropper button - pick color from screen */}
        {'EyeDropper' in window && (
          <button
            onClick={async () => {
              try {
                // @ts-expect-error EyeDropper API
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                if (result?.sRGBHex) {
                  onChange(result.sRGBHex);
                }
              } catch {
                // User cancelled or API not supported
              }
            }}
            className="w-6 h-6 flex items-center justify-center rounded glass-btn text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            title="Pick color from screen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3l6 6m-6-6l-9.5 9.5a2.121 2.121 0 00-.5.8L4 18l4.7-1a2.121 2.121 0 00.8-.5L19 7m-4-4l2.5 2.5M7 21h10" />
            </svg>
          </button>
        )}
      </div>

      {/* Color preview and mode-switchable inputs */}
      <div className="flex gap-2 items-center">
        {/* Color preview */}
        <div
          className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Mode-switchable inputs - all modes use same column layout */}
        <div className="flex-1 flex gap-1">
          {modeData.single ? (
            /* HEX mode - single column with label on top */
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-gray-400 uppercase mb-0.5">HEX</span>
              <input
                type="text"
                value={color}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-full px-1 py-1 text-xs rounded glass-flat text-gray-800 dark:text-gray-100 font-mono text-center"
                placeholder="#000000"
              />
            </div>
          ) : (
            /* RGB/HSL mode - three columns with label on top, value below */
            modeData.labels.map((label, index) => (
              <div key={label} className="flex-1 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase mb-0.5">{label}</span>
                <input
                  type="number"
                  min="0"
                  max={colorMode === 'rgb' ? 255 : (index === 0 ? 360 : 100)}
                  value={modeData.values[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className="w-full px-1 py-1 text-xs rounded glass-flat text-gray-800 dark:text-gray-100 text-center"
                />
              </div>
            ))
          )}
        </div>

        {/* Mode switch button */}
        <button
          onClick={cycleColorMode}
          className="w-6 h-6 flex items-center justify-center rounded glass-btn text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          title={`Switch to ${colorMode === 'hex' ? 'RGB' : colorMode === 'rgb' ? 'HSL' : 'HEX'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
