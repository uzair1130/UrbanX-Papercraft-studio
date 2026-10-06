import * as THREE from 'three';
import { PaperMaterialConfig, PaperComponent, FaceMaterialsConfig } from '../types';
import { ASSET_IMAGES } from '../assets/images';

// Helper to create a procedural canvas texture
const proceduralCache = new Map<string, string>();

export type ProceduralTextureType = 
  | 'kraft' 
  | 'graph' 
  | 'blueprint' 
  | 'modern_windows' 
  | 'historic_windows' 
  | 'origami_creases'
  | 'brick'
  | 'concrete'
  | 'wood_slats'
  | 'marble'
  | 'corrugated'
  | 'brushed_metal';

export function createProceduralPaperCanvas(type: ProceduralTextureType): string {
  if (typeof document === 'undefined') return '';
  if (proceduralCache.has(type)) {
    return proceduralCache.get(type)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'kraft') {
    // Kraft cardboard with subtle fiber specks
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle fiber noise
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const val = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${160 + val}, ${130 + val}, ${95 + val}, 0.25)`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Corrugation faint score lines
    ctx.strokeStyle = 'rgba(120, 90, 60, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  } else if (type === 'graph') {
    // Architectural Graph paper with faint blue grid
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 512, 512);

    // Minor grid
    ctx.strokeStyle = 'rgba(180, 205, 220, 0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 512; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Major grid
    ctx.strokeStyle = 'rgba(120, 160, 190, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  } else if (type === 'blueprint') {
    // Blueprint architectural grid with clean white drafting lines
    ctx.fillStyle = '#1e3d59';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  } else if (type === 'modern_windows') {
    // Crisp modern high-rise papercut windows
    ctx.fillStyle = '#eae6df';
    ctx.fillRect(0, 0, 512, 512);

    const cols = 4;
    const rows = 6;
    const colW = 512 / cols;
    const rowH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * colW + 16;
        const y = r * rowH + 12;
        const w = colW - 32;
        const h = rowH - 24;

        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#718096';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
      }
    }
  } else if (type === 'historic_windows') {
    // Historic townhouse facade windows with arched crowns
    ctx.fillStyle = '#d7c7b2';
    ctx.fillRect(0, 0, 512, 512);

    const cols = 3;
    const rows = 4;
    const colW = 512 / cols;
    const rowH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * colW + 24;
        const y = r * rowH + 20;
        const w = colW - 48;
        const h = rowH - 40;

        ctx.strokeStyle = '#5c4d3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#3d3429';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        ctx.strokeStyle = '#d7c7b2';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h * 0.33);
        ctx.lineTo(x + w, y + h * 0.33);
        ctx.moveTo(x, y + h * 0.66);
        ctx.lineTo(x + w, y + h * 0.66);
        ctx.stroke();
      }
    }
  } else if (type === 'origami_creases') {
    // Folded paper with geometric score lines and tabs
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#a0aec0';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(512, 512);
    ctx.moveTo(512, 0);
    ctx.lineTo(0, 512);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 496, 496);
  } else if (type === 'brick') {
    // Architectural Terracotta Brick Course
    ctx.fillStyle = '#a04838';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#e2d9cf';
    ctx.lineWidth = 3;

    const rowHeight = 32;
    const brickWidth = 64;

    for (let y = 0; y <= 512; y += rowHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const rowIndex = Math.floor(y / rowHeight);
      const offsetX = (rowIndex % 2 === 0) ? 0 : brickWidth / 2;

      for (let x = offsetX; x <= 512; x += brickWidth) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowHeight);
        ctx.stroke();
      }
    }
  } else if (type === 'concrete') {
    // Architectural Smooth Cast Concrete with Formwork Tie Holes
    ctx.fillStyle = '#b0b7bd';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Formwork seams
    ctx.strokeStyle = '#8a949d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 512);
    ctx.moveTo(0, 256); ctx.lineTo(512, 256);
    ctx.stroke();

    // Tie-rod holes (4 architectural circular indents)
    const holes = [
      [128, 128], [384, 128],
      [128, 384], [384, 384]
    ];
    holes.forEach(([hx, hy]) => {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  } else if (type === 'wood_slats') {
    // Vertical Scandinavian Timber Slats
    ctx.fillStyle = '#c89d7c';
    ctx.fillRect(0, 0, 512, 512);

    const slatW = 24;
    for (let x = 0; x < 512; x += slatW) {
      // Wood tone variation
      const toneOffset = (Math.random() - 0.5) * 20;
      ctx.fillStyle = `rgb(${200 + toneOffset}, ${157 + toneOffset}, ${124 + toneOffset})`;
      ctx.fillRect(x + 2, 0, slatW - 4, 512);

      // Dark shadow recess between slats
      ctx.fillStyle = '#4a3325';
      ctx.fillRect(x, 0, 2, 512);
    }
  } else if (type === 'marble') {
    // Refined White Carrara Marble / Limestone
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Marble veins
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.bezierCurveTo(150, 120, 280, 40, 512, 180);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.bezierCurveTo(200, 200, 320, 300, 512, 450);
    ctx.stroke();
  } else if (type === 'corrugated') {
    // Fluted Corrugated Industrial Cardboard
    ctx.fillStyle = '#d9c2a7';
    ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += 16) {
      // Highlight side
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(x, 0, 8, 512);
      // Shadow side
      ctx.fillStyle = 'rgba(80, 50, 20, 0.15)';
      ctx.fillRect(x + 8, 0, 8, 512);
    }
  } else if (type === 'brushed_metal') {
    // Matte Brushed Aluminum Panel
    ctx.fillStyle = '#cfd6dc';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    for (let y = 0; y < 512; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const result = canvas.toDataURL('image/png');
  proceduralCache.set(type, result);
  return result;
}

export interface TexturePresetItem {
  id: string;
  name: string;
  category: 'Architectural' | 'Facades & Windows' | 'Paper & Card' | 'Materials';
  type: ProceduralTextureType;
  getUrl: () => string;
  defaultRepeat: [number, number];
  defaultRoughness: number;
}

export const TEXTURE_PRESETS: TexturePresetItem[] = [
  {
    id: 'tex_graph',
    name: 'Graph Paper Grid',
    category: 'Paper & Card',
    type: 'graph',
    getUrl: () => createProceduralPaperCanvas('graph'),
    defaultRepeat: [2, 2],
    defaultRoughness: 0.85,
  },
  {
    id: 'tex_blueprint',
    name: 'Cyan Blueprint Grid',
    category: 'Architectural',
    type: 'blueprint',
    getUrl: () => createProceduralPaperCanvas('blueprint'),
    defaultRepeat: [2, 2],
    defaultRoughness: 0.88,
  },
  {
    id: 'tex_modern_windows',
    name: 'Modern Glazed Windows',
    category: 'Facades & Windows',
    type: 'modern_windows',
    getUrl: () => createProceduralPaperCanvas('modern_windows'),
    defaultRepeat: [1, 2],
    defaultRoughness: 0.5,
  },
  {
    id: 'tex_historic_windows',
    name: 'Historic Townhouse Facade',
    category: 'Facades & Windows',
    type: 'historic_windows',
    getUrl: () => createProceduralPaperCanvas('historic_windows'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.8,
  },
  {
    id: 'tex_kraft',
    name: 'Kraft Board Cardstock',
    category: 'Paper & Card',
    type: 'kraft',
    getUrl: () => createProceduralPaperCanvas('kraft'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.92,
  },
  {
    id: 'tex_origami',
    name: 'Origami Creases & Tabs',
    category: 'Paper & Card',
    type: 'origami_creases',
    getUrl: () => createProceduralPaperCanvas('origami_creases'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.85,
  },
  {
    id: 'tex_brick',
    name: 'Terracotta Brick Masonry',
    category: 'Architectural',
    type: 'brick',
    getUrl: () => createProceduralPaperCanvas('brick'),
    defaultRepeat: [2, 2],
    defaultRoughness: 0.9,
  },
  {
    id: 'tex_concrete',
    name: 'Exposed Cast Concrete',
    category: 'Architectural',
    type: 'concrete',
    getUrl: () => createProceduralPaperCanvas('concrete'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.92,
  },
  {
    id: 'tex_wood_slats',
    name: 'Timber Wood Slats',
    category: 'Materials',
    type: 'wood_slats',
    getUrl: () => createProceduralPaperCanvas('wood_slats'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.78,
  },
  {
    id: 'tex_marble',
    name: 'Travertine / Marble Vein',
    category: 'Materials',
    type: 'marble',
    getUrl: () => createProceduralPaperCanvas('marble'),
    defaultRepeat: [1, 1],
    defaultRoughness: 0.6,
  },
  {
    id: 'tex_corrugated',
    name: 'Corrugated Cardboard Ribs',
    category: 'Paper & Card',
    type: 'corrugated',
    getUrl: () => createProceduralPaperCanvas('corrugated'),
    defaultRepeat: [2, 1],
    defaultRoughness: 0.95,
  },
  {
    id: 'tex_brushed_metal',
    name: 'Brushed Aluminum Panels',
    category: 'Materials',
    type: 'brushed_metal',
    getUrl: () => createProceduralPaperCanvas('brushed_metal'),
    defaultRepeat: [2, 2],
    defaultRoughness: 0.55,
  },
];

export const PRESET_MATERIALS: PaperMaterialConfig[] = [
  {
    id: 'mat_crisp_white_cardstock',
    name: 'Pure White Cardstock',
    category: 'bristol',
    textureUrl: '',
    color: '#ffffff',
    roughness: 0.85,
    subsurface: 0.3,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_museum_ivory',
    name: 'Museum Ivory Board',
    category: 'bristol',
    textureUrl: '',
    color: '#faf7ee',
    roughness: 0.88,
    subsurface: 0.35,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_natural_cotton',
    name: 'Natural Cotton Paper',
    category: 'bristol',
    textureUrl: '',
    color: '#f3eee4',
    roughness: 0.9,
    subsurface: 0.25,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_kraft_matte',
    name: 'Matte Kraft Board',
    category: 'kraft',
    textureUrl: '',
    color: '#d4bc9f',
    roughness: 0.92,
    subsurface: 0.15,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_cool_vellum',
    name: 'Architectural Cool Vellum',
    category: 'bristol',
    textureUrl: '',
    color: '#eef2f6',
    roughness: 0.82,
    subsurface: 0.4,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_studio_gray',
    name: 'Studio Gray Cardstock',
    category: 'bristol',
    textureUrl: '',
    color: '#d8dee6',
    roughness: 0.86,
    subsurface: 0.2,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_anthracite_slate',
    name: 'Anthracite Slate Card',
    category: 'cardboard',
    textureUrl: '',
    color: '#343a46',
    roughness: 0.9,
    subsurface: 0.05,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
  {
    id: 'mat_charcoal_matte',
    name: 'Charcoal Black Card',
    category: 'cardboard',
    textureUrl: '',
    color: '#1a1d24',
    roughness: 0.94,
    subsurface: 0.02,
    creaseIntensity: 0.2,
    repeat: [1, 1],
    paperGrain: false,
  },
];

// Texture loader cache to prevent redundant re-loading
const textureCache = new Map<string, THREE.Texture>();

export function getOrCreateTexture(url: string, repeat: [number, number] = [1, 1]): THREE.Texture {
  const cacheKey = `${url}_${repeat[0]}_${repeat[1]}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural realistic textures for urban surfaces
export function createAsphaltRoadCanvas(orientation: 'straight_x' | 'straight_z' | 'cross' = 'straight_z'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Asphalt base with realistic aggregate gravel noise
  ctx.fillStyle = '#222831';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Concrete curbs along borders
  ctx.fillStyle = '#64748b';
  if (orientation === 'straight_z') {
    ctx.fillRect(0, 0, 24, 512);
    ctx.fillRect(512 - 24, 0, 24, 512);
  } else if (orientation === 'straight_x') {
    ctx.fillRect(0, 0, 512, 24);
    ctx.fillRect(0, 512 - 24, 512, 24);
  }

  // 3. Markings
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';

  if (orientation === 'straight_z') {
    // White side lines
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(34, 512);
    ctx.moveTo(512 - 34, 0);
    ctx.lineTo(512 - 34, 512);
    ctx.stroke();

    // Center double yellow lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(250, 0);
    ctx.lineTo(250, 512);
    ctx.moveTo(262, 0);
    ctx.lineTo(262, 512);
    ctx.stroke();
  } else if (orientation === 'straight_x') {
    // White side lines
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(512, 34);
    ctx.moveTo(0, 512 - 34);
    ctx.lineTo(512, 512 - 34);
    ctx.stroke();

    // Center double yellow lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(512, 250);
    ctx.moveTo(0, 262);
    ctx.lineTo(512, 262);
    ctx.stroke();
  } else {
    // Intersection Cross: Zebra pedestrian crossings on each approach
    ctx.fillStyle = '#ffffff';
    // North crosswalk
    for (let x = 60; x <= 450; x += 36) {
      ctx.fillRect(x, 28, 20, 48);
    }
    // South crosswalk
    for (let x = 60; x <= 450; x += 36) {
      ctx.fillRect(x, 512 - 76, 20, 48);
    }
    // West crosswalk
    for (let y = 60; y <= 450; y += 36) {
      ctx.fillRect(28, y, 48, 20);
    }
    // East crosswalk
    for (let y = 60; y <= 450; y += 36) {
      ctx.fillRect(512 - 76, y, 48, 20);
    }

    // Curbs on 4 corners
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillRect(512 - 24, 0, 24, 24);
    ctx.fillRect(0, 512 - 24, 24, 24);
    ctx.fillRect(512 - 24, 512 - 24, 24, 24);
  }

  return canvas.toDataURL('image/png');
}

export function createWaterCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#0369a1');
  grad.addColorStop(1, '#075985');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft subtle caustics ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 40;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 0.75);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

export function createParkGrassCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Rich lush grass green
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 512);

  // Blade variations
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 1.5));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle garden pathway pavers
  ctx.fillStyle = 'rgba(203, 213, 225, 0.5)';
  for (let i = 40; i < 480; i += 60) {
    ctx.fillRect(i, 236, 40, 40);
  }

  return canvas.toDataURL('image/png');
}

export function createFlyoverDeckCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Elevated highway dark surface
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 512, 512);

  // Outer safety barrier curbs
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 32, 512);
  ctx.fillRect(512 - 32, 0, 32, 512);

  // Yellow hazard side stripes
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(38, 0);
  ctx.lineTo(38, 512);
  ctx.moveTo(512 - 38, 0);
  ctx.lineTo(512 - 38, 512);
  ctx.stroke();

  // White lane divider dashes
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.setLineDash([32, 24]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export function createBridgeDeckCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Bridge deck steel/concrete surface
  ctx.fillStyle = '#262e3b';
  ctx.fillRect(0, 0, 512, 512);

  // Expansion steel joint lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 4;
  for (let y = 64; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Steel safety truss railing borders
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 28, 512);
  ctx.fillRect(512 - 28, 0, 28, 512);

  // Yellow center double lane
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(250, 0);
  ctx.lineTo(250, 512);
  ctx.moveTo(262, 0);
  ctx.lineTo(262, 512);
  ctx.stroke();

  // White border markings
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(36, 0);
  ctx.lineTo(36, 512);
  ctx.moveTo(512 - 36, 0);
  ctx.lineTo(512 - 36, 512);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

// Generate paper edge bevel & crease lines shader material or standard material
export function createPaperThreeMaterial(
  config: PaperMaterialConfig, 
  isSelected = false, 
  stressFactor = 0,
  nightFactor = 0
): THREE.Material {
  // Apply texture if user added a texture
  const texture = config.textureUrl ? getOrCreateTexture(config.textureUrl, config.repeat || [1, 1]) : null;

  // Base color starting from config
  const baseColor = new THREE.Color(config.color || '#ffffff');

  if (stressFactor > 0.05) {
    if (stressFactor < 0.4) {
      baseColor.multiply(new THREE.Color('#e2e8f0'));
    } else if (stressFactor < 0.75) {
      baseColor.multiply(new THREE.Color('#94a3b8'));
    } else {
      baseColor.multiply(new THREE.Color('#475569'));
    }
  }

  if (isSelected) {
    baseColor.lerp(new THREE.Color('#38bdf8'), 0.4); // Selected cyan tint
  }

  const emissive = new THREE.Color(0x000000);
  let emissiveIntensity = 0;

  if (nightFactor > 0.05 && stressFactor < 0.7) {
    emissive.set('#fef08a');
    emissiveIntensity = nightFactor * 0.9 * (1.0 - stressFactor * 0.85);
  }

  const mat = new THREE.MeshStandardMaterial({
    color: baseColor,
    map: texture,
    roughness: Math.max(0.65, Math.min(1.0, (config.roughness || 0.85) + stressFactor * 0.2)),
    metalness: 0.02,
    emissive: emissive,
    emissiveIntensity: emissiveIntensity,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  return mat;
}

// Generate multi-material per-face array or single material based on component faceMaterials configuration
export function createComponentThreeMaterials(
  comp: PaperComponent,
  isSelected = false,
  stressFactor = 0,
  nightFactor = 0
): THREE.Material | THREE.Material[] {
  const fm = comp.faceMaterials;
  const hasFaceOverrides = Boolean(
    fm && (fm.front || fm.back || fm.top || fm.bottom || fm.left || fm.right || fm.side)
  );

  if (!hasFaceOverrides || !fm) {
    return createPaperThreeMaterial(comp.materialConfig, isSelected, stressFactor, nightFactor);
  }

  // Helper to resolve material config for a face with fallback to component base material
  const getMatForFace = (faceKey: keyof FaceMaterialsConfig) => {
    const faceConfig = fm[faceKey] || (faceKey !== 'top' && faceKey !== 'bottom' && fm.side ? fm.side : undefined) || comp.materialConfig;
    return createPaperThreeMaterial(faceConfig, isSelected, stressFactor, nightFactor);
  };

  // Three.js BoxGeometry uses 6 groups:
  // 0: right (+X), 1: left (-X), 2: top (+Y), 3: bottom (-Y), 4: front (+Z), 5: back (-Z)
  if (
    comp.shape === 'paper_box' || 
    comp.shape === 'paper_sheet' || 
    comp.shape === 'square_paper' || 
    comp.shape === 'folded_wall' || 
    comp.shape === 'balcony_tab' ||
    comp.shape === 'square_slab'
  ) {
    return [
      getMatForFace('right'),
      getMatForFace('left'),
      getMatForFace('top'),
      getMatForFace('bottom'),
      getMatForFace('front'),
      getMatForFace('back'),
    ];
  }

  // CylinderGeometry & Extruded Slabs use 3 groups: [0: side rim, 1: top cap, 2: bottom cap]
  if (
    comp.shape === 'cylindrical_column' || 
    comp.shape === 'triangular_prism' || 
    comp.shape === 'hexagonal_prism' || 
    comp.shape === 'octagonal_prism' || 
    comp.shape === 'barrel_vault' || 
    comp.shape === 'paper_hyperboloid' || 
    comp.shape === 'stepped_crown' || 
    comp.shape === 'trapezoid_prism' ||
    comp.shape === 'circle_slab' ||
    comp.shape === 'triangle_slab' ||
    comp.shape === 'pentagon_slab' ||
    comp.shape === 'hexagon_slab' ||
    comp.shape === 'octagon_slab' ||
    comp.shape === 'semicircle_slab' ||
    comp.shape === 'trapezoid_slab'
  ) {
    return [
      fm.side ? getMatForFace('side') : getMatForFace('front'),
      getMatForFace('top'),
      getMatForFace('bottom'),
    ];
  }

  // ConeGeometry uses 2 groups: [0: side, 1: bottom]
  if (comp.shape === 'cone_spire' || comp.shape === 'pyramid_spire') {
    return [
      fm.side ? getMatForFace('side') : getMatForFace('front'),
      getMatForFace('bottom'),
    ];
  }

  // ExtrudeGeometry (triangle_wedge, flat_triangle, pitched_roof, l_fold_wall) uses 2 groups:
  // [0: front/back caps, 1: sides]
  if (
    comp.shape === 'triangle_wedge' || 
    comp.shape === 'flat_triangle' || 
    comp.shape === 'pitched_roof' || 
    comp.shape === 'l_fold_wall'
  ) {
    return [
      getMatForFace('front'),
      fm.side ? getMatForFace('side') : getMatForFace('left'),
    ];
  }

  // Sphere & Torus multi-group: [0: top hemisphere / upper ring, 1: bottom hemisphere / lower ring]
  if (comp.shape === 'paper_sphere' || comp.shape === 'paper_torus') {
    return [
      fm.top ? getMatForFace('top') : (fm.front ? getMatForFace('front') : getMatForFace('side')),
      fm.bottom ? getMatForFace('bottom') : (fm.back ? getMatForFace('back') : getMatForFace('side')),
    ];
  }

  // Fallback for custom or single-group meshes
  const primaryFaceMat = fm.front || fm.side || fm.top || fm.bottom || comp.materialConfig;
  return createPaperThreeMaterial(primaryFaceMat, isSelected, stressFactor, nightFactor);
}
