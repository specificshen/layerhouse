import * as THREE from "three";
import { addBox, addCyl, GEO } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

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

/** Layered broadleaf clumps — a conifer silhouette without a stack of cones. */
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
  addCyl(g, 0.11 * s, h * 0.38, 0, h * 0.16, 0, mats.trunk);
  addCyl(g, 0.07 * s, h * 0.22, 0.03 * s, h * 0.4, 0, mats.trunk);
  const clumps: Array<[number, number, number, number, number, number]> = [
    [0, 0.48, 0.05, 1.15, 0.7, 1.05],
    [0.35, 0.62, -0.2, 0.85, 0.62, 0.8],
    [-0.4, 0.58, 0.18, 0.8, 0.55, 0.78],
    [0.1, 0.78, -0.05, 0.7, 0.5, 0.66],
    [-0.15, 0.9, 0.12, 0.48, 0.42, 0.5],
    [0.22, 0.4, 0.28, 0.62, 0.4, 0.55],
  ];
  for (const [bx, by, bz, sx, sy, sz] of clumps) {
    blob(g, by > 0.7 ? mats.canopyDeep : mats.pine, bx * s, by * h, bz * s, sx * s, sy * s, sz * s);
  }
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
  addCyl(g, 0.16 * s, h * 0.55, 0, h * 0.26, 0, mats.trunk);
  addCyl(g, 0.07 * s, 0.85 * s, 0.28 * s, h * 0.62, 0.05, mats.trunk, { rotZ: 0.7 });
  addCyl(g, 0.055 * s, 0.7 * s, -0.22 * s, h * 0.68, -0.08, mats.trunk, { rotZ: -0.85, rotX: 0.3 });
  addCyl(g, 0.04 * s, 0.55 * s, 0.05 * s, h * 0.78, 0.22 * s, mats.trunk, { rotX: -0.6 });
  const clumps: Array<[number, number, number, number, THREE.Material]> = [
    [0, h * 0.98, 0, 1.05, mats.canopy],
    [0.55, h * 0.9, 0.25, 0.78, mats.canopyDeep],
    [-0.5, h * 0.92, -0.2, 0.82, mats.canopy],
    [0.2, h * 1.18, -0.35, 0.62, mats.canopyDeep],
    [-0.15, h * 1.12, 0.4, 0.58, mats.canopy],
    [0.35, h * 0.78, -0.45, 0.5, mats.canopyDeep],
    [-0.4, h * 0.8, 0.35, 0.48, mats.canopy],
  ];
  for (const [bx, by, bz, br, mat] of clumps) {
    blob(g, mat, bx * s, by, bz * s, br * s * 2.1, br * s * 1.15, br * s * 1.9);
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
