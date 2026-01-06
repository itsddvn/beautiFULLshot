// BackgroundLayer - Renders gradient/solid/transparent/wallpaper/image background

import { useEffect, useRef, useState } from 'react';
import { Rect, Shape, Image as KonvaImage, Group } from 'react-konva';
import Konva from 'konva';
import { useBackgroundStore } from '../../stores/background-store';
import { useCanvasStore } from '../../stores/canvas-store';
import { parseWallpaperUrl } from '../../data/wallpapers';

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Checkerboard pattern size for transparency
const CHECKER_SIZE = 10;

interface BackgroundLayerProps {
  canvasWidth?: number;
  canvasHeight?: number;
}

export function BackgroundLayer({ canvasWidth, canvasHeight }: BackgroundLayerProps) {
  const {
    type,
    gradient,
    solidColor,
    wallpaper,
    customImageUrl,
    blurAmount,
    getPaddingPx,
  } = useBackgroundStore();
  const { originalWidth, originalHeight } = useCanvasStore();

  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Debounce blur amount for performance (cache operation is expensive)
  const debouncedBlurAmount = useDebounce(blurAmount, 50);

  const padding = getPaddingPx(originalWidth, originalHeight);

  // Use provided dimensions (for aspect ratio extension) or calculate from image
  const totalWidth = canvasWidth || originalWidth + padding * 2;
  const totalHeight = canvasHeight || originalHeight + padding * 2;

  // Load custom image or wallpaper image
  useEffect(() => {
    let imageUrl: string | null = null;

    if (type === 'image' && customImageUrl) {
      imageUrl = customImageUrl;
    } else if (type === 'wallpaper' && wallpaper) {
      const parsed = parseWallpaperUrl(wallpaper.url);
      if (parsed.type === 'image') {
        imageUrl = parsed.value;
      }
    }

    if (imageUrl && !imageUrl.startsWith('gradient:')) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setLoadedImage(img);
      img.onerror = () => setLoadedImage(null);
      img.src = imageUrl;
    } else {
      setLoadedImage(null);
    }
  }, [type, customImageUrl, wallpaper]);

  // Apply blur filter for image backgrounds (debounced for performance)
  useEffect(() => {
    if (imageRef.current && loadedImage && debouncedBlurAmount > 0) {
      imageRef.current.clearCache();
      // Limit blur to 100px max for performance (higher values cause canvas memory issues)
      const effectiveBlur = Math.min(debouncedBlurAmount, 100);
      imageRef.current.cache();
      imageRef.current.filters([Konva.Filters.Blur]);
      imageRef.current.blurRadius(effectiveBlur);
      imageRef.current.getLayer()?.batchDraw();
    } else if (imageRef.current) {
      imageRef.current.clearCache();
      imageRef.current.filters([]);
      imageRef.current.getLayer()?.batchDraw();
    }
  }, [loadedImage, debouncedBlurAmount, totalWidth, totalHeight]);

  // Apply blur filter for non-image backgrounds (gradient, solid, wallpaper gradient) - debounced
  useEffect(() => {
    const isImageBackground = (type === 'image' && loadedImage) ||
      (type === 'wallpaper' && wallpaper && parseWallpaperUrl(wallpaper.url).type === 'image' && loadedImage);

    // Only apply group blur for non-image backgrounds
    if (groupRef.current && !isImageBackground && type !== 'transparent') {
      if (debouncedBlurAmount > 0) {
        groupRef.current.clearCache();
        // Limit blur to 100px max for performance (higher values cause canvas memory issues)
        const effectiveBlur = Math.min(debouncedBlurAmount, 100);
        groupRef.current.cache();
        groupRef.current.filters([Konva.Filters.Blur]);
        groupRef.current.blurRadius(effectiveBlur);
        groupRef.current.getLayer()?.batchDraw();
      } else {
        groupRef.current.clearCache();
        groupRef.current.filters([]);
        groupRef.current.getLayer()?.batchDraw();
      }
    }
  }, [type, wallpaper, loadedImage, debouncedBlurAmount, totalWidth, totalHeight, gradient, solidColor]);

  // Don't render if no image loaded
  if (originalWidth === 0 || originalHeight === 0) {
    return null;
  }

  // Transparent: checkerboard pattern
  if (type === 'transparent') {
    return (
      <Shape
        sceneFunc={(ctx) => {
          for (let x = 0; x < totalWidth; x += CHECKER_SIZE) {
            for (let y = 0; y < totalHeight; y += CHECKER_SIZE) {
              const isEven =
                (Math.floor(x / CHECKER_SIZE) + Math.floor(y / CHECKER_SIZE)) %
                  2 ===
                0;
              ctx.fillStyle = isEven ? '#cccccc' : '#ffffff';
              ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
            }
          }
        }}
        listening={false}
      />
    );
  }

  // Solid color background
  if (type === 'solid') {
    return (
      <Group ref={groupRef}>
        <Rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          fill={solidColor}
          listening={false}
        />
      </Group>
    );
  }

  // Custom image background
  if (type === 'image') {
    if (loadedImage) {
      // Calculate scale to cover entire background while preserving aspect ratio
      const scaleX = totalWidth / loadedImage.width;
      const scaleY = totalHeight / loadedImage.height;
      const scale = Math.max(scaleX, scaleY);

      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const offsetX = (totalWidth - scaledWidth) / 2;
      const offsetY = (totalHeight - scaledHeight) / 2;

      return (
        <Group
          clipX={0}
          clipY={0}
          clipWidth={totalWidth}
          clipHeight={totalHeight}
        >
          <KonvaImage
            ref={imageRef}
            image={loadedImage}
            x={offsetX}
            y={offsetY}
            width={scaledWidth}
            height={scaledHeight}
            listening={false}
          />
        </Group>
      );
    }
    // Loading fallback - solid dark background
    return (
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="#1a1a2e"
        listening={false}
      />
    );
  }

  // Wallpaper background
  if (type === 'wallpaper' && wallpaper) {
    const parsed = parseWallpaperUrl(wallpaper.url);

    // If wallpaper is an image
    if (parsed.type === 'image' && loadedImage) {
      // Calculate scale to cover entire background while preserving aspect ratio
      const scaleX = totalWidth / loadedImage.width;
      const scaleY = totalHeight / loadedImage.height;
      const scale = Math.max(scaleX, scaleY);

      const scaledWidth = loadedImage.width * scale;
      const scaledHeight = loadedImage.height * scale;
      const offsetX = (totalWidth - scaledWidth) / 2;
      const offsetY = (totalHeight - scaledHeight) / 2;

      return (
        <Group
          clipX={0}
          clipY={0}
          clipWidth={totalWidth}
          clipHeight={totalHeight}
        >
          <KonvaImage
            ref={imageRef}
            image={loadedImage}
            x={offsetX}
            y={offsetY}
            width={scaledWidth}
            height={scaledHeight}
            listening={false}
          />
        </Group>
      );
    }

    // If wallpaper is a gradient
    if (parsed.type === 'gradient') {
      return (
        <Group ref={groupRef}>
          <Shape
            sceneFunc={(ctx) => {
              // Parse the gradient CSS
              const gradientCss = parsed.value;

              // Simple parsing for linear and radial gradients
              if (gradientCss.startsWith('linear-gradient')) {
                const match = gradientCss.match(/linear-gradient\(([^,]+),\s*(.+)\)/);
                if (match) {
                  const direction = match[1].trim();
                  const colorsStr = match[2];

                  // Parse angle
                  let angle = 180;
                  if (direction.includes('deg')) {
                    angle = parseInt(direction.replace('deg', ''));
                  }

                  // Parse color stops
                  const colorStops = colorsStr.split(/,(?![^(]*\))/).map((s) => s.trim());
                  const colors: { color: string; position: number }[] = [];

                  colorStops.forEach((stop) => {
                    const parts = stop.split(/\s+/);
                    const color = parts[0];
                    const position = parts[1]
                      ? parseFloat(parts[1].replace('%', '')) / 100
                      : null;
                    if (color) {
                      colors.push({
                        color,
                        position: position ?? colors.length / (colorStops.length - 1),
                      });
                    }
                  });

                  // Create gradient
                  const angleRad = (angle * Math.PI) / 180;
                  const x1 = totalWidth / 2 - Math.cos(angleRad) * (totalWidth / 2);
                  const y1 = totalHeight / 2 - Math.sin(angleRad) * (totalHeight / 2);
                  const x2 = totalWidth / 2 + Math.cos(angleRad) * (totalWidth / 2);
                  const y2 = totalHeight / 2 + Math.sin(angleRad) * (totalHeight / 2);

                  const grd = ctx.createLinearGradient(x1, y1, x2, y2);
                  colors.forEach(({ color, position }) => {
                    grd.addColorStop(position, color);
                  });

                  ctx.fillStyle = grd;
                  ctx.fillRect(0, 0, totalWidth, totalHeight);
                }
              } else if (gradientCss.startsWith('radial-gradient')) {
                const match = gradientCss.match(/radial-gradient\([^,]+,\s*(.+)\)/);
                if (match) {
                  const colorsStr = match[1];
                  const colorStops = colorsStr.split(/,(?![^(]*\))/).map((s) => s.trim());
                  const colors: { color: string; position: number }[] = [];

                  colorStops.forEach((stop) => {
                    const parts = stop.split(/\s+/);
                    const color = parts[0];
                    const position = parts[1]
                      ? parseFloat(parts[1].replace('%', '')) / 100
                      : null;
                    if (color) {
                      colors.push({
                        color,
                        position: position ?? colors.length / (colorStops.length - 1),
                      });
                    }
                  });

                  const grd = ctx.createRadialGradient(
                    totalWidth / 2,
                    totalHeight / 2,
                    0,
                    totalWidth / 2,
                    totalHeight / 2,
                    Math.max(totalWidth, totalHeight) / 2
                  );
                  colors.forEach(({ color, position }) => {
                    grd.addColorStop(position, color);
                  });

                  ctx.fillStyle = grd;
                  ctx.fillRect(0, 0, totalWidth, totalHeight);
                }
              }
            }}
            listening={false}
          />
        </Group>
      );
    }
  }

  // Gradient background (default)
  if (!gradient) {
    return (
      <Group ref={groupRef}>
        <Rect
          x={0}
          y={0}
          width={totalWidth}
          height={totalHeight}
          fill="#ffffff"
          listening={false}
        />
      </Group>
    );
  }

  return (
    <Group ref={groupRef}>
      <Shape
        sceneFunc={(ctx) => {
          let grd: CanvasGradient;

          if (gradient.direction === 'radial') {
            grd = ctx.createRadialGradient(
              totalWidth / 2,
              totalHeight / 2,
              0,
              totalWidth / 2,
              totalHeight / 2,
              Math.max(totalWidth, totalHeight) / 2
            );
          } else {
            // Linear gradient based on angle
            const angleRad = ((gradient.angle || 0) * Math.PI) / 180;
            const x1 = totalWidth / 2 - Math.cos(angleRad) * (totalWidth / 2);
            const y1 = totalHeight / 2 - Math.sin(angleRad) * (totalHeight / 2);
            const x2 = totalWidth / 2 + Math.cos(angleRad) * (totalWidth / 2);
            const y2 = totalHeight / 2 + Math.sin(angleRad) * (totalHeight / 2);
            grd = ctx.createLinearGradient(x1, y1, x2, y2);
          }

          gradient.colors.forEach((color, i) => {
            grd.addColorStop(i / (gradient.colors.length - 1), color);
          });

          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, totalWidth, totalHeight);
        }}
        listening={false}
      />
    </Group>
  );
}
