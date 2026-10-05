import * as THREE from 'three';
import { ComponentShape } from '../types';

// Apply continuous arc/cylindrical bending deformation to any paper geometry
export function applyBendDeformation(
  geometry: THREE.BufferGeometry,
  bendAngleDeg: number,
  bendAxis: 'x' | 'y' | 'z' = 'x',
  scale: [number, number, number] = [2, 2, 2]
): THREE.BufferGeometry {
  if (!bendAngleDeg || Math.abs(bendAngleDeg) < 0.5) return geometry;

  const pos = geometry.attributes.position;
  if (!pos) return geometry;

  const [sx, sy, sz] = scale;
  const theta = (bendAngleDeg * Math.PI) / 180;

  if (bendAxis === 'x') {
    // Horizontal bend along width (X-axis): curves into an arc / cylinder segment in X-Z plane
    const width = Math.max(0.1, sx);
    const R = width / theta; // radius of curvature
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const t = x / width; // -0.5 to 0.5
      const phi = t * theta;
      const r = R + z;

      pos.setX(i, r * Math.sin(phi));
      pos.setZ(i, r * Math.cos(phi) - R);
      pos.setY(i, y);
    }
  } else if (bendAxis === 'y') {
    // Vertical bend along height (Y-axis): curves into an arch / bow in Y-Z plane
    const height = Math.max(0.1, sy);
    const R = height / theta; // radius of curvature
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const t = y / height; // -0.5 to 0.5
      const phi = t * theta;
      const r = R + z;

      pos.setY(i, r * Math.sin(phi));
      pos.setZ(i, r * Math.cos(phi) - R);
      pos.setX(i, x);
    }
  } else {
    // Depth bend along Z-axis: curves into a roll/curl in Z-X plane
    const depth = Math.max(0.1, sz);
    const R = depth / theta; // radius of curvature
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const t = z / depth; // -0.5 to 0.5
      const phi = t * theta;
      const r = R + x;

      pos.setZ(i, r * Math.sin(phi));
      pos.setX(i, r * Math.cos(phi) - R);
      pos.setY(i, y);
    }
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createComponentGeometry(
  shape: ComponentShape,
  scale: [number, number, number],
  bendAngle = 0,
  bendAxis: 'x' | 'y' | 'z' = 'x'
): THREE.BufferGeometry {
  const baseGeom = createBaseComponentGeometry(shape, scale);
  if (bendAngle && Math.abs(bendAngle) >= 0.5) {
    return applyBendDeformation(baseGeom, bendAngle, bendAxis, scale);
  }
  return baseGeom;
}

function createBaseComponentGeometry(shape: ComponentShape, scale: [number, number, number]): THREE.BufferGeometry {
  const [sx, sy, sz] = scale;

  switch (shape) {
    case 'square_paper':
    case 'paper_sheet': {
      // Clean, crisp cardstock paper sheet (with subdivisions for smooth bending)
      const paperThickness = Math.max(0.015, Math.min(sy, 0.08));
      return new THREE.BoxGeometry(sx, paperThickness, sz, 24, 1, 24);
    }
    case 'paper_box': {
      // Standard rectangular paper prism with segment subdivisions for smooth deformation
      return new THREE.BoxGeometry(sx, sy, sz, 24, 24, 24);
    }
    case 'folded_wall': {
      // Folded paper sheet with segment subdivisions
      return new THREE.BoxGeometry(sx, sy, Math.max(0.06, sz * 0.08), 24, 24, 4);
    }
    case 'l_fold_wall': {
      // 90 degree folded corner paper profile
      const shape2D = new THREE.Shape();
      const t = 0.08;
      shape2D.moveTo(-sx / 2, -sz / 2);
      shape2D.lineTo(sx / 2, -sz / 2);
      shape2D.lineTo(sx / 2, -sz / 2 + t);
      shape2D.lineTo(-sx / 2 + t, -sz / 2 + t);
      shape2D.lineTo(-sx / 2 + t, sz / 2);
      shape2D.lineTo(-sx / 2, sz / 2);
      shape2D.closePath();

      const extrudeSettings = {
        steps: 16,
        depth: sy,
        bevelEnabled: false,
      };
      const geom = new THREE.ExtrudeGeometry(shape2D, extrudeSettings);
      geom.center();
      // Rotate so extrusion goes vertically
      geom.rotateX(Math.PI / 2);
      return geom;
    }
    case 'pyramid_spire': {
      // 4-sided pyramid origami roof with height segments for smooth bending
      return new THREE.ConeGeometry(Math.max(sx, sz) * 0.7, sy, 4, 24);
    }
    case 'stepped_crown': {
      // 3-tiered art deco crown
      return new THREE.CylinderGeometry(sx * 0.3, sx * 0.7, sy, 4, 24);
    }
    case 'pitched_roof': {
      // Gable prism roof
      const shapePrism = new THREE.Shape();
      shapePrism.moveTo(-sx / 2, -sy / 2);
      shapePrism.lineTo(0, sy / 2);
      shapePrism.lineTo(sx / 2, -sy / 2);
      shapePrism.closePath();

      const geom = new THREE.ExtrudeGeometry(shapePrism, {
        steps: 24,
        depth: sz,
        bevelEnabled: false,
      });
      geom.center();
      return geom;
    }
    case 'cylindrical_column': {
      // Rolled paper column tube
      return new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sy, 24, 24);
    }
    case 'triangular_prism': {
      // Equilateral triangular prism / column
      const geom = new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sy, 3, 24);
      geom.rotateY(Math.PI / 6);
      return geom;
    }
    case 'triangle_wedge': {
      // Right-angled 3D triangular wedge / ramp
      const shapeWedge = new THREE.Shape();
      shapeWedge.moveTo(-sx / 2, -sy / 2);
      shapeWedge.lineTo(sx / 2, -sy / 2);
      shapeWedge.lineTo(-sx / 2, sy / 2);
      shapeWedge.closePath();

      const geom = new THREE.ExtrudeGeometry(shapeWedge, {
        steps: 24,
        depth: sz,
        bevelEnabled: false,
      });
      geom.center();
      return geom;
    }
    case 'flat_triangle': {
      // Flat triangular cardstock sheet / folded origami facet
      const shapeTri = new THREE.Shape();
      shapeTri.moveTo(-sx / 2, -sz / 2);
      shapeTri.lineTo(sx / 2, -sz / 2);
      shapeTri.lineTo(0, sz / 2);
      shapeTri.closePath();

      const paperThick = Math.max(0.02, Math.min(sy, 0.08));
      const geom = new THREE.ExtrudeGeometry(shapeTri, {
        steps: 24,
        depth: paperThick,
        bevelEnabled: false,
      });
      geom.center();
      geom.rotateX(Math.PI / 2);
      return geom;
    }
    case 'hexagonal_prism': {
      // 6-sided regular hexagonal column / prism
      const geom = new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sy, 6, 24);
      return geom;
    }
    case 'octagonal_prism': {
      // 8-sided regular octagonal column / prism
      const geom = new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sy, 8, 24);
      return geom;
    }
    case 'cone_spire': {
      // Conical paper spire / cone
      return new THREE.ConeGeometry(sx * 0.5, sy, 24, 24);
    }
    case 'barrel_vault': {
      // Half-cylinder curved barrel vault / paper arch
      const geom = new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sz, 24, 24, false, 0, Math.PI);
      geom.rotateZ(Math.PI / 2);
      geom.rotateX(Math.PI / 2);
      return geom;
    }
    case 'trapezoid_prism': {
      // Beveled trapezoidal block (narrower top, wider base)
      const geom = new THREE.CylinderGeometry(sx * 0.35, sx * 0.5, sy, 4, 24);
      geom.rotateY(Math.PI / 4);
      return geom;
    }
    case 'paper_sphere': {
      // 3D paper sphere / geodesic dome orb with upper & lower hemisphere groups
      const geom = new THREE.SphereGeometry(1, 32, 24);
      geom.scale(sx * 0.5, sy * 0.5, sz * 0.5);
      if (geom.index) {
        const half = Math.floor(geom.index.count / 2);
        geom.clearGroups();
        geom.addGroup(0, half, 0); // top hemisphere
        geom.addGroup(half, geom.index.count - half, 1); // bottom hemisphere
      }
      return geom;
    }
    case 'paper_torus': {
      // 3D paper torus / architectural ring with upper & lower ring groups
      const majorRadius = Math.max(0.4, (Math.min(sx, sz) * 0.5) * 0.72);
      const tubeRadius = Math.max(0.1, Math.min(sy * 0.5, majorRadius * 0.35));
      const geom = new THREE.TorusGeometry(majorRadius, tubeRadius, 24, 48);
      geom.rotateX(Math.PI / 2); // Lay horizontal
      if (geom.index) {
        const half = Math.floor(geom.index.count / 2);
        geom.clearGroups();
        geom.addGroup(0, half, 0); // top half ring
        geom.addGroup(half, geom.index.count - half, 1); // bottom half ring
      }
      return geom;
    }
    case 'paper_hyperboloid': {
      // 3D one-sheet ruled hyperboloid of revolution (waisted tower/column)
      const radiusWaist = Math.min(sx, sz) * 0.28;
      const radiusEnds = Math.min(sx, sz) * 0.5;
      const geom = new THREE.CylinderGeometry(radiusEnds, radiusEnds, sy, 32, 32, false);
      const pos = geom.attributes.position;
      const halfH = sy / 2;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const normY = halfH > 0 ? y / halfH : 0; // -1 to +1
        // Hyperbolic profile
        const r = Math.sqrt(radiusWaist * radiusWaist + (radiusEnds * radiusEnds - radiusWaist * radiusWaist) * (normY * normY));
        const currentR = Math.hypot(pos.getX(i), pos.getZ(i));
        if (currentR > 0.0001) {
          const factor = r / currentR;
          pos.setX(i, pos.getX(i) * factor);
          pos.setZ(i, pos.getZ(i) * factor);
        }
      }
      geom.computeVertexNormals();
      return geom;
    }
    case 'balcony_tab': {
      return new THREE.BoxGeometry(sx, Math.max(0.08, sy), sz);
    }
    case 'arch_portal': {
      return new THREE.CylinderGeometry(sx * 0.5, sx * 0.5, sz, 16, 1, false, 0, Math.PI);
    }

    // ----------------------------------------------------
    // LANDMARK GEOMETRIES INSPIRED BY ICONIC STRUCTURES
    // ----------------------------------------------------
    case 'skybridge_arch_crown': {
      // 1. Kingdom Centre (Riyadh) - Inverted Parabolic Arch with top Skybridge
      const shape2D = new THREE.Shape();
      const hx = sx / 2;
      const hy = sy / 2;
      shape2D.moveTo(-hx, -hy);
      shape2D.lineTo(hx, -hy);
      shape2D.lineTo(hx, hy);
      shape2D.lineTo(-hx, hy);
      shape2D.closePath();

      // Inverted catenary / parabolic arch cutout with horizontal skybridge span
      const archHole = new THREE.Path();
      const bridgeThickness = Math.max(0.18, sy * 0.12);
      const archTopY = hy - bridgeThickness;
      const archBottomY = -hy * 0.25;
      const archHalfW = hx * 0.68;

      archHole.moveTo(-archHalfW, archTopY);
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 2 - 1; // -1 to 1
        const px = t * archHalfW;
        const py = archTopY - (1 - t * t) * (archTopY - archBottomY);
        archHole.lineTo(px, py);
      }
      archHole.closePath();
      shape2D.holes.push(archHole);

      const geom = new THREE.ExtrudeGeometry(shape2D, {
        depth: sz,
        bevelEnabled: false,
        steps: 1,
      });
      geom.center();
      return geom;
    }

    case 'pyramid_globe_spire': {
      // 2. Al Faisaliah Tower (Riyadh) - 4-sided pyramid with golden observation sphere
      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      // Lower tapering pyramidal shaft
      const lowerHeight = sy * 0.6;
      const lowerGeom = new THREE.CylinderGeometry(hx * 0.5, hx * 0.95, lowerHeight, 4);
      lowerGeom.rotateY(Math.PI / 4);
      lowerGeom.translate(0, -hy + lowerHeight / 2, 0);

      // Golden observation sphere nestled in upper atrium
      const sphereRadius = Math.min(sx, sz) * 0.26;
      const sphereGeom = new THREE.IcosahedronGeometry(sphereRadius, 2);
      sphereGeom.translate(0, hy * 0.2, 0);

      // Upper open pyramid needle pinnacle
      const pinnacleHeight = sy * 0.4;
      const pinnacleGeom = new THREE.ConeGeometry(hx * 0.45, pinnacleHeight, 4);
      pinnacleGeom.rotateY(Math.PI / 4);
      pinnacleGeom.translate(0, hy - pinnacleHeight / 2, 0);

      // Merge into single buffer geometry
      const combined = new THREE.BufferGeometry();
      const posArray: number[] = [];
      const normArray: number[] = [];
      const uvArray: number[] = [];

      [lowerGeom, sphereGeom, pinnacleGeom].forEach((g) => {
        const nonIndexed = g.toNonIndexed();
        const pos = nonIndexed.getAttribute('position');
        const norm = nonIndexed.getAttribute('normal');
        const uv = nonIndexed.getAttribute('uv');

        for (let i = 0; i < pos.count; i++) {
          posArray.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (norm) normArray.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          else normArray.push(0, 1, 0);
          if (uv) uvArray.push(uv.getX(i), uv.getY(i));
          else uvArray.push(0, 0);
        }
      });

      combined.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
      combined.setAttribute('normal', new THREE.Float32BufferAttribute(normArray, 3));
      combined.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
      return combined;
    }

    case 'chamfered_octagonal_prism': {
      // 3. One World Trade Center (Freedom Tower, NYC) - Square base transitioning into 8 triangular facets
      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      // Bottom square (y = -hy): 4 corners
      const b0 = [-hx, -hy, -hz];
      const b1 = [hx, -hy, -hz];
      const b2 = [hx, -hy, hz];
      const b3 = [-hx, -hy, hz];

      // Top square rotated 45 degrees (y = hy): 4 vertices
      const t0 = [0, hy, -hz * 0.95];
      const t1 = [hx * 0.95, hy, 0];
      const t2 = [0, hy, hz * 0.95];
      const t3 = [-hx * 0.95, hy, 0];

      // 8 Triangular Facets: 4 upward-pointing triangles + 4 downward-pointing triangles
      const vertices: number[] = [];
      const addTri = (p1: number[], p2: number[], p3: number[]) => {
        vertices.push(...p1, ...p2, ...p3);
      };

      // Upward pointing triangles (base at bottom, tip at top)
      addTri(b0, b1, t0);
      addTri(b1, b2, t1);
      addTri(b2, b3, t2);
      addTri(b3, b0, t3);

      // Downward pointing triangles (base at top, tip at bottom)
      addTri(t0, t1, b1);
      addTri(t1, t2, b2);
      addTri(t2, t3, b3);
      addTri(t3, t0, b0);

      // Bottom cap (2 triangles)
      addTri(b0, b3, b2);
      addTri(b0, b2, b1);

      // Top cap (2 triangles)
      addTri(t0, t1, t2);
      addTri(t0, t2, t3);

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      // Procedural UVs based on normalized bounds
      const pos = geom.getAttribute('position');
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        uvs[i * 2] = (x + hx) / sx;
        uvs[i * 2 + 1] = (y + hy) / sy;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geom;
    }

    case 'faceted_diamond_tower': {
      // 4. KAFD Crystalline Diamond Faceted Skyscraper
      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      // Bottom square
      const b0 = [-hx * 0.85, -hy, -hz * 0.85];
      const b1 = [hx * 0.85, -hy, -hz * 0.85];
      const b2 = [hx * 0.85, -hy, hz * 0.85];
      const b3 = [-hx * 0.85, -hy, hz * 0.85];

      // Mid-height diamond facet projection points (y = 0)
      const m0 = [0, 0, -hz * 1.15];
      const m1 = [hx * 1.15, 0, 0];
      const m2 = [0, 0, hz * 1.15];
      const m3 = [-hx * 1.15, 0, 0];
      const mc0 = [-hx * 0.65, 0, -hz * 0.65];
      const mc1 = [hx * 0.65, 0, -hz * 0.65];
      const mc2 = [hx * 0.65, 0, hz * 0.65];
      const mc3 = [-hx * 0.65, 0, hz * 0.65];

      // Top square
      const t0 = [-hx * 0.85, hy, -hz * 0.85];
      const t1 = [hx * 0.85, hy, -hz * 0.85];
      const t2 = [hx * 0.85, hy, hz * 0.85];
      const t3 = [-hx * 0.85, hy, hz * 0.85];

      const vertices: number[] = [];
      const addTri = (p1: number[], p2: number[], p3: number[]) => {
        vertices.push(...p1, ...p2, ...p3);
      };

      // Lower diamond facets
      addTri(b0, b1, m0);
      addTri(b1, b2, m1);
      addTri(b2, b3, m2);
      addTri(b3, b0, m3);

      addTri(b0, m0, mc0);
      addTri(b1, m1, mc1);
      addTri(b2, m2, mc2);
      addTri(b3, m3, mc3);

      // Upper diamond facets
      addTri(m0, t1, t0);
      addTri(m1, t2, t1);
      addTri(m2, t3, t2);
      addTri(m3, t0, t3);

      addTri(m0, mc0, t0);
      addTri(m1, mc1, t1);
      addTri(m2, mc2, t2);
      addTri(m3, mc3, t3);

      // Caps
      addTri(b0, b3, b2);
      addTri(b0, b2, b1);
      addTri(t0, t1, t2);
      addTri(t0, t2, t3);

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const pos = geom.getAttribute('position');
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + hx) / sx;
        uvs[i * 2 + 1] = (pos.getY(i) + hy) / sy;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geom;
    }

    case 'supertall_needle_spire': {
      // 5. Jeddah Tower / Burj Khalifa aerodynamic tapering needle spire
      const hx = sx / 2;
      const hy = sy / 2;

      // Tiered tri-buttressed base + sharp needle mast
      const baseHeight = sy * 0.55;
      const baseGeom = new THREE.CylinderGeometry(hx * 0.35, hx * 0.9, baseHeight, 6);
      baseGeom.translate(0, -hy + baseHeight / 2, 0);

      const midHeight = sy * 0.3;
      const midGeom = new THREE.ConeGeometry(hx * 0.32, midHeight, 6);
      midGeom.translate(0, -hy + baseHeight + midHeight / 2, 0);

      const needleHeight = sy * 0.35;
      const needleGeom = new THREE.CylinderGeometry(0.04, hx * 0.12, needleHeight, 8);
      needleGeom.translate(0, hy - needleHeight / 2, 0);

      const combined = new THREE.BufferGeometry();
      const posArray: number[] = [];
      const normArray: number[] = [];
      const uvArray: number[] = [];

      [baseGeom, midGeom, needleGeom].forEach((g) => {
        const nonIndexed = g.toNonIndexed();
        const pos = nonIndexed.getAttribute('position');
        const norm = nonIndexed.getAttribute('normal');
        const uv = nonIndexed.getAttribute('uv');

        for (let i = 0; i < pos.count; i++) {
          posArray.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (norm) normArray.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          else normArray.push(0, 1, 0);
          if (uv) uvArray.push(uv.getX(i), uv.getY(i));
          else uvArray.push(0, 0);
        }
      });

      combined.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
      combined.setAttribute('normal', new THREE.Float32BufferAttribute(normArray, 3));
      combined.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
      return combined;
    }

    case 'twisting_helical_tower': {
      // 6. KAFD Twisting Helical Origami Skyscraper
      const layers = 8;
      const segmentsPerRing = 8;
      const layerHeight = sy / layers;
      const totalTwistAngle = Math.PI / 3; // 60 degree twist from base to crown
      const hx = sx / 2;
      const hz = sz / 2;

      const vertices: number[] = [];
      const ringPoints: Array<Array<[number, number, number]>> = [];

      for (let l = 0; l <= layers; l++) {
        const curY = -sy / 2 + l * layerHeight;
        const progress = l / layers;
        const angleOffset = progress * totalTwistAngle;
        const scaleFactor = 1.0 - progress * 0.15; // subtle tapering upward

        const ring: Array<[number, number, number]> = [];
        for (let s = 0; s < segmentsPerRing; s++) {
          const theta = (s / segmentsPerRing) * Math.PI * 2 + angleOffset;
          const rx = Math.cos(theta) * hx * scaleFactor;
          const rz = Math.sin(theta) * hz * scaleFactor;
          ring.push([rx, curY, rz]);
        }
        ringPoints.push(ring);
      }

      const addTri = (p1: [number, number, number], p2: [number, number, number], p3: [number, number, number]) => {
        vertices.push(...p1, ...p2, ...p3);
      };

      // Connect rings with quads (split into 2 triangles)
      for (let l = 0; l < layers; l++) {
        const ringA = ringPoints[l];
        const ringB = ringPoints[l + 1];

        for (let s = 0; s < segmentsPerRing; s++) {
          const nextS = (s + 1) % segmentsPerRing;
          const a1 = ringA[s];
          const a2 = ringA[nextS];
          const b1 = ringB[s];
          const b2 = ringB[nextS];

          addTri(a1, a2, b2);
          addTri(a1, b2, b1);
        }
      }

      // Bottom & top caps
      const bottomCenter: [number, number, number] = [0, -sy / 2, 0];
      const topCenter: [number, number, number] = [0, sy / 2, 0];
      for (let s = 0; s < segmentsPerRing; s++) {
        const nextS = (s + 1) % segmentsPerRing;
        addTri(bottomCenter, ringPoints[0][nextS], ringPoints[0][s]);
        addTri(topCenter, ringPoints[layers][s], ringPoints[layers][nextS]);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const pos = geom.getAttribute('position');
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + hx) / sx;
        uvs[i * 2 + 1] = (pos.getY(i) + sy / 2) / sy;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geom;
    }

    case 'geodesic_sphere_pod': {
      // 7. Geodesic Observation Orb / Sphere Pod
      return new THREE.IcosahedronGeometry(Math.min(sx, sy, sz) * 0.5, 2);
    }

    // ----------------------------------------------------
    // NEW LANDMARK GEOMETRIES: Empire State, Burj Al Arab, Shanghai Trio, Evolution Tower
    // ----------------------------------------------------
    case 'empire_art_deco_stepped': {
      // 8. Empire State Building - Multi-tier Art Deco Stepped Setbacks & Mooring Mast
      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      // Tier 1: Wide Podium Base (30% height)
      const t1H = sy * 0.3;
      const t1Geo = new THREE.BoxGeometry(sx, t1H, sz);
      t1Geo.translate(0, -hy + t1H / 2, 0);

      // Tier 2: Mid-Tower Stepped Setback (28% height)
      const t2H = sy * 0.28;
      const t2Geo = new THREE.BoxGeometry(sx * 0.78, t2H, sz * 0.78);
      t2Geo.translate(0, -hy + t1H + t2H / 2, 0);

      // Tier 3: Upper Tower Setback (24% height)
      const t3H = sy * 0.24;
      const t3Geo = new THREE.BoxGeometry(sx * 0.56, t3H, sz * 0.56);
      t3Geo.translate(0, -hy + t1H + t2H + t3H / 2, 0);

      // Tier 4: Art-Deco Mooring Mast & Pinnacle Spire (18% height)
      const t4H = sy * 0.18;
      const t4Geo = new THREE.CylinderGeometry(hx * 0.12, hx * 0.32, t4H, 8);
      t4Geo.translate(0, hy - t4H / 2, 0);

      const spireNeedle = new THREE.CylinderGeometry(0.02, 0.06, sy * 0.12, 6);
      spireNeedle.translate(0, hy + sy * 0.05, 0);

      const combined = new THREE.BufferGeometry();
      const posArray: number[] = [];
      const normArray: number[] = [];
      const uvArray: number[] = [];

      [t1Geo, t2Geo, t3Geo, t4Geo, spireNeedle].forEach((g) => {
        const nonIndexed = g.toNonIndexed();
        const pos = nonIndexed.getAttribute('position');
        const norm = nonIndexed.getAttribute('normal');
        const uv = nonIndexed.getAttribute('uv');

        for (let i = 0; i < pos.count; i++) {
          posArray.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (norm) normArray.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          else normArray.push(0, 1, 0);
          if (uv) uvArray.push(uv.getX(i), uv.getY(i));
          else uvArray.push(0, 0);
        }
      });

      combined.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
      combined.setAttribute('normal', new THREE.Float32BufferAttribute(normArray, 3));
      combined.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
      return combined;
    }

    case 'sail_spinnaker_tower': {
      // 9. Burj Al Arab (Dubai) - Curvilinear Dhow Sail Spinnaker Profile
      const hx = sx / 2;
      const hy = sy / 2;

      const sailShape = new THREE.Shape();
      // Rear vertical spine mast
      sailShape.moveTo(-hx * 0.85, -hy);
      sailShape.lineTo(-hx * 0.85, hy);

      // Sweeping curved sail face outward and swooping up to apex
      sailShape.bezierCurveTo(
        hx * 1.15, hy * 0.4,   // control point 1: outward belly of sail
        hx * 0.9, -hy * 0.5,   // control point 2: lower curve
        -hx * 0.2, -hy         // bottom curve meeting base
      );
      sailShape.lineTo(-hx * 0.85, -hy);
      sailShape.closePath();

      const geom = new THREE.ExtrudeGeometry(sailShape, {
        depth: sz,
        bevelEnabled: false,
        steps: 1,
      });
      geom.center();
      return geom;
    }

    case 'cantilever_helipad_disk': {
      // 10. Burj Al Arab Helipad - Cantilevered Circular Observation Platform
      const diskRadius = Math.min(sx, sz) * 0.5;
      const diskGeo = new THREE.CylinderGeometry(diskRadius, diskRadius, Math.max(0.1, sy * 0.15), 24);

      // Angled cantilever support truss beam
      const trussGeo = new THREE.BoxGeometry(sx * 0.65, 0.1, sz * 0.18);
      trussGeo.rotateZ(Math.PI / 6);
      trussGeo.translate(-sx * 0.2, -sy * 0.2, 0);

      const combined = new THREE.BufferGeometry();
      const posArray: number[] = [];
      const normArray: number[] = [];
      const uvArray: number[] = [];

      [diskGeo, trussGeo].forEach((g) => {
        const nonIndexed = g.toNonIndexed();
        const pos = nonIndexed.getAttribute('position');
        const norm = nonIndexed.getAttribute('normal');
        const uv = nonIndexed.getAttribute('uv');

        for (let i = 0; i < pos.count; i++) {
          posArray.push(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (norm) normArray.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          else normArray.push(0, 1, 0);
          if (uv) uvArray.push(uv.getX(i), uv.getY(i));
          else uvArray.push(0, 0);
        }
      });

      combined.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
      combined.setAttribute('normal', new THREE.Float32BufferAttribute(normArray, 3));
      combined.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
      return combined;
    }

    case 'trapezoid_aperture_crown': {
      // 11. Shanghai World Financial Center (SWFC "Bottle Opener")
      const hx = sx / 2;
      const hy = sy / 2;

      const towerShape = new THREE.Shape();
      // Outer trapezoidal tapering silhouette
      towerShape.moveTo(-hx, -hy);
      towerShape.lineTo(hx, -hy);
      towerShape.lineTo(hx * 0.75, hy);
      towerShape.lineTo(-hx * 0.75, hy);
      towerShape.closePath();

      // Rectangular / Trapezoidal portal aperture cutout opening
      const hole = new THREE.Path();
      const holeBotY = hy * 0.22;
      const holeTopY = hy * 0.82;
      const holeW1 = hx * 0.42;
      const holeW2 = hx * 0.32;

      hole.moveTo(-holeW1, holeBotY);
      hole.lineTo(holeW1, holeBotY);
      hole.lineTo(holeW2, holeTopY);
      hole.lineTo(-holeW2, holeTopY);
      hole.closePath();

      towerShape.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(towerShape, {
        depth: sz,
        bevelEnabled: false,
        steps: 1,
      });
      geom.center();
      return geom;
    }

    case 'spiraling_cam_tower': {
      // 12. Shanghai Tower - 120° Twisting Rounded-Triangular Cam Profile
      const layers = 10;
      const segs = 18;
      const layerH = sy / layers;
      const totalTwist = (2 * Math.PI) / 3; // 120 degrees total twist
      const hx = sx / 2;
      const hz = sz / 2;

      const vertices: number[] = [];
      const rings: Array<Array<[number, number, number]>> = [];

      for (let l = 0; l <= layers; l++) {
        const curY = -sy / 2 + l * layerH;
        const progress = l / layers;
        const angleOffset = progress * totalTwist;
        const taper = 1.0 - progress * 0.18; // gentle aerodynamic taper

        const ring: Array<[number, number, number]> = [];
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * Math.PI * 2 + angleOffset;
          // Reuleaux rounded-triangular cam: 3 lobes
          const camFactor = 1.0 + 0.15 * Math.cos(3 * (theta - angleOffset));
          const rx = Math.cos(theta) * hx * taper * camFactor;
          const rz = Math.sin(theta) * hz * taper * camFactor;
          ring.push([rx, curY, rz]);
        }
        rings.push(ring);
      }

      const addTri = (p1: [number, number, number], p2: [number, number, number], p3: [number, number, number]) => {
        vertices.push(...p1, ...p2, ...p3);
      };

      for (let l = 0; l < layers; l++) {
        const r1 = rings[l];
        const r2 = rings[l + 1];
        for (let s = 0; s < segs; s++) {
          const ns = (s + 1) % segs;
          addTri(r1[s], r1[ns], r2[ns]);
          addTri(r1[s], r2[ns], r2[s]);
        }
      }

      // Caps
      const botCenter: [number, number, number] = [0, -sy / 2, 0];
      const topCenter: [number, number, number] = [0, sy / 2, 0];
      for (let s = 0; s < segs; s++) {
        const ns = (s + 1) % segs;
        addTri(botCenter, rings[0][ns], rings[0][s]);
        addTri(topCenter, rings[layers][s], rings[layers][ns]);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const pos = geom.getAttribute('position');
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + hx) / sx;
        uvs[i * 2 + 1] = (pos.getY(i) + sy / 2) / sy;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geom;
    }

    case 'jin_mao_pagoda_tier': {
      // 13. Jin Mao Tower - Traditional Chinese Pagoda Stepped Setbacks with Eaves
      const tiers = 4;
      const tierH = sy / tiers;
      const hx = sx / 2;
      const hz = sz / 2;

      const combined = new THREE.BufferGeometry();
      const posArray: number[] = [];
      const normArray: number[] = [];
      const uvArray: number[] = [];

      for (let t = 0; t < tiers; t++) {
        const progress = t / tiers;
        const curScale = 1.0 - progress * 0.22;
        const curY = -sy / 2 + t * tierH + tierH / 2;

        // Main shaft body for this tier (8-sided octagon)
        const shaftW = sx * curScale * 0.88;
        const shaftD = sz * curScale * 0.88;
        const shaftGeo = new THREE.CylinderGeometry(shaftW * 0.45, shaftW * 0.5, tierH * 0.82, 8);
        shaftGeo.translate(0, curY - tierH * 0.08, 0);

        // Flared overhanging pagoda eave at the top of the tier
        const eaveGeo = new THREE.CylinderGeometry(shaftW * 0.55, shaftW * 0.48, tierH * 0.18, 8);
        eaveGeo.translate(0, curY + tierH * 0.41, 0);

        [shaftGeo, eaveGeo].forEach((g) => {
          const nonIndexed = g.toNonIndexed();
          const pos = nonIndexed.getAttribute('position');
          const norm = nonIndexed.getAttribute('normal');
          const uv = nonIndexed.getAttribute('uv');

          for (let i = 0; i < pos.count; i++) {
            posArray.push(pos.getX(i), pos.getY(i), pos.getZ(i));
            if (norm) normArray.push(norm.getX(i), norm.getY(i), norm.getZ(i));
            else normArray.push(0, 1, 0);
            if (uv) uvArray.push(uv.getX(i), uv.getY(i));
            else uvArray.push(0, 0);
          }
        });
      }

      combined.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
      combined.setAttribute('normal', new THREE.Float32BufferAttribute(normArray, 3));
      combined.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
      return combined;
    }

    case 'double_helix_spiral_tower': {
      // 14. Evolution Tower (Moscow) - Twisting DNA Double-Helix Spiral
      const layers = 10;
      const segs = 12;
      const layerH = sy / layers;
      const totalTwist = Math.PI / 2; // 90 degree twist
      const hx = sx / 2;
      const hz = sz / 2;

      const vertices: number[] = [];
      const rings: Array<Array<[number, number, number]>> = [];

      for (let l = 0; l <= layers; l++) {
        const curY = -sy / 2 + l * layerH;
        const progress = l / layers;
        const angleOffset = progress * totalTwist;

        const ring: Array<[number, number, number]> = [];
        for (let s = 0; s < segs; s++) {
          const theta = (s / segs) * Math.PI * 2 + angleOffset;
          // Dual lobes representing DNA double helix ribbons
          const helixMod = 1.0 + 0.22 * Math.cos(2 * (theta - angleOffset));
          const rx = Math.cos(theta) * hx * helixMod;
          const rz = Math.sin(theta) * hz * helixMod;
          ring.push([rx, curY, rz]);
        }
        rings.push(ring);
      }

      const addTri = (p1: [number, number, number], p2: [number, number, number], p3: [number, number, number]) => {
        vertices.push(...p1, ...p2, ...p3);
      };

      for (let l = 0; l < layers; l++) {
        const r1 = rings[l];
        const r2 = rings[l + 1];
        for (let s = 0; s < segs; s++) {
          const ns = (s + 1) % segs;
          addTri(r1[s], r1[ns], r2[ns]);
          addTri(r1[s], r2[ns], r2[s]);
        }
      }

      const botCenter: [number, number, number] = [0, -sy / 2, 0];
      const topCenter: [number, number, number] = [0, sy / 2, 0];
      for (let s = 0; s < segs; s++) {
        const ns = (s + 1) % segs;
        addTri(botCenter, rings[0][ns], rings[0][s]);
        addTri(topCenter, rings[layers][s], rings[layers][ns]);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const pos = geom.getAttribute('position');
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) + hx) / sx;
        uvs[i * 2 + 1] = (pos.getY(i) + sy / 2) / sy;
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      return geom;
    }
    default:
      return new THREE.BoxGeometry(sx, sy, sz);
  }
}

// Compute smart snapping points on bounding surfaces of a paper component
export function getComponentSnapPoints(comp: { position: [number, number, number]; scale: [number, number, number] }): Array<[number, number, number]> {
  const [px, py, pz] = comp.position;
  const [sx, sy, sz] = comp.scale;
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;

  return [
    // Top center
    [px, py + hy, pz],
    // Bottom center
    [px, py - hy, pz],
    // 4 Face centers
    [px + hx, py, pz],
    [px - hx, py, pz],
    [px, py, pz + hz],
    [px, py, pz - hz],
    // 4 Top corners
    [px + hx, py + hy, pz + hz],
    [px - hx, py + hy, pz + hz],
    [px + hx, py + hy, pz - hz],
    [px - hx, py + hy, pz - hz],
    // 4 Bottom corners
    [px + hx, py - hy, pz + hz],
    [px - hx, py - hy, pz + hz],
    [px + hx, py - hy, pz - hz],
    [px - hx, py - hy, pz - hz],
  ];
}

// Universal papercraft trapezoidal glue tab with 45° chamfers
export function createGlueTabGeometry(length: number, depth = 0.35, thickness = 0.015): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const d = Math.min(depth, length * 0.3);
  const hl = length / 2;
  shape.moveTo(-hl, 0);
  shape.lineTo(-hl + d, d);
  shape.lineTo(hl - d, d);
  shape.lineTo(hl, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.01, thickness),
    bevelEnabled: false,
  });
  geom.rotateX(Math.PI / 2);
  geom.center();
  return geom;
}

