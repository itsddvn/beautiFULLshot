// Sidebar - Right sidebar with beautification, crop, and export controls

import { BackgroundPanel } from './background-panel';
import { CropPanel } from './crop-panel';
import { ExportPanel } from './export-panel';
import { useCanvasStore } from '../../stores/canvas-store';

export function Sidebar() {
  const { imageUrl } = useCanvasStore();

  // Only show sidebar when image is loaded
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
      <BackgroundPanel />
      <CropPanel />
      <ExportPanel />
    </div>
  );
}
