import * as THREE from "three";
import { addBox, addCyl, GEO } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function blob(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
) {
  const m = new THREE.Mesh(GEO.sphere, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
}

function tuft(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
) {
  const m = new THREE.Mesh(GEO.cone, mat);
  m.scale.set(r * 2, h, r * 1.55);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
}

export function planter(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  z: number,
  w: number,
  d: number,
) {
  addBox(parent, w, 0.42, d, x, 0.21, z, mats.concrete, rec, {});
  addBox(parent, w - 0.08, 0.06, d - 0.08, x, 0.44, z, mats.soil, rec, { noCast: true });
  shrub(parent, mats, x, z, Math.min(w, d) * 0.42, 0.62);
}

/** Irregular conifer: tapered trunk, whorled branches, jagged needle tufts. */
export function pine(
  parent: THREE.Object3D,
  mats: Materials,
  x: number,
  z: number,
  s: number,
  h: number,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const seed = x * 13.1 + z * 7.7;
  addCyl(g, 0.14 * s, h * 0.22, 0, h * 0.1, 0, mats.trunk);
  addCyl(g, 0.09 * s, h * 0.28, 0, h * 0.32, 0, mats.trunk);
  addCyl(g, 0.045 * s, h * 0.34, 0, h * 0.58, 0, mats.trunk);
  const whorls = 5;
  for (let i = 0; i < whorls; i++) {
    const t = i / (whorls - 1);
    const y = h * (0.32 + t * 0.58);
    const reach = s * (1.15 - t * 0.78);
    const count = 5 + (i % 2);
    for (let k = 0; k < count; k++) {
      const jitter = (hash(seed + i * 19 + k) - 0.5) * 0.7;
      const a = (k / count) * Math.PI * 2 + jitter + i * 0.35;
      const len = reach * (0.75 + hash(seed + k + 3) * 0.45);
      const bx = Math.cos(a) * len * 0.55;
      const bz = Math.sin(a) * len * 0.55;
      addCyl(g, 0.02 * s, len, bx * 0.45, y - len * 0.08, bz * 0.45, mats.trunk, {
        rotZ: Math.cos(a) * 0.9,
        rotX: -Math.sin(a) * 0.9,
      });
      const mat = hash(seed + i + k) > 0.45 ? mats.pine : mats.canopyDeep;
      const tr = reach * (0.34 + hash(seed + k) * 0.18);
      tuft(g, mat, bx, y + tr * 0.15, bz, tr, tr * (1.1 + hash(seed + i) * 0.5));
      if (hash(seed + i * 5 + k) > 0.55) {
        tuft(g, mats.pine, bx * 0.72, y - tr * 0.2, bz * 0.72, tr * 0.65, tr * 0.8);
      }
    }
  }
  tuft(g, mats.pine, 0, h * 0.96, 0, s * 0.22, s * 0.55);
  parent.add(g);
}

export function maple(
  parent: THREE.Object3D,
  mats: Materials,
  _rec: HouseRecord,
  x: number,
  z: number,
  s: number,
  h: number,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const seed = x * 9.2 + z * 4.4;
  addCyl(g, 0.15 * s, h * 0.42, 0, h * 0.2, 0, mats.trunk);
  const limbs: Array<[number, number, number, number]> = [
    [0.55, 0.62, 0.15, 0.85],
    [-0.62, 0.58, -0.2, 0.95],
    [0.1, 0.78, -0.55, 0.7],
    [-0.15, 0.84, 0.48, 0.62],
  ];
  for (const [lx, ly, lz, reach] of limbs) {
    addCyl(g, 0.045 * s, reach * s, lx * s * 0.45, h * ly, lz * s * 0.45, mats.trunk, {
      rotZ: lx * 0.9,
      rotX: -lz * 0.8,
    });
    const n = 4;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.4) / n;
      const jx = (hash(seed + i + lx * 10) - 0.5) * 0.45;
      const jz = (hash(seed + i * 3 + lz) - 0.5) * 0.45;
      const px = (lx * u + jx) * s;
      const pz = (lz * u + jz) * s;
      const py = h * (ly * 0.75 + 0.28) + hash(seed + i) * h * 0.12;
      const r = s * (0.28 + hash(seed + i + 8) * 0.28) * (1.15 - u * 0.35);
      blob(g, i % 2 === 0 ? mats.canopy : mats.canopyDeep, px, py, pz, r * 1.7, r * 0.85, r * 1.45);
    }
  }
  parent.add(g);
}

export function shrub(
  parent: THREE.Object3D,
  mats: Materials,
  x: number,
  z: number,
  r: number,
  h = 0.7,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const parts: Array<[number, number, number, number]> = [
    [0, 0.55, 0, 1],
    [-0.35, 0.4, 0.15, 0.72],
    [0.32, 0.42, -0.12, 0.68],
    [0.05, 0.75, 0.2, 0.5],
  ];
  for (const [px, py, pz, k] of parts) {
    const sy = ((k * r * 1.3 * h) / 0.7) * 2;
    blob(
      g,
      py > 0.6 ? mats.canopyDeep : mats.canopy,
      px * r,
      py * r,
      pz * r,
      k * r * 2,
      sy,
      k * r * 2,
    );
  }
  parent.add(g);
}
