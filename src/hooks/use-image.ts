// useImage hook - Load and track image loading status

import { useState, useEffect, useRef } from 'react';

type ImageStatus = 'loading' | 'loaded' | 'error';

export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');
  // Track the URL we're currently loading to prevent stale updates
  const currentUrlRef = useRef<string>('');

  useEffect(() => {
    if (!url) {
      setImage(null);
      setStatus('loading');
      currentUrlRef.current = '';
      return;
    }

    // Track current URL to detect stale callbacks
    currentUrlRef.current = url;
    setStatus('loading');

    const img = new Image();
    // Store URL at time of creation for comparison in callbacks
    const loadingUrl = url;

    img.onload = () => {
      // Only update if this is still the current URL (not stale)
      if (currentUrlRef.current === loadingUrl) {
        setImage(img);
        setStatus('loaded');
      }
    };

    img.onerror = () => {
      // Only update if this is still the current URL (not stale)
      if (currentUrlRef.current === loadingUrl) {
        setImage(null);
        setStatus('error');
      }
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [image, status];
}
