import * as THREE from "three";
import { WATER_EDGE } from "@/config";
import { addBox, addCyl } from "@/geom";
import type { Materials } from "@/materials";
import type { HouseRecord } from "@/types";
import { maple, pine, shrub } from "./trees";

const HEDGE = new THREE.MeshStandardMaterial({
  color: 0x5d8454,
  roughness: 0.82,
  metalness: 0,
});
const REED = new THREE.MeshStandardMaterial({
  color: 0x8a8f62,
  roughness: 0.8,
  metalness: 0,
});
const MOUND = new THREE.SphereGeometry(1, 20, 14);

/**
 * One house on the lot. The surroundings are garden, shore, and a horizon —
 * an open pavilion, not another dwelling.
 */
export function buildContext(mats: Materials, rec: HouseRecord): THREE.Group {
  const g = new THREE.Group();
  g.name = "context";

  const shore = new THREE.Mesh(new THREE.BoxGeometry(130, 0.42, 34), mats.grass);
  shore.name = "shore";
  shore.position.set(0, -0.02, -46);
  shore.receiveShadow = true;
  shore.castShadow = false;
  g.add(shore);

  const shoreY = 0.19;
  const horizon: Array<[number, number, number]> = [
    [-42, 0.75, 3.6],
    [-28, 0.9, 4.4],
    [-14, 0.7, 3.4],
    [2, 0.85, 4.1],
    [18, 0.72, 3.5],
    [34, 0.95, 4.6],
  ];
  for (const [x, scale, height] of horizon) {
    pine(g, mats, x, -38, scale, height);
    const planted = g.children.at(-1);
    if (planted) planted.position.y = shoreY;
  }

  addBox(g, 46, 0.045, 8.2, 1.2, 0.02, 21.2, mats.paver, null, { noCast: true, name: "lane" });
  addBox(g, 46.4, 0.08, 0.16, 1.2, 0.04, 17.2, mats.concrete, null, { noCast: true });
  addBox(g, 46.4, 0.08, 0.16, 1.2, 0.04, 25.2, mats.concrete, null, { noCast: true });
  maple(g, mats, rec, -16, 16.6, 1.05, 2.8);
  maple(g, mats, rec, 16.5, 16.8, 0.95, 2.6);
  maple(g, mats, rec, 1.4, 26.4, 1.15, 3.1);

  mound(g, mats.grass, -23, 1.5, 7.5, 0.42, 5.5);
  mound(g, mats.grass, 32, 18, 6.2, 0.34, 4.6);

  hedgeRun(g, -14.4, -1.5, -14.4, 9.2);
  hedgeRun(g, 15.6, -7.2, 15.6, 5.4);

  bed(g, mats, -17.6, 1.6);
  bed(g, mats, -17.6, 4.2);
  bed(g, mats, -17.6, 6.8);
  maple(g, mats, rec, -21.5, -6.2, 1.2, 3.2);

  pavilion(g, mats);
  for (let i = 0; i < 5; i++) {
    addBox(g, 0.62, 0.04, 0.62, 15.6 + i * 0.95, 0.03, 2.15, mats.paver, null, {
      noCast: true,
      name: "stepping-stone",
    });
  }

  reedCluster(g, -10.2, WATER_EDGE - 0.35);
  reedCluster(g, -5.4, WATER_EDGE - 0.2);
  reedCluster(g, 8.4, WATER_EDGE - 0.3);
  reedCluster(g, 12.6, WATER_EDGE - 0.15);
  shrub(g, mats, 18.2, 3.4, 0.55, 0.7);
  shrub(g, mats, 22.4, -0.6, 0.48, 0.62);
  shrub(g, mats, -16.2, 9.4, 0.5, 0.66);

  return g;
}

function mound(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
) {
  const mesh = new THREE.Mesh(MOUND, mat);
  mesh.name = "berm";
  mesh.scale.set(rx, ry, rz);
  mesh.position.set(x, ry * 0.15, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function hedgeRun(parent: THREE.Object3D, x0: number, z0: number, x1: number, z1: number) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const rotY = Math.atan2(dx, dz);
  addBox(parent, 0.42, 0.62, len, (x0 + x1) / 2, 0.31, (z0 + z1) / 2, HEDGE, null, {
    rotY,
    noCast: true,
    name: "hedge",
  });
}

function bed(parent: THREE.Object3D, mats: Materials, x: number, z: number) {
  addBox(parent, 2.4, 0.1, 1.35, x, 0.05, z, mats.soil, null, { noCast: true, name: "bed" });
  addBox(parent, 2.15, 0.16, 1.05, x, 0.14, z, HEDGE, null, { noCast: true, name: "bed-crop" });
}

/** Open timber roof on four posts. Low, unenclosed, and clearly not a second house. */
function pavilion(parent: THREE.Object3D, mats: Materials) {
  const g = new THREE.Group();
  g.name = "pavilion";
  g.position.set(21.2, 0, 0.6);
  const w = 4.4;
  const d = 3.2;
  addBox(g, w, 0.08, d, 0, 0.04, 0, mats.deck, null, { noCast: true });
  const posts: Array<[number, number]> = [
    [-w / 2 + 0.18, -d / 2 + 0.18],
    [w / 2 - 0.18, -d / 2 + 0.18],
    [-w / 2 + 0.18, d / 2 - 0.18],
    [w / 2 - 0.18, d / 2 - 0.18],
  ];
  for (const [x, z] of posts) addCyl(g, 0.07, 2.45, x, 1.22, z, mats.woodDark);
  addBox(g, w + 0.7, 0.06, d + 0.55, 0, 2.52, 0, mats.roof, null, {});
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + (i * (w + 0.5)) / 5;
    addBox(g, 0.02, 0.03, d + 0.7, x, 2.57, 0, mats.roofSeam, null, { noCast: true });
  }
  addBox(g, w + 0.75, 0.1, 0.06, 0, 2.46, d / 2 + 0.28, mats.fascia, null, {});
  addBox(g, 1.6, 0.08, 0.42, -0.2, 0.46, 0.15, mats.woodMid, null, {});
  addBox(g, 0.08, 0.4, 0.4, -0.9, 0.24, 0.15, mats.woodDark, null, { noCast: true });
  addBox(g, 0.08, 0.4, 0.4, 0.5, 0.24, 0.15, mats.woodDark, null, { noCast: true });
  parent.add(g);
}

function reedCluster(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.name = "reeds";
  g.position.set(x, 0, z);
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const lean = 0.12 + (i % 3) * 0.05;
    const h = 0.85 + (i % 4) * 0.16;
    const stem = addCyl(g, 0.025, h, Math.cos(ang) * 0.22, h / 2, Math.sin(ang) * 0.18, REED, {
      noShadow: true,
    });
    stem.rotation.z = Math.cos(ang) * lean;
    stem.rotation.x = Math.sin(ang) * lean;
  }
  parent.add(g);
}
