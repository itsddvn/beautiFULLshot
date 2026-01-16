// UI store - Zustand state management for UI modals and dialogs

import { create } from 'zustand';

interface UIState {
  // Modal states
  isWindowPickerOpen: boolean;
  isSettingsOpen: boolean;
  isMonitorPickerOpen: boolean;

  // Actions
  openWindowPicker: () => void;
  closeWindowPicker: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openMonitorPicker: () => void;
  closeMonitorPicker: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isWindowPickerOpen: false,
  isSettingsOpen: false,
  isMonitorPickerOpen: false,

  openWindowPicker: () => set({ isWindowPickerOpen: true }),
  closeWindowPicker: () => set({ isWindowPickerOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openMonitorPicker: () => set({ isMonitorPickerOpen: true }),
  closeMonitorPicker: () => set({ isMonitorPickerOpen: false }),
}));
