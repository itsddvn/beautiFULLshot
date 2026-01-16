// MonitorPickerModal - Modal for selecting a monitor for region capture

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { MonitorInfo } from '../../types/screenshot';
import * as screenshotApi from '../../utils/screenshot-api';
import { logError } from '../../utils/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MonitorPickerModal({ isOpen, onClose }: Props) {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch monitors list
  const fetchMonitors = useCallback(async () => {
    setLoading(true);
    try {
      const list = await screenshotApi.getMonitors();
      setMonitors(list);
    } catch (e) {
      logError('MonitorPickerModal:fetchMonitors', e);
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load monitors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMonitors();
      setSelectedId(null);
    }
  }, [isOpen, fetchMonitors]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Calculate layout bounds for visual display
  const layoutBounds = useMemo(() => {
    if (monitors.length === 0) return { minX: 0, minY: 0, maxX: 1920, maxY: 1080 };

    const minX = Math.min(...monitors.map((m) => m.x));
    const minY = Math.min(...monitors.map((m) => m.y));
    const maxX = Math.max(...monitors.map((m) => m.x + m.width));
    const maxY = Math.max(...monitors.map((m) => m.y + m.height));

    return { minX, minY, maxX, maxY };
  }, [monitors]);

  // Scale factor for visual display (fit monitors in ~400px width)
  const scaleFactor = useMemo(() => {
    const totalWidth = layoutBounds.maxX - layoutBounds.minX;
    const totalHeight = layoutBounds.maxY - layoutBounds.minY;
    const maxDisplayWidth = 400;
    const maxDisplayHeight = 200;

    return Math.min(maxDisplayWidth / totalWidth, maxDisplayHeight / totalHeight, 0.15);
  }, [layoutBounds]);

  // Handle monitor selection - show overlay on selected monitor
  const handleSelectMonitor = async (monitorId: number) => {
    setSelectedId(monitorId);
    try {
      onClose();
      // Small delay to let modal close animation complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      await screenshotApi.showOverlayWindowOnMonitor(monitorId);
    } catch (e) {
      logError('MonitorPickerModal:selectMonitor', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-[500px] flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monitor-picker-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2
            id="monitor-picker-title"
            className="text-lg font-medium text-gray-800 dark:text-gray-100"
          >
            Chọn màn hình
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
            aria-label="Close (Escape)"
          >
            ×
          </button>
        </div>

        {/* Monitor Layout Visual */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              Đang tải...
            </div>
          ) : monitors.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              Không tìm thấy màn hình
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Click vào màn hình muốn chụp
              </p>

              {/* Visual layout of monitors */}
              <div
                className="relative mx-auto"
                style={{
                  width: (layoutBounds.maxX - layoutBounds.minX) * scaleFactor,
                  height: (layoutBounds.maxY - layoutBounds.minY) * scaleFactor,
                }}
              >
                {monitors.map((monitor, index) => (
                  <button
                    key={monitor.id}
                    onClick={() => handleSelectMonitor(monitor.id)}
                    className={`absolute border-2 rounded transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedId === monitor.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    }`}
                    style={{
                      left: (monitor.x - layoutBounds.minX) * scaleFactor,
                      top: (monitor.y - layoutBounds.minY) * scaleFactor,
                      width: monitor.width * scaleFactor,
                      height: monitor.height * scaleFactor,
                    }}
                  >
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      {index + 1}
                    </span>
                    {monitor.is_primary && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Primary</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Monitor list with details */}
              <div className="mt-6 space-y-2">
                {monitors.map((monitor, index) => (
                  <button
                    key={monitor.id}
                    onClick={() => handleSelectMonitor(monitor.id)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                      selectedId === monitor.id
                        ? 'bg-orange-50 dark:bg-orange-900/30 ring-2 ring-orange-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-sm text-gray-700 dark:text-gray-200">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {monitor.name || `Monitor ${index + 1}`}
                        {monitor.is_primary && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Primary)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {monitor.width}×{monitor.height} • Position: ({monitor.x}, {monitor.y})
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
