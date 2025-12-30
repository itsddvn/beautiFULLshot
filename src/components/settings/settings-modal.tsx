// SettingsModal - Modal dialog for app settings

import { useState, useEffect, useRef } from 'react';
import { useSettingsStore, isValidHotkey, type HotkeyConfig, type ThemeMode } from '../../stores/settings-store';

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

// Theme options
const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

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
        className="bg-white dark:bg-gray-800 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 id="settings-title" className="text-lg font-medium text-gray-800 dark:text-gray-100">
            Settings
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
            aria-label="Close settings (Escape)"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">Appearance</h3>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => settings.setTheme(option.value)}
                  className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                    settings.theme === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Hotkeys Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">Keyboard Shortcuts</h3>
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
                      <label className="text-sm text-gray-600 dark:text-gray-300">
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
                          className={`w-48 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ${
                            isEditing && !isValid
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Format: Modifier+Key (e.g., CommandOrControl+Shift+C)
            </p>
          </section>

          {/* Behavior Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">Behavior</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.startMinimized}
                  onChange={(e) => settings.setStartMinimized(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Start minimized to tray
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.closeToTray}
                  onChange={(e) => settings.setCloseToTray(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Close to tray instead of quit
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) => settings.setShowNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">Show notifications</span>
              </label>
            </div>
          </section>

          {/* Save Location Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">Default Save Location</h3>
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
                    className="w-4 h-4 border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{loc}</span>
                </label>
              ))}

              {settings.saveLocation === 'custom' && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    value={settings.customSavePath || ''}
                    onChange={(e) => settings.setCustomSavePath(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    placeholder="Enter custom path..."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={() => settings.resetToDefaults()}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
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
