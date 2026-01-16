// TextInputOverlay - In-canvas text input for text annotations
// Supports multiline with Shift+Enter

import { useRef, useEffect, useState } from 'react';
import { useAnnotationStore } from '../../stores/annotation-store';

interface Props {
  position: { x: number; y: number; screenX: number; screenY: number };
  scale: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function TextInputOverlay({
  position,
  scale,
  onSubmit,
  onCancel,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState('');
  const [size, setSize] = useState({ width: 20, height: 24 });
  const [isReady, setIsReady] = useState(false);
  const { fontSize, fontFamily, fontWeight, fontStyle, textDecoration, strokeColor } = useAnnotationStore();

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Measure text size for auto-resize
  useEffect(() => {
    if (measureRef.current) {
      const width = measureRef.current.offsetWidth;
      const height = measureRef.current.offsetHeight;
      setSize({
        width: Math.max(20, width + 4),
        height: Math.max(24, height + 4),
      });
    }
  }, [text, fontSize, scale]);

  const screenX = position.screenX - 10;
  const screenY = position.screenY - 4;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without Shift = submit
      e.preventDefault();
      onSubmit(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    // Shift+Enter = newline (default textarea behavior)
  };

  const scaledFontSize = fontSize * scale;

  return (
    <div
      className="absolute z-50"
      style={{
        left: screenX,
        top: screenY,
      }}
    >
      {/* Hidden span for measuring text size */}
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre-wrap"
        style={{
          fontSize: `${scaledFontSize}px`,
          fontFamily,
          fontWeight,
          fontStyle,
          maxWidth: '400px',
        }}
      >
        {text || ' '}
      </span>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!isReady) return;
          if (text.trim()) {
            onSubmit(text);
          } else {
            onCancel();
          }
        }}
        className="px-2 py-0.5 border-2 border-blue-500 rounded outline-none bg-white dark:bg-gray-800 dark:text-white box-content resize-none"
        style={{
          fontSize: `${scaledFontSize}px`,
          fontFamily,
          fontWeight,
          fontStyle,
          textDecoration: textDecoration !== 'none' ? textDecoration : undefined,
          color: strokeColor,
          width: `${size.width}px`,
          height: `${size.height}px`,
          lineHeight: 1.2,
        }}
        placeholder="Type text... (Shift+Enter for new line)"
      />
    </div>
  );
}
