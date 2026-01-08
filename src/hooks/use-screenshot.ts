// useScreenshot hook - React hook for screenshot capture functionality
// Returns raw bytes - URL lifecycle managed by canvas-store

import { useState, useCallback, useEffect } from "react";
import * as api from "../utils/screenshot-api";
import type { WindowInfo, MonitorInfo } from "../types/screenshot";

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseScreenshotReturn {
  // State
  loading: boolean;
  error: string | null;

  // Capture actions - return raw bytes
  captureFullscreen: () => Promise<Uint8Array | null>;
  captureRegion: (region: CaptureRegion) => Promise<Uint8Array | null>;
  captureRegionInteractive: () => Promise<Uint8Array | null>;
  captureWindow: (windowId: number) => Promise<Uint8Array | null>;

  // Data fetching
  getWindows: () => Promise<WindowInfo[]>;
  getMonitors: () => Promise<MonitorInfo[]>;

  // Permission checks
  checkPermission: () => Promise<boolean>;
  waylandWarning: string | null;
}

export function useScreenshot(): UseScreenshotReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waylandWarning, setWaylandWarning] = useState<string | null>(null);

  // Check for Wayland on mount (Linux only)
  useEffect(() => {
    api.checkWayland().then((warning) => {
      if (warning) setWaylandWarning(warning);
    });
  }, []);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const captureFullscreen = useCallback(async (): Promise<Uint8Array | null> => {
    setLoading(true);
    setError(null);
    try {
      // Use hidden capture to exclude app window from screenshot
      const bytes = await api.captureFullscreenHidden();
      return bytes;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const captureRegion = useCallback(
    async (region: CaptureRegion): Promise<Uint8Array | null> => {
      setLoading(true);
      setError(null);
      try {
        // Use hidden capture to exclude app window from screenshot
        const bytes = await api.captureRegionHidden(region);
        return bytes;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const captureRegionInteractive = useCallback(async (): Promise<Uint8Array | null> => {
    setLoading(true);
    setError(null);
    try {
      // This opens the overlay window for interactive region selection
      // The actual capture is handled by the overlay via events
      await api.createOverlayWindow();
      // Note: This function returns null immediately because actual capture
      // happens asynchronously via region-selected event
      return null;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const captureWindow = useCallback(
    async (windowId: number): Promise<Uint8Array | null> => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await api.captureWindow(windowId);
        return bytes;
      } catch (e) {
        setError(String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getWindows = useCallback(async () => {
    return await api.getWindows();
  }, []);

  const getMonitors = useCallback(async () => {
    return await api.getMonitors();
  }, []);

  const checkPermission = useCallback(async () => {
    return await api.checkScreenPermission();
  }, []);

  return {
    loading,
    error,
    captureFullscreen,
    captureRegion,
    captureRegionInteractive,
    captureWindow,
    getWindows,
    getMonitors,
    checkPermission,
    waylandWarning,
  };
}
