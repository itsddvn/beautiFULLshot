// useCaptureFeeback - Provides visual and audio feedback for screenshot capture
// Includes camera shutter sound and screen flash effect

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCaptureFebackReturn {
  showFlash: boolean;
  triggerFeedback: () => void;
}

/**
 * Creates a function to play the macOS screen capture sound
 * Uses the system's native screenshot sound for familiar UX
 */
function createShutterSound(): () => void {
  let audio: HTMLAudioElement | null = null;

  return () => {
    try {
      if (!audio) {
        audio = new Audio('/screen-capture.aif');
        audio.volume = 0.7;
      }
      audio.currentTime = 0;
      audio.play().catch(() => {/* ignore autoplay restrictions */});
    } catch {
      // Silently fail
    }
  };
}

/**
 * Hook that provides screenshot capture feedback
 * - Visual flash effect (white screen flash)
 * - Audio shutter sound
 */
export function useCaptureFeedback(): UseCaptureFebackReturn {
  const [showFlash, setShowFlash] = useState(false);
  const playSound = useRef(createShutterSound());

  // Cleanup flash state after animation
  useEffect(() => {
    if (showFlash) {
      const timer = setTimeout(() => setShowFlash(false), 150);
      return () => clearTimeout(timer);
    }
  }, [showFlash]);

  const triggerFeedback = useCallback(() => {
    // Play shutter sound
    playSound.current();
    // Show flash
    setShowFlash(true);
  }, []);

  return { showFlash, triggerFeedback };
}
