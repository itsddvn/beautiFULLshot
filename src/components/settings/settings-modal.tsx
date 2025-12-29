// SettingsModal - Modal dialog for app settings

import { useState, useEffect, useRef } from 'react';
import { useSettingsStore, isValidHotkey, type HotkeyConfig } from '../../stores/settings-store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Hotkey display names
const HOTKEY_LABELS: Record<keyof HotkeyConfig, string> = {
  capture: 'Capture Screen',
  captureRegion: 'Capture Region',
  captureWindow: 'Capture Window',
  save: 'Quick Save',
  copy: 'Copy to Clipboard',
};

export function SettingsModal({ isOpen, onClose }: Props) {
  const settings = useSettingsStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Track editing state for validation feedback
  const [editingHotkey, setEditingHotkey] = useState<{ action: keyof HotkeyConfig; value: string } | null>(null);

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

  // Focus management - focus close button on open
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 id="settings-title" className="text-lg font-medium text-gray-800">
            Settings
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close settings (Escape)"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Hotkeys Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {(Object.entries(settings.hotkeys) as [keyof HotkeyConfig, string][]).map(
                ([action, shortcut]) => {
                  const isEditing = editingHotkey?.action === action;
                  const currentValue = isEditing ? editingHotkey.value : shortcut;
                  const isValid = !currentValue || isValidHotkey(currentValue);

                  return (
                    <div
                      key={action}
                      className="flex justify-between items-center"
                    >
                      <label className="text-sm text-gray-600">
                        {HOTKEY_LABELS[action]}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => setEditingHotkey({ action, value: e.target.value })}
                          onBlur={() => {
                            if (editingHotkey && isValidHotkey(editingHotkey.value)) {
                              settings.setHotkey(action, editingHotkey.value);
                            }
                            setEditingHotkey(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingHotkey(null);
                            } else if (e.key === 'Enter' && editingHotkey && isValidHotkey(editingHotkey.value)) {
                              settings.setHotkey(action, editingHotkey.value);
                              setEditingHotkey(null);
                            }
                          }}
                          className={`w-48 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ${
                            isEditing && !isValid
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder="e.g., CommandOrControl+Shift+C"
                        />
                        {isEditing && !isValid && currentValue && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
                            Invalid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Format: Modifier+Key (e.g., CommandOrControl+Shift+C)
            </p>
          </section>

          {/* Behavior Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700">Behavior</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.startMinimized}
                  onChange={(e) => settings.setStartMinimized(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Start minimized to tray
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.closeToTray}
                  onChange={(e) => settings.setCloseToTray(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Close to tray instead of quit
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) => settings.setShowNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Show notifications</span>
              </label>
            </div>
          </section>

          {/* Save Location Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700">Default Save Location</h3>
            <div className="space-y-2">
              {(['pictures', 'desktop', 'custom'] as const).map((loc) => (
                <label
                  key={loc}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="saveLocation"
                    checked={settings.saveLocation === loc}
                    onChange={() => settings.setSaveLocation(loc)}
                    className="w-4 h-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 capitalize">{loc}</span>
                </label>
              ))}

              {settings.saveLocation === 'custom' && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    value={settings.customSavePath || ''}
                    onChange={(e) => settings.setCustomSavePath(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom path..."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center sticky bottom-0 bg-white">
          <button
            onClick={() => settings.resetToDefaults()}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
