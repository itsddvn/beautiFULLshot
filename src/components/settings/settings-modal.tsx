// SettingsModal - Modal dialog for app settings
// Uses React Portal to render at document body level for proper z-index stacking

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore, isValidHotkey, type HotkeyConfig, type ThemeMode } from '../../stores/settings-store';
import { updateShortcuts } from '../../utils/screenshot-api';
import { formatHotkey } from '../../utils/hotkey-formatter';

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

const GLOBAL_HOTKEY_ACTIONS: (keyof HotkeyConfig)[] = ['capture', 'captureRegion', 'captureWindow'];

function findDuplicateHotkeys(hotkeys: HotkeyConfig): Record<string, string[]> {
  const duplicates: Record<string, string[]> = {};
  const entries = Object.entries(hotkeys) as [keyof HotkeyConfig, string][];

  for (let i = 0; i < entries.length; i++) {
    const [action1, shortcut1] = entries[i];
    if (!shortcut1) continue;

    const normalizedShortcut1 = shortcut1.toLowerCase();
    const conflicts: string[] = [];

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const [action2, shortcut2] = entries[j];
      if (!shortcut2) continue;

      if (normalizedShortcut1 === shortcut2.toLowerCase()) {
        conflicts.push(HOTKEY_LABELS[action2]);
      }
    }

    if (conflicts.length > 0) {
      duplicates[action1] = conflicts;
    }
  }

  return duplicates;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const settings = useSettingsStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Track editing state for validation feedback
  const [editingHotkey, setEditingHotkey] = useState<{ action: keyof HotkeyConfig; value: string } | null>(null);
  const [registrationErrors, setRegistrationErrors] = useState<Record<string, string>>({});

  const duplicateHotkeys = findDuplicateHotkeys(settings.hotkeys);

  useEffect(() => {
    if (!isOpen) return;

    const checkShortcuts = async () => {
      try {
        const errors = await updateShortcuts(
          settings.hotkeys.capture,
          settings.hotkeys.captureRegion,
          settings.hotkeys.captureWindow
        );

        const errorMap: Record<string, string> = {};
        for (const err of errors) {
          if (err.includes('Capture Region')) {
            errorMap.captureRegion = err;
          } else if (err.includes('Capture Window')) {
            errorMap.captureWindow = err;
          } else if (err.includes('Capture')) {
            errorMap.capture = err;
          }
        }
        setRegistrationErrors(errorMap);
      } catch (e) {
        console.error('Failed to check shortcuts:', e);
      }
    };

    checkShortcuts();
  }, [isOpen, settings.hotkeys.capture, settings.hotkeys.captureRegion, settings.hotkeys.captureWindow]);

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

  // Use portal to render modal at document body level for proper z-index stacking
  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="glass-heavy floating-panel w-[500px] max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 dark:border-white/5 flex justify-between items-center sticky top-0 glass-heavy rounded-t-[var(--panel-radius)]">
          <h2 id="settings-title" className="text-lg font-medium text-gray-800 dark:text-gray-100">
            Settings
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center glass-btn rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none transition-all"
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
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${settings.theme === option.value
                      ? 'glass-btn glass-btn-active text-orange-500'
                      : 'glass-btn text-gray-600 dark:text-gray-300'
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
                  const isGlobalAction = GLOBAL_HOTKEY_ACTIONS.includes(action);
                  const hasRegistrationError = isGlobalAction && registrationErrors[action];
                  const hasDuplicate = duplicateHotkeys[action];

                  return (
                    <div
                      key={action}
                      className="flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                          {HOTKEY_LABELS[action]}
                          {isGlobalAction && (
                            <span className="ml-1 text-xs text-gray-400">(global)</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={isEditing ? currentValue : formatHotkey(currentValue)}
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
                            className={`w-48 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 glass-flat text-gray-800 dark:text-gray-100 ${(isEditing && !isValid) || hasRegistrationError
                                ? 'border-red-300 focus:ring-red-500'
                                : hasDuplicate
                                  ? 'border-yellow-400 focus:ring-yellow-500'
                                  : 'focus:ring-orange-500'
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
                      {hasRegistrationError && (
                        <p className="text-xs text-red-500 text-right">
                          Shortcut unavailable (may be in use by another app)
                        </p>
                      )}
                      {hasDuplicate && !hasRegistrationError && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 text-right">
                          Conflicts with: {hasDuplicate.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Format: Modifier+Key (e.g., Cmd+Shift+C)
            </p>
          </section>

          {/* Behavior Section */}
          <section>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-gray-200">Behavior</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer glass-flat rounded-xl p-3 transition-all hover:bg-white/20 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={settings.startMinimized}
                  onChange={(e) => settings.setStartMinimized(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Start minimized to tray
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer glass-flat rounded-xl p-3 transition-all hover:bg-white/20 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={settings.closeToTray}
                  onChange={(e) => settings.setCloseToTray(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Close to tray instead of quit
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer glass-flat rounded-xl p-3 transition-all hover:bg-white/20 dark:hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) => settings.setShowNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500"
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
                  className="flex items-center gap-3 cursor-pointer glass-flat rounded-xl p-3 transition-all hover:bg-white/20 dark:hover:bg-white/5"
                >
                  <input
                    type="radio"
                    name="saveLocation"
                    checked={settings.saveLocation === loc}
                    onChange={() => settings.setSaveLocation(loc)}
                    className="w-4 h-4 border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500"
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
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 glass-flat text-gray-800 dark:text-gray-100"
                    placeholder="Enter custom path..."
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 dark:border-white/5 flex justify-between items-center sticky bottom-0 glass-heavy rounded-b-[var(--panel-radius)]">
          <button
            onClick={() => settings.resetToDefaults()}
            className="px-4 py-2 text-sm glass-btn rounded-xl text-gray-600 dark:text-gray-300 transition-all"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 glass-btn glass-btn-active text-orange-500 rounded-xl text-sm font-medium transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
