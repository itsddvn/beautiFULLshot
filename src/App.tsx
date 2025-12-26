import { useState, useEffect } from "react";
import { useScreenshot } from "./hooks/use-screenshot";
import type { WindowInfo } from "./types/screenshot";

function App() {
  const {
    imageUrl,
    loading,
    error,
    captureFullscreen,
    captureWindow,
    clearImage,
    getWindows,
    waylandWarning,
  } = useScreenshot();

  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [showWindows, setShowWindows] = useState(false);

  // Fetch windows when dropdown is opened
  useEffect(() => {
    if (showWindows) {
      getWindows().then(setWindows).catch(console.error);
    }
  }, [showWindows, getWindows]);

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">BeautyFullShot</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Cross-platform screenshot beautification app
      </p>

      {/* Wayland warning */}
      {waylandWarning && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm max-w-md">
          {waylandWarning}
        </div>
      )}

      {/* Capture buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={captureFullscreen}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Capturing..." : "Capture Screen"}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowWindows(!showWindows)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Capture Window
          </button>

          {showWindows && windows.length > 0 && (
            <div className="absolute top-full mt-2 left-0 w-64 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
              {windows.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    captureWindow(w.id);
                    setShowWindows(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm truncate"
                >
                  <span className="font-medium">{w.app_name}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {w.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {imageUrl && (
          <button
            onClick={clearImage}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm max-w-md">
          {error}
        </div>
      )}

      {/* Screenshot preview */}
      {imageUrl && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden max-w-4xl">
          <img
            src={imageUrl}
            alt="Screenshot"
            className="max-w-full h-auto"
          />
        </div>
      )}

      {/* Empty state */}
      {!imageUrl && !loading && !error && (
        <div className="text-gray-400 dark:text-gray-500 text-center py-12">
          <p className="text-lg mb-2">No screenshot captured</p>
          <p className="text-sm">Click "Capture Screen" or select a window</p>
        </div>
      )}
    </main>
  );
}

export default App;
