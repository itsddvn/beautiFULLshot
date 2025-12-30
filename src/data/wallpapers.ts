// Wallpaper presets for background beautification
// Using curated collection of beautiful, royalty-free wallpapers

export interface WallpaperCategory {
  id: string;
  name: string;
  icon?: string; // Optional icon identifier
}

export interface WallpaperPreset {
  id: string;
  name: string;
  categoryId: string;
  // Use data URLs for embedded wallpapers or external URLs
  // For production, these would be bundled assets
  url: string;
  thumbnailUrl?: string; // Optional smaller version for UI
  colors: string[]; // Dominant colors for fallback/preview
}

export const WALLPAPER_CATEGORIES: WallpaperCategory[] = [
  { id: 'favorites', name: 'Favorites', icon: 'star' },
  { id: 'macos', name: 'macOS', icon: 'apple' },
  { id: 'abstract', name: 'Abstract', icon: 'shapes' },
  { id: 'nature', name: 'Nature', icon: 'leaf' },
  { id: 'minimal', name: 'Minimal', icon: 'square' },
];

// Wallpaper presets using CSS gradients as fallback
// These simulate the look of popular wallpapers
// In production, replace with actual image URLs from public/wallpapers/
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  // macOS-inspired wallpapers (gradient simulations)
  {
    id: 'macos-ventura',
    name: 'Ventura',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    colors: ['#1a1a2e', '#16213e', '#0f3460'],
  },
  {
    id: 'macos-sonoma-light',
    name: 'Sonoma Light',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(180deg, #87CEEB 0%, #E0F4FF 50%, #FFF5E6 100%)',
    colors: ['#87CEEB', '#E0F4FF', '#FFF5E6'],
  },
  {
    id: 'macos-sonoma-dark',
    name: 'Sonoma Dark',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(180deg, #1a1a2e 0%, #2d2d44 50%, #3d3d5c 100%)',
    colors: ['#1a1a2e', '#2d2d44', '#3d3d5c'],
  },
  {
    id: 'macos-monterey',
    name: 'Monterey',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    id: 'macos-bigsur',
    name: 'Big Sur',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(135deg, #4158D0 0%, #C850C0 50%, #FFCC70 100%)',
    colors: ['#4158D0', '#C850C0', '#FFCC70'],
  },
  {
    id: 'macos-catalina',
    name: 'Catalina',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(180deg, #0c1445 0%, #1a237e 30%, #283593 60%, #3949ab 100%)',
    colors: ['#0c1445', '#1a237e', '#3949ab'],
  },
  {
    id: 'macos-mojave-day',
    name: 'Mojave Day',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(180deg, #ffecd2 0%, #fcb69f 50%, #ee9ca7 100%)',
    colors: ['#ffecd2', '#fcb69f', '#ee9ca7'],
  },
  {
    id: 'macos-mojave-night',
    name: 'Mojave Night',
    categoryId: 'macos',
    url: 'gradient:linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    colors: ['#0f0c29', '#302b63', '#24243e'],
  },

  // Abstract wallpapers
  {
    id: 'abstract-aurora',
    name: 'Aurora',
    categoryId: 'abstract',
    url: 'gradient:linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #5ee7df 75%, #667eea 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb', '#5ee7df'],
  },
  {
    id: 'abstract-neon',
    name: 'Neon Glow',
    categoryId: 'abstract',
    url: 'gradient:linear-gradient(45deg, #ff0080 0%, #7928ca 50%, #00d4ff 100%)',
    colors: ['#ff0080', '#7928ca', '#00d4ff'],
  },
  {
    id: 'abstract-fire',
    name: 'Fire',
    categoryId: 'abstract',
    url: 'gradient:linear-gradient(135deg, #f12711 0%, #f5af19 50%, #f093fb 100%)',
    colors: ['#f12711', '#f5af19', '#f093fb'],
  },
  {
    id: 'abstract-ocean',
    name: 'Ocean Wave',
    categoryId: 'abstract',
    url: 'gradient:linear-gradient(135deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)',
    colors: ['#0077b6', '#00b4d8', '#90e0ef'],
  },
  {
    id: 'abstract-sunset',
    name: 'Sunset Blaze',
    categoryId: 'abstract',
    url: 'gradient:linear-gradient(180deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
    colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
  },
  {
    id: 'abstract-cosmic',
    name: 'Cosmic',
    categoryId: 'abstract',
    url: 'gradient:radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    colors: ['#1a1a2e', '#16213e', '#0f3460'],
  },

  // Nature-inspired wallpapers
  {
    id: 'nature-forest',
    name: 'Forest',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(180deg, #134E5E 0%, #71B280 100%)',
    colors: ['#134E5E', '#71B280'],
  },
  {
    id: 'nature-sky',
    name: 'Clear Sky',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(180deg, #2980B9 0%, #6DD5FA 50%, #FFFFFF 100%)',
    colors: ['#2980B9', '#6DD5FA', '#FFFFFF'],
  },
  {
    id: 'nature-dusk',
    name: 'Dusk',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(180deg, #0f0c29 0%, #302b63 30%, #24243e 50%, #ff6b6b 80%, #feca57 100%)',
    colors: ['#0f0c29', '#302b63', '#ff6b6b', '#feca57'],
  },
  {
    id: 'nature-spring',
    name: 'Spring',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
    colors: ['#a8e063', '#56ab2f'],
  },
  {
    id: 'nature-autumn',
    name: 'Autumn',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(135deg, #f5af19 0%, #f12711 50%, #8B0000 100%)',
    colors: ['#f5af19', '#f12711', '#8B0000'],
  },
  {
    id: 'nature-winter',
    name: 'Winter',
    categoryId: 'nature',
    url: 'gradient:linear-gradient(180deg, #E0EAFC 0%, #CFDEF3 100%)',
    colors: ['#E0EAFC', '#CFDEF3'],
  },

  // Minimal wallpapers
  {
    id: 'minimal-white',
    name: 'Pure White',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    colors: ['#ffffff', '#f8f9fa'],
  },
  {
    id: 'minimal-black',
    name: 'Pure Black',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
    colors: ['#000000', '#1a1a1a'],
  },
  {
    id: 'minimal-gray',
    name: 'Soft Gray',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #e0e0e0 0%, #bdbdbd 100%)',
    colors: ['#e0e0e0', '#bdbdbd'],
  },
  {
    id: 'minimal-dark',
    name: 'Dark Mode',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #1f1f1f 0%, #2d2d2d 100%)',
    colors: ['#1f1f1f', '#2d2d2d'],
  },
  {
    id: 'minimal-cream',
    name: 'Cream',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)',
    colors: ['#fdfbfb', '#ebedee'],
  },
  {
    id: 'minimal-paper',
    name: 'Paper',
    categoryId: 'minimal',
    url: 'gradient:linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)',
    colors: ['#f5f5f5', '#e8e8e8'],
  },

  // Favorites (curated best ones)
  {
    id: 'fav-gradient-mesh',
    name: 'Mesh Gradient',
    categoryId: 'favorites',
    url: 'gradient:linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    id: 'fav-sunset',
    name: 'Golden Hour',
    categoryId: 'favorites',
    url: 'gradient:linear-gradient(180deg, #FF512F 0%, #F09819 50%, #FFEDBC 100%)',
    colors: ['#FF512F', '#F09819', '#FFEDBC'],
  },
  {
    id: 'fav-midnight',
    name: 'Midnight',
    categoryId: 'favorites',
    url: 'gradient:linear-gradient(180deg, #232526 0%, #414345 100%)',
    colors: ['#232526', '#414345'],
  },
  {
    id: 'fav-pastel',
    name: 'Pastel Dream',
    categoryId: 'favorites',
    url: 'gradient:linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ee9ca7 100%)',
    colors: ['#ffecd2', '#fcb69f', '#ee9ca7'],
  },
];

// Helper to get wallpapers by category
export function getWallpapersByCategory(categoryId: string): WallpaperPreset[] {
  return WALLPAPER_PRESETS.filter((w) => w.categoryId === categoryId);
}

// Helper to get a random wallpaper
export function getRandomWallpaper(): WallpaperPreset {
  const randomIndex = Math.floor(Math.random() * WALLPAPER_PRESETS.length);
  return WALLPAPER_PRESETS[randomIndex];
}

// Parse gradient URL to CSS
export function parseWallpaperUrl(url: string): { type: 'gradient' | 'image'; value: string } {
  if (url.startsWith('gradient:')) {
    return { type: 'gradient', value: url.replace('gradient:', '') };
  }
  return { type: 'image', value: url };
}
