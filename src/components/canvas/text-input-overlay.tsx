// TextInputOverlay - In-canvas text input for text annotations

import { useRef, useEffect, useState } from 'react';
import { useAnnotationStore } from '../../stores/annotation-store';

interface Props {
  position: { x: number; y: number };
  padding: number;
  scale: number;
  stagePosition: { x: number; y: number };
  offsetX: number;
  offsetY: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function TextInputOverlay({
  position,
  padding,
  scale,
  stagePosition,
  offsetX,
  offsetY,
  onSubmit,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const { fontSize, strokeColor } = useAnnotationStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Calculate screen position from canvas position
  const screenX = (position.x + padding + offsetX) * scale + stagePosition.x;
  const screenY = (position.y + padding + offsetY) * scale + stagePosition.y;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-50"
      style={{
        left: screenX,
        top: screenY,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSubmit(text)}
        className="min-w-[100px] px-2 py-1 border-2 border-blue-500 rounded outline-none bg-white dark:bg-gray-800 dark:text-white"
        style={{
          fontSize: `${fontSize}px`,
          color: strokeColor,
        }}
        placeholder="Enter text..."
      />
    </div>
  );
}
