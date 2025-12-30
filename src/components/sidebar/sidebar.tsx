// Sidebar - Right sidebar with beautification, crop, and export controls

import { BackgroundPanel } from './background-panel';
import { CropPanel } from './crop-panel';
import { ExportPanel } from './export-panel';
import { useCanvasStore } from '../../stores/canvas-store';

export function Sidebar() {
  const { imageUrl } = useCanvasStore();

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      {!imageUrl && (
        <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm border-b border-gray-200 dark:border-gray-700">
          Take a screenshot to get started
        </div>
      )}
      <BackgroundPanel />
      <CropPanel />
      <ExportPanel />
    </div>
  );
}
