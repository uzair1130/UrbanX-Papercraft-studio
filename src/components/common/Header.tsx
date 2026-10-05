import React from 'react';
import { Box, Sparkles, Download, FolderOpen, Plus, Compass, Sun, Moon, BookOpen } from 'lucide-react';
import { BuildingModel } from '../../types';

interface HeaderProps {
  onOpenTutorial: () => void;
  onOpenExport: () => void;
  rtxEnabled: boolean;
  onToggleRtx: () => void;
  currentBuilding: BuildingModel;
  buildingCatalog: Record<string, BuildingModel>;
  onSelectBuilding: (bldg: BuildingModel) => void;
  onNewBuilding: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTutorial,
  onOpenExport,
  rtxEnabled,
  onToggleRtx,
  currentBuilding,
  buildingCatalog,
  onSelectBuilding,
  onNewBuilding,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-13 bg-white dark:bg-[#0e121b] border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors duration-150">
      {/* Zone 1: Wordmark & Architecture Studio Brand */}
      <div className="flex items-center gap-3">
        <a 
          href="#" 
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2.5 text-neutral-900 dark:text-white transition-opacity hover:opacity-90"
        >
          {/* Secondary Red-to-Yellow gradient mark */}
          <div className="w-6 h-6 bg-ry-gradient flex items-center justify-center text-white shadow-xs">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight uppercase text-ry-gradient">
              Papercraft Studio
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-ry-gradient uppercase hidden sm:inline">
              CAD 3D
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Model Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Model Project Selector */}
        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-[#141926] px-2 py-1 border border-neutral-200 dark:border-neutral-800">
          <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-ry-gradient hidden md:inline">Model:</span>
          <select
            value={currentBuilding.id}
            onChange={(e) => {
              const selected = buildingCatalog[e.target.value];
              if (selected) {
                onSelectBuilding(selected);
              }
            }}
            className="bg-transparent text-neutral-900 dark:text-neutral-100 text-xs font-semibold outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
            title="Switch between 3D papercraft models"
          >
            {Object.values(buildingCatalog).map((b) => (
              <option key={b.id} value={b.id} className="bg-white dark:bg-[#141926] text-neutral-900 dark:text-neutral-100 font-normal">
                {b.name} {b.heightMeters > 0 ? `(${b.heightMeters}m)` : '(Blank Canvas)'}
              </option>
            ))}
          </select>

          <button
            onClick={onNewBuilding}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors ml-0.5"
            title="Create New Blank Papercraft Project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Workspace Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-ry-gradient font-bold">3D Studio Workspace</span>
        </div>
      </div>

      {/* Zone 3: Primary Actions (Tutorial, Dark mode, RTX, Export) */}
      <div className="flex items-center gap-2">
        {/* Tutorial & Features Guide */}
        <button
          onClick={onOpenTutorial}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Open Complete Tutorial & Feature Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[11px] font-semibold">Tutorial &amp; Features</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden lg:inline text-[11px]">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Light</span>
            </>
          )}
        </button>

        {/* Ray Tracing Quick Toggle */}
        <button
          onClick={onToggleRtx}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition-colors ${
            rtxEnabled
              ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs'
              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Toggle Real-Time Ray Traced Lighting & Subsurface Scatters"
        >
          <Sparkles className={`w-3.5 h-3.5 ${rtxEnabled ? 'text-amber-400 dark:text-amber-500 fill-current' : 'text-neutral-400'}`} />
          <span className="hidden md:inline">{rtxEnabled ? 'RTX Active' : 'RTX Off'}</span>
        </button>

        {/* 3D & Net Export Button - Secondary Red-to-Yellow Gradient */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-ry-gradient text-white shadow-xs hover:brightness-105 active:scale-[0.99] transition-all whitespace-nowrap"
          title="Export as Printable PDF Net, OBJ, STL, GLTF or Snapshot"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 3D &amp; Net</span>
        </button>
      </div>
    </header>
  );
};
