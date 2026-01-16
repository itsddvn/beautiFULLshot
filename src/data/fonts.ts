// Font presets and configuration for text annotations
// Provides font families, sizes, and style presets for design/annotation use cases

export interface FontPreset {
  id: string;
  name: string;
  nameVi: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  description: string;
}

// Font families available (system fonts for cross-platform compatibility)
export const FONT_FAMILIES = [
  { id: 'arial', name: 'Arial', value: 'Arial, sans-serif' },
  { id: 'helvetica', name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { id: 'verdana', name: 'Verdana', value: 'Verdana, sans-serif' },
  { id: 'tahoma', name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { id: 'trebuchet', name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { id: 'georgia', name: 'Georgia', value: 'Georgia, serif' },
  { id: 'times', name: 'Times New Roman', value: '"Times New Roman", serif' },
  { id: 'courier', name: 'Courier New', value: '"Courier New", monospace' },
  { id: 'impact', name: 'Impact', value: 'Impact, sans-serif' },
  { id: 'comic', name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
] as const;

// Preset font sizes for quick selection
export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72] as const;

// Style presets for common design/annotation use cases
export const TEXT_STYLE_PRESETS: FontPreset[] = [
  {
    id: 'title',
    name: 'Title',
    nameVi: 'Tiêu đề',
    fontFamily: 'Arial, sans-serif',
    fontSize: 36,
    fontWeight: 'bold',
    fontStyle: 'normal',
    description: 'Large bold text for titles and headers',
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    nameVi: 'Phụ đề',
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    description: 'Medium text for subtitles',
  },
  {
    id: 'body',
    name: 'Body',
    nameVi: 'Nội dung',
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    description: 'Standard body text',
  },
  {
    id: 'caption',
    name: 'Caption',
    nameVi: 'Chú thích',
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'italic',
    description: 'Small italic text for captions',
  },
  {
    id: 'highlight',
    name: 'Highlight',
    nameVi: 'Nhấn mạnh',
    fontFamily: 'Arial, sans-serif',
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'normal',
    description: 'Bold emphasized text',
  },
  {
    id: 'callout',
    name: 'Callout',
    nameVi: 'Gọi chú ý',
    fontFamily: 'Impact, sans-serif',
    fontSize: 28,
    fontWeight: 'bold',
    fontStyle: 'normal',
    description: 'Eye-catching callout text',
  },
  {
    id: 'quote',
    name: 'Quote',
    nameVi: 'Trích dẫn',
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    fontWeight: 'normal',
    fontStyle: 'italic',
    description: 'Elegant italic quote text',
  },
  {
    id: 'code',
    name: 'Code',
    nameVi: 'Mã nguồn',
    fontFamily: '"Courier New", monospace',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    description: 'Monospace text for code snippets',
  },
  {
    id: 'label',
    name: 'Label',
    nameVi: 'Nhãn',
    fontFamily: 'Verdana, sans-serif',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'normal',
    description: 'Small bold labels for diagrams',
  },
  {
    id: 'watermark',
    name: 'Watermark',
    nameVi: 'Watermark',
    fontFamily: 'Arial, sans-serif',
    fontSize: 48,
    fontWeight: 'bold',
    fontStyle: 'italic',
    description: 'Large watermark text',
  },
];

// Default font settings
export const DEFAULT_FONT_SETTINGS = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontWeight: 'normal' as const,
  fontStyle: 'normal' as const,
  textDecoration: 'none' as const,
};

// Text effect preset type (simplified: normal or stroke)
export interface TextEffectPreset {
  id: string;
  name: string;
  nameVi: string;
  effect: 'none' | 'stroke';
  stroke?: string;
  strokeWidth?: number;
  description: string;
}

// Text effect presets: Normal or White stroke
export const TEXT_EFFECT_PRESETS: TextEffectPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    nameVi: 'Thường',
    effect: 'none',
    description: 'Plain text without effects',
  },
  {
    id: 'stroke',
    name: 'Outline',
    nameVi: 'Có viền',
    effect: 'stroke',
    stroke: '#ffffff',
    strokeWidth: 4,
    description: 'Text with white outline',
  },
];
