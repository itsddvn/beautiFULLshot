// useScreenshot hook - React hook for screenshot capture functionality

import { useState, useCallback, useEffect } from "react";
import * as api from "../utils/screenshot-api";
import type { WindowInfo, MonitorInfo } from "../types/screenshot";

interface UseScreenshotReturn {
  // Screenshot data
  imageUrl: string | null;
  imageBytes: Uint8Array | null;

  // State
  loading: boolean;
  error: string | null;

  // Capture actions
  captureFullscreen: () => Promise<void>;
  captureWindow: (windowId: number) => Promise<void>;
  clearImage: () => void;

  // Data fetching
  getWindows: () => Promise<WindowInfo[]>;
  getMonitors: () => Promise<MonitorInfo[]>;

  // Permission checks
  checkPermission: () => Promise<boolean>;
  waylandWarning: string | null;
}

export function useScreenshot(): UseScreenshotReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waylandWarning, setWaylandWarning] = useState<string | null>(null);

  // Check for Wayland on mount (Linux only)
  useEffect(() => {
    api.checkWayland().then((warning) => {
      if (warning) setWaylandWarning(warning);
    });
  }, []);

  const captureFullscreen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await api.captureFullscreen();
      setImageBytes(bytes);
      // Revoke previous URL if exists
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(api.bytesToImageUrl(bytes));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

  const captureWindow = useCallback(
    async (windowId: number) => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await api.captureWindow(windowId);
        setImageBytes(bytes);
        // Revoke previous URL if exists
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(api.bytesToImageUrl(bytes));
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [imageUrl]
  );

  const clearImage = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageBytes(null);
    setError(null);
  }, [imageUrl]);

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
    imageUrl,
    imageBytes,
    loading,
    error,
    captureFullscreen,
    captureWindow,
    clearImage,
    getWindows,
    getMonitors,
    checkPermission,
    waylandWarning,
  };
}
