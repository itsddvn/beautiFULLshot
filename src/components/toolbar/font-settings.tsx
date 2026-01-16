// FontSettings - Text styling controls for toolbar
// Shows font family, size, weight, style, and preset options

import { useState, useRef, useEffect } from 'react';
import { useAnnotationStore } from '../../stores/annotation-store';
import { FONT_FAMILIES, FONT_SIZES, TEXT_EFFECT_PRESETS } from '../../data/fonts';

// Custom dropdown component that shows each font in its own typeface
function FontFamilyDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current font name for display
  const currentFont = FONT_FAMILIES.find((f) => f.value === value) || FONT_FAMILIES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Font</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 flex items-center justify-between"
      >
        <span style={{ fontFamily: currentFont.value }}>{currentFont.name}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => {
                onChange(font.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1.5 text-left text-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors ${
                font.value === value ? 'bg-orange-50 dark:bg-orange-900/20' : ''
              }`}
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FontSettings() {
  const {
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    textDecoration,
    setFontSize,
    setFontFamily,
    setFontWeight,
    setFontStyle,
    setTextDecoration,
    textEffect,
    applyTextEffectPreset,
    selectedId,
    annotations,
  } = useAnnotationStore();

  // Get current values from selected text annotation if any
  const selectedAnnotation = selectedId
    ? annotations.find((a) => a.id === selectedId && a.type === 'text')
    : null;

  const currentFontSize = selectedAnnotation?.type === 'text' ? selectedAnnotation.fontSize : fontSize;
  const currentFontFamily = selectedAnnotation?.type === 'text' ? selectedAnnotation.fontFamily : fontFamily;
  const currentFontWeight = selectedAnnotation?.type === 'text' ? selectedAnnotation.fontWeight : fontWeight;
  const currentFontStyle = selectedAnnotation?.type === 'text' ? selectedAnnotation.fontStyle : fontStyle;
  const currentTextDecoration = selectedAnnotation?.type === 'text' ? selectedAnnotation.textDecoration : textDecoration;

  return (
    <div className="flex flex-col gap-3">
      {/* Text Effect Presets */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hiệu ứng</label>
        <div className="flex flex-wrap gap-1.5">
          {TEXT_EFFECT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyTextEffectPreset(preset)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                textEffect === preset.effect || (textEffect === 'none' && preset.id === 'normal')
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30'
              }`}
              title={preset.description}
            >
              {preset.nameVi}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family - Custom dropdown for font preview */}
      <FontFamilyDropdown
        value={currentFontFamily}
        onChange={setFontFamily}
      />

      {/* Font Size */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
          Size: {currentFontSize}px
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="8"
            max="72"
            value={currentFontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <select
            value={FONT_SIZES.includes(currentFontSize as typeof FONT_SIZES[number]) ? currentFontSize : ''}
            onChange={(e) => e.target.value && setFontSize(Number(e.target.value))}
            className="w-16 px-1 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option value="" disabled>
              {currentFontSize}
            </option>
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Font Style Toggles */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Format</label>
        <div className="flex gap-1">
          {/* Bold */}
          <button
            onClick={() => setFontWeight(currentFontWeight === 'bold' ? 'normal' : 'bold')}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              currentFontWeight === 'bold'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Bold (Ctrl+B)"
          >
            <span className="font-bold text-sm">B</span>
          </button>

          {/* Italic */}
          <button
            onClick={() => setFontStyle(currentFontStyle === 'italic' ? 'normal' : 'italic')}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              currentFontStyle === 'italic'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Italic (Ctrl+I)"
          >
            <span className="italic text-sm">I</span>
          </button>

          {/* Underline */}
          <button
            onClick={() => setTextDecoration(currentTextDecoration === 'underline' ? 'none' : 'underline')}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              currentTextDecoration === 'underline'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Underline (Ctrl+U)"
          >
            <span className="underline text-sm">U</span>
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => setTextDecoration(currentTextDecoration === 'line-through' ? 'none' : 'line-through')}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              currentTextDecoration === 'line-through'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Strikethrough"
          >
            <span className="line-through text-sm">S</span>
          </button>
        </div>
      </div>
    </div>
  );
}
