import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Materials } from "./materials";
import type { HouseGroups, HouseRecord } from "./types";
import { MAIN, COURT, POOL, CARPORT, LOT, WATER_EDGE } from "./config";
import { addBox, addCyl, GEO } from "./geom";

export function buildSite(
  _scene: THREE.Scene,
  groups: HouseGroups,
  mats: Materials,
  rec: HouseRecord,
) {
  const site = groups.site;
  const land = groups.landscape;

  // Large terrain grass (context, always-ish)
  const ground = new THREE.Mesh(GEO.plane, mats.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(180, 180, 1);
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.castShadow = false;
  ground.name = "ground";
  land.add(ground);
  rec.ground = ground;

  // Lot grass is the same plane; add a slightly raised lot pad? skip to avoid z-fight.
  // Soil bank at water edge
  addBox(land, 90, 0.7, 1.4, 0, -0.2, WATER_EDGE - 0.2, mats.soil, rec, { noCast: true });

  // ——— Pavers: driveway + entry path ———
  addBox(site, 8.6, 0.04, 7.2, 4.2, 0.02, 9.4, mats.paver, rec, { noCast: true });
  addBox(site, 4.2, 0.04, 3.4, -0.9, 0.02, 8.0, mats.paver, rec, { noCast: true });
  // ——— Pool (basin + coping) ———
  const pw = POOL.x1 - POOL.x0,
    pd = POOL.z1 - POOL.z0;
  const px = (POOL.x0 + POOL.x1) / 2,
    pz = (POOL.z0 + POOL.z1) / 2;

  // Courtyard deck as four strips, leaving a hole so the water is visible from above.
  const holeX0 = POOL.x0 - 0.22,
    holeX1 = POOL.x1 + 0.22;
  const holeZ0 = POOL.z0 - 0.22,
    holeZ1 = POOL.z1 + 0.22;
  const cx0 = COURT.x0 + 0.05,
    cx1 = COURT.x1 - 0.05;
  const cz0 = COURT.z0 + 0.05,
    cz1 = COURT.z1 - 0.05;
  addBox(
    site,
    holeX0 - cx0,
    0.06,
    cz1 - cz0,
    (cx0 + holeX0) / 2,
    0.03,
    (cz0 + cz1) / 2,
    mats.deck,
    rec,
    { noCast: true },
  );
  addBox(
    site,
    cx1 - holeX1,
    0.06,
    cz1 - cz0,
    (holeX1 + cx1) / 2,
    0.03,
    (cz0 + cz1) / 2,
    mats.deck,
    rec,
    { noCast: true },
  );
  addBox(
    site,
    holeX1 - holeX0,
    0.06,
    cz1 - holeZ1,
    (holeX0 + holeX1) / 2,
    0.03,
    (holeZ1 + cz1) / 2,
    mats.deck,
    rec,
    { noCast: true },
  );
  addBox(
    site,
    holeX1 - holeX0,
    0.06,
    holeZ0 - cz0,
    (holeX0 + holeX1) / 2,
    0.03,
    (cz0 + holeZ0) / 2,
    mats.deck,
    rec,
    { noCast: true },
  );

  // Coping ring (not a solid lid)
  const copW = 0.22,
    copH = 0.08,
    copY = 0.06;
  addBox(site, pw + copW * 2, copH, copW, px, copY, POOL.z0 - copW / 2, mats.concrete, rec, {
    clip: false,
  });
  addBox(site, pw + copW * 2, copH, copW, px, copY, POOL.z1 + copW / 2, mats.concrete, rec, {
    clip: false,
  });
  addBox(site, copW, copH, pd, POOL.x0 - copW / 2, copY, pz, mats.concrete, rec, { clip: false });
  addBox(site, copW, copH, pd, POOL.x1 + copW / 2, copY, pz, mats.concrete, rec, { clip: false });
  // basin walls
  const bh = 0.55;
  addBox(site, pw + 0.16, bh, 0.1, px, -0.2, POOL.z0, mats.concrete, rec, {});
  addBox(site, pw + 0.16, bh, 0.1, px, -0.2, POOL.z1, mats.concrete, rec, {});
  addBox(site, 0.1, bh, pd, POOL.x0, -0.2, pz, mats.concrete, rec, {});
  addBox(site, 0.1, bh, pd, POOL.x1, -0.2, pz, mats.concrete, rec, {});
  rec.poolMeta = { px, pz, pw, pd };

  // ——— Fence: horizontal slats, west + part south + east ———
  buildFence(site, mats, rec);

  // ——— Carport ———
  buildCarport(site, mats, rec);

  // ——— Dock ———
  buildDock(site, mats, rec);

  // Courtyard bench / outdoor
  addBox(site, 1.8, 0.4, 0.45, 2.8, 0.28, -3.0, mats.woodMid, rec, {});
  addBox(site, 0.5, 0.45, 0.5, 5.9, 0.28, -6.4, mats.concrete, rec, {}); // planter box base (plant in landscape)

  rec.hotspots.push({
    id: "pool",
    labelZh: "庭院水庭",
    labelEn: "Courtyard pool",
    position: new THREE.Vector3(px, 0.6, pz),
    object: site,
  });

  rec.floors.push({ x0: COURT.x0, x1: COURT.x1, z0: COURT.z0, z1: COURT.z1, y: 0.06, level: 0 });
  rec.floors.push({ x0: CARPORT.x0, x1: CARPORT.x1, z0: CARPORT.z0, z1: 10, y: 0.04, level: 0 });
  rec.floors.push({ x0: -3, x1: 2, z0: MAIN.z1, z1: 10, y: 0.04, level: 0 });

  return { px, pz, pw, pd };
}

export function buildWater(_scene: THREE.Scene, rec: HouseRecord): THREE.Group {
  const poolMeta = rec.poolMeta;
  if (!poolMeta) throw new Error("poolMeta missing — buildSite must run first");
  const canal = new Reflector(new THREE.PlaneGeometry(160, 90), {
    textureWidth: 512,
    textureHeight: 512,
    color: 0x6a7a88,
    clipBias: 0.003,
  });
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(4, -0.38, WATER_EDGE - 42);
  canal.name = "canal";
  // tint overlay
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 90),
    new THREE.MeshPhysicalMaterial({
      color: 0x3a5060,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
      envMapIntensity: 1.1,
      depthWrite: false,
    }),
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.set(4, -0.36, WATER_EDGE - 42);
  overlay.name = "canalTint";
  overlay.renderOrder = 1;

  const pool = new Reflector(new THREE.PlaneGeometry(poolMeta.pw - 0.08, poolMeta.pd - 0.08), {
    textureWidth: 256,
    textureHeight: 256,
    color: 0x5a8a88,
    clipBias: 0.003,
  });
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(poolMeta.px, 0.008, poolMeta.pz);
  pool.name = "pool";
  // Lit basin floor so the pool reads teal from above even when the reflection is dark.
  const poolFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(poolMeta.pw - 0.12, poolMeta.pd - 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x146e6c,
      emissive: 0x1ad8cc,
      emissiveIntensity: 0,
      roughness: 0.7,
      metalness: 0.05,
    }),
  );
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(poolMeta.px, 0.0, poolMeta.pz);
  poolFloor.name = "poolFloor";
  poolFloor.receiveShadow = true;

  const poolTint = new THREE.Mesh(
    new THREE.PlaneGeometry(poolMeta.pw - 0.08, poolMeta.pd - 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x1a8a88,
      emissive: 0x2ee0d4,
      emissiveIntensity: 0,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  poolTint.rotation.x = -Math.PI / 2;
  poolTint.position.set(poolMeta.px, 0.014, poolMeta.pz);
  poolTint.name = "poolTint";
  poolTint.renderOrder = 1;

  const waterGrp = new THREE.Group();
  waterGrp.name = "water";
  waterGrp.add(canal, overlay, poolFloor, pool, poolTint);
  rec.water = { canal, overlay, pool, poolTint, poolFloor, group: waterGrp };
  return waterGrp;
}

function buildFence(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const slatH = 0.09,
    gap = 0.035,
    n = 8,
    h = n * (slatH + gap);
  function run(x0: number, z0: number, x1: number, z1: number) {
    const dx = x1 - x0,
      dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const rotY = Math.atan2(dx, dz);
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    // posts
    const posts = Math.max(2, Math.round(len / 1.8));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      addBox(
        parent,
        0.08,
        h + 0.15,
        0.08,
        x0 + dx * t,
        (h + 0.15) / 2,
        z0 + dz * t,
        mats.fence,
        rec,
        {},
      );
    }
    for (let i = 0; i < n; i++) {
      const y = 0.12 + i * (slatH + gap);
      addBox(parent, 0.025, slatH, len - 0.05, cx, y, cz, mats.fence, rec, { rotY, noCast: true });
    }
  }
  // west lot
  run(LOT.x0 + 0.4, WATER_EDGE + 0.4, LOT.x0 + 0.4, 8.5);
  // south-west (leave entry/drive open)
  run(LOT.x0 + 0.4, 8.5, -3.2, 8.5);
  // east
  run(LOT.x1 - 0.6, WATER_EDGE + 0.8, LOT.x1 - 0.6, 7.2);
  run(11.6, 7.2, LOT.x1 - 0.6, 7.2);
}

function buildCarport(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const { x0, x1, z0, z1 } = CARPORT;
  const y = 2.85;
  const posts: Array<[number, number]> = [
    [x0 + 0.25, z0 + 0.25],
    [x1 - 0.25, z0 + 0.25],
    [x0 + 0.25, z1 - 0.25],
    [x1 - 0.25, z1 - 0.25],
  ];
  for (const [x, z] of posts) addCyl(parent, 0.07, y, x, y / 2, z, mats.steel);
  addBox(
    parent,
    x1 - x0 + 0.3,
    0.08,
    z1 - z0 + 0.3,
    (x0 + x1) / 2,
    y,
    (z0 + z1) / 2,
    mats.fascia,
    rec,
    {},
  );
  addBox(
    parent,
    x1 - x0 + 0.3,
    0.03,
    z1 - z0 + 0.3,
    (x0 + x1) / 2,
    y - 0.06,
    (z0 + z1) / 2,
    mats.deck,
    rec,
    {},
  );
  rec.floors.push({ x0, x1, z0, z1, y: 0.04, level: 0 });
}

function buildDock(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const x0 = 1.1,
    x1 = 3.6,
    z0 = -15.2,
    z1 = -10.2;
  addBox(parent, x1 - x0, 0.1, z1 - z0, (x0 + x1) / 2, 0.22, (z0 + z1) / 2, mats.deck, rec, {});
  // stringers / piles
  for (let i = 0; i < 5; i++) {
    const z = z0 + 0.4 + i * ((z1 - z0 - 0.8) / 4);
    addCyl(parent, 0.07, 0.9, x0 + 0.15, -0.15, z, mats.woodDark);
    addCyl(parent, 0.07, 0.9, x1 - 0.15, -0.15, z, mats.woodDark);
  }
  // simple rail
  addBox(parent, 0.04, 0.7, z1 - z0, x0, 0.6, (z0 + z1) / 2, mats.woodDark, rec, {});
  addBox(parent, 0.04, 0.7, z1 - z0, x1, 0.6, (z0 + z1) / 2, mats.woodDark, rec, {});
  rec.floors.push({ x0, x1, z0, z1, y: 0.28, level: 0 });
  rec.hotspots.push({
    id: "dock",
    labelZh: "临水栈道",
    labelEn: "Water dock",
    position: new THREE.Vector3((x0 + x1) / 2, 1.0, z0 + 1.2),
    object: parent,
  });
}

export function buildLandscape(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  const land = groups.landscape;
  // Planters
  planter(land, mats, rec, 5.9, -6.4, 0.7, 0.7);
  planter(land, mats, rec, -3.4, 7.4, 1.1, 0.7);
  planter(land, mats, rec, 1.4, 7.6, 0.9, 0.6);

  // Trees — pines + maples, no palms
  pine(land, mats, 8.6, 7.8, 1.15, 5.4);
  pine(land, mats, 11.2, 4.2, 0.95, 4.6);
  pine(land, mats, -10.6, 2.2, 1.2, 5.8);
  pine(land, mats, -11.4, -8.6, 1.05, 5.0);
  pine(land, mats, 7.8, -12.6, 1.1, 5.2);
  pine(land, mats, -8.2, -13.4, 0.9, 4.4);
  maple(land, mats, rec, 3.15, -9.35, 1.35, 3.2);
  maple(land, mats, rec, -9.2, 7.6, 1.5, 3.6);
  maple(land, mats, rec, 12.4, 10.6, 1.3, 3.1);
  maple(land, mats, rec, -4.6, 11.2, 1.1, 2.7);

  rec.hotspots.push({
    id: "tree",
    labelZh: "庭树",
    labelEn: "Courtyard maple",
    position: new THREE.Vector3(3.15, 2.4, -9.35),
    object: land,
  });

  // Shrubs
  const shrubPts: Array<[number, number, number]> = [
    [-6.6, 7.1, 0.55],
    [-5.2, 7.3, 0.4],
    [6.6, 7.0, 0.45],
    [9.4, 1.2, 0.5],
    [-8.8, -2.2, 0.55],
    [-8.4, -10.8, 0.4],
    [6.2, -10.6, 0.5],
    [0.2, -10.0, 0.35],
    [5.6, -3.2, 0.3],
    [12.6, 6.2, 0.5],
    [-12.0, 6.6, 0.45],
  ];
  for (const [x, z, r] of shrubPts) shrub(land, mats, x, z, r);

  // Property line
  const pts = [
    LOT.x0,
    0.02,
    WATER_EDGE,
    LOT.x1,
    0.02,
    WATER_EDGE,
    LOT.x1,
    0.02,
    LOT.z1,
    LOT.x0,
    0.02,
    LOT.z1,
    LOT.x0,
    0.02,
    WATER_EDGE,
  ];
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(pts);
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: 0x2a382c,
      transparent: true,
      opacity: 0.4,
      toneMapped: true,
    }),
  );
  line.name = "lotLine";
  land.add(line);
}

function planter(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  z: number,
  w: number,
  d: number,
) {
  addBox(parent, w, 0.38, d, x, 0.2, z, mats.concrete, rec, {});
  addBox(parent, w - 0.1, 0.08, d - 0.1, x, 0.4, z, mats.soil, rec, { noCast: true });
  shrub(parent, mats, x, z, 0.28, 0.55);
}

function pine(parent: THREE.Object3D, mats: Materials, x: number, z: number, s: number, h: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  addCyl(g, 0.12 * s, h * 0.45, 0, h * 0.2, 0, mats.trunk);
  const levels = 4;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const y = h * 0.32 + t * h * 0.58;
    const r = s * (1.15 - t * 0.75);
    const hh = s * (1.1 - t * 0.2);
    const cone = new THREE.Mesh(GEO.cone, mats.pine);
    cone.scale.set(r * 2, hh, r * 2);
    cone.position.y = y;
    cone.castShadow = true;
    cone.receiveShadow = true;
    cone.rotation.y = i * 0.4;
    g.add(cone);
  }
  parent.add(g);
}

function maple(
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
  addCyl(g, 0.13 * s, h * 0.7, 0, h * 0.32, 0, mats.trunk);
  // a few branches
  addCyl(g, 0.05 * s, 0.8 * s, 0.25 * s, h * 0.7, 0.1, mats.trunk, { rotZ: Math.PI / 5 });
  addCyl(g, 0.05 * s, 0.7 * s, -0.2 * s, h * 0.75, -0.1, mats.trunk, { rotZ: -Math.PI / 6 });
  const canopyMat = mats.canopy;
  const blobs: Array<[number, number, number, number]> = [
    [0, h * 0.95, 0, 1.15],
    [0.45, h * 0.9, 0.2, 0.85],
    [-0.4, h * 0.92, -0.25, 0.8],
    [0.15, h * 1.15, -0.3, 0.7],
    [-0.2, h * 1.1, 0.35, 0.65],
  ];
  for (const [bx, by, bz, br] of blobs) {
    const m = new THREE.Mesh(GEO.sphere, canopyMat);
    m.scale.set(br * s * 2, br * s * 1.7, br * s * 2);
    m.position.set(bx * s, by, bz * s);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  parent.add(g);
}

function shrub(parent: THREE.Object3D, mats: Materials, x: number, z: number, r: number, h = 0.7) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(GEO.sphereLow, mats.canopy);
    const k = r * (0.8 + i * 0.15);
    m.scale.set(k * 2, (k * 1.5 * h) / 0.7, k * 2);
    m.position.set((i - 1) * r * 0.35, k * 0.7, (i % 2) * r * 0.2);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  parent.add(g);
}

export function buildNeighbors(
  _scene: THREE.Scene,
  mats: Materials,
  rec: HouseRecord,
): THREE.Group {
  const g = new THREE.Group();
  g.name = "neighbors";
  // North across the canal
  neighbor(g, mats, -18, -28, 0.2, 12, 9, 5.2, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 4, -32, -0.1, 11, 10, 4.8, mats.neighborB, mats.neighborRoofB, "hip");
  neighbor(g, mats, 24, -26, 0.4, 13, 9, 5.0, mats.neighborC, mats.neighborRoof, "gable");
  // East
  neighbor(g, mats, 24, 2, -0.6, 11, 9, 4.6, mats.neighborB, mats.neighborRoof, "shed");
  neighbor(g, mats, 27, 16, 0.3, 10, 8, 4.4, mats.neighborA, mats.neighborRoofB, "gable");
  // West
  neighbor(g, mats, -24, 3, 0.5, 12, 9, 4.7, mats.neighborC, mats.neighborRoof, "gable");
  neighbor(g, mats, -26, 18, -0.2, 10, 8, 4.3, mats.neighborB, mats.neighborRoofB, "hip");
  // South across the street
  neighbor(g, mats, -8, 26, Math.PI, 12, 9, 4.5, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 10, 28, Math.PI + 0.1, 11, 9, 4.4, mats.neighborC, mats.neighborRoofB, "shed");

  // far land masses / simple green banks
  const far = new THREE.Mesh(new THREE.BoxGeometry(80, 1.2, 24), mats.grass);
  far.position.set(-10, 0.2, -48);
  far.receiveShadow = true;
  far.castShadow = false;
  g.add(far);

  rec.neighbors = g;
  return g;
}

function neighbor(
  parent: THREE.Object3D,
  _mats: Materials,
  x: number,
  z: number,
  rotY: number,
  w: number,
  d: number,
  h: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  kind: string,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  addBox(g, w, h, d, 0, h / 2, 0, wallMat, null, {});
  // punched window insets (emissive at night via a shared array)
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x6a7380,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0xffc080,
    emissiveIntensity: 0,
  });
  const wins = [];
  const nw = 3;
  for (let i = 0; i < nw; i++) {
    const px = -w / 2 + 1.5 + i * ((w - 3) / Math.max(1, nw - 1));
    const pane = addBox(g, 0.9, 1.1, 0.04, px, 1.6, d / 2 + 0.02, winMat, null, { noShadow: true });
    wins.push(pane);
    if (h > 4.2) {
      const pane2 = addBox(g, 0.9, 0.9, 0.04, px, 3.4, d / 2 + 0.02, winMat, null, {
        noShadow: true,
      });
      wins.push(pane2);
    }
  }
  g.userData.windows = wins;
  g.userData.winMat = winMat;

  if (kind === "gable") {
    const pitch = 0.45;
    const half = d / 2 + 0.3;
    const slope = half / Math.cos(pitch);
    const ridgeY = h + Math.tan(pitch) * half;
    for (const sign of [-1, 1]) {
      const p = addBox(
        g,
        w + 0.5,
        0.12,
        slope,
        0,
        (h + ridgeY) / 2,
        (sign * half) / 2,
        roofMat,
        null,
        {},
      );
      p.rotation.x = -sign * pitch;
    }
  } else if (kind === "hip") {
    addBox(g, w + 0.4, 0.5, d + 0.4, 0, h + 0.15, 0, roofMat, null, {});
    addBox(g, w * 0.55, 0.7, d * 0.55, 0, h + 0.7, 0, roofMat, null, {});
  } else {
    const p = addBox(g, w + 0.4, 0.12, d + 0.5, 0, h + 0.35, -0.1, roofMat, null, {});
    p.rotation.x = 0.18;
  }
  parent.add(g);
}

export function setNeighborGlow(neighbors: THREE.Object3D, amount: number) {
  if (!neighbors) return;
  neighbors.traverse((o) => {
    if (o.userData && o.userData.winMat) {
      o.userData.winMat.emissiveIntensity = amount * 0.7;
    }
  });
}
