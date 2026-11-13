import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { CARPORT, COURT, LOT, MAIN, POOL, WATER_EDGE } from "../../config";
import type { HouseGroups, HouseRecord } from "../../types";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import { buildCarport, buildDock, buildFence, buildLotDressing } from "./hardscape";
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
  const ground = new THREE.Mesh(lawnAroundPool(), mats.grass);
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
  // ——— Pool (raised coping around a recessed basin) ———
  const pw = POOL.x1 - POOL.x0,
    pd = POOL.z1 - POOL.z0;
  const px = (POOL.x0 + POOL.x1) / 2,
    pz = (POOL.z0 + POOL.z1) / 2;
  const copW = 0.34;
  const copH = 0.2;
  const copBase = 0.06;
  const copY = copBase + copH / 2;

  // Deck stops under the coping so the stone lip sits above the lawn and the boards.
  const holeX0 = POOL.x0 - copW + 0.04,
    holeX1 = POOL.x1 + copW - 0.04;
  const holeZ0 = POOL.z0 - copW + 0.04,
    holeZ1 = POOL.z1 + copW - 0.04;
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

  const coping = mats.plinth.clone();
  coping.color.setHex(0xefeae0);
  coping.roughness = 0.58;
  coping.metalness = 0.02;
  coping.emissive.setHex(0x6a6458);
  coping.emissiveIntensity = 0.22;
  addBox(site, pw + copW * 2, copH, copW, px, copY, POOL.z0 - copW / 2, coping, rec, {
    clip: false,
  });
  addBox(site, pw + copW * 2, copH, copW, px, copY, POOL.z1 + copW / 2, coping, rec, {
    clip: false,
  });
  addBox(site, copW, copH, pd, POOL.x0 - copW / 2, copY, pz, coping, rec, { clip: false });
  addBox(site, copW, copH, pd, POOL.x1 + copW / 2, copY, pz, coping, rec, { clip: false });
  if (!mats.poolTile.map) mats.poolTile.map = tileMap();
  // Continuous tile lip on the inner face, above the water line.
  const lipH = 0.1;
  const lipY = 0.12;
  const lipT = 0.07;
  lipStrip(site, mats.poolTile, pw - 0.16, lipH, lipT, px, lipY, POOL.z0 + 0.07);
  lipStrip(site, mats.poolTile, pw - 0.16, lipH, lipT, px, lipY, POOL.z1 - 0.07);
  lipStrip(site, mats.poolTile, lipT, lipH, pd - 0.3, POOL.x0 + 0.07, lipY, pz);
  lipStrip(site, mats.poolTile, lipT, lipH, pd - 0.3, POOL.x1 - 0.07, lipY, pz);
  const poolLight = new THREE.PointLight(0x8ee0d4, 0, 7.2, 2);
  poolLight.position.set(px, 0.0, pz + pd * 0.08);
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
  buildLotDressing(site, land, mats, rec);

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

  const waterGrp = new THREE.Group();
  waterGrp.name = "water";
  waterGrp.add(canal, overlay);
  const basin = buildPoolBasin(waterGrp, poolMeta);
  rec.water = {
    canal,
    overlay,
    pool: basin.pool,
    poolTint: basin.poolTint,
    poolFloor: basin.poolFloor,
    poolMid: basin.poolMid,
    poolDeep: basin.poolDeep,
    caustic: basin.caustic,
    poolSheen: basin.poolSheen,
    group: waterGrp,
  };
  return waterGrp;
}

/** Lawn with the pool cut out so the basin can sit below the turf. */
function lawnAroundPool() {
  const span = 90;
  const shape = new THREE.Shape();
  shape.moveTo(-span, -span);
  shape.lineTo(span, -span);
  shape.lineTo(span, span);
  shape.lineTo(-span, span);
  const hole = new THREE.Path();
  const x0 = POOL.x0 + 0.04;
  const x1 = POOL.x1 - 0.04;
  // rotateX(-90) maps shape Y to world -Z, so store the pool's Z negated.
  const y0 = -(POOL.z1 - 0.04);
  const y1 = -(POOL.z0 + 0.04);
  hole.moveTo(x0, y0);
  hole.lineTo(x0, y1);
  hole.lineTo(x1, y1);
  hole.lineTo(x1, y0);
  shape.holes.push(hole);
  const geo = new THREE.ShapeGeometry(shape);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  if (!pos || !uv) throw new Error("lawn geometry missing attributes");
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / 180 + 0.5, -pos.getY(i) / 180 + 0.5);
  }
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function canvasTexture(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

let tileImage: THREE.CanvasTexture | null = null;

function tileMap(): THREE.CanvasTexture {
  if (!tileImage) {
    tileImage = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#f3f0ea";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#6e6a64";
      const g = 14;
      ctx.fillRect(0, 0, w, g);
      ctx.fillRect(0, h - g, w, g);
      ctx.fillRect(0, 0, g, h);
      ctx.fillRect(w - g, 0, g, h);
    });
  }
  return tileImage;
}

function causticMap(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) {
      const x = (i * 97) % w;
      const y = (i * 61) % h;
      const rx = 36 + (i % 4) * 14;
      const ry = 14 + (i % 3) * 6;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, rx);
      grad.addColorStop(0, "rgba(255,255,255,0.55)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.12)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Canvas top is north (deep). Keep the pattern on the shallow south end.
    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createLinearGradient(0, h, 0, 0);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(0.46, "rgba(0,0,0,0.9)");
    fade.addColorStop(0.68, "rgba(0,0,0,0.12)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
  });
}

function sheenMap(): THREE.CanvasTexture {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const film = ctx.createLinearGradient(0, h, 0, 0);
    film.addColorStop(0, "rgba(186,224,214,0.05)");
    film.addColorStop(0.22, "rgba(214,238,230,0.34)");
    film.addColorStop(0.55, "rgba(232,246,240,0.48)");
    film.addColorStop(0.84, "rgba(200,228,220,0.22)");
    film.addColorStop(1, "rgba(180,214,206,0.04)");
    ctx.fillStyle = film;
    ctx.fillRect(0, 0, w, h);
    const streak = ctx.createRadialGradient(w * 0.4, h * 0.46, 6, w * 0.46, h * 0.5, w * 0.42);
    streak.addColorStop(0, "rgba(255,255,255,0.8)");
    streak.addColorStop(0.4, "rgba(236,248,244,0.35)");
    streak.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.ellipse(w * 0.42, h * 0.48, w * 0.36, h * 0.18, -0.42, 0, Math.PI * 2);
    ctx.fill();
  });
}

function scaleBoxUvs(geo: THREE.BufferGeometry, w: number, h: number, d: number, perM: number) {
  const uv = geo.getAttribute("uv");
  const faces: Array<[number, number]> = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let face = 0; face < faces.length; face++) {
    const su = faces[face]![0] * perM;
    const sv = faces[face]![1] * perM;
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    }
  }
  uv.needsUpdate = true;
}

function tileBox(w: number, h: number, d: number, mat: THREE.MeshStandardMaterial) {
  const geo = new THREE.BoxGeometry(w, h, d);
  scaleBoxUvs(geo, w, h, d, 2.4);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function lipStrip(
  parent: THREE.Object3D,
  mat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  scaleBoxUvs(geo, w, h, d, 3.6);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
}

function buildPoolBasin(
  parent: THREE.Group,
  meta: { px: number; pz: number; pw: number; pd: number },
) {
  const { px, pz, pw, pd } = meta;
  const inset = 0.12;
  const innerW = pw - inset * 2;
  const innerD = pd - inset * 2;
  const south = pz + pd / 2 - inset;
  const map = tileMap();

  const shallowMat = new THREE.MeshStandardMaterial({
    color: 0x3c8078,
    map,
    roughness: 0.58,
    metalness: 0.05,
    emissive: 0x08302e,
    emissiveIntensity: 0.04,
  });
  const midMat = new THREE.MeshStandardMaterial({
    color: 0x2a625c,
    map,
    roughness: 0.64,
    metalness: 0.05,
    emissive: 0x0c3834,
    emissiveIntensity: 0.05,
  });
  const deepMat = new THREE.MeshStandardMaterial({
    color: 0x1c4644,
    map,
    roughness: 0.7,
    metalness: 0.06,
    emissive: 0x0c3030,
    emissiveIntensity: 0.06,
  });
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(pw - 0.02, 0.16, pd - 0.02),
    new THREE.MeshStandardMaterial({ color: 0x071214, roughness: 1, metalness: 0 }),
  );
  shell.position.set(px, -0.96, pz);
  shell.name = "poolShell";
  parent.add(shell);

  const tops = [-0.08, -0.26, -0.46, -0.68];
  const floorBottom = -0.86;
  const bands = tops.length;
  let poolFloor: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null = null;
  let poolMid: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null = null;
  let poolDeep: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> | null = null;
  const bandMat = (i: number) => (i < 2 ? shallowMat : i === 2 ? midMat : deepMat);
  for (let i = 0; i < bands; i++) {
    const zSouth = south - (innerD * i) / bands;
    const zNorth = south - (innerD * (i + 1)) / bands;
    const len = zSouth - zNorth - 0.02;
    const top = tops[i]!;
    const base = tops[i + 1] ?? floorBottom;
    const thick = top - base;
    const mat = bandMat(i);
    const mesh = tileBox(innerW - 0.08, thick, len, mat);
    mesh.position.set(px, base + thick / 2, (zSouth + zNorth) / 2);
    mesh.name = i < 2 ? "poolFloor" : i === 2 ? "poolMid" : "poolDeep";
    parent.add(mesh);
    if (i === 0) poolFloor = mesh;
    if (i === 2) poolMid = mesh;
    if (i === bands - 1) poolDeep = mesh;
  }
  if (!poolFloor || !poolMid || !poolDeep) throw new Error("pool basin failed to build");

  const wallTop = 0.045;
  const wallT = 0.055;
  const placeWall = (
    w: number,
    h: number,
    d: number,
    x: number,
    z: number,
    floorY: number,
    mat: THREE.MeshStandardMaterial,
  ) => {
    const mesh = tileBox(w, h, d, mat);
    mesh.position.set(x, floorY + h / 2, z);
    mesh.name = "poolWall";
    parent.add(mesh);
  };
  placeWall(innerW, wallTop - tops[0]!, wallT, px, south - wallT / 2, tops[0]!, shallowMat);
  placeWall(innerW, wallTop - tops[3]!, wallT, px, south - innerD + wallT / 2, tops[3]!, deepMat);
  for (let i = 0; i < bands; i++) {
    const zSouth = south - (innerD * i) / bands;
    const zNorth = south - (innerD * (i + 1)) / bands;
    const mat = bandMat(i);
    for (const side of [-1, 1]) {
      placeWall(
        wallT,
        wallTop - tops[i]!,
        zSouth - zNorth + 0.02,
        px + side * (innerW / 2 - wallT / 2),
        (zSouth + zNorth) / 2,
        tops[i]!,
        mat,
      );
    }
  }

  const waterY = 0.078;
  const caustic = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW - 0.2, innerD - 0.2),
    new THREE.MeshStandardMaterial({
      color: 0xdff8f2,
      map: causticMap(),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
      emissive: 0xb6efe4,
      emissiveIntensity: 0.2,
    }),
  );
  caustic.rotation.x = -Math.PI / 2;
  caustic.position.set(px, -0.02, pz);
  caustic.name = "poolCaustic";
  caustic.renderOrder = 2;

  const poolTint = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW - 0.1, innerD - 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x1a4246,
      roughness: 0.2,
      metalness: 0.16,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      emissive: 0x062422,
      emissiveIntensity: 0.02,
      envMapIntensity: 0.7,
    }),
  );
  poolTint.rotation.x = -Math.PI / 2;
  poolTint.position.set(px, waterY + 0.012, pz);
  poolTint.name = "poolTint";
  poolTint.renderOrder = 4;

  // North half only. A soft film so the deep end reads as water, not an empty floor.
  const sheenD = innerD * 0.5;
  const poolSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(innerW - 0.18, sheenD),
    new THREE.MeshStandardMaterial({
      color: 0xc9e0d8,
      map: sheenMap(),
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      roughness: 0.24,
      metalness: 0.28,
      emissive: 0x7eaea4,
      emissiveIntensity: 0.08,
      envMapIntensity: 0.85,
    }),
  );
  poolSheen.rotation.x = -Math.PI / 2;
  poolSheen.position.set(px, waterY + 0.02, south - innerD + sheenD / 2);
  poolSheen.name = "poolSheen";
  poolSheen.renderOrder = 5;

  parent.add(caustic, poolTint, poolSheen);
  return { pool: poolTint, poolTint, poolFloor, poolMid, poolDeep, caustic, poolSheen };
}

export function buildLandscape(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  const land = groups.landscape;
  // Planters
  planter(land, mats, rec, 5.9, -6.4, 0.7, 0.7);
  planter(land, mats, rec, -2.4, 9.5, 0.9, 0.6);
  planter(land, mats, rec, 1.4, 7.6, 0.9, 0.6);

  // Trees — pines + maples, no palms
  // Same crown as the old driveway pine; the trunk moves onto the lawn east of the curb.
  pine(land, mats, 7.8, 8.6, 1.15, 5.4);
  const frontPine = land.children.at(-1);
  // East of the drive curb and south of the carport, so the trunk sits on the lawn.
  if (frontPine) frontPine.position.set(10.9, 0, 9.5);
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
