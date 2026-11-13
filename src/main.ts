import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { CAM, EYE, LAYERS, ROOF_LIFT, TOD, WATER_EDGE } from "./config";
import { createTextures, createMaterials, setLampIntensity, setGrassColor } from "./materials";
import { createSky, applySky, createSunDisc, placeSun } from "./sky";
import { buildHouse, heightAt } from "./house";
import { furnishHouse } from "./furnish";
import { buildSite, buildWater, buildLandscape, buildNeighbors, setNeighborGlow } from "./site";
import { buildSystems } from "./systems";
import type { CutDir, DemoApi, LayerId, Mode, TimeId, Vec3, ViewMode } from "./types";
import { isCutDir, isTimeId, isViewMode } from "./types";

function mustEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

function hasEmissive(mat: THREE.Material): mat is THREE.MeshStandardMaterial {
  return "emissive" in mat && (mat as THREE.MeshStandardMaterial).emissive instanceof THREE.Color;
}

function orbitPreset(mode: Mode, cutDir: CutDir) {
  if (mode === "cut") {
    return CAM[cutDir === "side" ? "cutSide" : cutDir === "front" ? "cutFront" : "cut"];
  }
  if (mode === "exterior" || mode === "exploded" || mode === "xray") return CAM[mode];
  return CAM.exploded;
}

const canvas = mustEl<HTMLCanvasElement>("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  stencil: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.localClippingEnabled = true;
renderer.setClearColor(0x1a2030, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8a6a72, 0.018);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.12, 600);
camera.position.set(...CAM.exploded.pos);
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(...CAM.exploded.target);
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.minDistance = 2.4;
orbit.maxDistance = 80;
orbit.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
};

const sky = createSky();
scene.add(sky.mesh);
const sunDisc = createSunDisc();
scene.add(sunDisc);

const hemi = new THREE.HemisphereLight(0xe8a888, 0x3a3a48, 0.48);
scene.add(hemi);
const amb = new THREE.AmbientLight(0x4a4058, 0.22);
scene.add(amb);
const sun = new THREE.DirectionalLight(0xff8a62, 0.95);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);
sun.target.position.set(0, 0, -1);

const fill = new THREE.DirectionalLight(0x6a70a8, 0.18);
fill.position.set(8, 10, -14);
scene.add(fill);

const textures = createTextures();
const mats = createMaterials(textures);

const rec = buildHouse(mats);
furnishHouse(rec.groups, mats, rec);
buildSite(scene, rec.groups, mats, rec);
buildLandscape(rec.groups, mats, rec);
buildSystems(rec.groups, mats, rec);

const houseRoot = new THREE.Group();
houseRoot.name = "houseRoot";
const clipTargets: LayerId[] = [
  "framing",
  "masonry",
  "roof",
  "walls",
  "insulation",
  "fenestration",
  "hvac",
  "electrical",
  "plumbing",
  "furniture",
];
for (const g of Object.values(rec.groups)) houseRoot.add(g);
scene.add(houseRoot);

const neighbors = buildNeighbors(scene, mats, rec);
scene.add(neighbors);
const waterGrp = buildWater(scene, rec);
scene.add(waterGrp);

// Clipping: clone materials used by house groups so site/context stays unclipped
const clipPlanes: THREE.Plane[] = [];
const clipCache = new Map<THREE.Material, THREE.Material>();
function enableClipping(root: THREE.Object3D) {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map((m) => {
      if (!clipCache.has(m)) {
        const c = m.clone();
        c.clippingPlanes = clipPlanes;
        c.clipShadows = true;
        clipCache.set(m, c);
      }
      return clipCache.get(m)!;
    });
    o.material = Array.isArray(o.material) ? next : next[0]!;
  });
}
for (const id of clipTargets) enableClipping(rec.groups[id]);

const capGroup = new THREE.Group();
capGroup.name = "sectionCaps";
scene.add(capGroup);
const sectionBox = new THREE.Group();
sectionBox.name = "sectionBox";
scene.add(sectionBox);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.22,
  0.35,
  0.88,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(sky.mesh.clone());

let mode: Mode = "boot";
let timeId: TimeId = "dusk";
let xrayLayer: LayerId = "framing";
let cutDir: CutDir = "top";
let cutValue = 4.3;
let prevMode: ViewMode = "exploded";
let roofY = ROOF_LIFT;
rec.roofGroup.position.y = ROOF_LIFT;

const camState = {
  active: false,
  t: 1,
  dur: 0.95,
  p0: camera.position.clone(),
  p1: camera.position.clone(),
  t0: orbit.target.clone(),
  t1: orbit.target.clone(),
};

function lerpCam(pos: Vec3 | number[], target: Vec3 | number[], dur = 0.95) {
  camState.active = true;
  camState.t = 0;
  camState.dur = dur;
  camState.p0.copy(camera.position);
  camState.p1.set(pos[0]!, pos[1]!, pos[2]!);
  camState.t0.copy(orbit.target);
  camState.t1.set(target[0]!, target[1]!, target[2]!);
}

function openRoofAmount() {
  return Math.max(0, Math.min(1, roofY / ROOF_LIFT));
}

/** When the roof (and L2 ceiling) lifts, sky + hemi flood the rooms.
 *  Pull interior fill and exposure down so wood floors and furniture stay readable,
 *  while lamp fixtures and window glow remain warm. */
function syncOpenRoofLighting() {
  const t = TOD[timeId];
  const open = openRoofAmount();
  const lampPts = t.lamps * (1 - open * 0.9);
  const fixtureEm = t.lamps * (1 - open * 0.3);
  const warmFill = t.lamps * (1 - open * 0.92);
  const glassEm = t.lamps * (1 - open * 0.1);
  setLampIntensity(mats, fixtureEm);
  mats.warmFill.emissiveIntensity = warmFill * 0.35;
  mats.glassWarm.emissiveIntensity = glassEm * 0.55;
  for (const [src, c] of clipCache) {
    if (hasEmissive(src) && hasEmissive(c)) {
      c.emissive.copy(src.emissive);
      c.emissiveIntensity = src.emissiveIntensity;
    }
  }
  for (const l of rec.lamps) l.intensity = lampPts * (Number(l.userData.base) || 1) * 6.5;
  const expCut = timeId === "day" ? 0.02 : 0.12;
  renderer.toneMappingExposure = t.exposure * (1 - open * expCut);
  hemi.intensity = t.hemi * (1 - open * 0.78);
  amb.intensity = t.ambInt * (1 - open * 0.5);
  fill.intensity = t.fillInt * (1 - open * 0.4);
  // Low-angle dusk sun otherwise rakes the open rooms and washes oak to cream.
  sun.intensity = t.sunInt * (1 - open * 0.45);
  scene.environmentIntensity =
    (timeId === "night" ? 0.25 : timeId === "day" ? 0.7 : 0.5) * (1 - open * 0.82);
  const floorEnv = 0.4 * (1 - open * 0.9);
  mats.floor.envMapIntensity = floorEnv;
  // Mild deepen + a bit more roughness so oak grain reads once the roof is off,
  // without crushing the boards to black.
  const floorCol = 1 - open * 0.16;
  mats.floor.color.setRGB(floorCol, floorCol * 0.96, floorCol * 0.9);
  mats.floor.roughness = 0.48 + open * 0.22;
  for (const [src, c] of clipCache) {
    if (src === mats.floor && c instanceof THREE.MeshStandardMaterial) {
      c.envMapIntensity = floorEnv;
      c.color.copy(mats.floor.color);
      c.roughness = mats.floor.roughness;
    }
  }
  const baseBloom = timeId === "night" ? 0.28 : timeId === "day" ? 0.08 : 0.22;
  bloom.strength = baseBloom * (1 - open * 0.5);
  bloom.threshold = timeId === "night" ? 0.8 : 0.88;
  if (rec.water) {
    const nightish = timeId !== "day";
    // The Reflector is opaque and hides the basin from above; at dusk/night hide it
    // so the emissive teal tint + floor can read, still picking up the sky env map.
    rec.water.pool.visible = !nightish;
    const tint = rec.water.poolTint.material;
    tint.toneMapped = !nightish;
    tint.opacity = nightish ? 0.68 : 0.32;
    tint.emissive.setHex(nightish ? 0x1ab8b0 : 0x0a3a38);
    tint.emissiveIntensity = nightish ? 0.72 : 0.06;
    tint.roughness = nightish ? 0.28 : 0.18;
    if (rec.water.poolFloor) {
      const fl = rec.water.poolFloor.material;
      fl.toneMapped = !nightish;
      fl.emissive.setHex(nightish ? 0x0e8a84 : 0x0a3030);
      fl.emissiveIntensity = nightish ? 0.55 : 0.04;
    }
  }
}

function applyTime(id: TimeId) {
  timeId = id;
  const t = TOD[id];
  applySky(sky, id);
  placeSun(sunDisc, id);
  const dir = new THREE.Vector3(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize();
  sun.position.copy(dir).multiplyScalar(36);
  sun.color.setHex(t.sunColorDir);
  sun.intensity = t.sunInt;
  sun.shadow.intensity = t.shadow;
  hemi.color.setHex(t.hemiSky);
  hemi.groundColor.setHex(t.hemiGround);
  hemi.intensity = t.hemi;
  amb.color.setHex(t.amb);
  amb.intensity = t.ambInt;
  fill.color.setHex(t.fillColor);
  fill.intensity = t.fillInt;
  renderer.toneMappingExposure = t.exposure;
  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.setHex(t.fog);
    scene.fog.density = t.fogDen;
  }
  setNeighborGlow(neighbors, t.windowWarm * 0.85);
  setGrassColor(mats, t.grass);
  if (rec.water) {
    rec.water.overlay.material.color.setHex(t.waterTint);
    rec.water.poolTint.material.color.setHex(id === "day" ? 0x3a6a68 : 0x148a86);
    rec.water.poolTint.material.emissive.setHex(id === "day" ? 0x0a3a38 : 0x2ee0d4);
    if (rec.water.poolFloor) {
      rec.water.poolFloor.material.color.setHex(id === "day" ? 0x1a4a48 : 0x146e6c);
      rec.water.poolFloor.material.emissive.setHex(id === "day" ? 0x0a3030 : 0x1ad8cc);
    }
  }
  syncOpenRoofLighting();
  // Rebuild a small PMREM from the sky on the next frame so boot stays responsive.
  requestAnimationFrame(() => {
    try {
      const tmp = new THREE.Scene();
      const skyClone = sky.mesh.clone();
      skyClone.material = sky.mat;
      tmp.add(skyClone);
      const env = pmrem.fromScene(tmp, 0.04, 0.1, 20);
      scene.environment = env.texture;
    } catch (e) {
      /* env optional */
    }
  });
  document
    .querySelectorAll<HTMLElement>("[data-time]")
    .forEach((b) => b.classList.toggle("active", b.dataset.time === id));
}

function setHouseVisibility() {
  const showAll = mode !== "xray";
  const groupIds = Object.keys(rec.groups) as LayerId[];
  for (const id of groupIds) {
    if (showAll) {
      const systemsHidden: LayerId[] = [
        "framing",
        "masonry",
        "insulation",
        "hvac",
        "electrical",
        "plumbing",
      ];
      rec.groups[id].visible = !systemsHidden.includes(id);
    } else {
      rec.groups[id].visible = id === xrayLayer;
    }
  }
  // context always on
  rec.groups.landscape.visible = true;
  if (mode === "xray" && xrayLayer === "landscape") {
    rec.groups.site.visible = false;
  } else if (mode === "xray" && xrayLayer === "site") {
    rec.groups.landscape.visible = true;
  } else if (mode !== "xray") {
    rec.groups.site.visible = true;
  } else {
    rec.groups.site.visible = xrayLayer === "site";
  }
  neighbors.visible = true;
  waterGrp.visible = true;
  capGroup.visible = mode === "cut";
  sectionBox.visible = mode === "cut";
}

function setMode(next: ViewMode) {
  if (next === mode && next !== "cut") return;
  if (mode === "walk" && next !== "walk") exitWalk();
  if (next !== "walk" && mode !== "boot" && mode !== "walk") prevMode = mode;
  mode = next;
  document
    .querySelectorAll<HTMLElement>("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === next));
  mustEl<HTMLElement>("cut-panel").classList.toggle("show", next === "cut");
  mustEl<HTMLElement>("layer-list").classList.toggle("show", next === "xray");
  mustEl<HTMLElement>("walk-bar").classList.toggle("show", next === "walk");
  mustEl<HTMLElement>("walk-hints").classList.toggle("show", next === "walk");
  setHouseVisibility();
  if (next === "cut") updateCut();
  else {
    clipPlanes.length = 0;
    capGroup.clear();
  }
  if (next === "walk") enterWalk();
  else {
    orbit.enabled = true;
    const c = orbitPreset(next, cutDir);
    lerpCam(c.pos, c.target);
  }
}

function cutRange() {
  if (cutDir === "top") return { min: 0.15, max: 9.2, def: 4.3 };
  if (cutDir === "side") return { min: -11.2, max: 7.0, def: 1.0 };
  return { min: -8.0, max: 8.0, def: 1.2 };
}

function updateCut() {
  if (mode !== "cut") return;
  const plane = new THREE.Plane();
  if (cutDir === "top") plane.set(new THREE.Vector3(0, -1, 0), cutValue);
  else if (cutDir === "side") plane.set(new THREE.Vector3(0, 0, -1), cutValue);
  else plane.set(new THREE.Vector3(-1, 0, 0), cutValue);
  clipPlanes.length = 0;
  clipPlanes.push(plane);
  rebuildCaps(plane);
  rebuildSectionBox();
  mustEl<HTMLElement>("cut-meter").textContent = `${cutValue.toFixed(1)} m`;
}

function rebuildCaps(plane: THREE.Plane) {
  capGroup.clear();
  const n = plane.normal;
  const axis = Math.abs(n.y) > 0.5 ? "y" : Math.abs(n.z) > 0.5 ? "z" : "x";
  const c = cutValue;
  const positions: number[][] = [];
  for (const b of rec.clipBoxes) {
    if (axis === "y") {
      if (c <= b.min.y + 0.001 || c >= b.max.y - 0.001) continue;
      positions.push(rect(b.min.x, b.min.z, b.max.x, b.max.z, "y", c));
    } else if (axis === "z") {
      if (c <= b.min.z + 0.001 || c >= b.max.z - 0.001) continue;
      positions.push(rect(b.min.x, b.min.y, b.max.x, b.max.y, "z", c));
    } else {
      if (c <= b.min.x + 0.001 || c >= b.max.x - 0.001) continue;
      positions.push(rect(b.min.z, b.min.y, b.max.z, b.max.y, "x", c));
    }
  }
  if (!positions.length) return;
  const geom = new THREE.BufferGeometry();
  const arr = new Float32Array(positions.length * 18);
  let i = 0;
  for (const p of positions) {
    for (const v of p) arr[i++] = v;
  }
  geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, mats.sectionCap);
  mesh.renderOrder = 2;
  capGroup.add(mesh);
}

function rect(
  a0: number,
  b0: number,
  a1: number,
  b1: number,
  axis: "x" | "y" | "z",
  c: number,
): number[] {
  // two triangles
  const q: Array<[number, number]> = [
    [a0, b0],
    [a1, b0],
    [a1, b1],
    [a0, b0],
    [a1, b1],
    [a0, b1],
  ];
  const out: number[] = [];
  for (const [u, v] of q) {
    if (axis === "y") out.push(u, c, v);
    else if (axis === "z") out.push(u, v, c);
    else out.push(c, v, u);
  }
  return out;
}

function rebuildSectionBox() {
  sectionBox.clear();
  const box = new THREE.Box3(
    new THREE.Vector3(-8.0, -0.2, -11.2),
    new THREE.Vector3(7.5, 9.0, 7.0),
  );
  const helper = new THREE.Box3Helper(box, 0xd0d6dc);
  const helperMat = helper.material as THREE.LineBasicMaterial;
  helperMat.transparent = true;
  helperMat.opacity = 0.55;
  sectionBox.add(helper);
  // cut plane rectangle
  const g = new THREE.BufferGeometry();
  let pts;
  if (cutDir === "top") {
    pts = [
      -8,
      cutValue,
      -11.2,
      7.5,
      cutValue,
      -11.2,
      7.5,
      cutValue,
      7,
      -8,
      cutValue,
      7,
      -8,
      cutValue,
      -11.2,
    ];
  } else if (cutDir === "side") {
    pts = [
      -8,
      -0.2,
      cutValue,
      7.5,
      -0.2,
      cutValue,
      7.5,
      9,
      cutValue,
      -8,
      9,
      cutValue,
      -8,
      -0.2,
      cutValue,
    ];
  } else {
    pts = [
      cutValue,
      -0.2,
      -11.2,
      cutValue,
      -0.2,
      7,
      cutValue,
      9,
      7,
      cutValue,
      9,
      -11.2,
      cutValue,
      -0.2,
      -11.2,
    ];
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const line = new THREE.Line(g, mats.sectionLine);
  sectionBox.add(line);
}

// ——— Walkthrough ———
const walk = {
  on: false,
  yaw: Math.PI,
  pitch: 0.04,
  vel: new THREE.Vector3(),
  keys: {} as Record<string, boolean | undefined>,
  vy: 0,
  grounded: true,
  pointer: false,
};
const walkStart = CAM.walkStart;

function enterWalk() {
  walk.on = true;
  walk.yaw = walkStart.yaw;
  walk.pitch = walkStart.pitch;
  orbit.enabled = false;
  camera.position.set(
    walkStart.pos[0],
    heightAt(rec, walkStart.pos[0], walkStart.pos[2]) + EYE,
    walkStart.pos[2],
  );
  applyWalkLook();
  canvas.style.cursor = "grab";
}

function exitWalk() {
  walk.on = false;
  walk.pointer = false;
  orbit.enabled = true;
  canvas.style.cursor = "";
  if (document.pointerLockElement) document.exitPointerLock();
}

function applyWalkLook() {
  const cy = Math.cos(walk.pitch);
  const dx = Math.sin(walk.yaw) * cy;
  const dy = Math.sin(walk.pitch);
  const dz = -Math.cos(walk.yaw) * cy;
  camera.lookAt(camera.position.x + dx, camera.position.y + dy, camera.position.z + dz);
  orbit.target.copy(camera.position).add(new THREE.Vector3(dx, dy, dz).multiplyScalar(4));
}

function resolveCollision(p: THREE.Vector3, r = 0.28) {
  for (const c of rec.collisions) {
    if (p.y + 0.4 < c.y0 || p.y - 1.2 > c.y1) continue;
    const x0 = c.x0 - r,
      x1 = c.x1 + r,
      z0 = c.z0 - r,
      z1 = c.z1 + r;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
      const l = p.x - x0,
        ri = x1 - p.x,
        bo = p.z - z0,
        t = z1 - p.z;
      const m = Math.min(l, ri, bo, t);
      if (m === l) p.x = x0;
      else if (m === ri) p.x = x1;
      else if (m === bo) p.z = z0;
      else p.z = z1;
    }
  }
  // water / pool barrier
  if (p.z < WATER_EDGE + 0.35) {
    const onDock = rec.floors.some(
      (f) => f.y > 0.2 && p.x >= f.x0 && p.x <= f.x1 && p.z >= f.z0 && p.z <= f.z1,
    );
    if (!onDock) p.z = WATER_EDGE + 0.35;
  }
}

function toggleNearestDoor() {
  let best: (typeof rec.doors)[number] | null = null,
    bd = 2.2;
  for (const d of rec.doors) {
    const dx = d.x - camera.position.x;
    const dz = d.z - camera.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < bd && camera.position.y > d.y0 - 0.5 && camera.position.y < d.y1 + 0.8) {
      best = d;
      bd = dist;
    }
  }
  if (best) best.target = best.target > 0.5 ? 0 : 1;
}

function updateWalk(dt: number) {
  if (!walk.on) return;
  const speed = walk.keys.Shift ? 4.6 : 2.6;
  const fwd = new THREE.Vector3(Math.sin(walk.yaw), 0, -Math.cos(walk.yaw));
  const right = new THREE.Vector3(Math.cos(walk.yaw), 0, Math.sin(walk.yaw));
  const move = new THREE.Vector3();
  if (walk.keys.KeyW || walk.keys.ArrowUp) move.add(fwd);
  if (walk.keys.KeyS || walk.keys.ArrowDown) move.sub(fwd);
  if (walk.keys.KeyD || walk.keys.ArrowRight) move.add(right);
  if (walk.keys.KeyA || walk.keys.ArrowLeft) move.sub(right);
  if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);
  const p = camera.position.clone().add(move);
  resolveCollision(p);
  const ground = heightAt(rec, p.x, p.z);
  if (walk.keys.Space && walk.grounded) {
    walk.vy = 4.2;
    walk.grounded = false;
  }
  walk.vy -= 14 * dt;
  let y = camera.position.y + walk.vy * dt;
  const eye = ground + EYE;
  if (y <= eye) {
    y = eye;
    walk.vy = 0;
    walk.grounded = true;
  }
  camera.position.set(p.x, y, p.z);
  applyWalkLook();
}

// doors animate
function updateDoors(dt: number) {
  for (const d of rec.doors) {
    d.open += (d.target - d.open) * Math.min(1, dt * 6);
    d.leaf.rotation.y = -d.open * Math.PI * 0.72 * (d.hingeSign || 1);
  }
}

// ——— Hotspots ———
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const hotLabel = mustEl<HTMLElement>("hot-label");
const outline = new THREE.BoxHelper(new THREE.Object3D());
outline.material.color.set(0xffffff);
outline.material.linewidth = 2;
outline.visible = false;
scene.add(outline);
let hoverHot: {
  position: THREE.Vector3;
  object?: THREE.Object3D;
  labelZh: string;
  labelEn: string;
} | null = null;

const hotHits: THREE.Mesh[] = [];
for (const h of rec.hotspots) {
  const s = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  s.position.copy(h.position);
  s.userData.hot = h;
  scene.add(s);
  hotHits.push(s);
}

function updateHotspots(ev: MouseEvent) {
  if (mode === "walk" || mode === "xray") {
    outline.visible = false;
    hotLabel.style.display = "none";
    return;
  }
  const r = canvas.getBoundingClientRect();
  mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(hotHits, false);
  if (hits.length) {
    const h = hits[0]!.object.userData.hot as (typeof rec.hotspots)[number];
    hoverHot = h;
    if (h.object) {
      outline.setFromObject(h.object);
      outline.visible = true;
    }
    const v = h.position.clone().project(camera);
    hotLabel.style.display = "block";
    hotLabel.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
    hotLabel.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
    hotLabel.textContent = `${h.labelZh}  ${h.labelEn}`;
  } else {
    hoverHot = null;
    outline.visible = false;
    hotLabel.style.display = "none";
  }
}

function updateHotLabelPos() {
  if (!hoverHot) return;
  const v = hoverHot.position.clone().project(camera);
  hotLabel.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
  hotLabel.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
}

// ——— UI ———
function buildLayerList() {
  const el = mustEl<HTMLElement>("layer-list");
  el.innerHTML = "";
  for (const L of LAYERS) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.layer = L.id;
    b.innerHTML = `${L.en}<span class="zh">${L.zh}</span>`;
    if (L.id === xrayLayer) b.classList.add("active");
    b.addEventListener("click", () => {
      xrayLayer = L.id;
      el.querySelectorAll("button").forEach((x) =>
        x.classList.toggle("active", x.dataset.layer === L.id),
      );
      setHouseVisibility();
    });
    el.appendChild(b);
  }
}
buildLayerList();

document.querySelectorAll<HTMLElement>("[data-view]").forEach((b) => {
  b.addEventListener("click", () => {
    if (isViewMode(b.dataset.view)) setMode(b.dataset.view);
  });
});
document.querySelectorAll<HTMLElement>("[data-time]").forEach((b) => {
  b.addEventListener("click", () => {
    if (isTimeId(b.dataset.time)) applyTime(b.dataset.time);
  });
});
mustEl<HTMLElement>("btn-reset").addEventListener("click", resetView);
mustEl<HTMLElement>("btn-reset-dial").addEventListener("click", resetView);
function resetView() {
  if (mode === "walk") setMode(prevMode);
  const c = orbitPreset(mode, cutDir);
  lerpCam(c.pos, c.target, 0.7);
}

const help = mustEl<HTMLElement>("help");
const helpBg = mustEl<HTMLElement>("help-bg");
mustEl<HTMLElement>("btn-help").addEventListener("click", () => {
  help.classList.add("show");
  helpBg.classList.add("show");
});
function closeHelp() {
  help.classList.remove("show");
  helpBg.classList.remove("show");
}
mustEl<HTMLElement>("help-close").addEventListener("click", closeHelp);
helpBg.addEventListener("click", closeHelp);

document.querySelectorAll<HTMLElement>("#cut-panel [data-cut]").forEach((b) => {
  b.addEventListener("click", () => {
    if (!isCutDir(b.dataset.cut)) return;
    cutDir = b.dataset.cut;
    document
      .querySelectorAll("#cut-panel [data-cut]")
      .forEach((x) => x.classList.toggle("active", x === b));
    const r = cutRange();
    cutValue = r.def;
    const sl = mustEl<HTMLInputElement>("cut-slider");
    const t = (cutValue - r.min) / (r.max - r.min);
    sl.value = String(t * 100);
    updateCut();
    const key = cutDir === "side" ? "cutSide" : cutDir === "front" ? "cutFront" : "cut";
    lerpCam(CAM[key].pos, CAM[key].target, 0.8);
  });
});
mustEl<HTMLInputElement>("cut-slider").addEventListener("input", (e) => {
  const r = cutRange();
  const value = (e.target as HTMLInputElement).value;
  cutValue = r.min + (Number(value) / 100) * (r.max - r.min);
  updateCut();
});
mustEl<HTMLElement>("btn-return").addEventListener("click", () => setMode(prevMode || "exploded"));

window.addEventListener("keydown", (e) => {
  walk.keys[e.code] = true;
  if (e.code === "Escape") {
    if (help.classList.contains("show")) closeHelp();
    else if (mode === "walk") setMode(prevMode || "exploded");
  }
  if ((e.code === "KeyE" || e.code === "KeyF") && mode === "walk") toggleNearestDoor();
});
window.addEventListener("keyup", (e) => {
  walk.keys[e.code] = false;
});

canvas.addEventListener("mousemove", (e) => {
  updateHotspots(e);
  if (walk.on && walk.pointer) {
    /* pointer lock handles */
  }
});
let draggingLook = false,
  lx = 0,
  ly = 0;
canvas.addEventListener("mousedown", (e) => {
  if (!walk.on) return;
  if (e.button === 0) {
    draggingLook = true;
    lx = e.clientX;
    ly = e.clientY;
    try {
      canvas.requestPointerLock();
    } catch (_) {
      /* ignore */
    }
  }
});
document.addEventListener("pointerlockchange", () => {
  walk.pointer = document.pointerLockElement === canvas;
});
window.addEventListener("mousemove", (e) => {
  if (!walk.on) return;
  let dx = 0,
    dy = 0;
  if (walk.pointer) {
    dx = e.movementX;
    dy = e.movementY;
  } else if (draggingLook) {
    dx = e.clientX - lx;
    dy = e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
  } else return;
  walk.yaw -= dx * 0.0022;
  walk.pitch -= dy * 0.0022;
  walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch));
  applyWalkLook();
});
window.addEventListener("mouseup", () => {
  draggingLook = false;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
});

// ——— Loop ———
const clock = new THREE.Clock();
let roofTarget = ROOF_LIFT;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  roofTarget = mode === "exploded" ? ROOF_LIFT : 0;
  roofY += (roofTarget - roofY) * Math.min(1, dt * 5.5);
  rec.roofGroup.position.y = roofY;
  syncOpenRoofLighting();

  if (camState.active && !walk.on) {
    camState.t += dt / camState.dur;
    const u = camState.t >= 1 ? 1 : camState.t * camState.t * (3 - 2 * camState.t);
    camera.position.lerpVectors(camState.p0, camState.p1, u);
    orbit.target.lerpVectors(camState.t0, camState.t1, u);
    if (camState.t >= 1) camState.active = false;
  }
  if (walk.on) updateWalk(dt);
  else orbit.update();
  updateDoors(dt);
  updateHotLabelPos();
  composer.render();
}

// ——— Boot ———
function hideLoader() {
  const el = mustEl<HTMLElement>("loader");
  el.classList.add("gone");
  setTimeout(() => {
    el.remove();
  }, 700);
}
mustEl<HTMLElement>("skip").addEventListener("click", hideLoader);

applyTime("dusk");
setMode("exploded");
setHouseVisibility();
mustEl<HTMLElement>("loadbar").style.width = "100%";
animate();
setTimeout(hideLoader, 900);

// Screenshot / automation hook
const demo: DemoApi = {
  setMode,
  applyTime,
  setLayer(id: LayerId) {
    xrayLayer = id;
    document
      .querySelectorAll<HTMLElement>("#layer-list button")
      .forEach((x) => x.classList.toggle("active", x.dataset.layer === id));
    setHouseVisibility();
  },
  setCut(dir: CutDir, value: number) {
    if (mode !== "cut") setMode("cut");
    cutDir = dir;
    cutValue = value;
    document
      .querySelectorAll<HTMLElement>("#cut-panel [data-cut]")
      .forEach((x) => x.classList.toggle("active", x.dataset.cut === dir));
    const r = cutRange();
    mustEl<HTMLInputElement>("cut-slider").value = String(
      ((value - r.min) / (r.max - r.min)) * 100,
    );
    updateCut();
    const preset = CAM[dir === "side" ? "cutSide" : dir === "front" ? "cutFront" : "cut"];
    camera.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    orbit.target.set(preset.target[0], preset.target[1], preset.target[2]);
    orbit.update();
    camState.active = false;
  },
  snapCam(pos: Vec3 | number[], target: Vec3 | number[]) {
    camera.position.set(pos[0]!, pos[1]!, pos[2]!);
    orbit.target.set(target[0]!, target[1]!, target[2]!);
    orbit.update();
    camState.active = false;
  },
  walkTo(x: number, z: number, yaw: number) {
    if (mode !== "walk") setMode("walk");
    camState.active = false;
    camera.position.set(x, heightAt(rec, x, z) + EYE, z);
    walk.yaw = yaw;
    walk.pitch = 0.02;
    applyWalkLook();
  },
  openDoor() {
    rec.doors.forEach((d) => {
      if (d.style === "pivot") d.target = 1;
    });
  },
  setRoof(y: number) {
    roofY = y;
    rec.roofGroup.position.y = y;
    syncOpenRoofLighting();
  },
  get state() {
    return { mode, timeId, xrayLayer, cutDir, cutValue, roofY };
  },
};
window.__demo = demo;
