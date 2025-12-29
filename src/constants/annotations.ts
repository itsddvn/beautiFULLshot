// Annotation default values and constants

export const ANNOTATION_DEFAULTS = {
  NUMBER: {
    RADIUS: 15,
    FONT_SIZE: 14,
    TEXT_COLOR: '#ffffff',
  },
  ARROW: {
    POINTER_LENGTH: 10,
    POINTER_WIDTH: 10,
  },
  SPOTLIGHT: {
    OPACITY: 0.5,
    DIMMED_COLOR: 'rgba(0,0,0,0.5)',
  },
  TRANSFORMER: {
    MIN_SIZE: 10,
    MIN_SHAPE_SIZE: 5,
    MIN_SPOTLIGHT_SIZE: 20,
    MIN_FONT_SIZE: 8,
  },
  TEXT: {
    MAX_LENGTH: 500,
  },
  SHAPE: {
    MIN_DRAW_SIZE: 5,
  },
} as const;

// Default canvas fallback dimensions
export const CANVAS_FALLBACK = {
  WIDTH: 1920,
  HEIGHT: 1080,
} as const;
