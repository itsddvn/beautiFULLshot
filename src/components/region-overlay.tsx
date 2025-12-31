// Region overlay component - Fullscreen overlay for interactive region selection
// Provides crosshair cursor, drag-to-select, and visual feedback

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';

interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function RegionOverlay() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get scale factor for DPI-aware coordinate conversion
  useEffect(() => {
    const getScaleFactor = async () => {
      try {
        const win = getCurrentWindow();
        const factor = await win.scaleFactor();
        setScaleFactor(factor);
      } catch {
        // Default to 1 if unable to get scale factor
        setScaleFactor(1);
      }
    };
    getScaleFactor();
  }, []);

  // Handle ESC to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cancelSelection = useCallback(async () => {
    await emit('region-selection-cancelled');
    const win = getCurrentWindow();
    await win.close();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsSelecting(true);
    setSelection({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selection) return;
    setSelection(prev => prev ? {
      ...prev,
      endX: e.clientX,
      endY: e.clientY,
    } : null);
  }, [isSelecting, selection]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !selection) return;
    setIsSelecting(false);

    // Calculate normalized rectangle (handle drag in any direction)
    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    // Minimum selection size (10px logical)
    if (width < 10 || height < 10) {
      cancelSelection();
      return;
    }

    // Convert logical to physical pixels for accurate capture
    const physicalX = Math.round(x * scaleFactor);
    const physicalY = Math.round(y * scaleFactor);
    const physicalWidth = Math.round(width * scaleFactor);
    const physicalHeight = Math.round(height * scaleFactor);

    // Emit selection coordinates to main window
    await emit('region-selected', {
      x: physicalX,
      y: physicalY,
      width: physicalWidth,
      height: physicalHeight,
    });

    const win = getCurrentWindow();
    await win.close();
  }, [isSelecting, selection, scaleFactor, cancelSelection]);

  // Calculate selection box style with "cutout" effect
  const getSelectionStyle = (): React.CSSProperties => {
    if (!selection) return { display: 'none' };

    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    return {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      border: '2px dashed #fff',
      backgroundColor: 'transparent',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      pointerEvents: 'none',
    };
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'fixed',
        inset: 0,
        cursor: 'crosshair',
        backgroundColor: isSelecting ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
        userSelect: 'none',
      }}
    >
      {/* Selection rectangle with cutout effect */}
      <div style={getSelectionStyle()} />

      {/* Instructions (hidden while selecting) */}
      {!isSelecting && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            fontSize: 14,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 16px',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          Drag to select region · ESC to cancel
        </div>
      )}

      {/* Selection dimensions tooltip */}
      {isSelecting && selection && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(selection.startX, selection.endX),
            top: Math.max(0, Math.min(selection.startY, selection.endY) - 28),
            color: '#fff',
            fontSize: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '4px 8px',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          {Math.abs(selection.endX - selection.startX)} × {Math.abs(selection.endY - selection.startY)}
        </div>
      )}
    </div>
  );
}
