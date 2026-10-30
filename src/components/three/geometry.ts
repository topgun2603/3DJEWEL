import * as THREE from "three";
import type { CutId, ProfileId } from "@/lib/catalog";

type Pt = [number, number];

/** Gem outline in the local XZ plane: x across the band (width w), z along the finger (length l). */
export function outline(cut: CutId, w: number, l: number): { pts: Pt[]; curved: boolean } {
  const hw = w / 2;
  const hl = l / 2;
  switch (cut) {
    case "round":
    case "oval": {
      const n = 16;
      return {
        curved: true,
        pts: Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          return [Math.cos(a) * hw, Math.sin(a) * hl];
        }),
      };
    }
    case "heart": {
      const n = 36;
      const raw: Pt[] = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        return [x, y];
      });
      const ys = raw.map((p) => p[1]);
      const yMid = (Math.max(...ys) + Math.min(...ys)) / 2;
      const ySpan = Math.max(...ys) - Math.min(...ys);
      // Point of the heart faces the wearer (+z, toward the viewer in the front view).
      return { curved: false, pts: raw.map(([x, y]) => [(x / 32) * w, (-(y - yMid) / ySpan) * l]) };
    }
    case "emerald": {
      const c = Math.min(w, l) * 0.2;
      return {
        curved: false,
        pts: [
          [hw, -hl + c], [hw, hl - c], [hw - c, hl], [-hw + c, hl],
          [-hw, hl - c], [-hw, -hl + c], [-hw + c, -hl], [hw - c, -hl],
        ],
      };
    }
    case "baguette":
    case "princess":
      return { curved: false, pts: [[hw, -hl], [hw, hl], [-hw, hl], [-hw, -hl]] };
  }
}

function sampleCurved(cut: CutId, w: number, l: number, n: number, phase: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + phase) / n) * Math.PI * 2;
    return [Math.cos(a) * (w / 2), Math.sin(a) * (l / 2)];
  });
}

export interface GemProportions {
  crown: number;
  pavilion: number;
  girdle: number;
}

export function gemProportions(cut: CutId, w: number, l: number): GemProportions {
  const s = Math.min(w, l);
  const step = cut === "baguette" || cut === "emerald";
  return { crown: s * (step ? 0.12 : 0.16), pavilion: s * (step ? 0.36 : 0.43), girdle: s * 0.025 };
}

const gemCache = new Map<string, THREE.BufferGeometry>();

/**
 * Builds a faceted gem (table, two crown tiers, girdle, two pavilion tiers, culet)
 * from any outline. Non-indexed so every facet is flat-shaded and catches light.
 */
export function gemGeometry(cut: CutId, w: number, l: number) {
  const key = `${cut}:${w.toFixed(4)}:${l.toFixed(4)}`;
  const cached = gemCache.get(key);
  if (cached) return cached;

  const { crown, pavilion, girdle } = gemProportions(cut, w, l);
  const { pts, curved } = outline(cut, w, l);
  const n = pts.length;
  const ring = (scale: number, y: number, phase: number) => {
    const src = curved && phase ? sampleCurved(cut, w, l, n, phase) : pts;
    return src.map(([x, z]) => new THREE.Vector3(x * scale, y, z * scale));
  };

  const table = ring(0.56, crown, 0.5);
  const crownMid = ring(0.82, crown * 0.55, 0.25);
  const gTop = ring(1, girdle / 2, 0);
  const gBot = ring(1, -girdle / 2, 0);
  const pavMid = ring(0.52, -pavilion * 0.6, 0.5);
  const tableCenter = new THREE.Vector3(0, crown, 0);
  const culet = new THREE.Vector3(0, -pavilion, 0);

  const pos: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    if (n.dot(centroid) < 0) [b, c] = [c, b];
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const band = (top: THREE.Vector3[], bot: THREE.Vector3[]) => {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tri(top[i], bot[i], bot[j]);
      tri(top[i], bot[j], top[j]);
    }
  };

  for (let i = 0; i < n; i++) tri(tableCenter, table[i], table[(i + 1) % n]);
  band(table, crownMid);
  band(crownMid, gTop);
  band(gTop, gBot);
  band(gBot, pavMid);
  for (let i = 0; i < n; i++) tri(culet, pavMid[(i + 1) % n], pavMid[i]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  gemCache.set(key, geo);
  return geo;
}

/** Points where prongs grip the stone, in the outline's XZ plane. */
export function prongPoints(cut: CutId, w: number, l: number): Pt[] {
  const hw = w / 2;
  const hl = l / 2;
  if (cut === "round" || cut === "oval") {
    return [45, 135, 225, 315].map((d) => {
      const a = (d * Math.PI) / 180;
      return [Math.cos(a) * hw, Math.sin(a) * hl];
    });
  }
  if (cut === "heart") return [[0, hl], [hw * 0.82, -hl * 0.45], [-hw * 0.82, -hl * 0.45]];
  if (cut === "emerald") {
    const c = Math.min(w, l) * 0.1;
    return [[hw - c, hl - c], [-hw + c, hl - c], [-hw + c, -hl + c], [hw - c, -hl + c]];
  }
  return [[hw, hl], [-hw, hl], [-hw, -hl], [hw, -hl]];
}

/** A metal cup around the stone's girdle, extruded downward. */
export function bezelGeometry(cut: CutId, w: number, l: number, wall: number, height: number) {
  const { pts } = outline(cut, w, l);
  const sx = (w + wall * 2) / w;
  const sz = (l + wall * 2) / l;
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x * sx, z * sz)));
  shape.holes.push(new THREE.Path(pts.map(([x, z]) => new THREE.Vector2(x * 0.97, z * 0.97)).reverse()));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: wall * 0.3,
    bevelSize: wall * 0.25,
    bevelSegments: 3,
    curveSegments: 24,
  });
  // Shape Y → world Z, extrusion → world -Y.
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * Ring band as a surface of revolution. The cross-section is a superellipse
 * whose inner/outer exponents produce comfort, domed or flat profiles.
 * Result: ring axis along Z, centred at the origin.
 */
export function bandGeometry(innerR: number, thickness: number, width: number, profile: ProfileId) {
  const [nIn, nOut] = profile === "comfort" ? [2.6, 2.6] : profile === "domed" ? [9, 2.1] : [10, 10];
  const a = thickness / 2;
  const b = width / 2;
  const rc = innerR + a;
  const pts: THREE.Vector2[] = [];
  const segs = 72;
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const n = c >= 0 ? nOut : nIn;
    const x = rc + a * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = b * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(new THREE.Vector2(x, y));
  }
  const geo = new THREE.LatheGeometry(pts, 160);
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}
