// BackgroundPanel - UI for selecting background with tabs: Wallpaper, Gradient, Color, Image

import { useState, useRef, useCallback } from 'react';
import { GRADIENT_PRESETS, SOLID_COLORS } from '../../data/gradients';
import {
  WALLPAPER_CATEGORIES,
  WALLPAPER_PRESETS,
  getWallpapersByCategory,
  getRandomWallpaper,
  parseWallpaperUrl,
} from '../../data/wallpapers';
import { useBackgroundStore } from '../../stores/background-store';
import { useCanvasStore } from '../../stores/canvas-store';

// Tab type mapping
type TabType = 'wallpaper' | 'gradient' | 'color' | 'image';

// Icons
const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function BackgroundPanel() {
  const {
    type,
    gradient,
    solidColor,
    wallpaper,
    customImageUrl,
    blurAmount,
    shadowBlur,
    cornerRadius,
    paddingPercent,
    setGradient,
    setSolidColor,
    setTransparent,
    setWallpaper,
    setCustomImage,
    clearCustomImage,
    setBlurAmount,
    setShadowBlur,
    setCornerRadius,
    setPaddingPercent,
  } = useBackgroundStore();

  const { fitToView } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (type === 'wallpaper') return 'wallpaper';
    if (type === 'gradient') return 'gradient';
    if (type === 'solid' || type === 'transparent') return 'color';
    if (type === 'image') return 'image';
    return 'wallpaper';
  });

  // Active wallpaper category
  const [activeCategory, setActiveCategory] = useState('favorites');

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Update padding and re-fit view
  const handlePaddingChange = (percent: number) => {
    setPaddingPercent(percent);
    fitToView();
  };

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === 'string') {
        // Create blob URL for display
        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);

        // Read as bytes for persistence
        const arrayReader = new FileReader();
        arrayReader.onload = (ae) => {
          const bytes = ae.target?.result;
          if (bytes instanceof ArrayBuffer) {
            setCustomImage(url, new Uint8Array(bytes));
          }
        };
        arrayReader.readAsArrayBuffer(file);
      }
    };
    reader.readAsDataURL(file);
  }, [setCustomImage]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };


  // Pick random wallpaper
  const handleRandomWallpaper = () => {
    const random = getRandomWallpaper();
    setWallpaper(random);
  };

  // Get wallpaper thumbnail style
  const getWallpaperStyle = (wp: typeof WALLPAPER_PRESETS[0]) => {
    const parsed = parseWallpaperUrl(wp.url);
    if (parsed.type === 'gradient') {
      return { background: parsed.value };
    }
    return { background: `linear-gradient(135deg, ${wp.colors.join(', ')})` };
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'wallpaper', label: 'Wallpaper' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'color', label: 'Color' },
    { id: 'image', label: 'Image' },
  ];

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Background</h3>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white dark:bg-gray-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Wallpaper Tab */}
      {activeTab === 'wallpaper' && (
        <div className="space-y-3">
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {WALLPAPER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? 'bg-gray-700 text-white dark:bg-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.id === 'favorites' && <StarIcon />}
                {category.name}
              </button>
            ))}
          </div>

          {/* Random wallpaper button */}
          <button
            onClick={handleRandomWallpaper}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <SparklesIcon />
            <span className="text-sm">Pick random wallpaper</span>
          </button>

          {/* Wallpaper grid */}
          <div className="grid grid-cols-4 gap-2">
            {getWallpapersByCategory(activeCategory).map((wp) => (
              <button
                key={wp.id}
                onClick={() => setWallpaper(wp)}
                className={`aspect-square rounded-lg overflow-hidden transition-all ${
                  type === 'wallpaper' && wallpaper?.id === wp.id
                    ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                    : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                }`}
                style={getWallpaperStyle(wp)}
                title={wp.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient Tab */}
      {activeTab === 'gradient' && (
        <div className="grid grid-cols-6 gap-2">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setGradient(preset)}
              className={`w-8 h-8 rounded transition-all ${
                type === 'gradient' && gradient?.id === preset.id
                  ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                  : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
              style={{
                background: `linear-gradient(${preset.angle || 135}deg, ${preset.colors.join(', ')})`,
              }}
              title={preset.name}
            />
          ))}
        </div>
      )}

      {/* Color Tab */}
      {activeTab === 'color' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Solid Colors</p>
          <div className="flex flex-wrap gap-2">
            {SOLID_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSolidColor(c.color)}
                className={`w-8 h-8 rounded border border-gray-300 dark:border-gray-600 transition-all ${
                  type === 'solid' && solidColor === c.color
                    ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                    : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                }`}
                style={{ background: c.color }}
                title={c.name}
              />
            ))}
            <button
              onClick={setTransparent}
              className={`w-8 h-8 rounded border border-gray-300 dark:border-gray-600 transition-all ${
                type === 'transparent'
                  ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                  : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
              style={{
                background: 'repeating-linear-gradient(45deg, #ccc, #ccc 3px, #fff 3px, #fff 6px)',
              }}
              title="Transparent"
            />
          </div>

          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">Custom color</span>
          </div>
        </div>
      )}

      {/* Image Tab */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Background Image</p>

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              type === 'image' && customImageUrl
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {type === 'image' && customImageUrl ? (
              <div className="space-y-2">
                <div
                  className="w-full h-16 rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${customImageUrl})` }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to change image
                </p>
              </div>
            ) : (
              <>
                <ImageIcon />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Click to select, drop image, or press ⌘V while hovering.
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Clear image button */}
          {type === 'image' && customImageUrl && (
            <button
              onClick={clearCustomImage}
              className="w-full py-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              Remove background image
            </button>
          )}
        </div>
      )}

      {/* Background blur slider - always visible */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Background blur: {blurAmount}px
        </label>
        <input
          type="range"
          min="0"
          max="500"
          value={blurAmount}
          onChange={(e) => setBlurAmount(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Shadow blur slider - always visible */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Shadow: {shadowBlur}px
        </label>
        <input
          type="range"
          min="0"
          max="500"
          value={shadowBlur}
          onChange={(e) => setShadowBlur(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Corner radius slider - always visible */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Corner Radius: {cornerRadius}px
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={cornerRadius}
          onChange={(e) => setCornerRadius(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Padding slider - always visible */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Padding: {paddingPercent}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={paddingPercent}
          onChange={(e) => handlePaddingChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
