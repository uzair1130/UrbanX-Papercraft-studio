import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  BuildingModel, 
  PaperComponent, 
  ComponentShape, 
  PaperMaterialConfig, 
  RayTracingSettings, 
  ViewportRenderMode,
  GeometryFaceKey,
  FaceMaterialsConfig
} from '../../types';
import { PRESET_MATERIALS, TEXTURE_PRESETS, TexturePresetItem, createPaperThreeMaterial, createComponentThreeMaterials } from '../../utils/paperTextures';
import { createComponentGeometry, getComponentSnapPoints } from '../../utils/paperGeometries';
import { 
  Box, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  Magnet, 
  Upload,
  Image as ImageIcon,
  Check, 
  CheckCheck,
  Sparkles, 
  Layers, 
  Compass,
  Move,
  Palette,
  Grid,
  Save,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
  FilePlus,
  FolderOpen,
  Edit3,
  X,
  Undo2,
  Redo2,
  Triangle,
  HardDrive,
  Download,
  History,
  Clock,
  ChevronDown,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { exportBuildingToDeviceFile } from '../../utils/deviceStorage';
import { HistoryManager, HistoryManagerState, cloneComponents } from '../../utils/historyManager';

export const FACE_OPTIONS: Array<{ key: GeometryFaceKey; label: string; tag: string; desc: string }> = [
  { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Apply texture uniformly to all surfaces' },
  { key: 'front', label: 'Front (+Z)', tag: '+Z', desc: 'Front facade surface (+Z)' },
  { key: 'back', label: 'Back (-Z)', tag: '-Z', desc: 'Rear facade surface (-Z)' },
  { key: 'left', label: 'Left (-X)', tag: '-X', desc: 'Left lateral wall (-X)' },
  { key: 'right', label: 'Right (+X)', tag: '+X', desc: 'Right lateral wall (+X)' },
  { key: 'top', label: 'Top / Roof (+Y)', tag: '+Y', desc: 'Top horizontal roof or cap (+Y)' },
  { key: 'bottom', label: 'Bottom / Base (-Y)', tag: '-Y', desc: 'Bottom foundation surface (-Y)' },
  { key: 'side', label: 'Side Perimeter', tag: 'SIDE', desc: 'Curved cylinder wall / perimeter' },
];

export function getFaceOptionsForShape(shape?: ComponentShape): Array<{ key: GeometryFaceKey; label: string; tag: string; desc: string }> {
  if (!shape) return FACE_OPTIONS;

  if (
    shape === 'paper_box' || 
    shape === 'paper_sheet' || 
    shape === 'square_paper' || 
    shape === 'folded_wall' || 
    shape === 'balcony_tab' ||
    shape === 'square_slab'
  ) {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on all faces' },
      { key: 'top', label: 'Top Surface (+Y)', tag: '+Y', desc: 'Top floor deck / podium plate' },
      { key: 'bottom', label: 'Bottom Face (-Y)', tag: '-Y', desc: 'Bottom underside / ceiling' },
      { key: 'front', label: 'Front Edge (+Z)', tag: '+Z', desc: 'Front edge facing camera' },
      { key: 'back', label: 'Back Edge (-Z)', tag: '-Z', desc: 'Rear facade edge' },
      { key: 'left', label: 'Left Edge (-X)', tag: '-X', desc: 'Left lateral edge' },
      { key: 'right', label: 'Right Edge (+X)', tag: '+X', desc: 'Right lateral edge' },
    ];
  }

  if (
    shape === 'circle_slab' ||
    shape === 'triangle_slab' ||
    shape === 'pentagon_slab' ||
    shape === 'hexagon_slab' ||
    shape === 'octagon_slab' ||
    shape === 'semicircle_slab' ||
    shape === 'trapezoid_slab'
  ) {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on entire slab' },
      { key: 'top', label: 'Top Surface (+Y)', tag: '+Y', desc: 'Top platform / floor deck' },
      { key: 'bottom', label: 'Bottom Face (-Y)', tag: '-Y', desc: 'Bottom underside / ceiling' },
      { key: 'side', label: 'Rim Edge', tag: 'EDGE', desc: 'Perimeter edge border' },
    ];
  }

  if (
    shape === 'cylindrical_column' || 
    shape === 'triangular_prism' || 
    shape === 'hexagonal_prism' || 
    shape === 'octagonal_prism' || 
    shape === 'barrel_vault' || 
    shape === 'paper_hyperboloid' || 
    shape === 'stepped_crown' || 
    shape === 'trapezoid_prism' ||
    shape === 'arch_portal' ||
    shape === 'chamfered_octagonal_prism'
  ) {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on entire cylinder/prism' },
      { key: 'side', label: 'Side Wall', tag: 'SIDE', desc: 'Curved perimeter wall / vertical facets' },
      { key: 'top', label: 'Top Cap (+Y)', tag: '+Y', desc: 'Top circular roof cap' },
      { key: 'bottom', label: 'Bottom Base (-Y)', tag: '-Y', desc: 'Bottom base foundation' },
    ];
  }

  if (shape === 'cone_spire' || shape === 'pyramid_spire') {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on entire spire' },
      { key: 'side', label: 'Spire Sides', tag: 'SIDE', desc: 'Slanted spire faces' },
      { key: 'bottom', label: 'Base Cap (-Y)', tag: '-Y', desc: 'Bottom flat base face' },
    ];
  }

  if (
    shape === 'triangle_wedge' || 
    shape === 'flat_triangle' || 
    shape === 'pitched_roof' || 
    shape === 'l_fold_wall'
  ) {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on all facets' },
      { key: 'front', label: 'Gable Caps', tag: 'CAP', desc: 'Front and rear gable cap facets' },
      { key: 'side', label: 'Side Slopes', tag: 'SIDE', desc: 'Ramped slopes and extruded walls' },
    ];
  }

  if (shape === 'paper_sphere' || shape === 'paper_torus') {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on entire shape' },
      { key: 'top', label: 'Upper Dome (+Y)', tag: '+Y', desc: 'Top hemisphere dome / upper ring' },
      { key: 'bottom', label: 'Lower Bowl (-Y)', tag: '-Y', desc: 'Bottom hemisphere bowl / lower ring' },
    ];
  }

  return FACE_OPTIONS;
}

interface BlenderStudioProps {
  currentBuilding: BuildingModel;
  onUpdateBuilding: (bldg: BuildingModel) => void;
  onSaveToCatalog: (bldg: BuildingModel) => void;
  buildingCatalog?: Record<string, BuildingModel>;
  onSelectBuilding?: (bldg: BuildingModel) => void;
  onOpenDeviceProjects?: (tab?: 'saved' | 'save' | 'open') => void;
  rtxSettings: RayTracingSettings;
  onUpdateRtxSettings: (settings: RayTracingSettings) => void;
  theme?: 'light' | 'dark';
}

export const BlenderStudio: React.FC<BlenderStudioProps> = ({
  currentBuilding,
  onUpdateBuilding,
  onSaveToCatalog,
  buildingCatalog,
  onSelectBuilding,
  onOpenDeviceProjects,
  rtxSettings,
  onUpdateRtxSettings,
  theme = 'light',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const snapMarkersRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const groundPlaneMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Studio UI state
  const [selectedCompId, setSelectedCompId] = useState<string | null>(
    currentBuilding.components[0]?.id || null
  );
  const [renderMode] = useState<ViewportRenderMode>('raytracing_rtx');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'textures' | 'outliner' | 'lighting'>('inspector');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('Saved to Catalog!');
  const [interactionTool, setInteractionTool] = useState<'select' | 'orbit' | 'pan'>('select');
  const [leftPaletteTab, setLeftPaletteTab] = useState<'shapes' | 'textures'>('shapes');
  const [textureCategoryFilter, setTextureCategoryFilter] = useState<string>('All');
  const [hoveredCompName, setHoveredCompName] = useState<string | null>(null);
  const [selectedFaceKey, setSelectedFaceKey] = useState<GeometryFaceKey>('all');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Save Modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState(currentBuilding.name);
  const [saveAsCategory, setSaveAsCategory] = useState<BuildingModel['category']>(currentBuilding.category);
  const [saveAsDesc, setSaveAsDesc] = useState(currentBuilding.description || '');

  // Dedicated Blender-Grade History State Manager
  const [historyState, setHistoryState] = useState<HistoryManagerState>(() => ({
    entries: [
      {
        id: `hist_init_${Date.now()}`,
        action: `Opened "${currentBuilding.name}"`,
        timestamp: Date.now(),
        components: cloneComponents(currentBuilding.components),
        selectedCompId: null,
        heightMeters: currentBuilding.heightMeters,
      },
    ],
    currentIndex: 0,
    canUndo: false,
    canRedo: false,
  }));

  const historyManagerRef = useRef<HistoryManager | null>(null);
  if (!historyManagerRef.current) {
    historyManagerRef.current = new HistoryManager(
      currentBuilding.components,
      null,
      currentBuilding.heightMeters,
      (nextState) => setHistoryState(nextState)
    );
  }

  // History UI dropdown & HUD feedback toast
  const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);
  const [historyToast, setHistoryToast] = useState<{ message: string; type: 'undo' | 'redo' } | null>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // Close history dropdown when clicking outside
  useEffect(() => {
    if (!historyDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setHistoryDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [historyDropdownOpen]);

  // Reset history stack whenever a different building is opened
  const lastBuildingIdRef = useRef(currentBuilding.id);
  useEffect(() => {
    if (currentBuilding.id !== lastBuildingIdRef.current) {
      lastBuildingIdRef.current = currentBuilding.id;
      historyManagerRef.current?.reset(
        currentBuilding.components,
        null,
        currentBuilding.heightMeters,
        `Opened "${currentBuilding.name}"`
      );
      setHistoryDropdownOpen(false);
    }
  }, [currentBuilding.id, currentBuilding.name, currentBuilding.heightMeters]);

  // Push state snapshot to history manager
  const pushHistory = (
    newComponents: PaperComponent[],
    actionLabel: string = 'Modify Building',
    isContinuous: boolean = false
  ) => {
    const maxHeight = newComponents.length > 0
      ? Math.max(...newComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4
      : 0;
    if (isContinuous) {
      historyManagerRef.current?.pushDebounced(actionLabel, newComponents, selectedCompId, Math.round(maxHeight));
    } else {
      historyManagerRef.current?.push(actionLabel, newComponents, selectedCompId, Math.round(maxHeight));
    }
  };

  // Undo
  const handleUndo = () => {
    if (!historyManagerRef.current) return;
    const undoneAction = historyManagerRef.current.undoAction;
    const entry = historyManagerRef.current.undo();
    if (entry) {
      onUpdateBuilding({
        ...currentBuilding,
        components: cloneComponents(entry.components),
        heightMeters: entry.heightMeters,
      });

      if (entry.selectedCompId && entry.components.some((c) => c.id === entry.selectedCompId)) {
        setSelectedCompId(entry.selectedCompId);
      } else {
        setSelectedCompId(entry.components[0]?.id || null);
      }

      setHistoryToast({ message: `Undid "${undoneAction}"`, type: 'undo' });
      setTimeout(() => setHistoryToast(null), 1800);
    }
  };

  // Redo
  const handleRedo = () => {
    if (!historyManagerRef.current) return;
    const redoneAction = historyManagerRef.current.redoAction;
    const entry = historyManagerRef.current.redo();
    if (entry) {
      onUpdateBuilding({
        ...currentBuilding,
        components: cloneComponents(entry.components),
        heightMeters: entry.heightMeters,
      });

      if (entry.selectedCompId && entry.components.some((c) => c.id === entry.selectedCompId)) {
        setSelectedCompId(entry.selectedCompId);
      } else {
        setSelectedCompId(entry.components[0]?.id || null);
      }

      setHistoryToast({ message: `Redid "${redoneAction}"`, type: 'redo' });
      setTimeout(() => setHistoryToast(null), 1800);
    }
  };

  // Jump directly to any historical timeline step
  const handleJumpToHistory = (index: number) => {
    if (!historyManagerRef.current) return;
    const entry = historyManagerRef.current.jumpTo(index);
    if (entry) {
      onUpdateBuilding({
        ...currentBuilding,
        components: cloneComponents(entry.components),
        heightMeters: entry.heightMeters,
      });

      if (entry.selectedCompId && entry.components.some((c) => c.id === entry.selectedCompId)) {
        setSelectedCompId(entry.selectedCompId);
      } else {
        setSelectedCompId(entry.components[0]?.id || null);
      }

      setHistoryToast({ message: `Restored: "${entry.action}"`, type: 'undo' });
      setTimeout(() => setHistoryToast(null), 1800);
      setHistoryDropdownOpen(false);
    }
  };

  const canUndo = historyState.canUndo;
  const canRedo = historyState.canRedo;

  // Mouse & Viewport Navigation state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'orbit' | 'pan'>('orbit');
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 5, 0));
  const cameraRadiusRef = useRef(18);
  const cameraThetaRef = useRef(Math.PI / 4);
  const cameraPhiRef = useRef(Math.PI / 3);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isDark = theme === 'dark';
    const initBg = isDark ? '#0c0f17' : '#f8fafc';
    scene.background = new THREE.Color(initBg);
    scene.fog = new THREE.FogExp2(initBg, isDark ? 0.015 : 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = rtxSettings.exposure;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Architectural cutting mat / grid floor
    const gridHelper = new THREE.GridHelper(30, 30, isDark ? '#334155' : '#94a3b8', isDark ? '#1e293b' : '#e2e8f0');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Ground plane with subtle shadow reception
    const planeGeo = new THREE.PlaneGeometry(60, 60);
    const planeMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#0f172a' : '#ffffff',
      roughness: 0.9,
      metalness: 0.05,
    });
    groundPlaneMatRef.current = planeMat;
    const groundPlane = new THREE.Mesh(planeGeo, planeMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Group for snap point visualization
    const snapGroup = new THREE.Group();
    scene.add(snapGroup);
    snapMarkersRef.current = snapGroup;

    // Initial Lights
    setupLighting(scene, rtxSettings, theme);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Sync Three.js scene colors when theme toggles
  useEffect(() => {
    if (!sceneRef.current) return;
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0c0f17' : '#f8fafc';
    sceneRef.current.background = new THREE.Color(bgColor);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.set(bgColor);
    }
    if (groundPlaneMatRef.current) {
      groundPlaneMatRef.current.color.set(isDark ? '#0f172a' : '#ffffff');
    }
    if (gridHelperRef.current && sceneRef.current) {
      sceneRef.current.remove(gridHelperRef.current);
      const newGrid = new THREE.GridHelper(30, 30, isDark ? '#334155' : '#94a3b8', isDark ? '#1e293b' : '#e2e8f0');
      newGrid.position.y = -0.01;
      sceneRef.current.add(newGrid);
      gridHelperRef.current = newGrid;
    }
    setupLighting(sceneRef.current, rtxSettings, theme);
  }, [theme]);

  // Update camera spherical coords
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const radius = cameraRadiusRef.current;
    const theta = cameraThetaRef.current;
    const phi = cameraPhiRef.current;
    const target = cameraTargetRef.current;

    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // Configure lighting & ray-tracing ambient presets
  const setupLighting = (scene: THREE.Scene, settings: RayTracingSettings, currentTheme: 'light' | 'dark' = theme) => {
    // Remove existing lights
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light) toRemove.push(obj);
    });
    toRemove.forEach((l) => scene.remove(l));

    const isDark = currentTheme === 'dark';

    if (settings.preset === 'golden_hour_inspo') {
      const bg = isDark ? '#1c1917' : '#faf7f2';
      scene.background = new THREE.Color(bg);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(bg);

      // Key Warm Sun
      const sunLight = new THREE.DirectionalLight('#fbbf24', 2.8);
      sunLight.position.set(16, 14, 12);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 60;
      sunLight.shadow.camera.left = -15;
      sunLight.shadow.camera.right = 15;
      sunLight.shadow.camera.top = 15;
      sunLight.shadow.camera.bottom = -15;
      scene.add(sunLight);

      // Cool Twilight Skylight fill
      const skyLight = new THREE.HemisphereLight('#f97316', '#38bdf8', 1.2);
      scene.add(skyLight);

      // Warm interior architectural bounce
      const bounce = new THREE.PointLight('#fef08a', 1.5, 30);
      bounce.position.set(0, 6, 0);
      scene.add(bounce);
    } else if (settings.preset === 'studio_softbox') {
      const bg = isDark ? '#1e293b' : '#f8fafc';
      scene.background = new THREE.Color(bg);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(bg);

      const keyLight = new THREE.DirectionalLight('#ffffff', 2.2);
      keyLight.position.set(12, 18, 10);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight('#94a3b8', 1.2);
      fillLight.position.set(-10, 10, -10);
      scene.add(fillLight);

      const hemi = new THREE.HemisphereLight('#f8fafc', '#334155', 0.9);
      scene.add(hemi);
    } else if (settings.preset === 'night_skyline') {
      const bg = '#090d16';
      scene.background = new THREE.Color(bg);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(bg);

      const moonLight = new THREE.DirectionalLight('#60a5fa', 0.8);
      moonLight.position.set(10, 20, 10);
      moonLight.castShadow = true;
      scene.add(moonLight);

      const interiorGlow1 = new THREE.PointLight('#fde047', 2.0, 25);
      interiorGlow1.position.set(0, 8, 0);
      scene.add(interiorGlow1);

      const interiorGlow2 = new THREE.PointLight('#fb923c', 1.5, 20);
      interiorGlow2.position.set(2, 4, 2);
      scene.add(interiorGlow2);

      const nightHemi = new THREE.HemisphereLight('#1e293b', '#020617', 0.4);
      scene.add(nightHemi);
    } else {
      // Overcast Nordic Daylight
      const bg = isDark ? '#182030' : '#f1f5f9';
      scene.background = new THREE.Color(bg);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(bg);

      const mainLight = new THREE.DirectionalLight('#f8fafc', 2.0);
      mainLight.position.set(5, 25, 8);
      mainLight.castShadow = true;
      scene.add(mainLight);

      const softHemi = new THREE.HemisphereLight('#cbd5e1', '#475569', 1.4);
      scene.add(softHemi);
    }
  };

  // Re-run lighting when RTX settings change
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      setupLighting(sceneRef.current, rtxSettings, theme);
      rendererRef.current.toneMappingExposure = rtxSettings.exposure;
    }
  }, [rtxSettings, theme]);

  // Update 3D meshes whenever currentBuilding components change
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const meshesMap = meshesMapRef.current;

    const currentCompIds = new Set(currentBuilding.components.map((c) => c.id));
    meshesMap.forEach((mesh, id) => {
      if (!currentCompIds.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        meshesMap.delete(id);
      }
    });

    currentBuilding.components.forEach((comp) => {
      let mesh = meshesMap.get(comp.id);
      if (!mesh) {
        const geo = createComponentGeometry(comp.shape, comp.scale, comp.bendAngle, comp.bendAxis);
        const mat = createComponentThreeMaterials(comp, comp.id === selectedCompId);
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { componentId: comp.id, name: comp.name };
        scene.add(mesh);
        meshesMap.set(comp.id, mesh);
      } else {
        mesh.geometry.dispose();
        mesh.geometry = createComponentGeometry(comp.shape, comp.scale, comp.bendAngle, comp.bendAxis);
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        mesh.material = createComponentThreeMaterials(comp, comp.id === selectedCompId);
        mesh.userData.name = comp.name;
      }

      mesh.position.set(comp.position[0], comp.position[1], comp.position[2]);
      mesh.rotation.set(comp.rotation[0], comp.rotation[1], comp.rotation[2]);
      mesh.visible = comp.visible !== false;
    });

    // Update snap point visualization markers
    if (snapMarkersRef.current) {
      const snapGroup = snapMarkersRef.current;
      while (snapGroup.children.length > 0) {
        const child = snapGroup.children[0];
        snapGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      }

      if (snapEnabled && selectedCompId) {
        const selComp = currentBuilding.components.find((c) => c.id === selectedCompId);
        if (selComp) {
          const snapPts = getComponentSnapPoints(selComp);
          const sphereGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
          const sphereMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true });
          snapPts.forEach((pt) => {
            const marker = new THREE.Mesh(sphereGeo, sphereMat);
            marker.position.set(pt[0], pt[1], pt[2]);
            snapGroup.add(marker);
          });
        }
      }
    }
  }, [currentBuilding, renderMode, snapEnabled, selectedCompId]);

  // Handle Mouse Click Raycasting for Component Selection and Per-Face Picking
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes = Array.from(meshesMapRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitMesh = hit.object as THREE.Mesh;
      const compId = hitMesh.userData.componentId;
      if (compId) {
        setSelectedCompId(compId);

        // Detect clicked face in local mesh coordinates for precise per-face texturing
        if (hit.face) {
          const worldNormal = hit.face.normal.clone();
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
          normalMatrix.invert();
          const localNormal = worldNormal.applyMatrix3(normalMatrix).normalize();

          const comp = currentBuilding.components.find((c) => c.id === compId);
          const shape = comp?.shape || 'paper_box';
          let detectedFace: GeometryFaceKey = 'front';

          const absX = Math.abs(localNormal.x);
          const absY = Math.abs(localNormal.y);
          const absZ = Math.abs(localNormal.z);

          if (
            shape === 'paper_box' ||
            shape === 'paper_sheet' ||
            shape === 'square_paper' ||
            shape === 'folded_wall' ||
            shape === 'balcony_tab' ||
            shape === 'square_slab'
          ) {
            if (absY >= absX && absY >= absZ) {
              detectedFace = localNormal.y > 0 ? 'top' : 'bottom';
            } else if (absX >= absY && absX >= absZ) {
              detectedFace = localNormal.x > 0 ? 'right' : 'left';
            } else {
              detectedFace = localNormal.z > 0 ? 'front' : 'back';
            }
          } else if (
            shape === 'cylindrical_column' ||
            shape === 'triangular_prism' ||
            shape === 'hexagonal_prism' ||
            shape === 'octagonal_prism' ||
            shape === 'barrel_vault' ||
            shape === 'paper_hyperboloid' ||
            shape === 'stepped_crown' ||
            shape === 'trapezoid_prism' ||
            shape === 'arch_portal' ||
            shape === 'chamfered_octagonal_prism' ||
            shape === 'circle_slab' ||
            shape === 'triangle_slab' ||
            shape === 'pentagon_slab' ||
            shape === 'hexagon_slab' ||
            shape === 'octagon_slab' ||
            shape === 'semicircle_slab' ||
            shape === 'trapezoid_slab'
          ) {
            if (absY > 0.6) {
              detectedFace = localNormal.y > 0 ? 'top' : 'bottom';
            } else {
              detectedFace = 'side';
            }
          } else if (shape === 'cone_spire' || shape === 'pyramid_spire') {
            if (localNormal.y < -0.6) {
              detectedFace = 'bottom';
            } else {
              detectedFace = 'side';
            }
          } else if (shape === 'paper_sphere' || shape === 'paper_torus') {
            detectedFace = localNormal.y > 0 ? 'top' : 'bottom';
          } else if (
            shape === 'triangle_wedge' ||
            shape === 'flat_triangle' ||
            shape === 'pitched_roof' ||
            shape === 'l_fold_wall'
          ) {
            if (absZ > 0.6) {
              detectedFace = 'front';
            } else {
              detectedFace = 'side';
            }
          } else {
            if (absY > 0.6) {
              detectedFace = localNormal.y > 0 ? 'top' : 'bottom';
            } else if (absZ > 0.6) {
              detectedFace = localNormal.z > 0 ? 'front' : 'back';
            } else {
              detectedFace = 'side';
            }
          }

          setSelectedFaceKey(detectedFace);
        }
      }
    }
  };

  // Mouse drag handlers for Orbit / Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    // Pan mode if Right-Click, Middle-Click, Shift is held, or pan tool is active
    if (e.button === 2 || e.button === 1 || e.shiftKey || interactionTool === 'pan') {
      dragModeRef.current = 'pan';
    } else {
      dragModeRef.current = 'orbit';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current) return;

    if (!isDraggingRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      const meshes = Array.from(meshesMapRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        setHoveredCompName(hit.userData.name || 'Component');
      } else {
        setHoveredCompName(null);
      }
      return;
    }

    const dist = Math.hypot(
      e.clientX - mouseDownPosRef.current.x,
      e.clientY - mouseDownPosRef.current.y
    );
    if (dist > 3) {
      hasMovedRef.current = true;
    }

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (dragModeRef.current === 'orbit') {
      cameraThetaRef.current -= deltaX * 0.008;
      cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, cameraPhiRef.current - deltaY * 0.008));
      updateCameraPosition();
    } else {
      const panSpeed = 0.02;
      const cam = cameraRef.current;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      cameraTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
      cameraTargetRef.current.addScaledVector(up, deltaY * panSpeed);
      updateCameraPosition();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const wasDragging = isDraggingRef.current;
    const hasMoved = hasMovedRef.current;
    isDraggingRef.current = false;

    // If mouse didn't drag significantly and it was a left click, perform component selection!
    if (wasDragging && !hasMoved && e.button === 0) {
      handleViewportClick(e);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    cameraRadiusRef.current = Math.max(4, Math.min(60, cameraRadiusRef.current + e.deltaY * 0.02));
    updateCameraPosition();
  };

  // Touch handlers for touchscreen & trackpad navigation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      const touch = e.touches[0];
      mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY };
      previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
      dragModeRef.current = 'orbit';
    } else if (e.touches.length >= 2) {
      isDraggingRef.current = true;
      hasMovedRef.current = true;
      dragModeRef.current = 'pan';
      const touch = e.touches[0];
      previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !cameraRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dist = Math.hypot(
      touch.clientX - mouseDownPosRef.current.x,
      touch.clientY - mouseDownPosRef.current.y
    );
    if (dist > 4) {
      hasMovedRef.current = true;
    }

    const deltaX = touch.clientX - previousMousePositionRef.current.x;
    const deltaY = touch.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: touch.clientX, y: touch.clientY };

    if (dragModeRef.current === 'orbit') {
      cameraThetaRef.current -= deltaX * 0.008;
      cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, cameraPhiRef.current - deltaY * 0.008));
      updateCameraPosition();
    } else {
      const panSpeed = 0.02;
      const cam = cameraRef.current;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      cameraTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
      cameraTargetRef.current.addScaledVector(up, deltaY * panSpeed);
      updateCameraPosition();
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Direct programmatic camera controls
  const handleZoom = (delta: number) => {
    cameraRadiusRef.current = Math.max(4, Math.min(60, cameraRadiusRef.current + delta));
    updateCameraPosition();
  };

  const handleOrbitDelta = (deltaTheta: number, deltaPhi: number) => {
    cameraThetaRef.current += deltaTheta;
    cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, cameraPhiRef.current + deltaPhi));
    updateCameraPosition();
  };

  const handlePanDelta = (deltaX: number, deltaY: number) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    cameraTargetRef.current.addScaledVector(right, deltaX);
    cameraTargetRef.current.addScaledVector(up, deltaY);
    updateCameraPosition();
  };

  // Window-level mouse listeners for continuous drag navigation across the entire screen
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;

      const dist = Math.hypot(
        e.clientX - mouseDownPosRef.current.x,
        e.clientY - mouseDownPosRef.current.y
      );
      if (dist > 3) {
        hasMovedRef.current = true;
      }

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (dragModeRef.current === 'orbit') {
        cameraThetaRef.current -= deltaX * 0.008;
        cameraPhiRef.current = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, cameraPhiRef.current - deltaY * 0.008));
        updateCameraPosition();
      } else {
        const panSpeed = 0.02;
        const cam = cameraRef.current;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
        cameraTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
        cameraTargetRef.current.addScaledVector(up, deltaY * panSpeed);
        updateCameraPosition();
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const wasDragging = isDraggingRef.current;
        const hasMoved = hasMovedRef.current;
        isDraggingRef.current = false;

        if (wasDragging && !hasMoved && e.button === 0 && mountRef.current) {
          const rect = mountRef.current.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            handleViewportClick(e as any);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  /**
   * Automatically calculate the 3D bounding box of the building model
   * and frame the camera distance & target so all components fit comfortably inside the viewport.
   */
  const fitCameraToBuilding = (comps: PaperComponent[] = currentBuilding.components) => {
    if (!cameraRef.current || !mountRef.current) return;

    if (!comps || comps.length === 0) {
      cameraTargetRef.current.set(0, 2, 0);
      cameraRadiusRef.current = 16;
      updateCameraPosition();
      return;
    }

    const box = new THREE.Box3();
    let hasValidMesh = false;

    // Use actual rendered meshes if present
    meshesMapRef.current.forEach((mesh) => {
      if (mesh.visible) {
        mesh.updateMatrixWorld(true);
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox();
        }
        if (mesh.geometry.boundingBox) {
          const meshBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
          box.union(meshBox);
          hasValidMesh = true;
        }
      }
    });

    // Fallback directly from component transforms if meshes are not yet ready
    if (!hasValidMesh) {
      comps.forEach((c) => {
        if (c.visible !== false) {
          const [px, py, pz] = c.position;
          const [sx, sy, sz] = c.scale;
          const min = new THREE.Vector3(px - sx / 2, py - sy / 2, pz - sz / 2);
          const max = new THREE.Vector3(px + sx / 2, py + sy / 2, pz + sz / 2);
          box.expandByPoint(min);
          box.expandByPoint(max);
          hasValidMesh = true;
        }
      });
    }

    if (!hasValidMesh) {
      cameraTargetRef.current.set(0, 2, 0);
      cameraRadiusRef.current = 16;
      updateCameraPosition();
      return;
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Compute bounding radius & extent
    const maxDim = Math.max(size.x, size.y, size.z, 2);
    const diagonal = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);

    const fov = (cameraRef.current.fov * Math.PI) / 180;
    const aspect = cameraRef.current.aspect || 1;
    const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);

    // Distance required to fit vertically and horizontally
    const distY = (size.y / 2) / Math.tan(fov / 2);
    const distX = (size.x / 2) / Math.tan(hFov / 2);
    const distDiag = (diagonal / 2) / Math.sin(Math.min(fov, hFov) / 2);

    let optimalDist = Math.max(distY, distX, distDiag * 0.95, maxDim * 1.5);
    // 35% comfortable breathing margin so it fits inside cleanly without touching edges/HUDs
    optimalDist = optimalDist * 1.35;
    // Keep within reasonable bounds
    optimalDist = Math.max(8, Math.min(180, optimalDist));

    cameraTargetRef.current.copy(center);
    cameraRadiusRef.current = optimalDist;
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    cameraThetaRef.current = Math.PI / 4;
    cameraPhiRef.current = Math.PI / 3;
    fitCameraToBuilding();
  };

  // Preset Views (Isometric, Top, Front, Right)
  const setCameraView = (view: 'iso' | 'top' | 'front' | 'right') => {
    if (view === 'iso') {
      cameraThetaRef.current = Math.PI / 4;
      cameraPhiRef.current = Math.PI / 3;
    } else if (view === 'top') {
      cameraThetaRef.current = 0;
      cameraPhiRef.current = 0.02;
    } else if (view === 'front') {
      cameraThetaRef.current = 0;
      cameraPhiRef.current = Math.PI / 2 - 0.05;
    } else if (view === 'right') {
      cameraThetaRef.current = Math.PI / 2;
      cameraPhiRef.current = Math.PI / 2 - 0.05;
    }
    updateCameraPosition();
  };

  // Automatically fit camera so the loaded building fits comfortably inside the screen
  const autoFitBuildingIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentBuilding && currentBuilding.id !== autoFitBuildingIdRef.current) {
      autoFitBuildingIdRef.current = currentBuilding.id;
      const timer = setTimeout(() => {
        fitCameraToBuilding(currentBuilding.components);
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [currentBuilding.id]);

  // Add Component to current building
  const handleAddComponent = (shape: ComponentShape) => {
    const existingCount = currentBuilding.components.length;
    const isSlab = shape.endsWith('_slab');
    const shapeScale: [number, number, number] = isSlab 
      ? [3.2, 0.25, 3.2] 
      : (shape === 'square_paper' || shape === 'paper_sheet' || shape === 'flat_triangle')
      ? [2.5, 0.08, 2.5]
      : [2.5, 2.0, 2.5];

    let newY = shapeScale[1] / 2;
    if (existingCount > 0) {
      const topComp = currentBuilding.components.reduce((prev, curr) =>
        curr.position[1] + curr.scale[1] / 2 > prev.position[1] + prev.scale[1] / 2 ? curr : prev
      );
      newY = topComp.position[1] + topComp.scale[1] / 2 + shapeScale[1] / 2;
    }

    const newId = `comp_${Date.now()}`;
    const newComponent: PaperComponent = {
      id: newId,
      name: `${shape.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} #${existingCount + 1}`,
      shape: shape,
      position: [0, newY, 0],
      rotation: [0, 0, 0],
      scale: shapeScale,
      materialConfig: PRESET_MATERIALS[existingCount % PRESET_MATERIALS.length],
      thickness: isSlab ? 1.5 : 1.0,
      bendAngle: 0,
      bendAxis: 'x',
      visible: true,
    };

    const nextComps = [...currentBuilding.components, newComponent];
    const maxHeight = Math.max(...nextComps.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    const shapeLabel = shape.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    pushHistory(nextComps, `Add ${shapeLabel}`, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComps,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(newId);
  };

  // Update selected component
  const updateSelectedComp = (
    updater: (comp: PaperComponent) => PaperComponent,
    actionLabel: string = 'Modify Component',
    isContinuous: boolean = false
  ) => {
    if (!selectedCompId) return;
    const nextComponents = currentBuilding.components.map((c) => (c.id === selectedCompId ? updater(c) : c));
    const maxHeight = Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    pushHistory(nextComponents, actionLabel, isContinuous);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
      heightMeters: Math.round(maxHeight),
    });
  };

  // Duplicate Selected Component
  const handleDuplicateSelected = () => {
    const comp = currentBuilding.components.find((c) => c.id === selectedCompId);
    if (!comp) return;

    const dupId = `comp_${Date.now()}`;
    const dupComp: PaperComponent = {
      ...JSON.parse(JSON.stringify(comp)),
      id: dupId,
      name: `${comp.name} Copy`,
      position: [comp.position[0], comp.position[1] + comp.scale[1], comp.position[2]],
    };

    const nextComps = [...currentBuilding.components, dupComp];
    const maxHeight = Math.max(...nextComps.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    pushHistory(nextComps, `Duplicate ${comp.name}`, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComps,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(dupId);
  };

  // Delete Selected Component
  const handleDeleteSelected = () => {
    if (!selectedCompId || currentBuilding.components.length === 0) return;
    const compToDelete = currentBuilding.components.find((c) => c.id === selectedCompId);
    const nextComponents = currentBuilding.components.filter((c) => c.id !== selectedCompId);
    const maxHeight = nextComponents.length > 0 
      ? Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4
      : 0;

    pushHistory(nextComponents, `Delete ${compToDelete?.name || 'Component'}`, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(nextComponents[0]?.id || null);
  };

  // Toggle visibility of any component by ID (with history)
  const handleToggleComponentVisibility = (compId: string) => {
    const target = currentBuilding.components.find((c) => c.id === compId);
    if (!target) return;
    const isNowVisible = target.visible === false;
    const nextComponents = currentBuilding.components.map((c) =>
      c.id === compId ? { ...c, visible: isNowVisible } : c
    );
    const actionLabel = `${isNowVisible ? 'Show' : 'Hide'} ${target.name}`;
    pushHistory(nextComponents, actionLabel, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
    });
  };

  // Duplicate specific component by ID (e.g. from Outliner)
  const handleDuplicateComponentById = (compId: string) => {
    const comp = currentBuilding.components.find((c) => c.id === compId);
    if (!comp) return;

    const dupId = `comp_${Date.now()}`;
    const dupComp: PaperComponent = {
      ...JSON.parse(JSON.stringify(comp)),
      id: dupId,
      name: `${comp.name} Copy`,
      position: [comp.position[0], comp.position[1] + comp.scale[1], comp.position[2]],
    };

    const nextComps = [...currentBuilding.components, dupComp];
    const maxHeight = Math.max(...nextComps.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    pushHistory(nextComps, `Duplicate ${comp.name}`, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComps,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(dupId);
  };

  // Delete specific component by ID (e.g. from Outliner)
  const handleDeleteComponentById = (compId: string) => {
    const compToDelete = currentBuilding.components.find((c) => c.id === compId);
    if (!compToDelete) return;

    const nextComponents = currentBuilding.components.filter((c) => c.id !== compId);
    const maxHeight = nextComponents.length > 0 
      ? Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4
      : 0;

    pushHistory(nextComponents, `Delete ${compToDelete.name}`, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
      heightMeters: Math.round(maxHeight),
    });
    if (selectedCompId === compId) {
      setSelectedCompId(nextComponents[0]?.id || null);
    }
  };

  // Quick nudge selected component position by delta
  const handleNudgeSelectedComp = (dx: number, dy: number, dz: number) => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => ({
        ...c,
        position: [
          Math.round((c.position[0] + dx) * 10) / 10,
          Math.max(0, Math.round((c.position[1] + dy) * 10) / 10),
          Math.round((c.position[2] + dz) * 10) / 10,
        ],
      }),
      'Nudge Position',
      false
    );
  };

  // Rotate selected component on X, Y, or Z axis
  const handleRotateAxis = (axis: 'x' | 'y' | 'z', dAngle: number) => {
    if (!selectedCompId) return;
    const deg = Math.round((dAngle * 180) / Math.PI);
    updateSelectedComp(
      (c) => {
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        const rot = [...c.rotation] as [number, number, number];
        rot[idx] = (rot[idx] + dAngle) % (Math.PI * 2);
        return {
          ...c,
          rotation: rot,
        };
      },
      `Rotate ${axis.toUpperCase()} ${deg > 0 ? '+' : ''}${deg}°`,
      false
    );
  };

  const handleSetRotationDegrees = (axis: 'x' | 'y' | 'z', degrees: number) => {
    if (!selectedCompId) return;
    const rad = (degrees * Math.PI) / 180;
    updateSelectedComp(
      (c) => {
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        const rot = [...c.rotation] as [number, number, number];
        rot[idx] = rad;
        return {
          ...c,
          rotation: rot,
        };
      },
      `Set Rotation ${axis.toUpperCase()} ${degrees}°`,
      true
    );
  };

  const handleResetRotation = () => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => ({
        ...c,
        rotation: [0, 0, 0],
      }),
      'Reset Rotation',
      false
    );
  };

  // Geometry Bending & Curvature handlers
  const handleSetBendAngle = (degrees: number) => {
    if (!selectedCompId) return;
    const clamped = Math.max(-180, Math.min(180, Math.round(degrees)));
    updateSelectedComp(
      (c) => ({
        ...c,
        bendAngle: clamped,
      }),
      `Set Bend ${clamped}°`,
      true
    );
  };

  const handleNudgeBend = (deltaDeg: number) => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => {
        const curr = c.bendAngle || 0;
        const next = Math.max(-180, Math.min(180, Math.round(curr + deltaDeg)));
        return {
          ...c,
          bendAngle: next,
        };
      },
      `Bend ${deltaDeg > 0 ? '+' : ''}${deltaDeg}°`,
      false
    );
  };

  const handleSetBendAxis = (axis: 'x' | 'y' | 'z') => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => ({
        ...c,
        bendAxis: axis,
      }),
      `Set Bend Axis ${axis.toUpperCase()}`,
      false
    );
  };

  const handleToggleBendAxis = () => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => {
        const curr = c.bendAxis || 'x';
        const nextAxis: 'x' | 'y' | 'z' = curr === 'x' ? 'y' : curr === 'y' ? 'z' : 'x';
        return {
          ...c,
          bendAxis: nextAxis,
        };
      },
      'Toggle Bend Axis',
      false
    );
  };

  const handleResetBend = () => {
    if (!selectedCompId) return;
    updateSelectedComp(
      (c) => ({
        ...c,
        bendAngle: 0,
      }),
      'Reset Bend',
      false
    );
  };

  // Comprehensive keyboard shortcuts & viewport navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      } else if (isCmdOrCtrl && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // [ and ]: Bend Selected Component curvature (-15° / +15°)
      if (selectedCompId && (e.key === '[' || e.key === '{')) {
        e.preventDefault();
        handleNudgeBend(-15);
        return;
      } else if (selectedCompId && (e.key === ']' || e.key === '}')) {
        e.preventDefault();
        handleNudgeBend(15);
        return;
      } else if (selectedCompId && (e.key === 'b' || e.key === 'B') && !e.shiftKey && !isCmdOrCtrl) {
        e.preventDefault();
        handleToggleBendAxis();
        return;
      }

      // Tool Switcher: 1=Select, 2=Orbit, 3=Pan
      if (e.key === '1') {
        setInteractionTool('select');
        return;
      } else if (e.key === '2') {
        setInteractionTool('orbit');
        return;
      } else if (e.key === '3') {
        setInteractionTool('pan');
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedCompId(null);
        return;
      }

      // Delete / Backspace to remove selected component
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCompId) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Shift + Arrows or Shift + WASD: Nudge selected component in 3D
      if (e.shiftKey && selectedCompId) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleNudgeSelectedComp(-0.5, 0, 0);
          return;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleNudgeSelectedComp(0.5, 0, 0);
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleNudgeSelectedComp(0, 0, -0.5);
          return;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleNudgeSelectedComp(0, 0, 0.5);
          return;
        } else if (e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
          e.preventDefault();
          handleNudgeSelectedComp(0, 0.5, 0);
          return;
        } else if (e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
          e.preventDefault();
          handleNudgeSelectedComp(0, -0.5, 0);
          return;
        }
      }

      // Move / Navigate camera around in 3D studio (WASD & Arrow keys)
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handlePanDelta(0, 0.6);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handlePanDelta(0, -0.6);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePanDelta(-0.6, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handlePanDelta(0.6, 0);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleOrbitDelta(Math.PI / 16, 0);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleOrbitDelta(-Math.PI / 16, 0);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        fitCameraToBuilding();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoom(-2);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom(2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBuilding, canUndo, canRedo, selectedCompId, interactionTool]);

  // Helper to obtain the active material configuration for the selected face
  const getActiveFaceConfig = (comp: PaperComponent): PaperMaterialConfig => {
    if (selectedFaceKey === 'all' || !comp.faceMaterials) {
      return comp.materialConfig;
    }
    const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
    return comp.faceMaterials[faceKey] || comp.materialConfig;
  };

  const isCurrentFaceOverridden = (comp: PaperComponent): boolean => {
    if (selectedFaceKey === 'all' || !comp.faceMaterials) return false;
    const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
    return Boolean(comp.faceMaterials[faceKey]?.textureUrl);
  };

  // Upload custom paper/material texture map (to ALL or currently selected face)
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;

      if (currentBuilding.components.length === 0) {
        // Create a new base block with this custom texture on blank canvas!
        const newId = `comp_${Date.now()}`;
        const newComponent: PaperComponent = {
          id: newId,
          name: 'Custom Textured Block',
          shape: 'paper_box',
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: [3, 2, 3],
          materialConfig: {
            ...PRESET_MATERIALS[0],
            textureUrl: url,
            repeat: [1, 1],
            roughness: 0.85,
          },
          thickness: 1.5,
        };
        const nextComps = [newComponent];
        pushHistory(nextComps, 'Create Custom Textured Block', false);
        onUpdateBuilding({
          ...currentBuilding,
          components: nextComps,
          heightMeters: 8,
        });
        setSelectedCompId(newId);
        setSaveSuccessMessage('Created paper block with your custom texture!');
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 2500);
        return;
      }

      updateSelectedComp((c) => {
        if (selectedFaceKey === 'all') {
          return {
            ...c,
            materialConfig: {
              ...c.materialConfig,
              textureUrl: url,
              repeat: c.materialConfig.repeat || [1, 1],
            },
            faceMaterials: undefined, // Reset individual face overrides so whole model gets uniform texture
          };
        } else {
          const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
          const currentFace = c.faceMaterials?.[faceKey] || { ...c.materialConfig };
          return {
            ...c,
            faceMaterials: {
              ...(c.faceMaterials || {}),
              [faceKey]: {
                ...currentFace,
                textureUrl: url,
                repeat: currentFace.repeat || [1, 1],
              },
            },
          };
        }
      }, selectedFaceKey === 'all' ? 'Upload Texture (All Faces)' : `Upload Texture (${selectedFaceKey})`, false);
      setSaveSuccessMessage(
        selectedFaceKey === 'all'
          ? 'Applied custom texture to ALL faces!'
          : `Applied custom texture to [${selectedFaceKey.toUpperCase()}] face!`
      );
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clear / remove texture map for selected face or all faces
  const handleRemoveTexture = () => {
    updateSelectedComp((c) => {
      if (selectedFaceKey === 'all') {
        return {
          ...c,
          materialConfig: {
            ...c.materialConfig,
            textureUrl: '',
          },
          faceMaterials: undefined,
        };
      } else {
        const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
        const nextFaceMats = { ...(c.faceMaterials || {}) };
        delete nextFaceMats[faceKey];
        return {
          ...c,
          faceMaterials: Object.keys(nextFaceMats).length > 0 ? nextFaceMats : undefined,
        };
      }
    }, selectedFaceKey === 'all' ? 'Remove Texture (All Faces)' : `Remove Texture (${selectedFaceKey})`, false);
    setSaveSuccessMessage(
      selectedFaceKey === 'all'
        ? 'Removed texture from ALL faces (clean cardstock)!'
        : `Removed texture from [${selectedFaceKey.toUpperCase()}] face (reverted to base paper)!`
    );
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Reset all individual face texture overrides back to uniform base material
  const handleResetAllFaceTextures = () => {
    updateSelectedComp((c) => ({
      ...c,
      faceMaterials: undefined,
    }), 'Reset Face Overrides', false);
    setSaveSuccessMessage('Reset all face textures! Restored uniform cardstock.');
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Apply a preset texture to selected component (or first component if none selected)
  const handleApplyPresetTexture = (preset: TexturePresetItem) => {
    const url = preset.getUrl();

    if (currentBuilding.components.length === 0) {
      // Create a base block with this preset texture on blank canvas!
      const newId = `comp_${Date.now()}`;
      const newComponent: PaperComponent = {
        id: newId,
        name: `${preset.name} Block`,
        shape: 'paper_box',
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [3, 2, 3],
        materialConfig: {
          ...PRESET_MATERIALS[0],
          textureUrl: url,
          repeat: preset.defaultRepeat,
          roughness: preset.defaultRoughness,
        },
        thickness: 1.5,
      };
      const nextComps = [newComponent];
      pushHistory(nextComps, `Add ${preset.name} Block`, false);
      onUpdateBuilding({
        ...currentBuilding,
        components: nextComps,
        heightMeters: 8,
      });
      setSelectedCompId(newId);
      setSaveSuccessMessage(`Added paper block with "${preset.name}" texture!`);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
      return;
    }

    let targetCompId = selectedCompId;
    if (!targetCompId && currentBuilding.components.length > 0) {
      targetCompId = currentBuilding.components[0].id;
      setSelectedCompId(targetCompId);
    }
    if (!targetCompId) return;

    const nextComponents = currentBuilding.components.map((c) => {
      if (c.id === targetCompId) {
        if (selectedFaceKey === 'all') {
          return {
            ...c,
            materialConfig: {
              ...c.materialConfig,
              textureUrl: url,
              repeat: preset.defaultRepeat,
              roughness: preset.defaultRoughness,
            },
            faceMaterials: undefined, // Clear face overrides so all 6 faces receive preset uniformly
          };
        } else {
          const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
          const currentFace = c.faceMaterials?.[faceKey] || { ...c.materialConfig };
          return {
            ...c,
            faceMaterials: {
              ...(c.faceMaterials || {}),
              [faceKey]: {
                ...currentFace,
                textureUrl: url,
                repeat: preset.defaultRepeat,
                roughness: preset.defaultRoughness,
              },
            },
          };
        }
      }
      return c;
    });

    const actionText = selectedFaceKey === 'all'
      ? `Apply Texture: ${preset.name}`
      : `Apply Texture: ${preset.name} (${selectedFaceKey})`;
    pushHistory(nextComponents, actionText, false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
    });
    setSaveSuccessMessage(
      selectedFaceKey === 'all'
        ? `Applied "${preset.name}" to ALL faces!`
        : `Applied "${preset.name}" to [${selectedFaceKey.toUpperCase()}] face!`
    );
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Adjust UV tile repeat for currently selected face (or all faces)
  const handleUpdateFaceRepeat = (axis: 0 | 1, val: number) => {
    updateSelectedComp((c) => {
      if (selectedFaceKey === 'all') {
        const rep = c.materialConfig.repeat || [1, 1];
        return {
          ...c,
          materialConfig: {
            ...c.materialConfig,
            repeat: [axis === 0 ? val : rep[0], axis === 1 ? val : rep[1]],
          },
        };
      } else {
        const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
        const currentFace = c.faceMaterials?.[faceKey] || { ...c.materialConfig };
        const rep = currentFace.repeat || [1, 1];
        return {
          ...c,
          faceMaterials: {
            ...(c.faceMaterials || {}),
            [faceKey]: {
              ...currentFace,
              repeat: [axis === 0 ? val : rep[0], axis === 1 ? val : rep[1]],
            },
          },
        };
      }
    }, 'Adjust UV Repeat', true);
  };

  // Adjust tint color for currently selected face (or all faces)
  const handleUpdateFaceColor = (color: string) => {
    updateSelectedComp((c) => {
      if (selectedFaceKey === 'all') {
        return {
          ...c,
          materialConfig: {
            ...c.materialConfig,
            color: color,
          },
        };
      } else {
        const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
        const currentFace = c.faceMaterials?.[faceKey] || { ...c.materialConfig };
        return {
          ...c,
          faceMaterials: {
            ...(c.faceMaterials || {}),
            [faceKey]: {
              ...currentFace,
              color: color,
            },
          },
        };
      }
    }, 'Adjust Face Color', true);
  };

  // Adjust roughness for currently selected face (or all faces)
  const handleUpdateFaceRoughness = (roughness: number) => {
    updateSelectedComp((c) => {
      if (selectedFaceKey === 'all') {
        return {
          ...c,
          materialConfig: {
            ...c.materialConfig,
            roughness: roughness,
          },
        };
      } else {
        const faceKey = selectedFaceKey as keyof FaceMaterialsConfig;
        const currentFace = c.faceMaterials?.[faceKey] || { ...c.materialConfig };
        return {
          ...c,
          faceMaterials: {
            ...(c.faceMaterials || {}),
            [faceKey]: {
              ...currentFace,
              roughness: roughness,
            },
          },
        };
      }
    }, 'Adjust Face Roughness', true);
  };

  // Copy current face texture settings across all other faces of the component
  const handleCopyFaceTextureToAllFaces = () => {
    if (!selectedComp) return;
    const activeFaceMat = getActiveFaceConfig(selectedComp);
    updateSelectedComp((c) => ({
      ...c,
      materialConfig: {
        ...c.materialConfig,
        textureUrl: activeFaceMat.textureUrl,
        repeat: activeFaceMat.repeat,
        roughness: activeFaceMat.roughness,
        color: activeFaceMat.color,
      },
      faceMaterials: undefined,
    }), 'Copy Face Texture to All Faces', false);
    setSelectedFaceKey('all');
    setSaveSuccessMessage('Copied texture across ALL faces!');
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Apply current or specific texture to ALL components in building
  const handleApplyTextureToAll = (textureUrl?: string, repeat?: [number, number], roughness?: number) => {
    if (currentBuilding.components.length === 0) return;
    const activeConfig = selectedComp ? getActiveFaceConfig(selectedComp) : undefined;
    const targetUrl = textureUrl !== undefined 
      ? textureUrl 
      : (activeConfig?.textureUrl || '');
    const targetRepeat = repeat || activeConfig?.repeat || [1, 1];
    const targetRoughness = roughness !== undefined ? roughness : (activeConfig?.roughness || 0.85);

    const nextComponents = currentBuilding.components.map((c) => ({
      ...c,
      materialConfig: {
        ...c.materialConfig,
        textureUrl: targetUrl,
        repeat: targetRepeat,
        roughness: targetRoughness,
      },
      faceMaterials: undefined, // Uniform across all components
    }));

    pushHistory(nextComponents, targetUrl ? 'Apply Texture Across All Components' : 'Clear Textures Across All Components', false);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
    });
    setSaveSuccessMessage(targetUrl ? 'Applied texture across ALL components!' : 'Cleared textures on ALL components!');
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Start new building (Blank Canvas)
  const handleNewBuilding = () => {
    const catalogCount = (buildingCatalog ? Object.keys(buildingCatalog).length : 0) + 1;
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

    onUpdateBuilding(newBuilding);
    onSaveToCatalog(newBuilding);
    setSelectedCompId(null);
    setSaveAsName(newBldgName);
    setSaveAsCategory('Skyscraper');
    setSaveAsDesc(newBuilding.description);
    setSaveSuccessMessage(`Started blank project "${newBldgName}"!`);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Save building under a NEW distinct ID and custom name in Catalog
  const handleSaveAsNew = () => {
    const trimmedName = saveAsName.trim() || `Paper Building ${Date.now()}`;
    const newBldgId = `bldg_${Date.now()}`;

    const newBuilding: BuildingModel = {
      ...currentBuilding,
      id: newBldgId,
      name: trimmedName,
      category: saveAsCategory,
      description: saveAsDesc.trim() || currentBuilding.description,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onUpdateBuilding(newBuilding);
    onSaveToCatalog(newBuilding);
    setSaveModalOpen(false);
    setSaveSuccessMessage(`Saved "${trimmedName}" as new building!`);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Update existing building in Catalog
  const handleUpdateCurrent = () => {
    const trimmedName = saveAsName.trim() || currentBuilding.name;
    const updatedBuilding: BuildingModel = {
      ...currentBuilding,
      name: trimmedName,
      category: saveAsCategory,
      description: saveAsDesc.trim() || currentBuilding.description,
    };

    onUpdateBuilding(updatedBuilding);
    onSaveToCatalog(updatedBuilding);
    setSaveModalOpen(false);
    setSaveSuccessMessage(`Updated "${trimmedName}" in catalog!`);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Quick Save or open modal
  const handleOpenSaveModal = () => {
    setSaveAsName(currentBuilding.name);
    setSaveAsCategory(currentBuilding.category);
    setSaveAsDesc(currentBuilding.description || '');
    setSaveModalOpen(true);
  };

  const selectedComp = currentBuilding.components.find((c) => c.id === selectedCompId);

  return (
    <div className="flex-1 flex overflow-hidden relative select-none bg-white dark:bg-[#0c0f17] text-neutral-800 dark:text-neutral-200 transition-colors duration-150">
      {/* 1. Left Component Palette - Minimal Clean CAD Sidebar */}
      {leftSidebarOpen && (
        <div className="w-56 bg-white dark:bg-[#0e121b] border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 z-10 text-neutral-700 dark:text-neutral-300">
        <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 bg-ry-gradient inline-block" />
            <span className="text-ry-gradient">Modular CAD</span>
          </div>
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`p-1 border transition-colors cursor-pointer ${
              snapEnabled 
                ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
            title="Toggle Smart Edge Snapping"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Left Palette Selector: Shapes vs Textures */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs bg-neutral-50/50 dark:bg-[#141926]/50">
          <button
            onClick={() => setLeftPaletteTab('shapes')}
            className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer relative ${
              leftPaletteTab === 'shapes'
                ? 'bg-white dark:bg-[#0e121b]'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={leftPaletteTab === 'shapes' ? 'text-ry-gradient font-bold' : ''}>Shapes</span>
            {leftPaletteTab === 'shapes' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
          <button
            onClick={() => setLeftPaletteTab('textures')}
            className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer relative ${
              leftPaletteTab === 'textures'
                ? 'bg-white dark:bg-[#0e121b]'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={leftPaletteTab === 'textures' ? 'text-ry-gradient font-bold' : ''}>Textures</span>
            {leftPaletteTab === 'textures' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {leftPaletteTab === 'textures' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
                <span className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">Add Texture</span>
                <span className="text-[9px] text-neutral-400 font-mono">1-Click</span>
              </div>

              {/* Upload button in sidebar */}
              <label className="flex items-center justify-center gap-1.5 p-2 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 bg-neutral-50/70 dark:bg-[#141926]/70 hover:bg-neutral-100/70 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-[11px] font-semibold">
                <Upload className="w-3 h-3 text-amber-500" />
                <span>+ Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTextureUpload}
                  className="hidden"
                />
              </label>

              {/* Preset Textures */}
              <div className="space-y-1">
                {TEXTURE_PRESETS.map((preset) => {
                  const url = preset.getUrl();
                  const isActive = selectedComp?.materialConfig.textureUrl === url;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPresetTexture(preset)}
                      className={`w-full flex items-center gap-2 p-1.5 border text-left transition-all cursor-pointer group ${
                        isActive
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-400/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:bg-neutral-100/70'
                      }`}
                      title={`Apply ${preset.name}`}
                    >
                      <img
                        src={url}
                        alt={preset.name}
                        className="w-7 h-7 object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-amber-600">
                          {preset.name}
                        </div>
                        <div className="text-[9px] text-neutral-400 truncate">
                          {preset.category}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-4 h-4 bg-ry-gradient text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Apply to All */}
              <button
                type="button"
                onClick={() => handleApplyTextureToAll()}
                className="w-full py-1.5 bg-ry-gradient text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Apply to All Components</span>
              </button>
            </div>
          ) : (
            <>
          <div className="text-[10px] font-bold px-1.5 pt-1.5 pb-0.5 uppercase tracking-wider text-ry-gradient">
            CORE PRISMS &amp; COLUMNS
          </div>
          
          <button
            type="button"
            onClick={() => handleAddComponent('paper_box')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <Box className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Paper Box Core</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">6-face rectangular prism</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('cylindrical_column')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>○</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Cylinder Pillar</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Round rolled column</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('hexagonal_prism')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⬡</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Hexagonal Prism</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">6-sided paper column</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('octagonal_prism')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⯃</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Octagonal Column</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">8-facet column prism</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('trapezoid_prism')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⏢</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Beveled Trapezoid</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Tapering beveled block</div>
            </div>
          </button>

          {/* TRIANGLES & WEDGES */}
          <div className="text-[10px] font-bold px-1.5 pt-3 pb-0.5 uppercase tracking-wider text-ry-gradient flex items-center justify-between">
            <span>TRIANGLES &amp; WEDGES</span>
            <span className="text-[9px] px-1 py-0.2 bg-ry-gradient text-white font-mono">NEW</span>
          </div>

          <button
            type="button"
            onClick={() => handleAddComponent('triangle_wedge')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <Triangle className="w-3.5 h-3.5 rotate-45" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Triangular Wedge</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Right-angle ramp &amp; incline</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('triangular_prism')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <Triangle className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Triangle Prism</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">3-sided equilateral column</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('flat_triangle')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>△</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Flat Triangle Tile</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Origami facet &amp; gable sheet</div>
            </div>
          </button>

          {/* ROOFS, WALLS & VAULTS */}
          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold px-1.5 pt-3 pb-0.5 uppercase tracking-wider">
            ROOFS, WALLS &amp; VAULTS
          </div>

          <button
            type="button"
            onClick={() => handleAddComponent('folded_wall')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Folded Wall Panel</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Cardstock facade</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('l_fold_wall')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">90° Corner Fold</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Self-standing L-profile</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('pyramid_spire')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>▲</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Pyramidal Spire</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">4-facet folded spire</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('pitched_roof')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⌂</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Gable Pitched Roof</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Townhouse roof</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('barrel_vault')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⌒</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Curved Barrel Vault</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Half-cylinder paper arch</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('cone_spire')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>△</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Conical Spire</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Smooth paper cone</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('stepped_crown')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>☲</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Stepped Art Deco Crown</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Tiered setback crown</div>
            </div>
          </button>

          {/* CURVED & REVOLUTION SOLIDS */}
          <div className="text-[10px] font-bold px-1.5 pt-3 pb-0.5 uppercase tracking-wider text-ry-gradient flex items-center justify-between">
            <span>SPHERES &amp; CURVES</span>
            <span className="text-[9px] px-1 py-0.2 bg-ry-gradient text-white font-mono">NEW</span>
          </div>

          <button
            type="button"
            onClick={() => handleAddComponent('paper_sphere')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>●</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Sphere</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">3D orb &amp; geodesic dome</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('paper_torus')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>◎</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Torus</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Architectural ring &amp; donut</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('paper_hyperboloid')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⧖</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Hyperboloid</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Ruled hourglass tower</div>
            </div>
          </button>

          {/* ARCHITECTURAL SLABS & PODIUMS */}
          <div className="text-[10px] font-bold px-1.5 pt-3 pb-0.5 uppercase tracking-wider text-ry-gradient flex items-center justify-between">
            <span>SLABS &amp; PODIUMS</span>
            <span className="text-[9px] px-1 py-0.2 bg-ry-gradient text-white font-mono">NEW</span>
          </div>

          <button
            type="button"
            onClick={() => handleAddComponent('triangle_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>△</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Triangle Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">3-sided triangular floor plate</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('circle_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>○</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Circle Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Circular round disc deck</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('square_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors">
              <Box className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Square Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">4-sided square plinth plate</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('pentagon_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⬟</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Pentagon Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">5-sided regular pentagon plate</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('hexagon_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⬡</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Hexagon Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">6-sided honeycomb terrace slab</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('octagon_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⯃</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Octagon Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">8-sided gazebo podium slab</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('semicircle_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>◗</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Semicircle Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Half-circle / D-shaped balcony slab</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAddComponent('trapezoid_slab')}
            className="w-full flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:bg-neutral-100/60 dark:hover:bg-[#1a2133] text-left transition-colors group cursor-pointer"
          >
            <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-yellow-400 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
              <span>⏢</span>
            </div>
            <div className="truncate">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Trapezoid Slab</div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Tapered cantilever plate slab</div>
            </div>
          </button>
          </>
          )}
        </div>

        {/* Building Stats Summary & Device Project Saving */}
        <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e121b] text-xs space-y-2">
          <div className="flex justify-between items-center text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ry-gradient">Height:</span>
              <span className="text-ry-gradient font-mono font-bold tabular-nums">{currentBuilding.heightMeters} m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ry-gradient">Parts:</span>
              <span className="text-ry-gradient font-mono font-bold tabular-nums">{currentBuilding.components.length}</span>
            </div>
          </div>

          {/* Device Saving & Finish Unfinished Buildings Controls */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-saved to device</span>
              </div>
              <span className="font-mono text-[9px] text-neutral-400">Local draft</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenDeviceProjects) {
                    onOpenDeviceProjects('save');
                  } else {
                    exportBuildingToDeviceFile(currentBuilding);
                  }
                }}
                className="py-1 px-1.5 bg-ry-gradient text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                title="Save current building to your device as a file (.paper) or local draft"
              >
                <Save className="w-3 h-3 shrink-0" />
                <span className="truncate">Save to Device</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenDeviceProjects) {
                    onOpenDeviceProjects('saved');
                  } else {
                    handleOpenSaveModal();
                  }
                }}
                className="py-1 px-1.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141926] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Finish your unfinished buildings and resume saved drafts"
              >
                <HardDrive className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">Finish Later</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 2. Central 3D Viewport Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 h-full">
        {/* Viewport Top Bar - Clean White with Minimal Controls */}
        <div className="h-11 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-800 px-2 sm:px-3 flex items-center justify-between text-xs z-10 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 min-w-0">
          {/* Left: Sidebar Toggle, Project Switcher, New Button, Editable Title & Category */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Toggle Left Sidebar Button */}
            <button
              type="button"
              onClick={() => {
                setLeftSidebarOpen(!leftSidebarOpen);
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                  fitCameraToBuilding();
                }, 60);
              }}
              className={`p-1.5 border transition-colors cursor-pointer shrink-0 ${
                leftSidebarOpen
                  ? 'bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141926] dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
              }`}
              title={leftSidebarOpen ? 'Hide Left Palette (Fit Screen)' : 'Show Left Palette'}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            {/* Catalog Switcher */}
            {buildingCatalog && Object.keys(buildingCatalog).length > 0 && (
              <div className="flex items-center gap-1 bg-neutral-50 dark:bg-[#141926] px-2 py-1 border border-neutral-200 dark:border-neutral-800 shrink-0">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <select
                  value={currentBuilding.id}
                  onChange={(e) => {
                    const selected = buildingCatalog[e.target.value];
                    if (selected && onSelectBuilding) onSelectBuilding(selected);
                    else if (selected) onUpdateBuilding(selected);
                  }}
                  className="bg-transparent text-neutral-800 dark:text-neutral-200 text-xs font-medium outline-none cursor-pointer max-w-[120px] truncate"
                  title="Switch between your saved buildings"
                >
                  {Object.values(buildingCatalog).map((b) => (
                    <option key={b.id} value={b.id} className="bg-white dark:bg-[#141926] text-neutral-900 dark:text-neutral-100">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* New Building Button */}
            <button
              onClick={handleNewBuilding}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141926] dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 text-xs transition-colors shrink-0 cursor-pointer"
              title="Start a new blank papercraft building project"
            >
              <FilePlus className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* Direct Editable Name Input */}
            <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 focus-within:border-amber-500 transition-colors min-w-0">
              <Edit3 className="w-3 h-3 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={currentBuilding.name}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateBuilding({ ...currentBuilding, name: val });
                  setSaveAsName(val);
                }}
                placeholder="Building Name..."
                className="bg-transparent text-ry-gradient font-bold text-xs outline-none w-32 sm:w-44 truncate"
                title="Click to rename building directly"
              />
            </div>

            {/* Category Selector */}
            <select
              value={currentBuilding.category}
              onChange={(e) => onUpdateBuilding({ ...currentBuilding, category: e.target.value as any })}
              className="bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs px-2 py-1 outline-none hidden md:inline shrink-0 cursor-pointer"
              title="Change building category"
            >
              <option value="Skyscraper">Skyscraper</option>
              <option value="Residential">Residential</option>
              <option value="Historic Old Town">Historic Old Town</option>
              <option value="Origami Pavilion">Origami Pavilion</option>
              <option value="Civic Institution">Civic Institution</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          {/* Right: Tools, Camera Presets, Save */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tool Switcher: Select vs Orbit vs Pan */}
            <div className="flex items-center bg-neutral-100 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 p-0.5">
              <button
                onClick={() => setInteractionTool('select')}
                className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  interactionTool === 'select'
                    ? 'bg-ry-gradient text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Select Mode: Left-Click to Select, Drag to Orbit, Right/Shift-Drag to Pan"
              >
                <MousePointer className="w-3 h-3" />
                <span className="hidden sm:inline">Select</span>
              </button>
              <button
                onClick={() => setInteractionTool('orbit')}
                className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  interactionTool === 'orbit'
                    ? 'bg-ry-gradient text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Orbit Camera Mode"
              >
                <Compass className="w-3 h-3" />
                <span className="hidden sm:inline">Orbit</span>
              </button>
              <button
                onClick={() => setInteractionTool('pan')}
                className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] transition-colors cursor-pointer ${
                  interactionTool === 'pan'
                    ? 'bg-ry-gradient text-white font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Pan Camera Mode"
              >
                <Move className="w-3 h-3" />
                <span className="hidden sm:inline">Pan</span>
              </button>
            </div>

            {/* Fit Building to Screen Button */}
            <button
              type="button"
              onClick={() => fitCameraToBuilding()}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141926] dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer shrink-0"
              title="Fit Building Inside Screen (Hotkey: F)"
            >
              <Maximize2 className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Fit Screen</span>
            </button>

            {/* History State Manager (Undo / Redo & Timeline Dropdown) */}
            <div ref={historyDropdownRef} className="relative flex items-center bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] border-r border-neutral-200 dark:border-neutral-800 transition-colors ${
                  canUndo
                    ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title={canUndo ? `Undo: ${historyManagerRef.current?.undoAction} (Ctrl+Z / ⌘Z)` : 'Undo (Ctrl+Z / ⌘Z)'}
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] border-r border-neutral-200 dark:border-neutral-800 transition-colors ${
                  canRedo
                    ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title={canRedo ? `Redo: ${historyManagerRef.current?.redoAction} (Ctrl+Y / ⌘⇧Z)` : 'Redo (Ctrl+Y / ⌘⇧Z)'}
              >
                <Redo2 className="w-3 h-3" />
              </button>

              {/* History Timeline Trigger */}
              <button
                onClick={() => setHistoryDropdownOpen(!historyDropdownOpen)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                  historyDropdownOpen
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title="Open Undo/Redo History Timeline"
              >
                <History className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] tabular-nums">
                  {historyState.currentIndex + 1}/{historyState.entries.length}
                </span>
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${historyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* History Timeline Dropdown Panel */}
              {historyDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 text-xs flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white text-[11px] uppercase tracking-wider">
                      <History className="w-3.5 h-3.5 text-amber-500" />
                      <span>History Stack</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Step {historyState.currentIndex + 1} of {historyState.entries.length}
                    </span>
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-neutral-100 dark:divide-neutral-800/60 p-1">
                    {historyState.entries.map((entry, idx) => {
                      const isCurrent = idx === historyState.currentIndex;
                      const isFuture = idx > historyState.currentIndex;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleJumpToHistory(idx)}
                          className={`w-full text-left p-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-l-2 border-l-amber-500'
                              : isFuture
                              ? 'opacity-50 hover:opacity-90 hover:bg-neutral-50 dark:hover:bg-[#141926] text-neutral-500'
                              : 'hover:bg-neutral-50 dark:hover:bg-[#141926] text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-neutral-400 w-4 text-right shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="truncate">{entry.action}</span>
                          </div>
                          {isCurrent && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white font-mono font-bold shrink-0 ml-1">
                              CURRENT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-1.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] flex items-center justify-between text-[10px] shrink-0 text-neutral-400">
                    <span>Ctrl+Z (Undo) · Ctrl+Y (Redo)</span>
                    <button
                      type="button"
                      onClick={() => handleJumpToHistory(0)}
                      disabled={historyState.currentIndex === 0}
                      className="text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-30 disabled:no-underline cursor-pointer font-medium"
                    >
                      Revert to start
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Camera View Presets */}
            <div className="hidden xl:flex items-center bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 text-[11px]">
              <button
                onClick={() => setCameraView('iso')}
                className="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer"
                title="Isometric View"
              >
                ISO
              </button>
              <button
                onClick={() => setCameraView('top')}
                className="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer"
                title="Top View"
              >
                TOP
              </button>
              <button
                onClick={() => setCameraView('front')}
                className="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-800 cursor-pointer"
                title="Front View"
              >
                FRONT
              </button>
              <button
                onClick={() => setCameraView('right')}
                className="px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="Right View"
              >
                SIDE
              </button>
            </div>

            {/* Lighting Preset Selector */}
            <select
              value={rtxSettings.preset}
              onChange={(e) => onUpdateRtxSettings({ ...rtxSettings, preset: e.target.value as any })}
              className="bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs px-2 py-1 outline-none hidden lg:inline cursor-pointer"
            >
              <option value="golden_hour_inspo">Sunset Light</option>
              <option value="studio_softbox">Studio Softbox</option>
              <option value="overcast_nordic">Overcast Day</option>
              <option value="night_skyline">Night Skyline</option>
            </select>

            {/* Save to Catalog Button - Secondary Red-to-Yellow Gradient */}
            <button
              onClick={handleOpenSaveModal}
              className="flex items-center gap-1.5 px-3 py-1 bg-ry-gradient text-white font-semibold text-xs transition-all hover:brightness-105 active:scale-[0.99] shadow-xs cursor-pointer"
              title="Save building under custom name or as a new creation"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Building</span>
            </button>

            {/* Toggle Right Inspector Sidebar Button */}
            <button
              type="button"
              onClick={() => {
                setRightSidebarOpen(!rightSidebarOpen);
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                  fitCameraToBuilding();
                }, 60);
              }}
              className={`p-1.5 border transition-colors cursor-pointer shrink-0 ${
                rightSidebarOpen
                  ? 'bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141926] dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
              }`}
              title={rightSidebarOpen ? 'Hide Right Panel (Fit Screen)' : 'Show Right Panel'}
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3D Viewport DOM Container */}
        <div
          ref={mountRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          className="flex-1 w-full h-full relative cursor-default outline-none"
        >
          {/* History Undo/Redo Feedback HUD Banner */}
          {historyToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 border border-neutral-700 dark:border-neutral-200 px-3.5 py-1.5 text-xs font-semibold pointer-events-none flex items-center gap-2 z-30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
              {historyToast.type === 'undo' ? (
                <Undo2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Redo2 className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{historyToast.message}</span>
              <span className="text-[10px] font-mono opacity-65">
                ({historyState.currentIndex + 1}/{historyState.entries.length})
              </span>
            </div>
          )}

          {/* Top-left Architecture Viewport Badge */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-[11px] pointer-events-none flex items-center gap-2 z-20 shadow-xs">
            <span className="text-ry-gradient font-bold uppercase tracking-wider">
              {currentBuilding.name}
            </span>
            <span>·</span>
            <span className="text-neutral-500 font-mono">
              {currentBuilding.components.length} {currentBuilding.components.length === 1 ? 'Block' : 'Blocks'}
            </span>
            <span>·</span>
            <span className="text-ry-gradient font-mono font-bold">
              {currentBuilding.heightMeters}m Height
            </span>
          </div>

          {/* Quick Component Move HUD when in Select mode & component is selected */}
          {selectedComp && (
            <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-[11px] flex items-center gap-2 z-20 shadow-md max-w-[calc(100%-1.5rem)] overflow-x-auto no-scrollbar shrink-0">
              <span className="text-ry-gradient font-bold uppercase tracking-wider truncate max-w-[120px]">
                {selectedComp.name}
              </span>
              <div className="w-[1px] h-3 bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Move X:</span>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(-0.5, 0, 0)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Move -X (Left) / Shift+A"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(0.5, 0, 0)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Move +X (Right) / Shift+D"
                >
                  →
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Height:</span>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(0, -0.5, 0)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Lower Component (-Y) / Shift+S"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(0, 0.5, 0)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Raise Component (+Y) / Shift+W"
                >
                  ↑
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Z:</span>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(0, 0, -0.5)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Move -Z (Back) / Shift+Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelectedComp(0, 0, 0.5)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Move +Z (Forward) / Shift+Down"
                >
                  ▼
                </button>
              </div>
              <div className="w-[1px] h-3 bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Rot:</span>
                <button
                  type="button"
                  onClick={() => handleRotateAxis('x', Math.PI / 4)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Rotate X 45° (Pitch)"
                >
                  X 45°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateAxis('y', Math.PI / 4)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Rotate Y 45° (Yaw)"
                >
                  Y 45°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotateAxis('z', Math.PI / 4)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Rotate Z 45° (Roll)"
                >
                  Z 45°
                </button>
                <button
                  type="button"
                  onClick={handleResetRotation}
                  className="px-1 py-0.5 text-neutral-400 hover:text-amber-500 text-[10px] cursor-pointer"
                  title="Reset All Rotations (0, 0, 0)"
                >
                  0°
                </button>
              </div>
              <div className="w-[1px] h-3 bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Bend:</span>
                <button
                  type="button"
                  onClick={() => handleNudgeBend(-15)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Bend -15° (Hotkey: [ )"
                >
                  -15°
                </button>
                <span className="font-mono text-ry-gradient font-bold text-[10px] px-0.5 min-w-[24px] text-center">
                  {selectedComp.bendAngle || 0}°
                </span>
                <button
                  type="button"
                  onClick={() => handleNudgeBend(15)}
                  className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer"
                  title="Bend +15° (Hotkey: ] )"
                >
                  +15°
                </button>
                <button
                  type="button"
                  onClick={handleToggleBendAxis}
                  className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-mono font-bold text-[9px] uppercase cursor-pointer"
                  title={`Bend Axis: ${selectedComp.bendAxis || 'x'} (Click or press 'B' to toggle X → Y → Z)`}
                >
                  {selectedComp.bendAxis || 'x'}
                </button>
              </div>
              <div className="w-[1px] h-3 bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 font-mono">Face:</span>
                <select
                  value={selectedFaceKey}
                  onChange={(e) => setSelectedFaceKey(e.target.value as GeometryFaceKey)}
                  className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono px-1 py-0.5 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  title="Target geometry face for texturing (or click on any face in 3D viewport)"
                >
                  {getFaceOptionsForShape(selectedComp.shape).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setActiveRightTab('textures')}
                  className="p-1 hover:text-amber-500 text-neutral-400 cursor-pointer"
                  title="Open Textures & Materials Studio"
                >
                  <Palette className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompId(null)}
                className="px-1 py-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer ml-1 text-xs"
                title="Deselect (Esc)"
              >
                ✕
              </button>
            </div>
          )}

          {/* Subtle Viewport Navigation Overlay Guide */}
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 pointer-events-none flex items-center gap-2 z-20 shadow-xs max-w-[calc(100%-14rem)] overflow-hidden text-ellipsis whitespace-nowrap hidden sm:flex">
            <span className="text-ry-gradient font-bold flex items-center gap-1 shrink-0">
              <MousePointer className="w-3 h-3 text-amber-500" />
              <span>Select Mode</span>
            </span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">F: Fit Screen</span>
            <span>·</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium shrink-0">Drag: Orbit</span>
            <span>·</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium shrink-0">Shift/Right-Drag: Pan</span>
            <span>·</span>
            <span className="text-ry-gradient font-bold shrink-0">WASD: Move</span>
            <span>·</span>
            <span className="shrink-0">[ / ] Bend</span>
            {hoveredCompName && (
              <>
                <span>·</span>
                <span className="text-neutral-900 dark:text-white font-medium bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 truncate">
                  Target: {hoveredCompName}
                </span>
              </>
            )}
          </div>

          {/* On-screen 3D Camera Controls (Sharp Minimalist Floating Gizmo) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 p-1 z-20 shadow-xs">
            <button
              onClick={() => handleOrbitDelta(Math.PI / 8, 0)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Orbit Camera Left"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleOrbitDelta(-Math.PI / 8, 0)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Orbit Camera Right"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
            <button
              onClick={() => handlePanDelta(-0.6, 0)}
              className="px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
              title="Pan Camera Left"
            >
              ←
            </button>
            <button
              onClick={() => handlePanDelta(0.6, 0)}
              className="px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
              title="Pan Camera Right"
            >
              →
            </button>
            <button
              onClick={() => handlePanDelta(0, 0.6)}
              className="px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
              title="Pan Camera Up"
            >
              ↑
            </button>
            <button
              onClick={() => handlePanDelta(0, -0.6)}
              className="px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold"
              title="Pan Camera Down"
            >
              ↓
            </button>
            <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
            <button
              onClick={() => handleZoom(-3)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(3)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
            <button
              onClick={() => fitCameraToBuilding()}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
              title="Fit Building Inside Screen (Hotkey: F)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

          {/* Save Notice */}
          {saveSuccessNotice && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-none animate-bounce z-30">
              <Check className="w-4 h-4" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Blank Canvas Empty State Callout */}
          {currentBuilding.components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 z-20">
              <div className="pointer-events-auto bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-8 max-w-sm text-center shadow-xl">
                <div className="w-10 h-10 bg-ry-gradient text-white mx-auto flex items-center justify-center mb-3 shadow-xs">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-ry-gradient mb-1">
                  Blank Architectural Canvas
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                  Start assembling your structure by adding clean modular paper blocks from the left palette.
                </p>
                <button
                  onClick={() => handleAddComponent('paper_box')}
                  className="px-4 py-2 bg-ry-gradient text-white font-semibold text-xs shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  + Add Base Plinth Block
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Blender-Style Inspector & Outliner */}
      {rightSidebarOpen && (
        <div className="w-80 bg-white dark:bg-[#0e121b] border-l border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 z-10 text-neutral-700 dark:text-neutral-300">
        {/* Tab Headers with Secondary Red-to-Yellow Hairline */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs">
          <button
            onClick={() => setActiveRightTab('inspector')}
            className={`flex-1 py-2 font-semibold text-center relative transition-colors cursor-pointer ${
              activeRightTab === 'inspector'
                ? 'bg-neutral-50 dark:bg-neutral-850/50'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={activeRightTab === 'inspector' ? 'text-ry-gradient font-bold' : ''}>Transform</span>
            {activeRightTab === 'inspector' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
          <button
            onClick={() => setActiveRightTab('textures')}
            className={`flex-1 py-2 font-semibold text-center relative transition-colors cursor-pointer ${
              activeRightTab === 'textures'
                ? 'bg-neutral-50 dark:bg-neutral-850/50'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={activeRightTab === 'textures' ? 'text-ry-gradient font-bold' : ''}>Textures</span>
            {activeRightTab === 'textures' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
          <button
            onClick={() => setActiveRightTab('outliner')}
            className={`flex-1 py-2 font-semibold text-center relative transition-colors cursor-pointer ${
              activeRightTab === 'outliner'
                ? 'bg-neutral-50 dark:bg-neutral-850/50'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={activeRightTab === 'outliner' ? 'text-ry-gradient font-bold' : ''}>Layers ({currentBuilding.components.length})</span>
            {activeRightTab === 'outliner' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
          <button
            onClick={() => setActiveRightTab('lighting')}
            className={`flex-1 py-2 font-semibold text-center relative transition-colors cursor-pointer ${
              activeRightTab === 'lighting'
                ? 'bg-neutral-50 dark:bg-neutral-850/50'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className={activeRightTab === 'lighting' ? 'text-ry-gradient font-bold' : ''}>Lighting</span>
            {activeRightTab === 'lighting' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ry-gradient" />
            )}
          </button>
        </div>

        {/* Tab Content: Inspector */}
        {activeRightTab === 'inspector' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {selectedComp ? (
              <>
                {/* Header of selected item */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <input
                      type="text"
                      value={selectedComp.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSelectedComp((c) => ({ ...c, name: val }), 'Rename Component', true);
                      }}
                      className="bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold px-2 py-1 text-xs w-44 outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 uppercase">
                      Shape: {selectedComp.shape}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDuplicateSelected}
                      className="p-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      title="Duplicate Component"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="p-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 cursor-pointer"
                      title="Delete Component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Transform Position (X, Y, Z) */}
                <div>
                  <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider mb-2">
                    Position (Meters)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">X</label>
                      <input
                        type="number"
                        step={snapEnabled ? '0.5' : '0.1'}
                        value={selectedComp.position[0]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateSelectedComp((c) => ({
                            ...c,
                            position: [val, c.position[1], c.position[2]],
                          }), 'Move Position X', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Y (Height)</label>
                      <input
                        type="number"
                        step={snapEnabled ? '0.5' : '0.1'}
                        value={selectedComp.position[1]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateSelectedComp((c) => ({
                            ...c,
                            position: [c.position[0], val, c.position[2]],
                          }), 'Move Position Y', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Z</label>
                      <input
                        type="number"
                        step={snapEnabled ? '0.5' : '0.1'}
                        value={selectedComp.position[2]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateSelectedComp((c) => ({
                            ...c,
                            position: [c.position[0], c.position[1], val],
                          }), 'Move Position Z', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions (Scale) */}
                <div>
                  <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider mb-2">
                    Dimensions (W x H x D)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">Width</label>
                      <input
                        type="number"
                        step="0.2"
                        min="0.2"
                        value={selectedComp.scale[0]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          updateSelectedComp((c) => ({
                            ...c,
                            scale: [val, c.scale[1], c.scale[2]],
                          }), 'Scale Width', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Height</label>
                      <input
                        type="number"
                        step="0.2"
                        min="0.2"
                        value={selectedComp.scale[1]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          updateSelectedComp((c) => ({
                            ...c,
                            scale: [c.scale[0], val, c.scale[2]],
                          }), 'Scale Height', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Depth</label>
                      <input
                        type="number"
                        step="0.2"
                        min="0.2"
                        value={selectedComp.scale[2]}
                        onChange={(e) => {
                          const val = Math.max(0.2, parseFloat(e.target.value) || 1);
                          updateSelectedComp((c) => ({
                            ...c,
                            scale: [c.scale[0], c.scale[1], val],
                          }), 'Scale Depth', true);
                        }}
                        className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono tabular-nums outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3-Axis Rotation (X, Y, Z) */}
                <div className="space-y-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-ry-gradient uppercase tracking-wider font-bold">
                      Rotation (3-Axis X · Y · Z)
                    </label>
                    <button
                      type="button"
                      onClick={handleResetRotation}
                      className="text-[9px] text-neutral-400 hover:text-amber-500 font-mono transition-colors cursor-pointer"
                      title="Reset Rotation to 0° on all axes"
                    >
                      Reset (0°)
                    </button>
                  </div>

                  {/* Rotation X (Pitch) */}
                  <div className="bg-neutral-50/70 dark:bg-[#141926]/70 p-2 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                        X-Axis (Pitch / Tilt)
                      </span>
                      <span className="font-mono text-ry-gradient font-bold tabular-nums text-[10px]">
                        {Math.round((selectedComp.rotation[0] * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step={Math.PI / 24}
                      value={selectedComp.rotation[0]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSelectedComp((c) => ({
                          ...c,
                          rotation: [val, c.rotation[1], c.rotation[2]],
                        }), 'Rotate Pitch (X)', true);
                      }}
                      className="w-full accent-amber-500 mb-1"
                    />
                    <div className="flex items-center gap-1">
                      {[-90, -45, 0, 45, 90].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => handleSetRotationDegrees('x', deg)}
                          className="flex-1 py-0.5 text-[9px] font-mono bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          {deg > 0 ? `+${deg}°` : `${deg}°`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotation Y (Yaw) */}
                  <div className="bg-neutral-50/70 dark:bg-[#141926]/70 p-2 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Y-Axis (Yaw / Turn)
                      </span>
                      <span className="font-mono text-ry-gradient font-bold tabular-nums text-[10px]">
                        {Math.round((selectedComp.rotation[1] * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.PI * 2}
                      step={Math.PI / 24}
                      value={selectedComp.rotation[1]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSelectedComp((c) => ({
                          ...c,
                          rotation: [c.rotation[0], val, c.rotation[2]],
                        }), 'Rotate Yaw (Y)', true);
                      }}
                      className="w-full accent-amber-500 mb-1"
                    />
                    <div className="flex items-center gap-1">
                      {[0, 45, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => handleSetRotationDegrees('y', deg)}
                          className="flex-1 py-0.5 text-[9px] font-mono bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotation Z (Roll) */}
                  <div className="bg-neutral-50/70 dark:bg-[#141926]/70 p-2 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                        Z-Axis (Roll / Bank)
                      </span>
                      <span className="font-mono text-ry-gradient font-bold tabular-nums text-[10px]">
                        {Math.round((selectedComp.rotation[2] * 180) / Math.PI)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step={Math.PI / 24}
                      value={selectedComp.rotation[2]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSelectedComp((c) => ({
                          ...c,
                          rotation: [c.rotation[0], c.rotation[1], val],
                        }), 'Rotate Roll (Z)', true);
                      }}
                      className="w-full accent-amber-500 mb-1"
                    />
                    <div className="flex items-center gap-1">
                      {[-90, -45, 0, 45, 90].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => handleSetRotationDegrees('z', deg)}
                          className="flex-1 py-0.5 text-[9px] font-mono bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          {deg > 0 ? `+${deg}°` : `${deg}°`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Geometry Bending & Curvature (Deform Modifier) */}
                <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-800/70 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-ry-gradient uppercase tracking-wider font-bold">
                        Bending &amp; Curvature Deform
                      </span>
                    </div>
                    {Boolean(selectedComp.bendAngle) && (
                      <button
                        type="button"
                        onClick={handleResetBend}
                        className="text-[9px] text-neutral-400 hover:text-amber-500 font-mono transition-colors cursor-pointer"
                        title="Flatten / Reset Bending to 0°"
                      >
                        Reset (0° Flat)
                      </button>
                    )}
                  </div>

                  <div className="bg-neutral-50/70 dark:bg-[#141926]/70 p-2.5 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    {/* Bend Axis selector tabs */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-neutral-500">Bend Plane / Axis:</span>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase font-semibold">
                          {selectedComp.bendAxis === 'y'
                            ? 'Vertical Arch (Y)'
                            : selectedComp.bendAxis === 'z'
                            ? 'Depth Curl (Z)'
                            : 'Horizontal Arc (X)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetBendAxis('x')}
                          className={`py-1 text-[10px] font-semibold border transition-all cursor-pointer ${
                            (selectedComp.bendAxis || 'x') === 'x'
                              ? 'bg-ry-gradient text-white border-transparent shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0e121b] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-amber-500'
                          }`}
                          title="X-Axis: Horizontal Arc / Cylindrical curvature along width"
                        >
                          X · Horizontal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetBendAxis('y')}
                          className={`py-1 text-[10px] font-semibold border transition-all cursor-pointer ${
                            selectedComp.bendAxis === 'y'
                              ? 'bg-ry-gradient text-white border-transparent shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0e121b] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-amber-500'
                          }`}
                          title="Y-Axis: Vertical Arch / Bow curvature along height"
                        >
                          Y · Vert Arch
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetBendAxis('z')}
                          className={`py-1 text-[10px] font-semibold border transition-all cursor-pointer ${
                            selectedComp.bendAxis === 'z'
                              ? 'bg-ry-gradient text-white border-transparent shadow-xs font-bold'
                              : 'bg-white dark:bg-[#0e121b] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-amber-500'
                          }`}
                          title="Z-Axis: Longitudinal Roll curvature along depth"
                        >
                          Z · Depth Curl
                        </button>
                      </div>
                    </div>

                    {/* Bend Angle Slider and Value */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                          Curvature Angle (Bend)
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            value={selectedComp.bendAngle || 0}
                            onChange={(e) => handleSetBendAngle(parseFloat(e.target.value) || 0)}
                            className="w-14 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-700 text-right px-1 py-0.5 font-mono text-ry-gradient font-bold text-[10px] outline-none focus:border-amber-500"
                          />
                          <span className="font-mono text-ry-gradient font-bold text-[10px]">°</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={selectedComp.bendAngle || 0}
                        onChange={(e) => handleSetBendAngle(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 mb-1.5 cursor-pointer"
                      />

                      {/* Quick Preset Angles */}
                      <div className="grid grid-cols-7 gap-1">
                        {[-180, -90, -45, 0, 45, 90, 180].map((deg) => {
                          const isActive = (selectedComp.bendAngle || 0) === deg;
                          return (
                            <button
                              key={deg}
                              type="button"
                              onClick={() => handleSetBendAngle(deg)}
                              className={`py-0.5 text-[9px] font-mono border transition-all cursor-pointer ${
                                isActive
                                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold'
                                  : 'bg-white dark:bg-[#0e121b] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-amber-400'
                              }`}
                              title={deg === 0 ? 'Flat (Unbent)' : `${deg > 0 ? '+' : ''}${deg}° Bend`}
                            >
                              {deg === 0 ? 'Flat' : deg > 0 ? `+${deg}°` : `${deg}°`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[9px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between pt-0.5 border-t border-neutral-200/50 dark:border-neutral-800/50">
                      <span>Shortcut: <kbd className="px-1 py-0.2 bg-neutral-200 dark:bg-neutral-800 font-mono text-[9px]">[</kbd> or <kbd className="px-1 py-0.2 bg-neutral-200 dark:bg-neutral-800 font-mono text-[9px]">]</kbd></span>
                      <span><kbd className="px-1 py-0.2 bg-neutral-200 dark:bg-neutral-800 font-mono text-[9px]">B</kbd> cycles axis</span>
                    </div>
                  </div>
                </div>

                {/* Paper Material & Finish (Solid Architectural Cardstock) */}
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">
                    Paper Cardstock &amp; Finish
                  </div>

                  {/* Preset Solid Paper Swatches */}
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Architectural Palette</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_MATERIALS.map((mat) => {
                        const isCurrent = selectedComp.materialConfig.color?.toLowerCase() === mat.color?.toLowerCase();
                        return (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => updateSelectedComp((c) => ({
                              ...c,
                              materialConfig: mat,
                            }), `Cardstock: ${mat.name}`, false)}
                            className={`p-1.5 border text-left flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isCurrent
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                            }`}
                            title={mat.name}
                          >
                            <span
                              className="w-full h-4 border border-black/10 dark:border-white/10 inline-block shadow-2xs"
                              style={{ backgroundColor: mat.color }}
                            />
                            <span className="text-[9px] text-neutral-600 dark:text-neutral-400 truncate w-full text-center">
                              {mat.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Solid Color Picker */}
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Custom Paper Tone</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedComp.materialConfig.color || '#ffffff'}
                        onChange={(e) => updateSelectedComp((c) => ({
                          ...c,
                          materialConfig: {
                            ...c.materialConfig,
                            color: e.target.value,
                          },
                        }), 'Paper Color', true)}
                        className="w-8 h-7 border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-[#141926] cursor-pointer"
                        title="Pick custom cardstock color"
                      />
                      <input
                        type="text"
                        value={selectedComp.materialConfig.color || '#ffffff'}
                        onChange={(e) => updateSelectedComp((c) => ({
                          ...c,
                          materialConfig: {
                            ...c.materialConfig,
                            color: e.target.value,
                          },
                        }), 'Paper Color', true)}
                        className="flex-1 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono text-xs uppercase"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Custom Texture Mapping & Upload for Selected Face */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-amber-500" />
                        <label className="text-[10px] text-ry-gradient font-bold uppercase tracking-wider">
                          Target Face Texturing
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveRightTab('textures')}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Texture Library →
                      </button>
                    </div>

                    {/* Quick Face Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {getFaceOptionsForShape(selectedComp.shape).map((face) => {
                        const isSelected = selectedFaceKey === face.key;
                        const faceOverride = selectedComp.faceMaterials?.[face.key as keyof FaceMaterialsConfig];
                        const hasTexture = face.key === 'all' 
                          ? Boolean(selectedComp.materialConfig.textureUrl)
                          : Boolean(faceOverride?.textureUrl);

                        return (
                          <button
                            key={face.key}
                            type="button"
                            onClick={() => setSelectedFaceKey(face.key)}
                            className={`p-1 border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-white dark:bg-[#0e121b] text-neutral-600 dark:text-neutral-400'
                            }`}
                            title={face.desc}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[9px] font-mono uppercase">{face.tag}</span>
                              {hasTexture && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {getActiveFaceConfig(selectedComp).textureUrl ? (
                      <div className="p-2 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] space-y-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getActiveFaceConfig(selectedComp).textureUrl}
                            alt="Custom texture preview"
                            className="w-10 h-10 object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-white block truncate">
                              {selectedFaceKey === 'all' ? 'All Faces Active' : `[${selectedFaceKey.toUpperCase()}] Face Active`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <label className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline-block">
                                Replace...
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleTextureUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={handleRemoveTexture}
                                className="text-[10px] text-red-500 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* UV Tile Repeat */}
                        <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>Tile Repeat (X / Y)</span>
                            <span className="font-mono tabular-nums">
                              {getActiveFaceConfig(selectedComp).repeat?.[0] || 1}x · {getActiveFaceConfig(selectedComp).repeat?.[1] || 1}y
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="1"
                              value={getActiveFaceConfig(selectedComp).repeat?.[0] || 1}
                              onChange={(e) => handleUpdateFaceRepeat(0, parseInt(e.target.value, 10))}
                              className="accent-amber-500"
                              title="Repeat X"
                            />
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="1"
                              value={getActiveFaceConfig(selectedComp).repeat?.[1] || 1}
                              onChange={(e) => handleUpdateFaceRepeat(1, parseInt(e.target.value, 10))}
                              className="accent-amber-500"
                              title="Repeat Y"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500 bg-neutral-50 dark:bg-[#141926] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-xs">
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                        <span>+ Add Texture to {selectedFaceKey === 'all' ? 'Model' : `[${selectedFaceKey.toUpperCase()}] Face`}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTextureUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Surface Matte Roughness */}
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                      <span>Surface Finish</span>
                      <span className="font-mono tabular-nums">{Math.round((selectedComp.materialConfig.roughness || 0.85) * 100)}% Matte</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={selectedComp.materialConfig.roughness || 0.85}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSelectedComp((c) => ({
                          ...c,
                          materialConfig: {
                            ...c.materialConfig,
                            roughness: val,
                          },
                        }), 'Matte Roughness', true);
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Cardstock Thickness */}
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                      <span>Cardstock Thickness</span>
                      <span className="font-mono tabular-nums">{selectedComp.thickness} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={selectedComp.thickness}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateSelectedComp((c) => ({ ...c, thickness: val }), 'Cardstock Thickness', true);
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-neutral-400">
                <Box className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium text-neutral-600 dark:text-neutral-400">No paper component selected.</p>
                <p className="text-[10px] mt-1 text-neutral-400">
                  Left-click a component in the 3D studio or select from Outliner.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Dedicated Textures & Finishes Studio */}
        {activeRightTab === 'textures' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Header & Target Component Info */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <div className="text-xs font-bold text-ry-gradient uppercase tracking-wider">
                  Texture &amp; Pattern Library
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {selectedComp ? (
                    <span>Target: <strong className="text-neutral-900 dark:text-neutral-100">{selectedComp.name}</strong></span>
                  ) : (
                    <span>Select a component to texture, or apply to all</span>
                  )}
                </div>
              </div>
              {selectedComp && (
                <div className="flex items-center gap-1.5">
                  {selectedComp.faceMaterials && Object.keys(selectedComp.faceMaterials).length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllFaceTextures}
                      className="px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 transition-colors cursor-pointer"
                      title="Reset all per-face texture overrides to restore uniform material"
                    >
                      Reset All Faces
                    </button>
                  )}
                  {((selectedFaceKey === 'all' && selectedComp.materialConfig.textureUrl) || isCurrentFaceOverridden(selectedComp)) && (
                    <button
                      type="button"
                      onClick={handleRemoveTexture}
                      className="px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      {selectedFaceKey === 'all' ? 'Clear Model' : 'Clear Face'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Target Geometry Face Selector */}
            {selectedComp && (
              <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#141926]/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">
                      Target Geometry Face
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono">
                    {selectedComp.faceMaterials ? `${Object.keys(selectedComp.faceMaterials).length} custom faces` : 'Uniform texture'}
                  </span>
                </div>

                {/* Face selector buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {getFaceOptionsForShape(selectedComp.shape).map((face) => {
                    const isSelected = selectedFaceKey === face.key;
                    const faceOverride = selectedComp.faceMaterials?.[face.key as keyof FaceMaterialsConfig];
                    const hasTexture = face.key === 'all' 
                      ? Boolean(selectedComp.materialConfig.textureUrl)
                      : Boolean(faceOverride?.textureUrl);
                    const textureThumb = face.key === 'all'
                      ? selectedComp.materialConfig.textureUrl
                      : faceOverride?.textureUrl;

                    return (
                      <button
                        key={face.key}
                        type="button"
                        onClick={() => setSelectedFaceKey(face.key)}
                        className={`p-1.5 border text-center relative flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-white dark:bg-[#0e121b] text-neutral-600 dark:text-neutral-400'
                        }`}
                        title={face.desc}
                      >
                        <div className="flex items-center justify-center gap-1 w-full">
                          <span className="text-[9px] font-mono uppercase tracking-tighter truncate">
                            {face.tag}
                          </span>
                          {hasTexture && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Texture active on this face" />
                          )}
                        </div>
                        <span className="text-[9px] leading-tight truncate w-full">
                          {face.label.split(' ')[0]}
                        </span>
                        {textureThumb ? (
                          <div className="w-full h-3 overflow-hidden border border-neutral-300 dark:border-neutral-700 mt-0.5 bg-neutral-200">
                            <img src={textureThumb} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-1 mt-1 bg-transparent" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Face Status Banner */}
                <div className="flex items-center justify-between text-[10px] bg-white dark:bg-[#0e121b] p-2 border border-neutral-200/80 dark:border-neutral-800/80">
                  <div className="min-w-0">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Active: {getFaceOptionsForShape(selectedComp.shape).find((f) => f.key === selectedFaceKey)?.label || 'All Faces'}
                    </span>
                    <div className="text-[9px] text-neutral-400 truncate">
                      {isCurrentFaceOverridden(selectedComp) 
                        ? 'Custom face texture active (overriding base)'
                        : (selectedFaceKey === 'all' ? 'Applying texture to all surfaces' : 'Inheriting base cardstock material')}
                    </div>
                  </div>
                  {isCurrentFaceOverridden(selectedComp) && (
                    <button
                      type="button"
                      onClick={handleRemoveTexture}
                      className="text-[9px] font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer shrink-0 ml-2"
                    >
                      Clear Face
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Custom Image Upload Option */}
            <div className="p-3 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500 transition-colors">
              <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Upload className="w-3 h-3 text-amber-500" />
                  <span>Upload Image for {selectedFaceKey === 'all' ? 'All Faces' : `[${selectedFaceKey.toUpperCase()}] Face`}</span>
                </div>
                {selectedFaceKey !== 'all' && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                    Target: {selectedFaceKey.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
                {selectedFaceKey === 'all'
                  ? 'Add any image from your computer to wrap directly around all surfaces of your paper model.'
                  : `Upload an image to apply specifically to the ${selectedFaceKey.toUpperCase()} face of this geometry.`}
              </p>
              
              {selectedComp && getActiveFaceConfig(selectedComp).textureUrl ? (
                <div className="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e121b]">
                  <img
                    src={getActiveFaceConfig(selectedComp).textureUrl}
                    alt="Active texture"
                    className="w-10 h-10 object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-ry-gradient block truncate">
                      {selectedFaceKey === 'all' ? 'Texture Active (All Faces)' : `Face [${selectedFaceKey.toUpperCase()}] Texture Active`}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <label className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline-block">
                        Replace File...
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTextureUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveTexture}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-xs font-semibold shadow-xs">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Choose Image for {selectedFaceKey === 'all' ? 'Model' : `${selectedFaceKey.toUpperCase()} Face`} (PNG, JPG, WEBP)...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTextureUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Category Filter for Presets */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">
                  Preset Architectural Textures
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">12 Presets</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2.5">
                {['All', 'Architectural', 'Facades & Windows', 'Paper & Card', 'Materials'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTextureCategoryFilter(cat)}
                    className={`px-2 py-0.5 text-[10px] transition-colors cursor-pointer ${
                      textureCategoryFilter === cat
                        ? 'bg-ry-gradient text-white font-semibold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of Preset Textures */}
              <div className="grid grid-cols-2 gap-2">
                {TEXTURE_PRESETS.filter((p) => textureCategoryFilter === 'All' || p.category === textureCategoryFilter).map((preset) => {
                  const url = preset.getUrl();
                  const activeConfig = selectedComp ? getActiveFaceConfig(selectedComp) : null;
                  const isActive = activeConfig?.textureUrl === url;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPresetTexture(preset)}
                      className={`p-2 border text-left flex flex-col gap-1.5 transition-all cursor-pointer group ${
                        isActive
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-400/80 bg-neutral-50/60 dark:bg-[#141926]/60 hover:bg-neutral-100/60'
                      }`}
                    >
                      <div className="w-full h-14 border border-neutral-300/80 dark:border-neutral-700/80 relative overflow-hidden bg-neutral-100">
                        <img
                          src={url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {isActive && (
                          <div className="absolute top-1 right-1 bg-ry-gradient text-white p-0.5 shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {preset.name}
                        </div>
                        <div className="text-[9px] text-neutral-400 truncate">
                          {preset.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Texture Mapping Controls (UV Repeat, Tint, Finish) for Selected Face */}
            {selectedComp && (
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">
                    {selectedFaceKey === 'all' ? 'Mapping & Finish (All Faces)' : `[${selectedFaceKey.toUpperCase()}] Face Mapping & Finish`}
                  </div>
                  {selectedFaceKey !== 'all' && getActiveFaceConfig(selectedComp).textureUrl && (
                    <button
                      type="button"
                      onClick={handleCopyFaceTextureToAllFaces}
                      className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      title="Copy this face's texture and settings to all other faces"
                    >
                      Copy to All Faces
                    </button>
                  )}
                </div>

                {/* UV Repeat */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                    <span>Tile Density (Repeat X / Y)</span>
                    <span className="font-mono tabular-nums text-ry-gradient font-bold">
                      {getActiveFaceConfig(selectedComp).repeat?.[0] || 1}x · {getActiveFaceConfig(selectedComp).repeat?.[1] || 1}y
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={getActiveFaceConfig(selectedComp).repeat?.[0] || 1}
                      onChange={(e) => handleUpdateFaceRepeat(0, parseInt(e.target.value, 10))}
                      className="accent-amber-500"
                      title="Repeat X"
                    />
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={getActiveFaceConfig(selectedComp).repeat?.[1] || 1}
                      onChange={(e) => handleUpdateFaceRepeat(1, parseInt(e.target.value, 10))}
                      className="accent-amber-500"
                      title="Repeat Y"
                    />
                  </div>
                </div>

                {/* Tint Color */}
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">Texture Tint Tone</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={getActiveFaceConfig(selectedComp).color || '#ffffff'}
                      onChange={(e) => handleUpdateFaceColor(e.target.value)}
                      className="w-8 h-7 border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-[#141926] cursor-pointer"
                      title="Texture Tint Color"
                    />
                    <input
                      type="text"
                      value={getActiveFaceConfig(selectedComp).color || '#ffffff'}
                      onChange={(e) => handleUpdateFaceColor(e.target.value)}
                      className="flex-1 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono text-xs uppercase"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Matte Finish */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                    <span>Matte Roughness</span>
                    <span className="font-mono tabular-nums text-ry-gradient font-bold">
                      {Math.round((getActiveFaceConfig(selectedComp).roughness || 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={getActiveFaceConfig(selectedComp).roughness || 0.85}
                    onChange={(e) => handleUpdateFaceRoughness(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Apply to ALL Button */}
                <button
                  type="button"
                  onClick={() => handleApplyTextureToAll()}
                  className="w-full py-2 bg-ry-gradient text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer mt-2"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Apply This Texture to ALL Components</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Outliner */}
        {activeRightTab === 'outliner' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider px-2 py-1 mb-1">
              Hierarchy &amp; Visibility ({currentBuilding.components.length})
            </div>
            {currentBuilding.components.map((comp) => {
              const isSelected = comp.id === selectedCompId;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`flex items-center justify-between px-2.5 py-2 border transition-colors cursor-pointer ${
                    isSelected 
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-neutral-900 dark:text-white font-medium border-l-2 border-l-amber-500' 
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Box className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{comp.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComponentVisibility(comp.id);
                      }}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                      title={comp.visible !== false ? 'Hide Component' : 'Show Component'}
                    >
                      {comp.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateComponentById(comp.id);
                      }}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                      title="Duplicate in Outliner"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComponentById(comp.id);
                      }}
                      className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      title="Delete from Outliner"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: RTX Lighting */}
        {activeRightTab === 'lighting' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider mb-2">
              Real-Time Ray Traced Renderer
            </div>

            {/* Enable RTX Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Ray Tracing Pipeline</span>
              </div>
              <input
                type="checkbox"
                checked={rtxSettings.enabled}
                onChange={(e) => onUpdateRtxSettings({ ...rtxSettings, enabled: e.target.checked })}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Soft Shadow Radius */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Contact Penumbra Shadows</span>
                <span className="font-mono tabular-nums">{rtxSettings.shadowSoftness}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={rtxSettings.shadowSoftness}
                onChange={(e) =>
                  onUpdateRtxSettings({ ...rtxSettings, shadowSoftness: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Ambient Occlusion */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Paper Crease Ambient Occlusion</span>
                <span className="font-mono tabular-nums">{rtxSettings.aoIntensity}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={rtxSettings.aoIntensity}
                onChange={(e) =>
                  onUpdateRtxSettings({ ...rtxSettings, aoIntensity: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            {/* Camera Exposure */}
            <div>
              <div className="flex justify-between text-neutral-500 mb-1">
                <span>Exposure Calibration</span>
                <span className="font-mono tabular-nums">{rtxSettings.exposure.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={rtxSettings.exposure}
                onChange={(e) =>
                  onUpdateRtxSettings({ ...rtxSettings, exposure: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 space-y-1">
              <div className="font-semibold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider">PBR Architectural Shading:</div>
              <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                PBR papercraft material model with translucent fiber scatter, PCF soft penumbra shadows, and ACES Filmic tonemapping.
              </p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Save Building Dialog Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 w-full max-w-md relative text-neutral-800 dark:text-neutral-200 shadow-2xl transition-colors duration-150">
            {/* Top red-to-yellow accent bar */}
            <div className="h-1 bg-ry-gradient w-full" />

            <div className="p-6">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 bg-ry-gradient flex items-center justify-center text-white text-xs">
                  <Save className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                  Save Paper Architecture Project
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                Save this design to your local architectural catalog or create a new revision branch.
              </p>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">Building Name</label>
                  <input
                    type="text"
                    required
                    value={saveAsName}
                    onChange={(e) => setSaveAsName(e.target.value)}
                    placeholder="e.g. Origami Tower, Faceted Pavilion..."
                    className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-neutral-900 dark:text-neutral-100 font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">Category</label>
                  <select
                    value={saveAsCategory}
                    onChange={(e) => setSaveAsCategory(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Skyscraper">Skyscraper</option>
                    <option value="Residential">Residential</option>
                    <option value="Historic Old Town">Historic Old Town</option>
                    <option value="Origami Pavilion">Origami Pavilion</option>
                    <option value="Civic Institution">Civic Institution</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">Architectural Notes / Description</label>
                  <textarea
                    rows={2}
                    value={saveAsDesc}
                    onChange={(e) => setSaveAsDesc(e.target.value)}
                    placeholder="Notes about folding structure, paper materials, or engineering resilience..."
                    className="w-full bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Building Stats summary */}
                <div className="p-3 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <span className="text-neutral-500 block uppercase">Components</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-bold text-xs tabular-nums">{currentBuilding.components.length}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase">Height</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-bold text-xs tabular-nums">{currentBuilding.heightMeters} m</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block uppercase">Storage</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">Device Disk</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const fname = saveAsName.trim() || currentBuilding.name;
                      exportBuildingToDeviceFile({
                        ...currentBuilding,
                        name: fname,
                        category: saveAsCategory,
                        description: saveAsDesc.trim() || currentBuilding.description,
                      });
                      setSaveSuccessMessage(`Downloaded "${fname}.paper" to device!`);
                      setSaveSuccessNotice(true);
                      setTimeout(() => setSaveSuccessNotice(false), 3000);
                    }}
                    className="px-3 py-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    title="Save .paper project file directly to your computer or phone"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .paper File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdateCurrent}
                    className="px-4 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-750 text-neutral-900 dark:text-white text-xs font-semibold cursor-pointer"
                    title="Overwrite the currently open building"
                  >
                    Update Current
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    className="px-4 py-1.5 bg-ry-gradient text-white text-xs font-bold shadow-xs hover:brightness-105 cursor-pointer"
                    title="Create a new entry with this custom name in your catalog"
                  >
                    Save as New Building
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
