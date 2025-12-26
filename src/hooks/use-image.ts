// useImage hook - Load and track image loading status

import { useState, useEffect } from 'react';

type ImageStatus = 'loading' | 'loaded' | 'error';

export function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>('loading');

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    setStatus('loading');
    const img = new Image();

    img.onload = () => {
      setImage(img);
      setStatus('loaded');
    };

    img.onerror = () => {
      setImage(null);
      setStatus('error');
    };

    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [image, status];
}
