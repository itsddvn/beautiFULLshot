// CropPanel - UI for crop mode with aspect ratio selection

import { ASPECT_RATIOS } from '../../data/aspect-ratios';
import { useCropStore } from '../../stores/crop-store';
import { useCanvasStore } from '../../stores/canvas-store';

export function CropPanel() {
  // Use selectors for proper Zustand 5.0 subscription
  const isCropping = useCropStore((state) => state.isCropping);
  const aspectRatio = useCropStore((state) => state.aspectRatio);
  const cropRect = useCropStore((state) => state.cropRect);
  const startCrop = useCropStore((state) => state.startCrop);
  const applyCrop = useCropStore((state) => state.applyCrop);
  const cancelCrop = useCropStore((state) => state.cancelCrop);
  const setAspectRatio = useCropStore((state) => state.setAspectRatio);
  const imageUrl = useCanvasStore((state) => state.imageUrl);
  const originalWidth = useCanvasStore((state) => state.originalWidth);
  const originalHeight = useCanvasStore((state) => state.originalHeight);
  const cropImage = useCanvasStore((state) => state.cropImage);

  // Disable crop if no image loaded
  const canCrop = imageUrl !== null && originalWidth > 0;

  const handleStartCrop = () => {
    if (canCrop) {
      startCrop();
    }
  };

  const handleApplyCrop = async () => {
    // Use current cropRect or default to 80% centered if not set
    const rect = cropRect || {
      x: originalWidth * 0.1,
      y: originalHeight * 0.1,
      width: originalWidth * 0.8,
      height: originalHeight * 0.8,
    };

    // Crop the image
    await cropImage(rect);

    // Close crop mode
    applyCrop();
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Crop</h3>

      {!isCropping ? (
        <button
          onClick={handleStartCrop}
          disabled={!canCrop}
          className={`w-full py-2 rounded transition-colors ${
            canCrop
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {canCrop ? 'Start Crop' : 'Take screenshot first'}
        </button>
      ) : (
        <>
          {/* Aspect ratio presets */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.ratio)}
                className={`px-2 py-1.5 text-sm rounded transition-colors ${
                  aspectRatio === ar.ratio
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                {ar.name}
              </button>
            ))}
          </div>

          {/* Apply/Cancel buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApplyCrop}
              className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={cancelCrop}
              className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
