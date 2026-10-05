import React, { useState } from 'react';
import { BuildingModel } from '../../types';
import { 
  exportToOBJ, 
  exportToGLTF, 
  exportToSTL, 
  generatePapercraftPrintableSVG, 
  triggerFileDownload 
} from '../../utils/exporters';
import { X, Download, FileCode, Printer, Box, Check } from 'lucide-react';

interface ExportModalProps {
  building: BuildingModel;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const ExportModal: React.FC<ExportModalProps> = ({ building, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExportOBJ = () => {
    const { objContent, mtlContent } = exportToOBJ(building);
    const safeName = building.name.toLowerCase().replace(/\s+/g, '_');
    triggerFileDownload(objContent, `${safeName}.obj`, 'text/plain');
    triggerFileDownload(mtlContent, `${safeName}.mtl`, 'text/plain');
    flashNotice('Wavefront OBJ & MTL packages downloaded!');
  };

  const handleExportGLTF = () => {
    const gltfContent = exportToGLTF(building);
    const safeName = building.name.toLowerCase().replace(/\s+/g, '_');
    triggerFileDownload(gltfContent, `${safeName}.gltf`, 'application/json');
    flashNotice('GLTF 2.0 format downloaded!');
  };

  const handleExportSTL = () => {
    const stlContent = exportToSTL(building);
    const safeName = building.name.toLowerCase().replace(/\s+/g, '_');
    triggerFileDownload(stlContent, `${safeName}.stl`, 'text/plain');
    flashNotice('STL 3D-printable model downloaded!');
  };

  const handleExportPapercraftSVG = () => {
    const svgContent = generatePapercraftPrintableSVG(building);
    const safeName = building.name.toLowerCase().replace(/\s+/g, '_');
    triggerFileDownload(svgContent, `${safeName}_papercraft_net.svg`, 'image/svg+xml');
    flashNotice('DIY Papercraft Cut & Fold Net (SVG) downloaded!');
  };

  const flashNotice = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0e121b] border border-neutral-200 dark:border-neutral-800 w-full max-w-xl relative text-neutral-800 dark:text-neutral-200 shadow-2xl transition-colors duration-150">
        {/* Red-to-Yellow Accent Bar */}
        <div className="h-1 bg-ry-gradient w-full" />

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-ry-gradient flex items-center justify-center text-white text-xs">
              <Download className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
              Export Architectural CAD: {building.name}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
            Generate production-grade 3D assets for Blender, Unreal, 3D printing slicers, or download the printable 2D cut and fold net for cardstock craft.
          </p>

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4 font-medium">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          <div className="space-y-2.5">
            {/* 1. OBJ + MTL */}
            <div className="p-3.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mt-0.5">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-2">
                    <span>Wavefront .OBJ + .MTL</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      · Universal Mesh
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Full geometry, vertex normals, UV texture coordinates, and material definition for Blender, Maya, Rhino.
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportOBJ}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Export OBJ
              </button>
            </div>

            {/* 2. GLTF 2.0 */}
            <div className="p-3.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mt-0.5">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-2">
                    <span>GLTF 2.0 (.gltf)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      · Realtime PBR
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Khronos PBR standard format for Three.js, web viewer embed, Unreal Engine 5, and Godot.
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportGLTF}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Export GLTF
              </button>
            </div>

            {/* 3. STL */}
            <div className="p-3.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mt-0.5">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-2">
                    <span>Stereolithography .STL</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      · 3D Slicer
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Solid manifold triangulation ready for Bambu Studio, PrusaSlicer, and Cura for 3D printed miniatures.
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportSTL}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Export STL
              </button>
            </div>

            {/* 4. DIY Printable Papercraft Net (SVG Sheet) */}
            <div className="p-3.5 bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 mt-0.5">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-2">
                    <span>DIY Papercraft Net (SVG Sheet)</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                      · Print &amp; Fold
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    2D architectural unfold template with solid cut lines, dashed fold creases, and glue tabs for cardstock.
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportPapercraftSVG}
                className="px-3.5 py-1.5 bg-ry-gradient text-white text-xs font-semibold shrink-0 shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                Print Net (SVG)
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
