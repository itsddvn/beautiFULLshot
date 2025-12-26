// useScreenshot hook - React hook for screenshot capture functionality
// Returns raw bytes - URL lifecycle managed by canvas-store

import { useState, useCallback, useEffect } from "react";
import * as api from "../utils/screenshot-api";
import type { WindowInfo, MonitorInfo } from "../types/screenshot";

interface UseScreenshotReturn {
  // State
  loading: boolean;
  error: string | null;

  // Capture actions - return raw bytes
  captureFullscreen: () => Promise<Uint8Array | null>;
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
      const bytes = await api.captureFullscreen();
      return bytes;
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
    captureWindow,
    getWindows,
    getMonitors,
    checkPermission,
    waylandWarning,
  };
}
