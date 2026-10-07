import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Box, 
  RotateCw, 
  Palette, 
  Sparkles, 
  Printer, 
  Keyboard, 
  ChevronRight, 
  Check, 
  Compass, 
  Layers,
  MousePointer
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape?: (shape: string) => void;
}

type TutorialTab = 
  | 'overview' 
  | 'shapes' 
  | 'rotation' 
  | 'bending' 
  | 'textures' 
  | 'lighting' 
  | 'exports' 
  | 'shortcuts';

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TutorialTab>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 w-full max-w-4xl max-h-[90vh] flex flex-col relative text-neutral-800 dark:text-neutral-200 shadow-2xl overflow-hidden">
        {/* Top Red-to-Yellow Accent Bar */}
        <div className="h-1.5 bg-ry-gradient w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-[#141926]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ry-gradient flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ry-gradient uppercase tracking-tight">
                  Papercraft Studio CAD 3D
                </h2>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  Feature Guide &amp; Tutorial
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Master 3D papercraft modeling, precision geometry bending, 3-axis rotation, procedural textures, and DIY unfolding.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Tab Navigator & Right Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Vertical Tab Menu */}
          <nav className="w-full md:w-56 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#111622]/80 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>1. Quick Start &amp; Orbit</span>
            </button>

            <button
              onClick={() => setActiveTab('shapes')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'shapes'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Box className="w-4 h-4 text-amber-500" />
              <span>2. Basic &amp; Advanced Shapes</span>
            </button>

            <button
              onClick={() => setActiveTab('rotation')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'rotation'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <RotateCw className="w-4 h-4 text-amber-500" />
              <span>3. 3-Axis Rotation</span>
            </button>

            <button
              onClick={() => setActiveTab('bending')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'bending'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="text-amber-500 font-mono font-bold text-sm">〰️</span>
              <span>4. Geometry Bending</span>
            </button>

            <button
              onClick={() => setActiveTab('textures')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'textures'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4 text-amber-500" />
              <span>5. Textures &amp; Finishes</span>
            </button>

            <button
              onClick={() => setActiveTab('lighting')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'lighting'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>6. Lighting &amp; RTX</span>
            </button>

            <button
              onClick={() => setActiveTab('exports')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'exports'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span>7. Printable DIY Nets</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-left font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'shortcuts'
                  ? 'bg-white dark:bg-[#0e121b] text-neutral-900 dark:text-white border-l-2 border-l-amber-500 font-bold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4 text-amber-500" />
              <span>8. Hotkey Cheat Sheet</span>
            </button>
          </nav>

          {/* Right Detailed Tab Content Area */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-none">
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Welcome to Papercraft Studio CAD 3D
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    A professional, browser-native 3D architectural modeling studio designed specifically for procedural papercraft, origami architecture, and physical DIY fabrication. Build towers, pavilions, bridges, or custom organic folded geometries, apply real paper materials, bend and rotate in 3D, and generate printable cutting nets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <MousePointer className="w-3.5 h-3.5 text-amber-500" />
                      <span>3D Mouse Navigation</span>
                    </div>
                    <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• <strong>Left-Click Drag:</strong> Orbit the camera smoothly in 360° around the model center.</li>
                      <li>• <strong>Right-Click or Shift + Drag:</strong> Pan the camera position laterally.</li>
                      <li>• <strong>Scroll Wheel:</strong> Zoom in and out with precision damping.</li>
                      <li>• <strong>Left-Click on Object:</strong> Selects block for live transform, rotation &amp; bending.</li>
                    </ul>
                  </div>

                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>Preset Camera Views</span>
                    </div>
                    <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
                      <li>• <strong>ISO:</strong> Standard 45° isometric axonometric view.</li>
                      <li>• <strong>TOP:</strong> Direct top-down architectural site plan view.</li>
                      <li>• <strong>FRONT:</strong> True orthographic front facade elevation.</li>
                      <li>• <strong>SIDE:</strong> Cross-section lateral elevation view.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-2 text-xs uppercase tracking-wide">
                    4-Step Workflow
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-neutral-50 dark:bg-[#141926] border border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="font-bold text-ry-gradient font-mono">01. Add</span>
                      <p className="text-[11px] text-neutral-500 mt-1">Pick a modular shape from the left palette (Cylinder, Wedge, Torus, Sheet, etc.).</p>
                    </div>
                    <div className="p-2 bg-neutral-50 dark:bg-[#141926] border border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="font-bold text-ry-gradient font-mono">02. Deform</span>
                      <p className="text-[11px] text-neutral-500 mt-1">Rotate on X/Y/Z, scale dimensions, and apply organic cylindrical bending.</p>
                    </div>
                    <div className="p-2 bg-neutral-50 dark:bg-[#141926] border border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="font-bold text-ry-gradient font-mono">03. Finish</span>
                      <p className="text-[11px] text-neutral-500 mt-1">Select architectural cardstocks, procedural textures, or upload custom imagery.</p>
                    </div>
                    <div className="p-2 bg-neutral-50 dark:bg-[#141926] border border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="font-bold text-ry-gradient font-mono">04. Fabricate</span>
                      <p className="text-[11px] text-neutral-500 mt-1">Export 1-click printable cut/fold PDF vector nets, OBJ, or 3D STL files.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHAPES & GEOMETRIES */}
            {activeTab === 'shapes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Available Geometries &amp; Primitives
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    The Left Sidebar provides a library of modular, cleanly tessellated papercraft shapes designed for architectural stability, aesthetic balance, and smooth bending:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Paper Box Core &amp; Sheets</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Square sheets, rectangular paper sheets, and volumetric cardstock prisms with high internal resolution for clean bending.</p>
                  </div>

                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Folded &amp; 90° Corner Walls</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Self-standing L-profile corner folds and folded architectural wall partitions with realistic paper thickness.</p>
                  </div>

                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Triangular Prisms &amp; Wedges</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Equilateral columns, 45° ramps/wedges, flat triangular origami facets, and gable pitched roofs.</p>
                  </div>

                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Polygonal &amp; Vault Columns</span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Hexagonal &amp; octagonal pillars, rolled cylindrical tubes, barrel vault arches, and pyramid spires.</p>
                  </div>

                  <div className="p-2.5 border border-amber-500/30 bg-amber-500/5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 font-bold text-ry-gradient uppercase text-[11px]">
                      <span>★ Curvature Geometries: Sphere, Torus &amp; Hyperboloid</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div>
                        <strong>Paper Sphere:</strong> 3D geodesic dome / orb geometry with latitude-longitude tessellation.
                      </div>
                      <div>
                        <strong>Paper Torus:</strong> Architectural circular doughnut ring with adjustable major &amp; minor radii.
                      </div>
                      <div>
                        <strong>Paper Hyperboloid:</strong> Waisted hour-glass cooling-tower hyperbolic revolution curve.
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 border border-amber-500/30 bg-amber-500/5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 font-bold text-ry-gradient uppercase text-[11px]">
                      <span>★ Architectural Slabs &amp; Podium Plates (Floor &amp; Ceiling Decks)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 mb-2">
                      Planar structural plates with slim vertical profiles designed for cantilevered balconies, foundation podiums, floor slabs, and terrace decks:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Square Slab:</strong> 4-sided square plinth platform / floor plate.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Circle Slab:</strong> Circular disc patio / rotunda deck.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Triangle Slab:</strong> 3-sided cantilevered triangular plate.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Pentagon Slab:</strong> 5-sided regular pentagon floor slab.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Hexagon Slab:</strong> 6-sided honeycomb terrace slab.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Octagon Slab:</strong> 8-sided gazebo podium slab.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Semicircle Slab:</strong> Half-circle / D-shaped balcony deck.
                      </div>
                      <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                        <strong>Trapezoid Slab:</strong> Tapered cantilever floor slab.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 3-AXIS ROTATION */}
            {activeTab === 'rotation' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Complete 3-Axis Rotation (X · Y · Z)
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Every modular paper block can be oriented with full 3-axis degrees of freedom in 3D space:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-bold text-amber-500 uppercase font-mono text-xs">X-Axis (Pitch / Tilt)</span>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Tilts the component forward or backward. Ideal for sloped roofs, awnings, ramped buttresses, and diagonal struts.
                    </p>
                    <div className="mt-2 text-[10px] text-neutral-400 font-mono">Range: -180° to +180°</div>
                  </div>

                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-bold text-amber-500 uppercase font-mono text-xs">Y-Axis (Yaw / Turn)</span>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Rotates the component horizontally around its vertical axis. Ideal for angling facade panels and corner folds.
                    </p>
                    <div className="mt-2 text-[10px] text-neutral-400 font-mono">Range: 0° to 360°</div>
                  </div>

                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-bold text-amber-500 uppercase font-mono text-xs">Z-Axis (Roll / Bank)</span>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Banks the component sideways (left-to-right). Ideal for cantilevers, asymmetric folds, and dynamic sculpture.
                    </p>
                    <div className="mt-2 text-[10px] text-neutral-400 font-mono">Range: -180° to +180°</div>
                  </div>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                    Quick Preset Buttons &amp; Reset
                  </span>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    Use the preset buttons in the Transform inspector to snap immediately to <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono">-90°</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono">-45°</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono">0°</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono">+45°</code>, or <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono">+90°</code>. Press &ldquo;Reset (0°)&rdquo; to return all axes to zero.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: GEOMETRY BENDING */}
            {activeTab === 'bending' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Geometry Bending &amp; Curvature Modifier
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Bend and deform any 3D paper geometry into continuous organic arcs, cylinders, bows, or rolls:
                  </p>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-[#141926]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="font-semibold text-amber-500 uppercase font-mono text-[11px]">X · Horizontal Arc</span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Curves width along X into a horizontal circular cylinder or curved facade wall (X-Z plane).
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-500 uppercase font-mono text-[11px]">Y · Vertical Arch / Bow</span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Curves height along Y into a parabolic bridge arch or vaulted bow (Y-Z plane).
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-amber-500 uppercase font-mono text-[11px]">Z · Depth Curl</span>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Curves depth along Z into a scroll roll or longitudinal wave (Z-X plane).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                    How to Control Bending
                  </span>
                  <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5">
                    <li>• <strong>Inspector Slider:</strong> Drag the curvature slider from <code>-180°</code> to <code>+180°</code> in the Right Inspector Transform tab.</li>
                    <li>• <strong>Preset Angles:</strong> Click <code>±45°</code>, <code>±90°</code> (quarter-pipe/arch), or <code>±180°</code> (full semicircle).</li>
                    <li>• <strong>On-Screen Viewport HUD:</strong> Click <code>⤹ -15°</code> and <code>+15° ⤸</code> directly at the top right of the 3D viewport.</li>
                    <li>• <strong>Keyboard Shortcuts:</strong> Press <code>[</code> to bend -15°, <code>]</code> to bend +15°, and <code>B</code> to cycle bend axis (X → Y → Z).</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: TEXTURES & FINISHES */}
            {activeTab === 'textures' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Per-Face Texturing &amp; Architectural Finishes
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Apply realistic architectural materials uniformly across the entire model or customize every individual face independently:
                  </p>
                </div>

                {/* Per-Face Mapping Feature Callout */}
                <div className="p-3 border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase font-mono">
                      ★ Per-Face Texture Mapping (Front, Back, Sides, Top, Bottom)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-2">
                    Every 3D geometry supports individual surface face texturing! You can map curtain-wall glass windows to the front facade, brick masonry to the sides, concrete to the base, and gravel/tiles to the roof deck.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                    <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                      <strong>Front (+Z)</strong>: Camera facade
                    </div>
                    <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                      <strong>Back (-Z)</strong>: Rear facade
                    </div>
                    <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                      <strong>Left/Right</strong>: Side walls
                    </div>
                    <div className="p-1.5 bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800">
                      <strong>Top (+Y)</strong>: Roof terrace
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-white">Procedural Architectural Library</span>
                    <ul className="text-[11px] text-neutral-500 mt-1 space-y-0.5">
                      <li>• Glazed Curtain Wall Glass Windows</li>
                      <li>• Traditional Brick Masonry &amp; Cast Concrete</li>
                      <li>• Graph Paper &amp; Cyan Grid Blueprint</li>
                      <li>• Wood Slats &amp; Travertine Stone Panels</li>
                    </ul>
                  </div>

                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-neutral-900 dark:text-white">Custom Texture Upload &amp; 3D Picking</span>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Upload any PNG, JPEG, or SVG file directly for the active face or entire component. You can also <strong>click directly on any face in the 3D viewport</strong> to instantly select that face for texturing!
                    </p>
                  </div>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                    Fine-Tuning Controls
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Adjust UV Tile Repeat sliders (1x1 to 8x8) to scale windows or bricks independently per face, pick custom cardstock color tints, adjust matte/sheen roughness, or use &ldquo;Copy to All Faces&rdquo; to replicate a face texture across all sides.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: LIGHTING & RTX */}
            {activeTab === 'lighting' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Lighting Studio &amp; Real-Time RTX
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Toggle RTX lighting in the top header for physically based soft shadows, translucency, and tone mapping:
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-amber-500 block text-[11px]">Sunset Light</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Warm golden hour directional sun with elongated ambient shadows.</p>
                  </div>
                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-amber-500 block text-[11px]">Studio Softbox</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Clean high-key photography studio lighting with three-point illumination.</p>
                  </div>
                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-amber-500 block text-[11px]">Overcast Nordic</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Diffuse daylight with neutral color temperature and gentle ambient occlusion.</p>
                  </div>
                  <div className="p-2.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-semibold text-amber-500 block text-[11px]">Night Skyline</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Dramatic nocturnal skyline with cool moonlight and glowing interior point lights.</p>
                  </div>
                </div>

                <div className="p-3 border border-neutral-200 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                    Subsurface Scattering &amp; Bloom
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    Paper is naturally translucent. The lighting engine calculates light penetration through thin cardstock folds, producing genuine papercraft realism.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 7: EXPORTS & DIY NETS */}
            {activeTab === 'exports' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Printable DIY Vector Nets &amp; 3D Export
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Export your models for real-world paper cutting, origami crafting, 3D printing, or digital CAD:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 border border-amber-500/30 bg-amber-500/5">
                    <span className="font-bold text-ry-gradient uppercase text-xs block mb-1">
                      ✂️ DIY Printable Papercraft Net (SVG / PDF)
                    </span>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                      Unfolds your 3D structure into flat printable 2D sheets:
                    </p>
                    <ul className="text-[11px] text-neutral-500 mt-1 space-y-0.5">
                      <li>• <strong>Solid Black Lines:</strong> Cut edges (Scissors or Cricut ✂️)</li>
                      <li>• <strong>Dashed Gray Lines:</strong> Score &amp; Fold lines (Mountain / Valley)</li>
                      <li>• <strong>Hatched Glue Tabs:</strong> Chamfered tabs for adhesive</li>
                    </ul>
                  </div>

                  <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#141926]/50">
                    <span className="font-bold text-neutral-900 dark:text-white uppercase text-xs block mb-1">
                      📦 Industry Standard 3D File Formats
                    </span>
                    <ul className="text-[11px] text-neutral-500 space-y-1">
                      <li>• <strong>Wavefront .OBJ + .MTL:</strong> Compatible with Blender, Rhino, AutoCAD, and Maya.</li>
                      <li>• <strong>GLTF 2.0 (.gltf):</strong> WebGL &amp; AR ready format.</li>
                      <li>• <strong>STL (.stl):</strong> Direct export for 3D slicing &amp; resin/FDM 3D printers.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: KEYBOARD SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ry-gradient uppercase tracking-wide mb-1">
                    Keyboard Shortcuts Cheat Sheet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Work at full speed with Blender-grade hotkeys:
                  </p>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold">
                        <th className="p-2">Action</th>
                        <th className="p-2">Shortcut</th>
                        <th className="p-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                      <tr>
                        <td className="p-2 font-sans font-medium">Camera Pan</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">W / A / S / D</kbd> or <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Arrows</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Pan camera viewport in 3D scene</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Camera Orbit</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Q</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">E</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Orbit view left or right</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Camera Zoom</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">+</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">-</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Zoom camera in or out</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Reset View</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">R</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Center view on current building</td>
                      </tr>
                      <tr className="bg-amber-500/5">
                        <td className="p-2 font-sans font-bold text-amber-600 dark:text-amber-400">Bend Curvature</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border font-bold">[</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border font-bold">]</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Bend selected component by -15° or +15°</td>
                      </tr>
                      <tr className="bg-amber-500/5">
                        <td className="p-2 font-sans font-bold text-amber-600 dark:text-amber-400">Cycle Bend Axis</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border font-bold">B</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Toggle bend axis between X (Horizontal), Y (Arch), and Z (Curl)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Nudge Component</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Shift + Arrows</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">WASD</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Nudge selected object along X, Y, or Z axis</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Select / Orbit / Pan Mode</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">1</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">2</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">3</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Quickly toggle active mouse tool</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Fit to Screen</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">F</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Fit entire building inside viewport</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Undo / Redo</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Ctrl+Z</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Ctrl+Y</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Full undo / redo history stack</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Deselect / Delete</td>
                        <td className="p-2"><kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Esc</kbd> / <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 border">Delete</kbd></td>
                        <td className="p-2 font-sans text-neutral-500">Clear selection or remove active block</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-[#141926]/60 text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Interactive Studio Ready</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const tabs: TutorialTab[] = ['overview', 'shapes', 'rotation', 'bending', 'textures', 'lighting', 'exports', 'shortcuts'];
                const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
                setActiveTab(tabs[nextIdx]);
              }}
              className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#0e121b] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next Topic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-ry-gradient text-white font-semibold shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Start Modeling</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
