// BackgroundPanel - UI for selecting background with tabs: Wallpaper, Gradient, Color, Image

import { useState, useRef, useCallback, useEffect } from 'react';
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
import { extractDominantColor } from '../../utils/color-extractor';

// Tab type mapping
type TabType = 'wallpaper' | 'gradient' | 'color' | 'image';

// Icons
const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
    autoColor,
    blurAmount,
    shadowBlur,
    cornerRadius,
    paddingPercent,
    imageLibrary,
    setGradient,
    setSolidColor,
    setTransparent,
    setAuto,
    setAutoColor,
    setWallpaper,
    setCustomImage,
    clearCustomImage,
    setBlurAmount,
    setShadowBlur,
    setCornerRadius,
    setPaddingPercent,
    loadLibrary,
    selectFromLibrary,
    removeFromLibrary,
    clearLibrary,
  } = useBackgroundStore();

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const { imageUrl, fitToView } = useCanvasStore();
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
  const [activeCategory, setActiveCategory] = useState('professional');

  // Auto-extract dominant color when image changes
  useEffect(() => {
    if (imageUrl) {
      extractDominantColor(imageUrl)
        .then((color) => {
          setAutoColor(color);
        })
        .catch(() => {
          setAutoColor('#808080'); // Fallback gray
        });
    }
  }, [imageUrl, setAutoColor]);

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
    if (wp.thumbnailUrl) {
      return {
        backgroundImage: `url(${wp.thumbnailUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
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
    <div className="p-3 glass-flat rounded-xl mb-2">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Background</h3>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-4 glass-flat rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
              ? 'glass-btn glass-btn-active text-orange-500'
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${activeCategory === category.id
                  ? 'bg-gray-700 text-white dark:bg-gray-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {category.id === 'professional' && <BriefcaseIcon />}
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
                className={`aspect-square rounded-lg overflow-hidden transition-all ${type === 'wallpaper' && wallpaper?.id === wp.id
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
              className={`w-8 h-8 rounded transition-all ${type === 'gradient' && gradient?.id === preset.id
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
          {/* Auto color option */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Auto (from screenshot)</p>
            <button
              onClick={setAuto}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${type === 'auto'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              title="Auto color from screenshot"
            >
              <div
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                style={{ background: autoColor || '#808080' }}
              />
              <div className="text-left">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {autoColor || 'Calculating...'}
                </p>
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">Solid Colors</p>
          <div className="flex flex-wrap gap-2">
            {SOLID_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSolidColor(c.color)}
                className={`w-8 h-8 rounded border border-gray-300 dark:border-gray-600 transition-all ${type === 'solid' && solidColor === c.color
                  ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                  : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                style={{ background: c.color }}
                title={c.name}
              />
            ))}
            <button
              onClick={setTransparent}
              className={`w-8 h-8 rounded border border-gray-300 dark:border-gray-600 transition-all ${type === 'transparent'
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
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${type === 'image' && customImageUrl
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
          >
            {type === 'image' && customImageUrl ? (
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded bg-cover bg-center"
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
                  Click to select or drop image
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

          {/* Image Library */}
          {imageLibrary.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recent Images</p>
                <button
                  onClick={clearLibrary}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {imageLibrary.map((img) => (
                  <div key={img.id} className="relative group">
                    <button
                      onClick={() => selectFromLibrary(img.id)}
                      className="w-full aspect-square rounded-lg overflow-hidden bg-cover bg-center border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                      style={{ backgroundImage: `url(${img.thumbnail})` }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromLibrary(img.id);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background blur slider - always visible */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Background blur: {blurAmount}px
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={blurAmount}
          onChange={(e) => setBlurAmount(Number(e.target.value))}
          className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Shadow blur slider - always visible */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Shadow: {shadowBlur}px
        </label>
        <input
          type="range"
          min="0"
          max="500"
          value={shadowBlur}
          onChange={(e) => setShadowBlur(Number(e.target.value))}
          className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Corner radius slider - always visible */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Corner Radius: {cornerRadius}px
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={cornerRadius}
          onChange={(e) => setCornerRadius(Number(e.target.value))}
          className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Padding slider - always visible */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
          Padding: {paddingPercent}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={paddingPercent}
          onChange={(e) => handlePaddingChange(Number(e.target.value))}
          className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
