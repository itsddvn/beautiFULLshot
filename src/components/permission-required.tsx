// PermissionRequired - Startup permission check screen
// Blocks app until both Screen Recording AND Accessibility permissions are granted
// macOS caches permission state at app launch - restart required after granting

import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { relaunch } from '@tauri-apps/plugin-process';

interface PermissionStatus {
  screenRecording: boolean;
  accessibility: boolean;
}

interface PermissionRequiredProps {
  onAllGranted: () => void;
}

// Check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// X icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// Permission item component
function PermissionItem({
  title,
  description,
  granted,
  onOpenSettings,
}: {
  title: string;
  description: string;
  granted: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${granted
      ? 'glass-flat border border-green-400/30'
      : 'glass-flat'
      }`}>
      {/* Status icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${granted
        ? 'bg-green-500'
        : 'glass-btn'
        }`}>
        {granted ? (
          <CheckIcon className="w-6 h-6 text-white" />
        ) : (
          <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold ${granted ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      {/* Action button */}
      {!granted && (
        <button
          onClick={onOpenSettings}
          className="px-4 py-2 glass-btn glass-btn-active text-orange-500 text-sm font-medium rounded-xl transition-all shrink-0"
        >
          Enable
        </button>
      )}
    </div>
  );
}

export function PermissionRequired({ onAllGranted }: PermissionRequiredProps) {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    screenRecording: false,
    accessibility: false,
  });
  const [checking, setChecking] = useState(true);

  // Check permissions on mount
  const checkPermissions = useCallback(async () => {
    setChecking(true);
    try {
      const [screen, accessibility] = await Promise.all([
        invoke<boolean>('check_screen_permission'),
        invoke<boolean>('check_accessibility_permission'),
      ]);

      const status = { screenRecording: screen, accessibility };
      setPermissions(status);

      // If all granted, call callback
      if (screen && accessibility) {
        onAllGranted();
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
    } finally {
      setChecking(false);
    }
  }, [onAllGranted]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const openScreenSettings = useCallback(async () => {
    try {
      // request_screen_permission now returns true if permission is granted
      // and handles opening settings if not
      const granted = await invoke<boolean>('request_screen_permission');
      if (granted) {
        setPermissions(prev => ({ ...prev, screenRecording: true }));
      }
    } catch (error) {
      console.error('Failed to request screen permission:', error);
      // Fallback
      await invoke('open_screen_recording_settings');
    }
  }, []);

  const openAccessibilitySettings = useCallback(async () => {
    try {
      const granted = await invoke<boolean>('request_accessibility_permission');
      if (granted) {
        setPermissions(prev => ({ ...prev, accessibility: true }));
      } else {
        // If not granted, generic prompt might have appeared,
        // but often we still need to open settings for them to toggle it.
        // macos_accessibility_client prompts, but doesn't auto-open settings if I recall correctly?
        // Actually it might be safer to open settings if false is returned.
        // Let's defer to opening settings if it returns false.
        await invoke('open_accessibility_settings');
      }
    } catch (error) {
      console.error('Failed to request accessibility permission:', error);
      await invoke('open_accessibility_settings');
    }
  }, []);

  const restartApp = useCallback(async () => {
    try {
      await relaunch();
    } catch (error) {
      console.error('Failed to restart:', error);
      // Fallback: just recheck
      checkPermissions();
    }
  }, [checkPermissions]);

  const allGranted = permissions.screenRecording && permissions.accessibility;
  const anyGranted = permissions.screenRecording || permissions.accessibility;

  return (
    <div className="fixed inset-0 canvas-area flex items-center justify-center p-6">
      <div className="max-w-lg w-full glass-heavy floating-panel overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Permissions Required</h1>
          <p className="text-orange-100 text-sm">
            beautiFULLshot needs these permissions to work properly
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Permission items */}
          <PermissionItem
            title="Screen Recording"
            description="Required to capture screenshots"
            granted={permissions.screenRecording}
            onOpenSettings={openScreenSettings}
          />

          <PermissionItem
            title="Accessibility"
            description="Required for global keyboard shortcuts"
            granted={permissions.accessibility}
            onOpenSettings={openAccessibilitySettings}
          />

          {/* Instructions */}
          {!allGranted && (
            <div className="glass-flat rounded-xl p-4 mt-4 border border-amber-400/20">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
                After enabling permissions:
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                macOS requires an app restart for permission changes to take effect. Click <strong>"Restart App"</strong> below after enabling.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {anyGranted && !allGranted ? (
              <>
                <button
                  onClick={restartApp}
                  disabled={checking}
                  className="flex-1 px-4 py-3 glass-btn glass-btn-active text-orange-500 disabled:opacity-50 font-medium rounded-xl transition-all"
                >
                  Restart App
                </button>
                <button
                  onClick={checkPermissions}
                  disabled={checking}
                  className="px-4 py-3 glass-btn text-gray-600 dark:text-gray-300 font-medium rounded-xl transition-all"
                >
                  {checking ? 'Checking...' : 'Recheck'}
                </button>
              </>
            ) : !allGranted ? (
              <button
                onClick={checkPermissions}
                disabled={checking}
                className="w-full px-4 py-3 glass-btn text-gray-600 dark:text-gray-300 font-medium rounded-xl transition-all"
              >
                {checking ? 'Checking permissions...' : 'Check Again'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            These permissions are only used for screenshot capture and keyboard shortcuts.
            <br />
            Your privacy is respected - no data is collected.
          </p>
        </div>
      </div>
    </div>
  );
}
