// useKeyboardShortcuts - Keyboard shortcuts for canvas operations and export

import { useEffect, useCallback } from 'react';
import { useAnnotationStore } from '../stores/annotation-store';
import { useSettingsStore } from '../stores/settings-store';
import { useExport } from './use-export';

/**
 * Parse hotkey string to check if it matches a keyboard event
 * Format: "Modifier+Modifier+Key" (e.g., "CommandOrControl+Shift+C")
 */
function matchesHotkey(e: KeyboardEvent, hotkey: string): boolean {
  if (!hotkey) return false;

  const parts = hotkey.split('+').map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Check key
  const pressedKey = e.key.toLowerCase();
  const keyCode = e.code.toLowerCase();

  // Match key (support both key name and code)
  const keyMatches =
    pressedKey === key ||
    keyCode === `key${key}` ||
    keyCode === `digit${key}` ||
    keyCode === key;

  if (!keyMatches) return false;

  // Check modifiers
  const needsCtrl = modifiers.some((m) =>
    ['commandorcontrol', 'control', 'ctrl'].includes(m)
  );
  const needsCmd = modifiers.some((m) =>
    ['commandorcontrol', 'command', 'cmd', 'meta', 'super'].includes(m)
  );
  const needsShift = modifiers.some((m) => m === 'shift');
  const needsAlt = modifiers.some((m) => m === 'alt');

  // CommandOrControl matches either Ctrl or Cmd
  const ctrlOrCmdMatches = needsCtrl || needsCmd ? e.ctrlKey || e.metaKey : true;
  const ctrlOrCmdRequired = needsCtrl || needsCmd;

  if (ctrlOrCmdRequired && !ctrlOrCmdMatches) return false;
  if (!ctrlOrCmdRequired && (e.ctrlKey || e.metaKey)) return false;

  if (needsShift !== e.shiftKey) return false;
  if (needsAlt !== e.altKey) return false;

  return true;
}

export function useKeyboardShortcuts() {
  const { selectedId, deleteSelected, duplicateSelected, setSelected, setTool, undo, redo } = useAnnotationStore();
  const { hotkeys } = useSettingsStore();
  const { quickSave, copyToClipboard } = useExport();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Check custom hotkeys from settings
      if (matchesHotkey(e, hotkeys.save)) {
        e.preventDefault();
        quickSave();
        return;
      }

      if (matchesHotkey(e, hotkeys.copy)) {
        e.preventDefault();
        copyToClipboard();
        return;
      }

      // Cmd/Ctrl shortcuts (hardcoded ones like undo/redo)
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            return;
          case 'y':
            e.preventDefault();
            redo();
            return;
          case 'd':
            if (selectedId) {
              e.preventDefault();
              duplicateSelected();
            }
            return;
        }
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedId) {
            e.preventDefault();
            deleteSelected();
          }
          break;

        case 'Escape':
          setSelected(null);
          setTool('select');
          break;

        // Tool shortcuts (only when no modifier)
        case 'v':
        case 'V':
          if (!isMod) setTool('select');
          break;
        case 'r':
        case 'R':
          if (!isMod) setTool('rectangle');
          break;
        case 'e':
        case 'E':
          if (!isMod) setTool('ellipse');
          break;
        case 'l':
        case 'L':
          if (!isMod) setTool('line');
          break;
        case 'a':
        case 'A':
          if (!isMod) setTool('arrow');
          break;
        case 't':
        case 'T':
          if (!isMod) setTool('text');
          break;
        case 'f':
        case 'F':
          if (!isMod) setTool('freehand');
          break;
        case 's':
        case 'S':
          if (!isMod) setTool('spotlight');
          break;
      }
    },
    [selectedId, deleteSelected, duplicateSelected, setSelected, setTool, quickSave, copyToClipboard, undo, redo, hotkeys]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
