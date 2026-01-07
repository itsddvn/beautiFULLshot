// Settings store - Zustand state for app settings with persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateShortcuts } from '../utils/screenshot-api';

// Valid modifier keys
const VALID_MODIFIERS = ['CommandOrControl', 'Control', 'Ctrl', 'Command', 'Cmd', 'Alt', 'Shift', 'Super', 'Meta'];

// Valid key codes (letters, numbers, and special keys) - all uppercase for comparison
const VALID_KEYS = [
  // Letters
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // Numbers
  ...'0123456789'.split(''),
  // Function keys
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  // Special keys (uppercase for matching)
  'SPACE', 'TAB', 'ENTER', 'ESCAPE', 'BACKSPACE', 'DELETE', 'INSERT', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN',
  'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'PRINTSCREEN',
];

/**
 * Validates hotkey string format
 * Expected format: "Modifier+Modifier+Key" (e.g., "CommandOrControl+Shift+C")
 */
export function isValidHotkey(hotkey: string): boolean {
  if (!hotkey || typeof hotkey !== 'string') return false;

  const parts = hotkey.split('+').map(p => p.trim());
  if (parts.length < 2) return false; // Need at least one modifier and one key

  const key = parts[parts.length - 1].toUpperCase();
  const modifiers = parts.slice(0, -1);

  // Check key is valid
  if (!VALID_KEYS.includes(key)) return false;

  // Check all modifiers are valid
  return modifiers.every(mod => VALID_MODIFIERS.some(valid =>
    valid.toLowerCase() === mod.toLowerCase()
  ));
}

export interface HotkeyConfig {
  capture: string;
  captureRegion: string;
  captureWindow: string;
  save: string;
  copy: string;
}

export type SaveLocation = 'pictures' | 'desktop' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  // Hotkeys configuration
  hotkeys: HotkeyConfig;

  // Behavior settings
  startMinimized: boolean;
  closeToTray: boolean;
  showNotifications: boolean;

  // Default save location
  saveLocation: SaveLocation;
  customSavePath: string | null;

  // Theme
  theme: ThemeMode;

  // Actions
  setHotkey: (action: keyof HotkeyConfig, shortcut: string) => void;
  setStartMinimized: (value: boolean) => void;
  setCloseToTray: (value: boolean) => void;
  setShowNotifications: (value: boolean) => void;
  setSaveLocation: (location: SaveLocation) => void;
  setCustomSavePath: (path: string | null) => void;
  setTheme: (theme: ThemeMode) => void;
  resetToDefaults: () => void;
}

const DEFAULT_HOTKEYS: HotkeyConfig = {
  capture: 'CommandOrControl+Shift+C',
  captureRegion: 'CommandOrControl+Shift+R',
  captureWindow: 'CommandOrControl+Shift+W',
  save: 'CommandOrControl+S',
  copy: 'CommandOrControl+Shift+V',
};

const DEFAULT_STATE = {
  hotkeys: DEFAULT_HOTKEYS,
  startMinimized: false,
  closeToTray: true,
  showNotifications: true,
  saveLocation: 'pictures' as SaveLocation,
  customSavePath: null,
  theme: 'dark' as ThemeMode,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setHotkey: (action, shortcut) => {
        // Only set if valid or empty (allow clearing)
        if (shortcut === '' || isValidHotkey(shortcut)) {
          set((state) => {
            const newHotkeys = { ...state.hotkeys, [action]: shortcut };
            // Update global shortcuts in backend for capture-related hotkeys
            if (['capture', 'captureRegion', 'captureWindow'].includes(action)) {
              updateShortcuts(
                newHotkeys.capture,
                newHotkeys.captureRegion,
                newHotkeys.captureWindow
              ).catch(console.error);
            }
            return { hotkeys: newHotkeys };
          });
        }
      },

      setStartMinimized: (value) => set({ startMinimized: value }),
      setCloseToTray: (value) => set({ closeToTray: value }),
      setShowNotifications: (value) => set({ showNotifications: value }),
      setSaveLocation: (location) => set({ saveLocation: location }),
      setCustomSavePath: (path) => set({ customSavePath: path }),
      setTheme: (theme) => set({ theme }),

      resetToDefaults: () => set(DEFAULT_STATE),
    }),
    {
      name: 'beautyshot-settings',
    }
  )
);
