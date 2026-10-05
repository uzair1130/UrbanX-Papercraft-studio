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
  Triangle
} from 'lucide-react';

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
    shape === 'balcony_tab'
  ) {
    return [
      { key: 'all', label: 'All Faces', tag: 'ALL', desc: 'Uniform texture on all 6 faces' },
      { key: 'front', label: 'Front (+Z)', tag: '+Z', desc: 'Front facade facing camera' },
      { key: 'back', label: 'Back (-Z)', tag: '-Z', desc: 'Rear facade surface' },
      { key: 'left', label: 'Left (-X)', tag: '-X', desc: 'Left lateral wall' },
      { key: 'right', label: 'Right (+X)', tag: '+X', desc: 'Right lateral wall' },
      { key: 'top', label: 'Top / Roof (+Y)', tag: '+Y', desc: 'Top horizontal roof deck' },
      { key: 'bottom', label: 'Bottom (-Y)', tag: '-Y', desc: 'Bottom foundation / base' },
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

  // Save Modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState(currentBuilding.name);
  const [saveAsCategory, setSaveAsCategory] = useState<BuildingModel['category']>(currentBuilding.category);
  const [saveAsDesc, setSaveAsDesc] = useState(currentBuilding.description || '');

  // Undo / Redo History Stack
  const historyRef = useRef<PaperComponent[][]>([JSON.parse(JSON.stringify(currentBuilding.components))]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Reset history stack whenever a different building is opened
  const lastBuildingIdRef = useRef(currentBuilding.id);
  useEffect(() => {
    if (currentBuilding.id !== lastBuildingIdRef.current) {
      lastBuildingIdRef.current = currentBuilding.id;
      historyRef.current = [JSON.parse(JSON.stringify(currentBuilding.components))];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [currentBuilding.id]);

  // Push state snapshot to history
  const pushHistory = (newComponents: PaperComponent[]) => {
    const snapshot: PaperComponent[] = JSON.parse(JSON.stringify(newComponents));
    const branch = historyRef.current.slice(0, historyIndexRef.current + 1);
    branch.push(snapshot);
    if (branch.length > 50) {
      branch.shift();
    }
    historyRef.current = branch;
    historyIndexRef.current = branch.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevComponents: PaperComponent[] = JSON.parse(
        JSON.stringify(historyRef.current[historyIndexRef.current])
      );
      const maxHeight = Math.max(...prevComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;
      onUpdateBuilding({
        ...currentBuilding,
        components: prevComponents,
        heightMeters: Math.round(maxHeight),
      });

      if (selectedCompId && !prevComponents.some((c) => c.id === selectedCompId)) {
        setSelectedCompId(prevComponents[0]?.id || null);
      }

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextComponents: PaperComponent[] = JSON.parse(
        JSON.stringify(historyRef.current[historyIndexRef.current])
      );
      const maxHeight = Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;
      onUpdateBuilding({
        ...currentBuilding,
        components: nextComponents,
        heightMeters: Math.round(maxHeight),
      });

      if (selectedCompId && !nextComponents.some((c) => c.id === selectedCompId)) {
        setSelectedCompId(nextComponents[0]?.id || null);
      }

      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

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

  // Handle Mouse Click Raycasting for Component Selection
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
      const hitMesh = intersects[0].object as THREE.Mesh;
      const compId = hitMesh.userData.componentId;
      if (compId) {
        setSelectedCompId(compId);
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

  const handleResetCamera = () => {
    const midHeight = (currentBuilding.heightMeters / 4) * 0.5;
    cameraTargetRef.current.set(0, Math.max(2, midHeight), 0);
    cameraRadiusRef.current = 18;
    cameraThetaRef.current = Math.PI / 4;
    cameraPhiRef.current = Math.PI / 3;
    updateCameraPosition();
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

  // Add Component to current building
  const handleAddComponent = (shape: ComponentShape) => {
    const existingCount = currentBuilding.components.length;
    let newY = 1.0;
    if (existingCount > 0) {
      const topComp = currentBuilding.components.reduce((prev, curr) =>
        curr.position[1] + curr.scale[1] / 2 > prev.position[1] + prev.scale[1] / 2 ? curr : prev
      );
      newY = topComp.position[1] + topComp.scale[1] / 2 + 1.2;
    }

    const newId = `comp_${Date.now()}`;
    const newComponent: PaperComponent = {
      id: newId,
      name: `${shape.replace(/_/g, ' ')} #${existingCount + 1}`,
      shape: shape,
      position: [0, newY, 0],
      rotation: [0, 0, 0],
      scale: [2.5, 2.0, 2.5],
      materialConfig: PRESET_MATERIALS[existingCount % PRESET_MATERIALS.length],
      thickness: 1.0,
      bendAngle: 0,
      bendAxis: 'x',
      visible: true,
    };

    const nextComps = [...currentBuilding.components, newComponent];
    const maxHeight = Math.max(...nextComps.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    pushHistory(nextComps);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComps,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(newId);
  };

  // Update selected component
  const updateSelectedComp = (updater: (comp: PaperComponent) => PaperComponent) => {
    if (!selectedCompId) return;
    const nextComponents = currentBuilding.components.map((c) => (c.id === selectedCompId ? updater(c) : c));
    const maxHeight = Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4;

    pushHistory(nextComponents);
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

    pushHistory(nextComps);
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
    const nextComponents = currentBuilding.components.filter((c) => c.id !== selectedCompId);
    const maxHeight = nextComponents.length > 0 
      ? Math.max(...nextComponents.map((c) => c.position[1] + c.scale[1] / 2), 2) * 4
      : 0;

    pushHistory(nextComponents);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
      heightMeters: Math.round(maxHeight),
    });
    setSelectedCompId(nextComponents[0]?.id || null);
  };

  // Quick nudge selected component position by delta
  const handleNudgeSelectedComp = (dx: number, dy: number, dz: number) => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => ({
      ...c,
      position: [
        Math.round((c.position[0] + dx) * 10) / 10,
        Math.max(0, Math.round((c.position[1] + dy) * 10) / 10),
        Math.round((c.position[2] + dz) * 10) / 10,
      ],
    }));
  };

  // Rotate selected component on X, Y, or Z axis
  const handleRotateAxis = (axis: 'x' | 'y' | 'z', dAngle: number) => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => {
      const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      const rot = [...c.rotation] as [number, number, number];
      rot[idx] = (rot[idx] + dAngle) % (Math.PI * 2);
      return {
        ...c,
        rotation: rot,
      };
    });
  };

  const handleSetRotationDegrees = (axis: 'x' | 'y' | 'z', degrees: number) => {
    if (!selectedCompId) return;
    const rad = (degrees * Math.PI) / 180;
    updateSelectedComp((c) => {
      const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      const rot = [...c.rotation] as [number, number, number];
      rot[idx] = rad;
      return {
        ...c,
        rotation: rot,
      };
    });
  };

  const handleResetRotation = () => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => ({
      ...c,
      rotation: [0, 0, 0],
    }));
  };

  // Geometry Bending & Curvature handlers
  const handleSetBendAngle = (degrees: number) => {
    if (!selectedCompId) return;
    const clamped = Math.max(-180, Math.min(180, Math.round(degrees)));
    updateSelectedComp((c) => ({
      ...c,
      bendAngle: clamped,
    }));
  };

  const handleNudgeBend = (deltaDeg: number) => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => {
      const curr = c.bendAngle || 0;
      const next = Math.max(-180, Math.min(180, Math.round(curr + deltaDeg)));
      return {
        ...c,
        bendAngle: next,
      };
    });
  };

  const handleSetBendAxis = (axis: 'x' | 'y' | 'z') => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => ({
      ...c,
      bendAxis: axis,
    }));
  };

  const handleToggleBendAxis = () => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => {
      const curr = c.bendAxis || 'x';
      const nextAxis: 'x' | 'y' | 'z' = curr === 'x' ? 'y' : curr === 'y' ? 'z' : 'x';
      return {
        ...c,
        bendAxis: nextAxis,
      };
    });
  };

  const handleResetBend = () => {
    if (!selectedCompId) return;
    updateSelectedComp((c) => ({
      ...c,
      bendAngle: 0,
    }));
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

  // Upload custom paper/material texture map
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
        pushHistory(nextComps);
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

      updateSelectedComp((c) => ({
        ...c,
        materialConfig: {
          ...c.materialConfig,
          textureUrl: url,
          repeat: c.materialConfig.repeat || [1, 1],
        },
      }));
      setSaveSuccessMessage('Applied custom texture image!');
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clear / remove texture map
  const handleRemoveTexture = () => {
    updateSelectedComp((c) => ({
      ...c,
      materialConfig: {
        ...c.materialConfig,
        textureUrl: '',
      },
    }));
    setSaveSuccessMessage('Removed texture (clean paper)!');
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Apply a preset texture to selected component (or first component if none selected, or create block if blank)
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
      pushHistory(nextComps);
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
        return {
          ...c,
          materialConfig: {
            ...c.materialConfig,
            textureUrl: url,
            repeat: preset.defaultRepeat,
            roughness: preset.defaultRoughness,
          },
        };
      }
      return c;
    });

    pushHistory(nextComponents);
    onUpdateBuilding({
      ...currentBuilding,
      components: nextComponents,
    });
    setSaveSuccessMessage(`Applied "${preset.name}" texture!`);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  // Apply current or specific texture to ALL components in building
  const handleApplyTextureToAll = (textureUrl?: string, repeat?: [number, number], roughness?: number) => {
    if (currentBuilding.components.length === 0) return;
    const targetUrl = textureUrl !== undefined 
      ? textureUrl 
      : (selectedComp?.materialConfig.textureUrl || '');
    const targetRepeat = repeat || selectedComp?.materialConfig.repeat || [1, 1];
    const targetRoughness = roughness !== undefined ? roughness : (selectedComp?.materialConfig.roughness || 0.85);

    const nextComponents = currentBuilding.components.map((c) => ({
      ...c,
      materialConfig: {
        ...c.materialConfig,
        textureUrl: targetUrl,
        repeat: targetRepeat,
        roughness: targetRoughness,
      },
    }));

    pushHistory(nextComponents);
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
          </>
          )}
        </div>

        {/* Building Stats Summary */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e121b] text-xs">
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-ry-gradient">Height:</span>
            <span className="text-ry-gradient font-mono font-bold tabular-nums">{currentBuilding.heightMeters} m</span>
          </div>
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="font-semibold text-ry-gradient">Components:</span>
            <span className="text-ry-gradient font-mono font-bold tabular-nums">{currentBuilding.components.length}</span>
          </div>
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-ry-gradient">Resilience:</span>
            <span className="text-ry-gradient font-mono font-bold tabular-nums">{currentBuilding.resilienceScore}%</span>
          </div>
        </div>
      </div>

      {/* 2. Central 3D Viewport Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Viewport Top Bar - Clean White with Minimal Controls */}
        <div className="h-11 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between text-xs z-10 gap-2">
          {/* Left: Project Switcher, New Button, Editable Title & Category */}
          <div className="flex items-center gap-2 min-w-0">
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

            {/* Undo / Redo */}
            <div className="flex items-center bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] border-r border-neutral-200 dark:border-neutral-800 transition-colors ${
                  canUndo
                    ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                  canRedo
                    ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3 h-3" />
              </button>
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
            <div className="absolute top-3 right-3 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-[11px] flex items-center gap-2 z-20 shadow-md">
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
          <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-xs border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 pointer-events-none flex items-center gap-2 z-20 shadow-xs">
            <span className="text-ry-gradient font-bold flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-amber-500" />
              <span>Select Mode</span>
            </span>
            <span>·</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">Drag: Orbit</span>
            <span>·</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">Shift/Right-Drag: Pan</span>
            <span>·</span>
            <span className="text-ry-gradient font-bold">WASD / Arrows: Move View</span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">[ / ] Bend Curvature · B Axis</span>
            <span>·</span>
            <span>Wheel: Zoom</span>
            {hoveredCompName && (
              <>
                <span>·</span>
                <span className="text-neutral-900 dark:text-white font-medium bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700">
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
              onClick={handleResetCamera}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Reset & Center View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
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
                        updateSelectedComp((c) => ({ ...c, name: val }));
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
                          }));
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
                          }));
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
                          }));
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
                          }));
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
                          }));
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
                          }));
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
                        }));
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
                        }));
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
                        }));
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
                            }))}
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
                        }))}
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
                        }))}
                        className="flex-1 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono text-xs uppercase"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Custom Texture Mapping & Upload */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-ry-gradient font-bold uppercase tracking-wider">Texture Mapping &amp; Upload</label>
                      {selectedComp.materialConfig.textureUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveTexture}
                          className="text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {selectedComp.materialConfig.textureUrl ? (
                      <div className="p-2 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141926] space-y-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={selectedComp.materialConfig.textureUrl}
                            alt="Custom texture preview"
                            className="w-10 h-10 object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-white block truncate">
                              Texture Active
                            </span>
                            <label className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline-block">
                              Replace Image...
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleTextureUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* UV Tile Repeat */}
                        <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                            <span>Tile Repeat (X / Y)</span>
                            <span className="font-mono tabular-nums">
                              {selectedComp.materialConfig.repeat?.[0] || 1}x · {selectedComp.materialConfig.repeat?.[1] || 1}y
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="1"
                              value={selectedComp.materialConfig.repeat?.[0] || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateSelectedComp((c) => ({
                                  ...c,
                                  materialConfig: {
                                    ...c.materialConfig,
                                    repeat: [val, c.materialConfig.repeat?.[1] || 1],
                                  },
                                }));
                              }}
                              className="accent-amber-500"
                              title="Repeat X"
                            />
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="1"
                              value={selectedComp.materialConfig.repeat?.[1] || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateSelectedComp((c) => ({
                                  ...c,
                                  materialConfig: {
                                    ...c.materialConfig,
                                    repeat: [c.materialConfig.repeat?.[0] || 1, val],
                                  },
                                }));
                              }}
                              className="accent-amber-500"
                              title="Repeat Y"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500 bg-neutral-50 dark:bg-[#141926] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-xs">
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                        <span>+ Add / Upload Texture Image</span>
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
                        }));
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
                        updateSelectedComp((c) => ({ ...c, thickness: val }));
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
              {selectedComp?.materialConfig.textureUrl && (
                <button
                  type="button"
                  onClick={handleRemoveTexture}
                  className="px-2 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Clear Texture
                </button>
              )}
            </div>

            {/* Custom Image Upload Option */}
            <div className="p-3 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/70 dark:bg-[#141926]/70 hover:border-amber-500 transition-colors">
              <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Upload className="w-3 h-3 text-amber-500" />
                <span>Upload Custom Image / Pattern</span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
                Add any image from your computer to wrap directly around your paper models.
              </p>
              
              {selectedComp?.materialConfig.textureUrl ? (
                <div className="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e121b]">
                  <img
                    src={selectedComp.materialConfig.textureUrl}
                    alt="Active texture"
                    className="w-10 h-10 object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-ry-gradient block truncate">
                      Texture Active
                    </span>
                    <label className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline-block">
                      Replace Image File...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTextureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer text-xs font-semibold shadow-xs">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Choose Image File (PNG, JPG, WEBP)...</span>
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
                  const isActive = selectedComp?.materialConfig.textureUrl === url;
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

            {/* Texture Mapping Controls (UV Repeat, Tint, Finish) */}
            {selectedComp && (
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="text-[10px] font-bold text-ry-gradient uppercase tracking-wider">
                  Mapping &amp; Finish Controls
                </div>

                {/* UV Repeat */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                    <span>Tile Density (Repeat X / Y)</span>
                    <span className="font-mono tabular-nums text-ry-gradient font-bold">
                      {selectedComp.materialConfig.repeat?.[0] || 1}x · {selectedComp.materialConfig.repeat?.[1] || 1}y
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={selectedComp.materialConfig.repeat?.[0] || 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateSelectedComp((c) => ({
                          ...c,
                          materialConfig: {
                            ...c.materialConfig,
                            repeat: [val, c.materialConfig.repeat?.[1] || 1],
                          },
                        }));
                      }}
                      className="accent-amber-500"
                      title="Repeat X"
                    />
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={selectedComp.materialConfig.repeat?.[1] || 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateSelectedComp((c) => ({
                          ...c,
                          materialConfig: {
                            ...c.materialConfig,
                            repeat: [c.materialConfig.repeat?.[0] || 1, val],
                          },
                        }));
                      }}
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
                      value={selectedComp.materialConfig.color || '#ffffff'}
                      onChange={(e) => updateSelectedComp((c) => ({
                        ...c,
                        materialConfig: {
                          ...c.materialConfig,
                          color: e.target.value,
                        },
                      }))}
                      className="w-8 h-7 border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-[#141926] cursor-pointer"
                      title="Texture Tint Color"
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
                      }))}
                      className="flex-1 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100 font-mono text-xs uppercase"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Matte Finish */}
                <div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
                    <span>Matte Roughness</span>
                    <span className="font-mono tabular-nums text-ry-gradient font-bold">{Math.round((selectedComp.materialConfig.roughness || 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
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
                      }));
                    }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSelectedComp((c) => ({ ...c, visible: c.visible === false ? true : false }));
                      }}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                    >
                      {comp.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-500" />}
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
                    <span className="text-neutral-500 block uppercase">Resilience</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs tabular-nums">{currentBuilding.resilienceScore}%</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSaveModalOpen(false)}
                    className="px-4 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
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
