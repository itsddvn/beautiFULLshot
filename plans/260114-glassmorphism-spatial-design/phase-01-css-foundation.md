---
title: "Phase 1: CSS Foundation"
status: pending
effort: 1h
---

# Phase 1: CSS Foundation

## Overview
Establish Tailwind CSS v4 utilities and CSS custom properties for glassmorphism and spatial design tokens.

## Context Links
- [Main Plan](./plan.md)
- Current styles: `src/styles.css`

## Key Insights
- Tailwind v4 uses `@theme` for custom properties
- backdrop-filter well-supported (97%+ browsers)
- CSS custom properties enable theme switching

## Requirements

### Functional
- Glass effect utility classes
- Spatial design tokens (gaps, shadows, radii)
- Light/dark mode glass variants

### Non-Functional
- Zero impact on existing functionality
- Minimal CSS bundle increase

## Implementation

### File: `src/styles.css`

Add after line 4 (after `@custom-variant dark`):

```css
/* ===========================================
   GLASSMORPHISM DESIGN TOKENS
   =========================================== */

/* Light mode glass */
:root {
  /* Glass backgrounds */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-bg-light: rgba(255, 255, 255, 0.5);
  --glass-bg-heavy: rgba(255, 255, 255, 0.9);

  /* Glass borders */
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-border-subtle: rgba(0, 0, 0, 0.06);

  /* Glass effects */
  --glass-blur: 16px;
  --glass-blur-heavy: 24px;

  /* Spatial design */
  --panel-radius: 16px;
  --panel-radius-sm: 12px;
  --panel-radius-lg: 20px;
  --panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --panel-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.15);
  --gap-layout: 12px;

  /* Canvas background for spatial effect */
  --canvas-bg: #e5e5e5;
}

/* Dark mode glass */
.dark {
  --glass-bg: rgba(30, 30, 30, 0.85);
  --glass-bg-light: rgba(40, 40, 40, 0.7);
  --glass-bg-heavy: rgba(20, 20, 20, 0.95);

  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-subtle: rgba(255, 255, 255, 0.05);

  --panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --panel-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.5);

  --canvas-bg: #1a1a1a;
}

/* ===========================================
   GLASSMORPHISM UTILITY CLASSES
   =========================================== */

/* Standard glass panel */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--panel-shadow);
}

/* Light glass variant */
.glass-light {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

/* Heavy glass (more opaque) */
.glass-heavy {
  background: var(--glass-bg-heavy);
  backdrop-filter: blur(var(--glass-blur-heavy));
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
  border: 1px solid var(--glass-border);
  box-shadow: var(--panel-shadow-lg);
}

/* Glass with no shadow (for nested elements) */
.glass-flat {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border-subtle);
}

/* ===========================================
   SPATIAL LAYOUT UTILITIES
   =========================================== */

/* Floating panel base */
.floating-panel {
  border-radius: var(--panel-radius);
  box-shadow: var(--panel-shadow);
}

/* Layout gaps */
.spatial-gap {
  gap: var(--gap-layout);
  padding: var(--gap-layout);
}

/* Canvas area background */
.canvas-area {
  background: var(--canvas-bg);
}

/* ===========================================
   ENHANCED BUTTON STATES
   =========================================== */

/* Glass button hover */
.glass-btn {
  background: var(--glass-bg-light);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border-subtle);
  transition: all 0.2s ease;
}

.glass-btn:hover {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .glass-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Active/selected glass button */
.glass-btn-active {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.4);
}

.dark .glass-btn-active {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}
```

## Todo List
- [ ] Add CSS custom properties for glass tokens
- [ ] Add glass utility classes
- [ ] Add spatial layout utilities
- [ ] Add enhanced button states
- [ ] Test in both light and dark modes
- [ ] Verify no existing styles break

## Success Criteria
- Glass utility classes available for use
- CSS variables work in both light/dark modes
- No breaking changes to existing UI

## Risk Assessment
- **Low**: CSS additions only, no modifications to existing rules
- **Mitigation**: Utility class approach = opt-in usage

## Next Steps
Proceed to [Phase 2: Layout Structure](./phase-02-layout-structure.md)
