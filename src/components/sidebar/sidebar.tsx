// Sidebar - Right sidebar with Edit (background/crop) and Export tabs

import { useState } from 'react';
import { BackgroundPanel } from './background-panel';
import { CropPanel } from './crop-panel';
import { ExportPanel } from './export-panel';

type SidebarTab = 'edit' | 'export';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('edit');

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className="w-80 glass floating-panel flex flex-col h-full">
      {/* Tab navigation - compact */}
      <div className="flex shrink-0 p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 text-sm font-medium transition-all rounded-lg ${
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
      <div className="flex-1 overflow-y-auto px-1 pb-1">

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
