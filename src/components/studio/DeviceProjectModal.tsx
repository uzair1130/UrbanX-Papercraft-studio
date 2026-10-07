import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Download, 
  Upload, 
  FolderOpen, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  Sparkles, 
  HardDrive, 
  Box,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BuildingModel } from '../../types';
import { DEFAULT_BUILDINGS, PRESET_BUILDING_IDS } from '../../data/defaultBuildings';
import { 
  exportBuildingToDeviceFile, 
  importBuildingFromDeviceFile, 
  saveBuildingToDeviceCatalog, 
  deleteBuildingFromDeviceCatalog,
  saveActiveDraftToDevice
} from '../../utils/deviceStorage';

interface DeviceProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBuilding: BuildingModel;
  buildingCatalog: Record<string, BuildingModel>;
  onSelectBuilding: (building: BuildingModel) => void;
  onUpdateBuildingCatalog: (catalog: Record<string, BuildingModel>) => void;
  initialTab?: 'saved' | 'save' | 'open';
}

export const DeviceProjectModal: React.FC<DeviceProjectModalProps> = ({
  isOpen,
  onClose,
  currentBuilding,
  buildingCatalog,
  onSelectBuilding,
  onUpdateBuildingCatalog,
  initialTab = 'saved',
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'save' | 'open'>(initialTab);
  const [saveName, setSaveName] = useState(currentBuilding.name);
  const [saveDesc, setSaveDesc] = useState(currentBuilding.description || '');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // 1. Direct Save to Device (.paper file)
  const handleExportToFile = () => {
    const filename = saveName.trim() || currentBuilding.name;
    exportBuildingToDeviceFile({
      ...currentBuilding,
      name: filename,
      description: saveDesc.trim() || currentBuilding.description,
    });
    showFeedback(`Downloaded "${filename}.paper" to your device!`);
  };

  // 2. Save as Local Draft in Device Browser Catalog
  const handleSaveToDeviceCatalog = () => {
    const trimmedName = saveName.trim() || currentBuilding.name;
    const isNew = !buildingCatalog[currentBuilding.id];
    const bldgId = isNew ? `bldg_saved_${Date.now()}` : currentBuilding.id;

    const toSave: BuildingModel = {
      ...currentBuilding,
      id: bldgId,
      name: trimmedName,
      description: saveDesc.trim() || currentBuilding.description,
      createdAt: currentBuilding.createdAt || new Date().toISOString().split('T')[0],
    };

    saveActiveDraftToDevice(toSave);
    const updated = saveBuildingToDeviceCatalog(toSave);
    onUpdateBuildingCatalog(updated);
    onSelectBuilding(toSave);
    showFeedback(`Saved "${trimmedName}" to this device! You can resume it anytime.`);
  };

  // 3. Delete custom project from device catalog
  const handleDeleteFromCatalog = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from this device's saved buildings?`)) {
      const updated = deleteBuildingFromDeviceCatalog(id);
      onUpdateBuildingCatalog(updated);
      showFeedback(`Removed "${name}" from device catalog.`);
    }
  };

  // 4. File import handler
  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    setImportError(null);
    try {
      const importedBuilding = await importBuildingFromDeviceFile(file);
      // Save to device catalog so user can resume anytime
      saveActiveDraftToDevice(importedBuilding);
      const updated = saveBuildingToDeviceCatalog(importedBuilding);
      onUpdateBuildingCatalog(updated);
      onSelectBuilding(importedBuilding);
      showFeedback(`Loaded "${importedBuilding.name}" with ${importedBuilding.components.length} components!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setImportError(err?.message || 'Failed to load project file from device.');
    }
  };

  // Strictly user-saved projects on this device (all presets excluded)
  const savedBuildingsList = Object.values(buildingCatalog).filter(
    (bldg) => Boolean(bldg && !DEFAULT_BUILDINGS[bldg.id] && !PRESET_BUILDING_IDS.has(bldg.id) && bldg.id !== 'bldg_blank_starter')
  );

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl text-neutral-800 dark:text-neutral-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Gradient Stripe */}
        <div className="h-1 bg-ry-gradient w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between shrink-0 bg-neutral-50/50 dark:bg-[#141926]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ry-gradient text-white flex items-center justify-center shadow-xs shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                  Device Project Storage
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold border border-amber-500/20">
                  MY DRAFTS
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Save your architectural models to your device so you can finish your unfinished buildings anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {feedbackNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 bg-white dark:bg-[#0e121b] shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Finish Unfinished Drafts ({savedBuildingsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('save')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'save'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Device</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'open'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open File from Device</span>
          </button>
        </div>

        {/* Tab 1: Unfinished Drafts & Saved Projects */}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedBuildingsList.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/40 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase mb-1">
                  No Saved Projects on This Device Yet
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mb-4 leading-relaxed">
                  When you save your building draft or download a .paper file, it will be stored right here on your device so you can resume your projects anytime.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('save')}
                    className="px-3.5 py-1.5 bg-ry-gradient text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Current Building to Device</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('open')}
                    className="px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141926] text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>Open File from Device</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  <span>Your saved architectural drafts on this device:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('save')}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save current as new draft</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {savedBuildingsList.map((bldg) => {
                    const isCurrent = bldg.id === currentBuilding.id;
                    return (
                      <div
                        key={bldg.id}
                        className={`p-3 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent
                            ? 'border-amber-500 bg-amber-500/5'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-[#141926]/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-semibold text-neutral-900 dark:text-white text-xs truncate">
                              {bldg.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-ry-gradient text-white font-bold font-mono">
                                CURRENTLY EDITING
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {bldg.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                            <span>{bldg.components.length} components</span>
                            <span>·</span>
                            <span>{bldg.heightMeters}m height</span>
                            {bldg.createdAt && (
                              <>
                                <span>·</span>
                                <span>Date: {bldg.createdAt}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => exportBuildingToDeviceFile(bldg)}
                            className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0e121b] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download .paper file to device"
                          >
                            <Download className="w-3 h-3 text-amber-500" />
                            <span className="text-[11px]">Save File</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectBuilding(bldg);
                              saveActiveDraftToDevice(bldg);
                              showFeedback(`Loaded "${bldg.name}"! You can now finish building.`);
                              setTimeout(() => onClose(), 800);
                            }}
                            className="px-3 py-1 text-xs bg-ry-gradient text-white font-semibold flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                            title="Resume working on this building"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>{isCurrent ? 'Continue' : 'Finish Building'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFromCatalog(bldg.id, bldg.name)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete draft from device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Save to Device Options */}
        {activeTab === 'save' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Skyline Skyscraper, Origami Pavilion..."
                  className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                  Project Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  placeholder="Notes on origami fold lines, dimensions, or unfinished sections to complete later..."
                  className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Current Building Preview */}
            <div className="p-3 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white block">
                  {currentBuilding.components.length} Components in active canvas
                </span>
                <span className="text-[11px] text-neutral-500">
                  Height: {currentBuilding.heightMeters}m · Category: {currentBuilding.category}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Ready for device export
              </span>
            </div>

            {/* Two Saving Pathways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: Download .paper File to Device Hard Drive */}
              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e121b] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase">
                      Download File (.paper)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                    Saves a portable <code className="text-amber-500 font-mono">.paper</code> file directly to your device storage (Downloads). Perfect for moving between computers or keeping offline backups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportToFile}
                  className="w-full py-2 bg-ry-gradient text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .paper File</span>
                </button>
              </div>

              {/* Option 2: Save to Local Device Memory */}
              <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e121b] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase">
                      Save to Device Memory
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                    Stores this building in your local browser storage so it automatically persists and appears in your drafts list whenever you return.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveToDeviceCatalog}
                  className="w-full py-2 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-amber-500" />
                  <span>Save Draft to Device</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Open File from Device */}
        {activeTab === 'open' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                handleFileSelected(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                isDraggingFile
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-500/80 bg-neutral-50/50 dark:bg-[#141926]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".paper,.json"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
                className="hidden"
              />
              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-amber-500 mb-3 rounded-full">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white uppercase mb-1">
                Choose a .paper or .json file from your device
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm mb-3">
                Drop your saved building project file here, or click to browse files on your device.
              </p>
              <span className="px-3 py-1 bg-ry-gradient text-white text-xs font-semibold shadow-xs">
                Browse Device Files...
              </span>
            </div>

            {importError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {importError}
              </div>
            )}

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-[#141926] p-3 border border-neutral-200 dark:border-neutral-800">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                💡 How Device Storage Works:
              </span>
              When you load a <code className="text-amber-500 font-mono">.paper</code> file, all components, shapes, 3D rotations, per-face textures, colors, and building dimensions are restored exactly as they were saved.
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e121b] flex items-center justify-between shrink-0 text-xs">
          <span className="text-[11px] text-neutral-400 font-mono">
            Auto-save: Active on device
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
