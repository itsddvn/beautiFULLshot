// Region overlay component - Fullscreen overlay for interactive region selection
// Persistent window that shows/hides, displays captured screenshot as background

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

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
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide overlay and reset state
  const hideOverlay = useCallback(async (emitSelection: boolean, region?: {x: number, y: number, width: number, height: number}) => {
    if (isClosing) return;
    setIsClosing(true);

    // Emit event to main window
    try {
      const mainWindow = new Window('main');
      if (emitSelection && region) {
        await mainWindow.emit('region-selected', region);
      } else {
        await mainWindow.emit('region-selection-cancelled', {});
      }
    } catch (e) {
      console.error('Emit error:', e);
    }

    // Clear stored screenshot data
    try {
      await invoke('clear_screenshot_data');
    } catch (e) {
      console.error('Clear screenshot error:', e);
    }

    // Hide window (don't close)
    try {
      const win = getCurrentWindow();
      await win.hide();
    } catch (e) {
      console.error('Hide window error:', e);
    }

    // Reset state for next activation
    setIsActive(false);
    setIsSelecting(false);
    setSelection(null);
    setBackgroundImage(null);
    setIsClosing(false);
  }, [isClosing]);

  // Activate overlay - load screenshot and show
  const activateOverlay = useCallback(async () => {
    // Reset state
    setIsSelecting(false);
    setSelection(null);
    setIsClosing(false);

    try {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      setScaleFactor(factor);

      // Load screenshot as background
      const screenshotData = await invoke<string | null>('get_screenshot_data');
      if (screenshotData) {
        // Preload image
        const img = new Image();
        img.onload = async () => {
          setBackgroundImage(`data:image/png;base64,${screenshotData}`);
          setIsActive(true);
          document.getElementById('root')?.classList.add('ready');
          await win.show();
          await win.setFocus();
        };
        img.onerror = async () => {
          console.error('Failed to load screenshot');
          setIsActive(true);
          document.getElementById('root')?.classList.add('ready');
          await win.show();
          await win.setFocus();
        };
        img.src = `data:image/png;base64,${screenshotData}`;
      } else {
        console.warn('No screenshot data available');
        setIsActive(true);
        document.getElementById('root')?.classList.add('ready');
        await win.show();
        await win.setFocus();
      }
    } catch (e) {
      console.error('Activate error:', e);
      setScaleFactor(1);
      setIsActive(true);
    }
  }, []);

  // Listen for activation event from Rust
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    listen('overlay-activate', () => {
      activateOverlay();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [activateOverlay]);

  // Handle ESC key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        hideOverlay(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [hideOverlay, isActive]);

  // Focus container when active
  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isActive]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isClosing || !isActive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsSelecting(true);
    setSelection({
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    });
  }, [isClosing, isActive]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || isClosing) return;
    e.preventDefault();
    setSelection(prev => prev ? {
      ...prev,
      endX: e.clientX,
      endY: e.clientY,
    } : null);
  }, [isSelecting, isClosing]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isClosing || !isSelecting || !selection) return;
    e.preventDefault();

    setIsSelecting(false);

    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    // Minimum selection size
    if (width < 10 || height < 10) {
      hideOverlay(false);
      return;
    }

    // Convert to physical pixels for capture
    const region = {
      x: Math.round(x * scaleFactor),
      y: Math.round(y * scaleFactor),
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor),
    };

    hideOverlay(true, region);
  }, [isSelecting, selection, scaleFactor, hideOverlay, isClosing]);

  // Calculate selection box style
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
      border: '2px solid #0078d4',
      backgroundColor: 'transparent',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
      pointerEvents: 'none',
      zIndex: 10,
    };
  };

  // Don't render interactive content until active
  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
      autoFocus
      style={{
        position: 'fixed',
        inset: 0,
        cursor: 'crosshair',
        userSelect: 'none',
        overflow: 'hidden',
        outline: 'none',
        backgroundColor: '#000',
      }}
    >
      {/* Background image - fill entire viewport */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {/* Selection rectangle with cutout effect */}
      <div style={getSelectionStyle()} />

      {/* Instructions overlay */}
      {!isSelecting && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '12px 24px',
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 20,
            textAlign: 'center',
          }}
        >
          <div>Kéo để chọn vùng</div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>ESC để hủy</div>
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
            backgroundColor: 'rgba(0, 120, 212, 0.9)',
            padding: '4px 8px',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {Math.abs(selection.endX - selection.startX)} × {Math.abs(selection.endY - selection.startY)}
        </div>
      )}
    </div>
  );
}
