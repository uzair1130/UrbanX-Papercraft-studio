/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BuildingModel, 
  RayTracingSettings 
} from './types';
import { STARTER_BUILDING, DEFAULT_BUILDINGS } from './data/defaultBuildings';
import { Header } from './components/common/Header';
import { BlenderStudio } from './components/studio/BlenderStudio';
import { ExportModal } from './components/export/ExportModal';
import { TutorialModal } from './components/tutorial/TutorialModal';
import { DeviceProjectModal } from './components/studio/DeviceProjectModal';
import { 
  loadActiveDraftFromDevice, 
  loadDeviceCatalog, 
  saveActiveDraftToDevice, 
  saveBuildingToDeviceCatalog 
} from './utils/deviceStorage';

export default function App() {
  // Minimalist clean white theme by default, with dark mode option
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('papercraft_cad_theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('papercraft_cad_theme', theme);
    } catch {
      // Ignore storage errors
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Building currently loaded in 3D Blender Studio (restores active draft from device storage if present)
  const [currentBuilding, setCurrentBuilding] = useState<BuildingModel>(() => {
    const savedDraft = loadActiveDraftFromDevice();
    return savedDraft || STARTER_BUILDING;
  });

  // User's catalog of saved buildings on this device
  const [buildingCatalog, setBuildingCatalog] = useState<Record<string, BuildingModel>>(() => {
    return loadDeviceCatalog();
  });

  // Automatically persist current active draft to device local storage
  useEffect(() => {
    if (currentBuilding) {
      saveActiveDraftToDevice(currentBuilding);
    }
  }, [currentBuilding]);

  // Ray Tracing / Rendering Settings
  const [rtxSettings, setRtxSettings] = useState<RayTracingSettings>({
    enabled: true,
    bounces: 2,
    ambientOcclusion: true,
    aoIntensity: 1.2,
    softShadows: true,
    shadowSoftness: 2.5,
    subsurfaceScatter: true,
    bloom: true,
    bloomIntensity: 0.6,
    preset: 'golden_hour_inspo',
    exposure: 1.25,
  });

  // Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Tutorial Modal State
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Device Project Storage Modal State
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceModalTab, setDeviceModalTab] = useState<'saved' | 'save' | 'open'>('saved');

  // Open Device Storage modal with specific tab
  const handleOpenDeviceModal = (tab: 'saved' | 'save' | 'open' = 'saved') => {
    setDeviceModalTab(tab);
    setDeviceModalOpen(true);
  };

  // Save current building to device persistent catalog
  const handleSaveToCatalog = (bldg: BuildingModel) => {
    const updated = saveBuildingToDeviceCatalog(bldg);
    setBuildingCatalog(updated);
  };

  // Start new project
  const handleNewBuilding = () => {
    const catalogCount = Object.keys(buildingCatalog).length + 1;
    const newBldgId = `bldg_${Date.now()}`;
    const newBldgName = `Paper Architecture ${catalogCount}`;

    const newBuilding: BuildingModel = {
      id: newBldgId,
      name: newBldgName,
      description: 'Blank modular architectural project.',
      category: 'Skyscraper',
      author: 'You (Architect)',
      createdAt: new Date().toISOString().split('T')[0],
      baseFootprint: [2, 2],
      heightMeters: 0,
      estimatedCostUSD: 0,
      resilienceScore: 100,
      tags: ['Custom', 'Modular', 'Architecture'],
      components: [],
    };

    setCurrentBuilding(newBuilding);
    handleSaveToCatalog(newBuilding);
  };

  return (
    <div className={`fixed inset-0 w-full h-full max-w-full max-h-screen flex flex-col overflow-hidden font-sans transition-colors duration-150 ${
      theme === 'dark' ? 'bg-[#0c0f17] text-neutral-100' : 'bg-white text-neutral-900'
    }`}>
      {/* Studio Header Contract */}
      <Header
        onOpenTutorial={() => setTutorialOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenDeviceProjects={handleOpenDeviceModal}
        rtxEnabled={rtxSettings.enabled}
        onToggleRtx={() => setRtxSettings((s) => ({ ...s, enabled: !s.enabled }))}
        currentBuilding={currentBuilding}
        buildingCatalog={buildingCatalog}
        onSelectBuilding={(bldg) => {
          setCurrentBuilding(bldg);
        }}
        onNewBuilding={handleNewBuilding}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      {/* Main Studio Views */}
      <main className="flex-1 flex overflow-hidden relative">
        <BlenderStudio
          currentBuilding={currentBuilding}
          onUpdateBuilding={setCurrentBuilding}
          onSaveToCatalog={handleSaveToCatalog}
          buildingCatalog={buildingCatalog}
          onSelectBuilding={setCurrentBuilding}
          onOpenDeviceProjects={handleOpenDeviceModal}
          rtxSettings={rtxSettings}
          onUpdateRtxSettings={setRtxSettings}
          theme={theme}
        />
      </main>

      {/* 3D Multi-Format Export Modal */}
      {exportModalOpen && (
        <ExportModal
          building={currentBuilding}
          onClose={() => setExportModalOpen(false)}
          theme={theme}
        />
      )}

      {/* Interactive Tutorial & Feature Guide Modal */}
      <TutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />

      {/* Device Project Storage & Resume Unfinished Buildings Modal */}
      <DeviceProjectModal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        currentBuilding={currentBuilding}
        buildingCatalog={buildingCatalog}
        onSelectBuilding={setCurrentBuilding}
        onUpdateBuildingCatalog={setBuildingCatalog}
        initialTab={deviceModalTab}
      />
    </div>
  );
}
