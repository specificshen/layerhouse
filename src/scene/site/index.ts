import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { CARPORT, COURT, LOT, MAIN, POOL, WATER_EDGE } from "../../config";
import type { HouseGroups, HouseRecord } from "../../types";
import { addBox, addCyl, GEO } from "../geom";
import type { Materials } from "../materials";
import { buildCarport, buildDock, buildFence } from "./hardscape";
import { maple, pine, planter, shrub } from "./trees";

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
  addBox(site, 9.0, 0.025, 0.16, 4.2, 0.045, 13.05, mats.concrete, rec, { noCast: true });
  addBox(site, 0.14, 0.025, 7.4, -0.05, 0.045, 9.4, mats.concrete, rec, { noCast: true });
  addBox(site, 0.14, 0.025, 7.4, 8.55, 0.045, 9.4, mats.concrete, rec, { noCast: true });
  addBox(site, 4.5, 0.02, 0.08, -0.9, 0.04, 6.4, mats.concrete, rec, { noCast: true });
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
  const tileY = 0.045;
  addBox(site, pw - 0.28, 0.05, 0.05, px, tileY, POOL.z0 + 0.08, mats.poolTile, rec, {
    noShadow: true,
  });
  addBox(site, pw - 0.28, 0.05, 0.05, px, tileY, POOL.z1 - 0.08, mats.poolTile, rec, {
    noShadow: true,
  });
  addBox(site, 0.05, 0.05, pd - 0.28, POOL.x0 + 0.08, tileY, pz, mats.poolTile, rec, {
    noShadow: true,
  });
  addBox(site, 0.05, 0.05, pd - 0.28, POOL.x1 - 0.08, tileY, pz, mats.poolTile, rec, {
    noShadow: true,
  });
  const poolLight = new THREE.PointLight(0x3ee0d0, 0, 7.5, 2);
  poolLight.position.set(px, 0.35, pz);
  poolLight.name = "poolLight";
  site.add(poolLight);
  rec.poolMeta = { px, pz, pw, pd };
  const bollards: Array<[number, number]> = [
    [-1.7, 10.4],
    [-0.3, 8.5],
    [1.4, 7.2],
    [6.4, 8.6],
    [8.6, 6.2],
    [3.4, -9.6],
  ];
  for (const [bx, bz] of bollards) {
    addCyl(site, 0.045, 0.7, bx, 0.35, bz, mats.steel);
    addCyl(site, 0.09, 0.07, bx, 0.72, bz, mats.pathLight, { noShadow: true });
    const glow = new THREE.PointLight(0xffd2a0, 0, 3.4, 2);
    glow.position.set(bx, 0.78, bz);
    glow.name = "pathLight";
    site.add(glow);
  }

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

export function buildLandscape(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  const land = groups.landscape;
  // Planters
  planter(land, mats, rec, 5.9, -6.4, 0.7, 0.7);
  planter(land, mats, rec, -2.4, 9.5, 0.9, 0.6);
  planter(land, mats, rec, 1.4, 7.6, 0.9, 0.6);

  // Trees — pines + maples, no palms
  // Shifted off the carport so the trunk is not in front of the roof.
  pine(land, mats, 7.8, 8.6, 1.15, 5.4);
  // East of the roof. 11.2 sat under it and the trunk grew through the slab.
  pine(land, mats, 12.6, 4.2, 0.95, 4.6);
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
    [-6.8, 8.6, 0.42],
    [-5.0, 8.9, 0.36],
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
