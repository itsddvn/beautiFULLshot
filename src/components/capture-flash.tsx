// CaptureFlash - Full screen white flash effect for screenshot feedback

interface CaptureFlashProps {
  visible: boolean;
}

/**
 * Full-screen flash overlay that briefly appears when taking a screenshot
 * Provides visual feedback similar to camera flash
 */
export function CaptureFlash({ visible }: CaptureFlashProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-white pointer-events-none z-[9999] animate-flash"
      aria-hidden="true"
    />
  );
}
