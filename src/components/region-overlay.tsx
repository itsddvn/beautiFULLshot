// Region overlay component - Fullscreen overlay for interactive region selection
// Shows captured screenshot as background for accurate region selection

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

  // Hide overlay and emit selection result
  const hideOverlay = useCallback(async (emitSelection: boolean, region?: { x: number, y: number, width: number, height: number }) => {
    if (isClosing) return;
    setIsClosing(true);

    // Reset visual state immediately
    setIsActive(false);
    setIsSelecting(false);
    setSelection(null);

    // Hide window FIRST
    try {
      const win = getCurrentWindow();
      await win.hide();
    } catch (e) {
      console.error('Hide window error:', e);
    }

    // Wait for compositor
    await new Promise(resolve => setTimeout(resolve, 100));

    // Emit event to main window
    try {
      const mainWindow = new Window('main');
      if (emitSelection && region) {
        await mainWindow.emit('region-selected', region);
      } else {
        await invoke('clear_screenshot_data');
        await mainWindow.emit('region-selection-cancelled', {});
      }
    } catch (e) {
      console.error('Emit error:', e);
    }

    setBackgroundImage(null);
    setIsClosing(false);
  }, [isClosing]);

  // Activate overlay - load screenshot and show
  const activateOverlay = useCallback(async () => {
    setIsSelecting(false);
    setSelection(null);
    setIsClosing(false);

    const win = getCurrentWindow();

    try {
      // Run scaleFactor and get screenshot data in parallel
      const [factor, screenshotData] = await Promise.all([
        win.scaleFactor(),
        invoke<string | null>('get_screenshot_data')
      ]);

      setScaleFactor(factor);

      if (screenshotData) {
        // Preload image before showing window
        const img = new Image();
        img.onload = async () => {
          setBackgroundImage(`data:image/png;base64,${screenshotData}`);
          setIsActive(true);
          await win.show();
          await win.setFocus();
        };
        img.onerror = async () => {
          console.error('Failed to load screenshot');
          setIsActive(true);
          await win.show();
          await win.setFocus();
        };
        img.src = `data:image/png;base64,${screenshotData}`;
      } else {
        console.warn('No screenshot data available');
        setIsActive(true);
        await win.show();
        await win.setFocus();
      }
    } catch (e) {
      console.error('Activate error:', e);
      setScaleFactor(1);
      setIsActive(true);
    }
  }, []);

  // Listen for activation event
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

  // Handle ESC key
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

  // Auto-activate on mount
  useEffect(() => {
    activateOverlay();
  }, [activateOverlay]);

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

    // Convert to physical pixels
    const region = {
      x: Math.round(x * scaleFactor),
      y: Math.round(y * scaleFactor),
      width: Math.round(width * scaleFactor),
      height: Math.round(height * scaleFactor),
    };

    hideOverlay(true, region);
  }, [isSelecting, selection, scaleFactor, hideOverlay, isClosing]);

  // Selection box style with cutout effect
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

  // Always render container with black background to prevent white flash
  return (
    <div
      ref={containerRef}
      onMouseDown={isActive ? handleMouseDown : undefined}
      onMouseMove={isActive ? handleMouseMove : undefined}
      onMouseUp={isActive ? handleMouseUp : undefined}
      tabIndex={0}
      autoFocus
      style={{
        position: 'fixed',
        inset: 0,
        cursor: isActive ? 'crosshair' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
        outline: 'none',
        backgroundColor: '#000',
      }}
    >
      {/* Background screenshot with dim overlay */}
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
          {/* Dim overlay - darkens the screen before selection */}
          {!isSelecting && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none',
              }}
            />
          )}
        </>
      )}

      {/* Selection rectangle */}
      <div style={getSelectionStyle()} />

      {/* Instructions - only show when active and not selecting */}
      {isActive && !isSelecting && (
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

      {/* Selection dimensions */}
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
