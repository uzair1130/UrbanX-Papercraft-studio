export type PaperEdge = 'top' | 'right' | 'bottom' | 'left';

export interface PaperAttachment {
  parentSheetId: string;
  edge: PaperEdge;
  foldAngle: number; // in degrees, e.g. 0 (flat), 90 (perpendicular up), -90 (down), 45, etc.
  hasGlueTab?: boolean;
}

export type ComponentShape = 
  | 'square_paper'                // Square paper sheet
  | 'paper_sheet'                 // Rectangular paper sheet
  | 'paper_box'                   // Legacy box compatibility
  | 'folded_wall'
  | 'l_fold_wall'
  | 'pyramid_spire'
  | 'stepped_crown'
  | 'pitched_roof'
  | 'cylindrical_column'
  | 'triangular_prism'
  | 'triangle_wedge'
  | 'flat_triangle'
  | 'hexagonal_prism'
  | 'octagonal_prism'
  | 'cone_spire'
  | 'barrel_vault'
  | 'trapezoid_prism'
  | 'paper_sphere'
  | 'paper_torus'
  | 'paper_hyperboloid'
  | 'square_slab'                 // Square floor slab / podium
  | 'circle_slab'                 // Circular disc slab / patio
  | 'triangle_slab'               // Triangular floor slab
  | 'pentagon_slab'               // 5-sided pentagon floor slab
  | 'hexagon_slab'                // 6-sided hexagon floor slab
  | 'octagon_slab'                // 8-sided octagon floor slab
  | 'semicircle_slab'             // Semi-circle / D-shaped balcony slab
  | 'trapezoid_slab'              // 4-sided tapered trapezoidal floor slab
  | 'balcony_tab'
  | 'arch_portal'
  | 'skybridge_arch_crown'
  | 'pyramid_globe_spire'
  | 'chamfered_octagonal_prism'
  | 'faceted_diamond_tower'
  | 'supertall_needle_spire'
  | 'twisting_helical_tower'
  | 'geodesic_sphere_pod'
  | 'empire_art_deco_stepped'
  | 'sail_spinnaker_tower'
  | 'cantilever_helipad_disk'
  | 'trapezoid_aperture_crown'
  | 'spiraling_cam_tower'
  | 'jin_mao_pagoda_tier'
  | 'double_helix_spiral_tower';

export interface SnapPoint {
  id: string;
  position: [number, number, number]; // local offset from component center
  normal: [number, number, number];   // outward normal for mating
  type: 'edge' | 'face' | 'vertex' | 'tab';
}

export interface PaperMaterialConfig {
  id: string;
  name: string;
  category: 'kraft' | 'bristol' | 'printed' | 'cardboard' | 'custom';
  textureUrl: string;
  color: string;
  roughness: number;
  subsurface: number;       // paper translucency / light scatter
  creaseIntensity: number;  // contrast of fold/crease lines
  repeat: [number, number]; // UV repeat
  paperGrain: boolean;      // procedural paper fiber bump
}

export type GeometryFaceKey = 
  | 'all' 
  | 'front' 
  | 'back' 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'side';

export interface FaceMaterialsConfig {
  front?: PaperMaterialConfig;  // +Z (Front facade)
  back?: PaperMaterialConfig;   // -Z (Back facade)
  top?: PaperMaterialConfig;    // +Y (Roof / Ceiling)
  bottom?: PaperMaterialConfig; // -Y (Base / Floor)
  left?: PaperMaterialConfig;   // -X (Left wall)
  right?: PaperMaterialConfig;  // +X (Right wall)
  side?: PaperMaterialConfig;   // Curved wall / Extrusion perimeter (Cylinders, Prisms, Wedges)
}

export interface PaperComponent {
  id: string;
  name: string;
  shape: ComponentShape;
  width?: number;                     // in meters (default 2.0)
  height?: number;                    // in meters (default 2.0)
  position: [number, number, number];
  rotation: [number, number, number]; // in radians
  scale: [number, number, number];    // width, thickness, height
  materialConfig: PaperMaterialConfig;
  faceMaterials?: FaceMaterialsConfig; // Per-face texture and material overrides
  thickness: number;                  // in mm (0.1mm - 3.0mm cardstock)
  creaseAngle?: number;               // fold angle
  bendAngle?: number;                 // Bending / curvature deformation angle in degrees (-180° to 180°, 0 = unbent)
  bendAxis?: 'x' | 'y' | 'z';         // Plane/axis of bend curvature (default 'x')
  attachment?: PaperAttachment;       // physical attachment to parent paper edge
  locked?: boolean;
  visible?: boolean;
  snappedToId?: string;
  stressFactor?: number;
}

export interface BuildingModel {
  id: string;
  name: string;
  description: string;
  category: 'Custom Model' | 'Skyscraper' | 'Residential' | 'Historic Old Town' | 'Origami Pavilion' | 'Civic Institution' | 'Industrial';
  components: PaperComponent[];
  author: string;
  createdAt: string;
  baseFootprint: [number, number];    // grid tiles [width, height]
  heightMeters: number;
  estimatedCostUSD: number;
  resilienceScore: number;            // 0 - 100 resilience rating against disasters
  tags: string[];
  thumbnailUrl?: string;
}

export type ViewportRenderMode = 'wireframe' | 'paper_preview' | 'raytracing_rtx' | 'stress_analysis';

export interface RayTracingSettings {
  enabled: boolean;
  bounces: number;             // 1 - 4
  ambientOcclusion: boolean;
  aoIntensity: number;         // 0 - 2
  softShadows: boolean;
  shadowSoftness: number;      // 0 - 5
  subsurfaceScatter: boolean;  // paper translucency
  bloom: boolean;
  bloomIntensity: number;
  preset: 'golden_hour_inspo' | 'studio_softbox' | 'overcast_nordic' | 'night_skyline';
  exposure: number;
}

export type CityTileType = 
  | 'empty'
  | 'road'
  | 'avenue'
  | 'park'
  | 'water'
  | 'building'
  | 'bridge'
  | 'flyover';

export interface CityTile {
  x: number;
  z: number;
  type: CityTileType;
  buildingId?: string;         // reference to placed BuildingModel
  instanceId?: string;         // unique instance ID in city
  roadOrientation?: 'straight_x' | 'straight_z' | 'cross' | 't_north' | 't_south' | 't_east' | 't_west' | 'turn';
  hasFlyover?: boolean;        // elevated highway layer crossing above ground tile
  flyoverOrientation?: 'straight_x' | 'straight_z' | 'cross';
  bridgeOrientation?: 'straight_x' | 'straight_z';
  elevation: number;
  damage: number;              // 0 (intact) to 1 (destroyed)
  flooded: boolean;
  onFire: boolean;
  fireIntensity: number;       // 0 to 1
}

export type DisasterType = 
  | 'none'
  | 'earthquake'
  | 'flood'
  | 'hurricane'
  | 'firestorm'
  | 'meteorite';

export interface DisasterState {
  activeType: DisasterType;
  intensity: number;           // 1 to 10 scale (or Richter 4 - 9)
  elapsedSeconds: number;
  epicenter: [number, number]; // x, z grid coordinates
  isPaused: boolean;
  hasRun: boolean;
}

export interface DamageReport {
  totalEconomicCostUSD: number;
  buildingsIntact: number;
  buildingsDamaged: number;
  buildingsDestroyed: number;
  casualties: number;
  injured: number;
  displaced: number;
  hospitalsOperationalPct: number;
  powerGridOperationalPct: number;
  waterSupplyOperationalPct: number;
  resilienceRating: 'Critical' | 'Poor' | 'Moderate' | 'High' | 'Superior';
  recommendations: string[];
}
