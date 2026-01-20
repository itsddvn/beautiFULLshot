// UpdateModal - Modal dialog for app updates
// Shows when a new version is available, with download progress and install

import { createPortal } from 'react-dom';
import { useAutoUpdate } from '../hooks/use-auto-update';

export function UpdateModal() {
  const {
    updateAvailable,
    update,
    downloading,
    progress,
    error,
    installUpdate,
    dismissUpdate,
    clearError,
  } = useAutoUpdate();

  // Don't render if no update available
  if (!updateAvailable || !update) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && !downloading && dismissUpdate()}
    >
      <div
        className="glass-heavy floating-panel w-[400px] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 dark:border-white/5 flex justify-between items-center">
          <h2 id="update-title" className="text-lg font-medium text-gray-800 dark:text-gray-100">
            Update Available
          </h2>
          {!downloading && (
            <button
              onClick={dismissUpdate}
              className="w-8 h-8 flex items-center justify-center glass-btn rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none transition-all"
              aria-label="Dismiss update"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Version info */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-1">
              A new version is ready to install
            </p>
            <p className="text-2xl font-semibold text-orange-500">
              v{update.version}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: v{update.currentVersion}
            </p>
          </div>

          {/* Release notes */}
          {update.body && (
            <div className="glass rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {update.body}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-500 hover:underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Progress bar */}
          {(downloading || progress === 100) && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {progress < 100
                  ? `Downloading... ${progress}%`
                  : downloading
                    ? 'Installing...'
                    : 'Restarting app...'}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!downloading && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={dismissUpdate}
                className="flex-1 py-2.5 px-4 glass-btn rounded-xl text-gray-600 dark:text-gray-300 font-medium transition-all hover:bg-white/50 dark:hover:bg-white/10"
              >
                Later
              </button>
              <button
                onClick={installUpdate}
                className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
              >
                Update Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
