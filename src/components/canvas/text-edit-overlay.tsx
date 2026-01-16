// TextEditOverlay - Edit existing text annotations via double-click
// Supports multiline with Shift+Enter

import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useAnnotationStore } from '../../stores/annotation-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { useBackgroundStore } from '../../stores/background-store';
import { useExportStore } from '../../stores/export-store';
import { calculateAspectRatioExtend } from '../../utils/export-utils';
import type { TextAnnotation } from '../../types/annotations';

export function TextEditOverlay() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ width: 100, height: 32 });
  const [isReady, setIsReady] = useState(false);

  const { editingTextId, annotations, updateTextContent, setEditingTextId } = useAnnotationStore();
  const { scale, position, originalWidth, originalHeight } = useCanvasStore();
  const { getPaddingPx } = useBackgroundStore();
  const { outputAspectRatio } = useExportStore();

  const annotation = annotations.find(
    (a) => a.id === editingTextId && a.type === 'text'
  ) as TextAnnotation | undefined;

  const [text, setText] = useState('');
  const scaledFontSize = annotation ? annotation.fontSize * scale : 16;

  // Initialize text when annotation changes
  useEffect(() => {
    if (annotation) {
      setText(annotation.text);
      setIsReady(false);
    }
  }, [annotation?.id]);

  // Focus input on mount
  useEffect(() => {
    if (annotation) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [annotation?.id]);

  // Measure and update size synchronously before paint
  useLayoutEffect(() => {
    if (measureRef.current && annotation) {
      const rect = measureRef.current.getBoundingClientRect();
      // Add padding for border (4px) + internal padding (8px) + cursor space
      setSize({
        width: Math.max(100, Math.ceil(rect.width) + 16),
        height: Math.max(scaledFontSize * 1.5, Math.ceil(rect.height) + 8),
      });
    }
  }, [text, annotation?.fontSize, annotation?.fontFamily, annotation?.fontWeight, annotation?.fontStyle, scale, scaledFontSize]);

  if (!annotation || !editingTextId) {
    return null;
  }

  const padding = getPaddingPx(originalWidth, originalHeight);

  // Calculate aspect ratio offset
  const baseWidth = originalWidth + padding * 2;
  const baseHeight = originalHeight + padding * 2;
  const aspectExtension = calculateAspectRatioExtend(baseWidth, baseHeight, outputAspectRatio);
  const contentOffsetX = aspectExtension?.offsetX || 0;
  const contentOffsetY = aspectExtension?.offsetY || 0;

  // Calculate screen position from canvas coordinates
  const canvasX = annotation.x + padding + contentOffsetX;
  const canvasY = annotation.y + padding + contentOffsetY;
  const screenX = canvasX * scale + position.x;
  const screenY = canvasY * scale + position.y;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without Shift = submit
      e.preventDefault();
      updateTextContent(editingTextId, text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTextId(null);
    }
    // Shift+Enter = newline (default textarea behavior)
  };

  const handleBlur = () => {
    if (!isReady) return;
    updateTextContent(editingTextId, text);
  };

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: screenX - 2,
        top: screenY - 1,
      }}
    >
      {/* Hidden span to measure text size - whitespace-pre to match Konva text (no auto-wrap) */}
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre"
        style={{
          fontSize: `${scaledFontSize}px`,
          fontFamily: annotation.fontFamily,
          fontWeight: annotation.fontWeight,
          fontStyle: annotation.fontStyle,
          lineHeight: 1.2,
        }}
      >
        {text || 'M'}
      </span>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="border-2 border-blue-500 rounded outline-none bg-white/90 dark:bg-gray-800/90 resize-none box-border overflow-hidden"
        style={{
          fontSize: `${scaledFontSize}px`,
          fontFamily: annotation.fontFamily,
          fontWeight: annotation.fontWeight,
          fontStyle: annotation.fontStyle,
          textDecoration: annotation.textDecoration !== 'none' ? annotation.textDecoration : undefined,
          color: annotation.fill,
          width: `${size.width}px`,
          height: `${size.height}px`,
          lineHeight: 1.2,
          padding: '2px 4px',
          whiteSpace: 'pre',
        }}
      />
    </div>
  );
}
