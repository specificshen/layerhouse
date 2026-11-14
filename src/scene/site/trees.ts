import * as THREE from "three";
import { addBox } from "@/geom";
import type { Materials } from "@/materials";
import type { HouseRecord } from "@/types";

const CONE = new THREE.ConeGeometry(1, 1, 22, 1);
const CROWN = new THREE.SphereGeometry(1, 24, 16);
const TRUNK = new THREE.CylinderGeometry(0.7, 1, 1, 14);

const PINE = new THREE.MeshStandardMaterial({
  color: 0x3f6b4c,
  roughness: 0.74,
  metalness: 0,
  envMapIntensity: 0.28,
});
const PINE_TIP = new THREE.MeshStandardMaterial({
  color: 0x74a06a,
  roughness: 0.68,
  metalness: 0,
  envMapIntensity: 0.3,
});
const MAPLE = new THREE.MeshStandardMaterial({
  color: 0x7d9b6c,
  roughness: 0.7,
  metalness: 0,
  envMapIntensity: 0.32,
});
const MAPLE_SHADE = new THREE.MeshStandardMaterial({
  color: 0x54784c,
  roughness: 0.78,
  metalness: 0,
  envMapIntensity: 0.26,
});
const SHRUB = new THREE.MeshStandardMaterial({
  color: 0x6a9460,
  roughness: 0.76,
  metalness: 0,
  envMapIntensity: 0.28,
});

function makeRng(seed: number): () => number {
  let s = Math.imul(Math.floor(seed * 1000) || 1, 0x9e3779b1) >>> 0;
  if (s === 0) s = 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function addMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
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

/** Nested smooth cones: one readable pine, not a pile of needles. */
export function pine(
  parent: THREE.Object3D,
  mats: Materials,
  x: number,
  z: number,
  s: number,
  h: number,
) {
  const g = new THREE.Group();
  g.name = "pine";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 13.1 + z * 7.7);
  g.rotation.y = rnd() * Math.PI * 2;
  const jitter = 0.96 + rnd() * 0.08;
  const scale = s * jitter;
  const trunkH = h * 0.28;
  const trunk = addMesh(g, TRUNK, mats.trunk, 0, trunkH / 2, 0, scale * 0.13, trunkH, scale * 0.13);
  trunk.receiveShadow = true;
  const skirts: Array<[number, number, number, THREE.Material]> = [
    [h * 0.4, scale * 1.12, h * 0.46, PINE],
    [h * 0.6, scale * 0.78, h * 0.4, PINE],
    [h * 0.8, scale * 0.44, h * 0.34, PINE_TIP],
  ];
  for (const [y, radius, height, mat] of skirts) {
    addMesh(g, CONE, mat, 0, y, 0, radius, height, radius * 0.92);
  }
  parent.add(g);
}

/** A short trunk and a cloud of smooth crowns. Wide, graphic, not a leaf atlas. */
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
  g.name = "maple";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 9.2 + z * 4.4);
  g.rotation.y = rnd() * Math.PI * 2;
  const jitter = 0.96 + rnd() * 0.08;
  const scale = s * jitter;
  const trunkH = h * 0.48;
  const trunk = addMesh(g, TRUNK, mats.trunk, 0, trunkH / 2, 0, scale * 0.11, trunkH, scale * 0.11);
  trunk.receiveShadow = true;
  const lean = (rnd() - 0.5) * 0.35;
  const branch = addMesh(
    g,
    TRUNK,
    mats.trunk,
    scale * 0.28,
    trunkH * 0.92,
    0,
    scale * 0.05,
    scale * 0.62,
    scale * 0.05,
  );
  branch.rotation.z = -0.9 + lean;
  const crowns: Array<[number, number, number, number, THREE.Material]> = [
    [0, h * 0.74, 0, scale * 0.62, MAPLE],
    [scale * 0.46, h * 0.66, scale * 0.08, scale * 0.42, MAPLE_SHADE],
    [-scale * 0.44, h * 0.68, -scale * 0.06, scale * 0.4, MAPLE],
    [scale * 0.06, h * 0.9, -scale * 0.16, scale * 0.34, MAPLE],
    [-scale * 0.08, h * 0.58, scale * 0.32, scale * 0.32, MAPLE_SHADE],
  ];
  for (const [cx, cy, cz, r, mat] of crowns) {
    addMesh(g, CROWN, mat, cx, cy, cz, r, r * 0.78, r);
  }
  parent.add(g);
}

export function shrub(
  parent: THREE.Object3D,
  _mats: Materials,
  x: number,
  z: number,
  r: number,
  h = 0.7,
) {
  const g = new THREE.Group();
  g.name = "shrub";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 3.7 + z * 8.1);
  const height = h * (0.94 + rnd() * 0.12);
  addMesh(g, CROWN, SHRUB, 0, height * 0.42, 0, r * 0.95, height * 0.55, r * 0.9);
  addMesh(g, CROWN, MAPLE, r * 0.28, height * 0.62, r * 0.08, r * 0.62, height * 0.4, r * 0.58);
  parent.add(g);
}
