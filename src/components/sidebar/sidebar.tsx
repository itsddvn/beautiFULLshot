// Sidebar - Right sidebar with Edit (background/crop) and Export tabs

import { useState } from 'react';
import { BackgroundPanel } from './background-panel';
import { CropPanel } from './crop-panel';
import { ExportPanel } from './export-panel';
import { useCanvasStore } from '../../stores/canvas-store';

type SidebarTab = 'edit' | 'export';

export function Sidebar() {
  const { imageUrl } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>('edit');

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className="w-80 glass floating-panel flex flex-col h-full">
      {/* Tab navigation */}
      <div className="flex shrink-0 p-1.5 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all rounded-xl ${
              activeTab === tab.id
                ? 'glass-btn glass-btn-active text-orange-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-1.5">
        {!imageUrl && (
          <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm glass-flat rounded-xl mb-2">
            Take a screenshot to get started
          </div>
        )}

        {activeTab === 'edit' && (
          <>
            <CropPanel />
            <BackgroundPanel />
          </>
        )}

        {activeTab === 'export' && <ExportPanel />}
      </div>
    </div>
  );
}
