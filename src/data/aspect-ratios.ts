// Aspect ratio presets for cropping and export

export interface AspectRatio {
  id: string;
  name: string;
  ratio: number | null; // null = freeform/auto
  category?: 'general' | 'social';
}

// Crop aspect ratios (used in crop tool)
export const ASPECT_RATIOS: AspectRatio[] = [
  { id: 'free', name: 'Free', ratio: null, category: 'general' },
  { id: '1:1', name: '1:1 Square', ratio: 1, category: 'general' },
  { id: '4:3', name: '4:3', ratio: 4 / 3, category: 'general' },
  { id: '3:2', name: '3:2', ratio: 3 / 2, category: 'general' },
  { id: '16:9', name: '16:9 Widescreen', ratio: 16 / 9, category: 'general' },
  { id: '21:9', name: '21:9 Ultrawide', ratio: 21 / 9, category: 'general' },
  { id: '9:16', name: '9:16 Portrait', ratio: 9 / 16, category: 'general' },
  { id: '3:4', name: '3:4 Portrait', ratio: 3 / 4, category: 'general' },
];

// Output aspect ratios for export (includes social media presets)
export interface OutputAspectRatio {
  id: string;
  name: string;
  ratio: number | null; // null = auto (match screenshot)
  icon?: string; // emoji or icon identifier
}

export const OUTPUT_ASPECT_RATIOS: OutputAspectRatio[] = [
  // Auto - maintains original screenshot aspect ratio
  { id: 'auto', name: 'Auto', ratio: null, icon: '📐' },

  // Common social media ratios
  { id: '1:1', name: '1:1 Square', ratio: 1, icon: '⬜' },
  { id: '4:5', name: '4:5 Instagram', ratio: 4 / 5, icon: '📸' },
  { id: '9:16', name: '9:16 Stories', ratio: 9 / 16, icon: '📱' },
  { id: '16:9', name: '16:9 YouTube', ratio: 16 / 9, icon: '🎬' },
  { id: '2:1', name: '2:1 Twitter', ratio: 2, icon: '🐦' },
  { id: '1.91:1', name: '1.91:1 Facebook', ratio: 1.91, icon: '👤' },
  { id: '3:4', name: '3:4 Pinterest', ratio: 3 / 4, icon: '📌' },
];
