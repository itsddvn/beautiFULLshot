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
  const setCropRect = useCropStore((state) => state.setCropRect);
  const imageUrl = useCanvasStore((state) => state.imageUrl);
  const originalWidth = useCanvasStore((state) => state.originalWidth);
  const originalHeight = useCanvasStore((state) => state.originalHeight);
  const cropImage = useCanvasStore((state) => state.cropImage);

  // Disable crop if no image loaded
  const canCrop = imageUrl !== null && originalWidth > 0;

  // Handle aspect ratio change - recalculate crop rect to match new ratio
  const handleAspectRatioChange = (newRatio: number | null) => {
    setAspectRatio(newRatio);

    // Get current rect or default
    const currentRect = cropRect || {
      x: originalWidth * 0.1,
      y: originalHeight * 0.1,
      width: originalWidth * 0.8,
      height: originalHeight * 0.8,
    };

    // For freeform (null ratio), keep current rect as-is
    if (newRatio === null) {
      setCropRect(currentRect);
      return;
    }

    // Calculate new dimensions maintaining center point
    const centerX = currentRect.x + currentRect.width / 2;
    const centerY = currentRect.y + currentRect.height / 2;

    let newWidth: number;
    let newHeight: number;

    // Determine new size based on aspect ratio, fitting within current rect area
    const currentRatio = currentRect.width / currentRect.height;
    if (newRatio > currentRatio) {
      // New ratio is wider - use current width, calculate height
      newWidth = currentRect.width;
      newHeight = newWidth / newRatio;
    } else {
      // New ratio is taller - use current height, calculate width
      newHeight = currentRect.height;
      newWidth = newHeight * newRatio;
    }

    // Calculate new position (centered on same point)
    let newX = centerX - newWidth / 2;
    let newY = centerY - newHeight / 2;

    // Clamp to image bounds
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newWidth > originalWidth) newX = originalWidth - newWidth;
    if (newY + newHeight > originalHeight) newY = originalHeight - newHeight;

    // If still out of bounds (rect too large), scale down
    if (newX < 0 || newY < 0) {
      const scaleX = originalWidth / newWidth;
      const scaleY = originalHeight / newHeight;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of max to leave margin
      newWidth *= scale;
      newHeight *= scale;
      newX = (originalWidth - newWidth) / 2;
      newY = (originalHeight - newHeight) / 2;
    }

    setCropRect({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      width: newWidth,
      height: newHeight,
    });
  };

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
    <div className="p-3 glass-flat rounded-xl mb-2">
      <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Crop</h3>

      {!isCropping ? (
        <button
          onClick={handleStartCrop}
          disabled={!canCrop}
          className={`w-full py-2 rounded-xl font-medium transition-all ${
            canCrop
              ? 'glass-btn text-orange-500 hover:text-orange-600'
              : 'glass-flat text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
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
                onClick={() => handleAspectRatioChange(ar.ratio)}
                className={`px-2 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  aspectRatio === ar.ratio
                    ? 'glass-btn glass-btn-active text-orange-500'
                    : 'glass-btn text-gray-600 dark:text-gray-300'
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
              className="flex-1 py-2 glass-btn glass-btn-active text-orange-500 rounded-xl font-medium transition-all"
            >
              Apply
            </button>
            <button
              onClick={cancelCrop}
              className="flex-1 py-2 glass-btn text-gray-600 dark:text-gray-300 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
