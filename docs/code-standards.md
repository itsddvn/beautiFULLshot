# BeautyShot - Code Standards & Guidelines

## Overview

This document establishes code quality standards, naming conventions, and best practices for the BeautyShot codebase. All contributions must adhere to these standards to maintain consistency and maintainability.

---

## Directory Structure

```
src/
├── components/                # React components (feature-organized)
│   ├── canvas/               # Canvas-related components
│   │   ├── canvas-editor.tsx
│   │   └── zoom-controls.tsx
│   ├── layout/               # Layout components
│   │   └── editor-layout.tsx
│   ├── toolbar/              # Toolbar components
│   │   └── toolbar.tsx
│   └── .gitkeep
├── hooks/                     # Custom React hooks
│   ├── use-image.ts          # Image loading hook
│   ├── use-screenshot.ts     # Screenshot capture hook
│   └── .gitkeep
├── stores/                    # Zustand state stores
│   ├── canvas-store.ts       # Canvas state management
│   └── .gitkeep
├── types/                     # TypeScript type definitions
│   ├── screenshot.ts         # Screenshot-related types
│   └── .gitkeep
├── utils/                     # Utility functions
│   ├── screenshot-api.ts     # Screenshot API wrapper
│   └── .gitkeep
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── styles.css                 # Global styles
└── vite-env.d.ts             # Vite environment types
```

### Organization Rules
- **Components:** One file per component, organized by feature domain
- **Hooks:** Custom hooks grouped by responsibility
- **Stores:** Separate file per store (Zustand)
- **Types:** Centralized type definitions by domain
- **Utils:** Pure functions, no React dependencies

---

## Naming Conventions

### TypeScript Files
- **Components:** PascalCase (e.g., `CanvasEditor.tsx`, `ZoomControls.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useImage.ts`, `useScreenshot.ts`)
- **Stores:** camelCase with suffix (e.g., `canvas-store.ts`)
- **Types:** PascalCase (e.g., `screenshot.ts` contains `WindowInfo`, `ImageData`)
- **Utils:** camelCase (e.g., `screenshot-api.ts`)

### Variables & Functions
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_SCALE`, `MIN_SCALE`, `ZOOM_FACTOR`)
- **Functions:** `camelCase` (e.g., `captureFullscreen()`, `getImageDimensions()`)
- **Event handlers:** `handle<Action>` (e.g., `handleWheel`, `handleDragEnd`, `handleCaptureFullscreen`)
- **State variables:** `camelCase` (e.g., `imageUrl`, `scale`, `position`)
- **React state setters:** `set<Property>` (e.g., `setImageFromBytes`, `setScale`)

### Class & Interface Names
- **Interfaces:** PascalCase (e.g., `CanvasState`, `WindowInfo`)
- **Type Aliases:** PascalCase (e.g., `ImageStatus`)
- **Enums:** PascalCase (e.g., `CaptureMode`)

### CSS Classes
- **Tailwind utilities:** Use utility-first approach (e.g., `flex-1`, `bg-gray-100`, `px-4`)
- **Custom classes:** kebab-case in CSS modules (if needed)

---

## TypeScript Standards

### Type Safety
- **Strict Mode:** `"strict": true` in `tsconfig.json`
- **No `any`:** Use `unknown` with type narrowing if necessary
- **No implicit `any`:** All function parameters and returns must have explicit types
- **Type Imports:** Use `type` keyword for type-only imports (ES modules optimization)

```typescript
// Good
import type { WindowInfo } from '../../types/screenshot';
import { useCallback } from 'react';

// Avoid
import { WindowInfo } from '../../types/screenshot';
import * as React from 'react';
```

### Function Types
```typescript
// Good: Explicit return type
export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  // ...
}

// Good: Event handler type
const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
  // ...
}, [dependencies]);
```

### Generic Types
- Use meaningful type variable names (not just `T`, `U`)
- Document generic constraints when complex

```typescript
// Good
interface Store<TState> {
  getState: () => TState;
  setState: (state: TState) => void;
}
```

---

## React Component Standards

### Component Structure
```typescript
// Good: Clear component structure
import { useState, useCallback } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import type { WindowInfo } from '../../types/screenshot';

export function ComponentName() {
  // 1. Hooks
  const { property, action } = useCanvasStore();
  const [local, setLocal] = useState<Type>(initial);

  // 2. Callbacks
  const handleAction = useCallback(() => {
    // ...
  }, [dependencies]);

  // 3. Effects (if needed)
  // useEffect(() => { ... }, [deps]);

  // 4. Render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### Hook Rules
- Extract logic into custom hooks
- Use `useCallback` for event handlers to prevent re-renders
- Use `useEffect` only when necessary; prefer hooks for state
- Clean up side effects in effect cleanup functions

```typescript
// Good: Custom hook
export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    // ... loading logic

    return () => {
      // Cleanup
    };
  }, [url]);

  return [image, status];
}
```

### Props & Interfaces
```typescript
// Good: Explicit props interface
interface CanvasEditorProps {
  imageUrl: string | null;
  onZoom?: (scale: number) => void;
}

export function CanvasEditor({ imageUrl, onZoom }: CanvasEditorProps) {
  // ...
}

// Avoid: Inline props type
export function CanvasEditor(props: any) { }
```

---

## State Management (Zustand)

### Store Structure
```typescript
// Good: Clear store structure with types
import { create } from 'zustand';

interface CanvasState {
  // State properties
  imageUrl: string | null;
  imageBytes: Uint8Array | null;

  // Actions
  setImageFromBytes: (bytes: Uint8Array, width: number, height: number) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  imageUrl: null,
  imageBytes: null,

  // Actions
  setImageFromBytes: (bytes, width, height) => {
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    set({ imageUrl: bytesToUrl(bytes), imageBytes: bytes });
  },

  clearCanvas: () => {
    const oldUrl = get().imageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    set({ imageUrl: null, imageBytes: null });
  },
}));
```

### Store Rules
- One file per store
- Group related state and actions together
- Document state properties with JSDoc comments
- Include memory cleanup (URL revocation, event listener cleanup)

---

## Error Handling

### Try-Catch Pattern
```typescript
// Good: Specific error handling
const handleCaptureFullscreen = useCallback(async () => {
  try {
    const bytes = await captureFullscreen();
    if (bytes) {
      const { width, height } = await getImageDimensions(bytes);
      setImageFromBytes(bytes, width, height);
    }
  } catch (e) {
    console.error('Failed to capture fullscreen:', e);
    setError('Screenshot failed. Check permissions.');
  }
}, [captureFullscreen, setImageFromBytes]);
```

### Error Messages
- User-facing: Clear, actionable messages
- Console: Detailed error context with component/function name
- Never silent failures; always log or display

```typescript
// Good error logging
console.error('Failed to get image dimensions:', e);
console.warn('Wayland detected; screenshot may have limitations');

// Avoid
console.log('error');  // Too vague
console.error(e);      // No context
```

---

## CSS & Tailwind Standards

### Tailwind Usage
- Use utility-first approach
- Avoid custom CSS unless necessary
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Use dark mode classes: `dark:bg-gray-800`

```tsx
// Good
<div className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900">
  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
    Click me
  </button>
</div>

// Avoid
<div style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
  <button style={{ padding: '8px 16px' }}>Click me</button>
</div>
```

### Common Tailwind Classes
| Purpose | Classes |
|---------|---------|
| **Layout** | `flex`, `grid`, `h-screen`, `w-full` |
| **Spacing** | `px-4`, `py-2`, `gap-2`, `m-4` |
| **Colors** | `bg-gray-100`, `text-blue-600`, `border-red-400` |
| **Interactive** | `hover:bg-gray-200`, `disabled:opacity-50` |
| **Responsive** | `md:flex-col`, `lg:px-8` |

---

## Documentation Standards

### Comments
- Use JSDoc for exported functions and components
- Inline comments for non-obvious logic only
- Update comments when code changes

```typescript
/**
 * Load image from URL and track loading status
 * @param url - Image URL to load
 * @returns [image element, loading status]
 */
export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  // Implementation
}
```

### File Headers
```typescript
// <Brief description of what this component/function does>
// <Additional context if needed>

import { ... };

// Component/function code
```

### Commit Messages
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Scope: feature/component name
- Description: imperative, present tense

```
feat(canvas-editor): implement zoom with mouse wheel
fix(toolbar): prevent multiple captures during loading
docs(code-standards): add type safety guidelines
```

---

## Performance Guidelines

### React Optimization
- Use `useCallback` for event handlers passed to children
- Memoize expensive computations with `useMemo` if needed
- Avoid creating objects/arrays in render

```typescript
// Good: useCallback for event handler
const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
  // ...
}, [scale, position, setScale, setPosition]);

// Bad: Function recreated on every render
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  // ...
};
```

### Memory Management
- Revoke blob URLs when no longer needed
- Clean up event listeners in effect cleanup
- Clear Uint8Array references when replacing images

```typescript
// Good: Memory cleanup
const oldUrl = get().imageUrl;
if (oldUrl) URL.revokeObjectURL(oldUrl);  // Prevent memory leak

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);  // Cleanup
}, []);
```

### Bundle Size
- Tree-shake unused code (ES modules)
- Lazy load heavy libraries if needed
- Use type-only imports for types

---

## Testing Guidelines

### Unit Tests (To be implemented)
- Test hooks in isolation
- Test store actions independently
- Test component props validation
- Aim for > 80% coverage

### Integration Tests (To be implemented)
- Test capture → store → render flow
- Test zoom/pan interactions
- Test error handling

### E2E Tests (To be implemented)
- Test complete screenshot workflow
- Test export functionality
- Cross-platform validation

---

## Security Standards

### Screenshot Data
- Store only in memory (Uint8Array in Zustand)
- Never cache to disk without user consent
- Revoke blob URLs after use to free memory
- No network transmission (offline-first)

### Input Validation
- Validate window IDs before capturing
- Check image dimensions are within reasonable bounds
- Validate zoom scale: 0.1x to 5x

### Dependencies
- Keep dependencies updated
- Review security advisories
- Minimize dependency count

---

## Git Workflow

### Branch Naming
- Feature: `feat/<feature-name>`
- Bug fix: `fix/<issue-name>`
- Docs: `docs/<doc-name>`
- Example: `feat/annotation-tools`, `fix/zoom-bug`

### Commit Strategy
- Atomic commits (one logical change per commit)
- Write meaningful commit messages
- Push to feature branch before PR
- All commits must pass lint/type checks

---

## Code Review Checklist

Before submitting PR, ensure:
- [ ] TypeScript strict mode passes (no errors)
- [ ] ESLint passes (run `npm run lint` if configured)
- [ ] Code follows naming conventions
- [ ] No `any` types (use `unknown` if needed)
- [ ] Error handling implemented
- [ ] Memory cleanup included (URLs, listeners)
- [ ] JSDoc comments for public functions
- [ ] No console.log left in code (use console.error/warn for important logs)
- [ ] Commit messages follow convention
- [ ] Related documentation updated

---

## Tools & Linting

### TypeScript Configuration
- `strict: true` for full type checking
- `noImplicitAny: true` to catch type errors
- `esModuleInterop: true` for better module compatibility

### Recommended VS Code Extensions
- ESLint
- Prettier (if configured)
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (if using Vue)

---

## Glossary

- **Store:** Zustand state management container
- **Hook:** Custom React function that uses state/effects
- **Component:** Reusable React function
- **Action:** Store method that modifies state
- **Selector:** Function that extracts state subset
- **Blob URL:** JavaScript object URL from binary data

---

**Document Version:** 1.0
**Last Updated:** 2025-12-27
**Phase:** 03 - Canvas Editor Foundation
