import { BuildingModel, PaperComponent } from '../types';
import { STARTER_BUILDING, DEFAULT_BUILDINGS, PRESET_BUILDING_IDS } from '../data/defaultBuildings';

export const DRAFT_STORAGE_KEY = 'papercraft_cad_active_draft';
export const CATALOG_STORAGE_KEY = 'papercraft_cad_saved_catalog';
export const LAST_SAVED_KEY = 'papercraft_cad_last_saved_time';

export interface ProjectFileWrapper {
  fileType: 'papercraft-studio-project';
  version: '1.0';
  exportedAt: string;
  appName: string;
  building: BuildingModel;
}

/**
 * Format and download building project file directly onto the user's device hard drive (.paper / .json)
 */
export function exportBuildingToDeviceFile(building: BuildingModel, filename?: string) {
  const payload: ProjectFileWrapper = {
    fileType: 'papercraft-studio-project',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'Papercraft CAD 3D Studio',
    building: {
      ...building,
      createdAt: building.createdAt || new Date().toISOString().split('T')[0],
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const safeTitle = (filename || building.name || 'paper_building')
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}.paper`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read and validate a project file uploaded from user's device
 */
export async function importBuildingFromDeviceFile(file: File): Promise<BuildingModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('File is empty.');

        const parsed = JSON.parse(text);
        let buildingData: BuildingModel;

        if (parsed.fileType === 'papercraft-studio-project' && parsed.building) {
          buildingData = parsed.building;
        } else if (parsed.components && Array.isArray(parsed.components)) {
          // Direct BuildingModel JSON format
          buildingData = parsed as BuildingModel;
        } else {
          throw new Error('Unrecognized project file structure. Expected a valid .paper or building JSON file.');
        }

        // Validate and sanitize building model
        const sanitized: BuildingModel = {
          id: buildingData.id || `bldg_${Date.now()}`,
          name: buildingData.name || file.name.replace(/\.[^/.]+$/, ''),
          description: buildingData.description || 'Imported architecture project from device.',
          category: buildingData.category || 'Custom Model',
          author: buildingData.author || 'You (Architect)',
          createdAt: buildingData.createdAt || new Date().toISOString().split('T')[0],
          baseFootprint: Array.isArray(buildingData.baseFootprint) ? buildingData.baseFootprint : [2, 2],
          heightMeters: typeof buildingData.heightMeters === 'number' ? buildingData.heightMeters : 0,
          estimatedCostUSD: typeof buildingData.estimatedCostUSD === 'number' ? buildingData.estimatedCostUSD : 0,
          resilienceScore: typeof buildingData.resilienceScore === 'number' ? buildingData.resilienceScore : 100,
          tags: Array.isArray(buildingData.tags) ? buildingData.tags : ['Custom', 'Device Import'],
          components: (buildingData.components || []).map((c: Partial<PaperComponent>, index: number) => ({
            id: c.id || `comp_imp_${Date.now()}_${index}`,
            name: c.name || `Component ${index + 1}`,
            shape: c.shape || 'paper_box',
            position: Array.isArray(c.position) ? c.position : [0, 1, 0],
            rotation: Array.isArray(c.rotation) ? c.rotation : [0, 0, 0],
            scale: Array.isArray(c.scale) ? c.scale : [2, 2, 2],
            materialConfig: c.materialConfig || {
              id: 'kraft_default',
              name: 'Brown Kraft Paper',
              category: 'kraft',
              textureUrl: '',
              color: '#c8a882',
              roughness: 0.85,
              subsurface: 0.25,
              creaseIntensity: 0.6,
              repeat: [1, 1],
              paperGrain: true,
            },
            faceMaterials: c.faceMaterials,
            thickness: typeof c.thickness === 'number' ? c.thickness : 1.0,
            bendAngle: typeof c.bendAngle === 'number' ? c.bendAngle : 0,
            bendAxis: c.bendAxis || 'x',
            visible: c.visible !== false,
          })),
        };

        resolve(sanitized);
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse project file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file from device'));
    reader.readAsText(file);
  });
}

/**
 * Auto-save active draft to browser local storage so user never loses unfinished buildings
 */
export function saveActiveDraftToDevice(building: BuildingModel): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(building));
    localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to auto-save draft to device localStorage:', err);
  }
}

/**
 * Load active draft from device local storage
 */
export function loadActiveDraftFromDevice(): BuildingModel | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.components)) {
      if (PRESET_BUILDING_IDS.has(parsed.id) || parsed.id?.startsWith('bldg_empire_state') || parsed.id?.startsWith('bldg_burj') || parsed.id?.startsWith('bldg_shanghai')) {
        return null;
      }
      return parsed as BuildingModel;
    }
  } catch (err) {
    console.warn('Error reading saved draft from device:', err);
  }
  return null;
}

/**
 * Clear current active draft from device local storage
 */
export function clearActiveDraftFromDevice(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Save building to user's persistent device catalog
 */
export function saveBuildingToDeviceCatalog(building: BuildingModel): Record<string, BuildingModel> {
  const currentCatalog = loadDeviceCatalog();
  const updatedCatalog = {
    ...currentCatalog,
    [building.id]: building,
  };
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updatedCatalog));
    localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to save to device catalog:', err);
  }
  return updatedCatalog;
}

/**
 * Load user's saved projects from device storage (strictly user saved projects, 0 presets)
 */
export function loadDeviceCatalog(): Record<string, BuildingModel> {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Filter out any default presets to ensure device storage only holds user projects
        const userProjects: Record<string, BuildingModel> = {};
        for (const [id, bldg] of Object.entries(parsed)) {
          if (!DEFAULT_BUILDINGS[id] && !PRESET_BUILDING_IDS.has(id) && bldg && typeof bldg === 'object') {
            userProjects[id] = bldg as BuildingModel;
          }
        }
        return userProjects;
      }
    }
  } catch (err) {
    console.warn('Failed to load device catalog:', err);
  }
  return {};
}

/**
 * Delete a user project from device catalog
 */
export function deleteBuildingFromDeviceCatalog(buildingId: string): Record<string, BuildingModel> {
  const currentCatalog = loadDeviceCatalog();
  const nextCatalog = { ...currentCatalog };
  delete nextCatalog[buildingId];
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(nextCatalog));
  } catch (err) {
    console.warn('Failed to delete from device catalog:', err);
  }
  return nextCatalog;
}

/**
 * Get human-friendly time since last device save
 */
export function getLastSavedRelativeTime(): string | null {
  try {
    const raw = localStorage.getItem(LAST_SAVED_KEY);
    if (!raw) return null;
    const date = new Date(raw);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  } catch {
    return null;
  }
}
