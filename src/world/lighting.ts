import * as THREE from "three";
import { ROOF_LIFT, TOD } from "@/config";
import { setGrassColor, setLampIntensity } from "@/materials";
import { applySky, placeSun } from "@/scene/sky";
import type { TimeId } from "@/types";
import type { Session } from "./session";

/**
 * Fog density before the first `applyTime`. Dusk color and the other lights come from
 * `TOD.dusk`; this density is the pre-frame value and is replaced before anything draws.
 */
const INITIAL_FOG_DENSITY = 0.018;

export function createDuskLights(scene: THREE.Scene) {
  const dusk = TOD.dusk;
  scene.fog = new THREE.FogExp2(dusk.fog, INITIAL_FOG_DENSITY);
  const hemi = new THREE.HemisphereLight(dusk.hemiSky, dusk.hemiGround, dusk.hemi);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(dusk.amb, dusk.ambInt);
  scene.add(amb);
  const sun = new THREE.DirectionalLight(dusk.sunColorDir, dusk.sunInt);
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
  const fill = new THREE.DirectionalLight(dusk.fillColor, dusk.fillInt);
  fill.position.set(8, 10, -14);
  scene.add(fill);
  return { hemi, amb, sun, fill };
}

const ROOM_BOUNCE: ReadonlyArray<readonly [number, number, number]> = [
  [-4.2, 1.65, 1.8],
  [4.6, 1.7, 1.4],
  [-4.4, 1.55, -7.4],
  [1.1, 4.85, -6.1],
];

export function addRoomBounce(parent: THREE.Object3D) {
  for (const [x, y, z] of ROOM_BOUNCE) {
    const light = new THREE.PointLight(0xfff0dc, 0, 5.2, 2);
    light.name = "roomBounce";
    light.position.set(x, y, z);
    light.castShadow = false;
    parent.add(light);
  }
}

function hasEmissive(mat: THREE.Material): mat is THREE.MeshStandardMaterial {
  return "emissive" in mat && (mat as THREE.MeshStandardMaterial).emissive instanceof THREE.Color;
}

function syncClone(s: Session, src: THREE.Material) {
  const c = s.clipCache.get(src);
  if (!(src instanceof THREE.MeshStandardMaterial) || !(c instanceof THREE.MeshStandardMaterial))
    return;
  c.color.copy(src.color);
  c.roughness = src.roughness;
  c.emissive.copy(src.emissive);
  c.emissiveIntensity = src.emissiveIntensity;
  c.envMapIntensity = src.envMapIntensity;
}

export function syncOpenRoofLighting(s: Session) {
  const t = TOD[s.timeId];
  const open = Math.max(0, Math.min(1, s.roofY / ROOF_LIFT));
  const lampPts = t.lamps * (1 - open * 0.9);
  const fixtureEm = t.lamps * (1 - open * 0.3);
  const warmFill = t.lamps * (1 - open * 0.92);
  const glassEm = t.lamps * (1 - open * 0.1);
  setLampIntensity(s.mats, fixtureEm);
  s.mats.warmFill.emissiveIntensity = warmFill * 0.35;
  s.mats.glassWarm.emissiveIntensity = glassEm * 0.55;
  for (const [src, c] of s.clipCache) {
    if (hasEmissive(src) && hasEmissive(c)) {
      c.emissive.copy(src.emissive);
      c.emissiveIntensity = src.emissiveIntensity;
    }
  }
  for (const l of s.rec.lamps) l.intensity = lampPts * (Number(l.userData.base) || 1) * 6.5;
  const expCut = s.timeId === "day" ? 0.02 : 0.12;
  s.renderer.toneMappingExposure = t.exposure * (1 - open * expCut);
  s.hemi.intensity = t.hemi * (1 - open * 0.78);
  s.amb.intensity = t.ambInt * (1 - open * 0.5);
  s.fill.intensity = t.fillInt * (1 - open * 0.4);
  s.sun.intensity = t.sunInt * (1 - open * 0.45);
  s.scene.environmentIntensity =
    (s.timeId === "night" ? 0.32 : s.timeId === "day" ? 0.7 : 0.5) * (1 - open * 0.82);
  const floorEnv = 0.62 * (1 - open * 0.9);
  s.mats.floor.envMapIntensity = floorEnv;
  const floorCol = 1 - open * 0.16;
  s.mats.floor.color.setRGB(floorCol, floorCol * 0.96, floorCol * 0.9);
  s.mats.floor.roughness = 0.48 + open * 0.22;
  const wood = 0.9 - open * 0.14;
  s.mats.woodMid.color.setRGB(wood, wood * 0.96, wood * 0.88);
  s.mats.woodMid.roughness = 0.52 + open * 0.12;
  syncClone(s, s.mats.floor);
  syncClone(s, s.mats.woodMid);
  const baseBloom = s.timeId === "night" ? 0.34 : s.timeId === "day" ? 0.08 : 0.22;
  s.bloom.strength = baseBloom * (1 - open * 0.45);
  s.bloom.threshold = s.timeId === "night" ? 0.72 : 0.88;
  s.bloom.radius = 0.35;
  if (s.rec.water) {
    const glow = t.poolGlow;
    const tint = s.rec.water.poolTint.material;
    tint.toneMapped = true;
    tint.opacity = 0.7;
    tint.color.setHex(glow > 0.5 ? 0x12383c : 0x1c4e52);
    tint.emissive.setHex(0x08302e);
    tint.emissiveIntensity = 0.03 + glow * 0.05;
    tint.roughness = 0.07;
    tint.metalness = 0.04;
    const fl = s.rec.water.poolFloor.material;
    fl.toneMapped = true;
    fl.color.setHex(glow > 0.5 ? 0x2a6e68 : 0x4a948c);
    fl.emissive.setHex(0x146860);
    fl.emissiveIntensity = 0.08 + glow * 0.42;
    const lit = glow > 0.5;
    const mid = s.rec.water.poolMid.material;
    mid.toneMapped = true;
    mid.color.setHex(lit ? 0x245e58 : 0x387870);
    mid.emissive.setHex(0x146458);
    mid.emissiveIntensity = lit ? 0.4 : 0.06;
    const deep = s.rec.water.poolDeep.material;
    deep.toneMapped = true;
    deep.color.setHex(lit ? 0x2a7068 : 0x3a8478);
    deep.emissive.setHex(0x1c8878);
    deep.emissiveIntensity = lit ? 0.48 : 0.07;
    const cau = s.rec.water.caustic.material;
    cau.opacity = 0.1 + glow * 0.08;
    cau.emissiveIntensity = 0.04 + glow * 0.14;
    const sheen = s.rec.water.poolSheen;
    sheen.visible = false;
    sheen.material.opacity = 0;
  }
  if (s.mode === "walk") {
    s.renderer.toneMappingExposure *= 0.72;
    s.bloom.strength *= 0.3;
    s.bloom.threshold = Math.max(s.bloom.threshold, 0.98);
    s.mats.lampBulb.emissiveIntensity *= 0.22;
    s.mats.lampShade.emissiveIntensity *= 0.4;
    for (const l of s.rec.lamps) {
      const walkScale = Number(l.userData.walk);
      l.intensity *= 0.34 * (Number.isFinite(walkScale) ? walkScale : 1);
    }
  }
  s.bloomNode.strength.value = s.bloom.strength;
  s.bloomNode.threshold.value = s.bloom.threshold;
  s.bloomNode.radius.value = s.bloom.radius;
}

function syncLawnBands(s: Session) {
  const tint = s.mats.grass.color;
  s.scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material;
    if (!(mat instanceof THREE.MeshStandardMaterial) || mat.name !== "lawnBand") return;
    const scale = mat.userData.scale;
    mat.color.copy(tint).multiplyScalar(typeof scale === "number" ? scale : 1);
  });
}

function namedLights(s: Session, id: TimeId) {
  const t = TOD[id];
  s.scene.traverse((o) => {
    if (!(o instanceof THREE.PointLight)) return;
    if (o.name === "pathLight") o.intensity = t.lamps * 1.7;
    if (o.name === "poolLight") o.intensity = t.poolGlow * (id === "day" ? 0.08 : 0.85);
    if (o.name === "roomBounce") {
      o.intensity = id === "day" ? 0.24 : id === "dawn" ? 0.16 : id === "dusk" ? 0.12 : 0.05;
      o.color.setHex(id === "day" ? 0xd5e4f4 : id === "night" ? 0xffd8b0 : 0xffc8a4);
    }
  });
  s.mats.pathLight.emissiveIntensity = t.lamps * 1.8;
  s.mats.poolTile.emissiveIntensity = t.poolGlow * (id === "day" ? 0.03 : 0.26);
}

export function applyTime(s: Session, id: TimeId) {
  s.timeId = id;
  const t = TOD[id];
  applySky(s.sky, id);
  placeSun(s.sunDisc, id);
  const dir = new THREE.Vector3(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize();
  s.sun.position.copy(dir).multiplyScalar(36);
  s.sun.color.setHex(t.sunColorDir);
  s.sun.intensity = t.sunInt;
  s.sun.shadow.intensity = t.shadow;
  s.hemi.color.setHex(t.hemiSky);
  s.hemi.groundColor.setHex(t.hemiGround);
  s.hemi.intensity = t.hemi;
  s.amb.color.setHex(t.amb);
  s.amb.intensity = t.ambInt;
  s.fill.color.setHex(t.fillColor);
  s.fill.intensity = t.fillInt;
  s.renderer.toneMappingExposure = t.exposure;
  if (s.scene.fog instanceof THREE.FogExp2) {
    s.scene.fog.color.setHex(id === "day" ? 0xe6dfd4 : t.fog);
    s.scene.fog.density = t.fogDen;
  }
  setGrassColor(s.mats, t.grass);
  syncLawnBands(s);
  namedLights(s, id);
  if (s.rec.water) s.rec.water.overlay.material.color.setHex(t.waterTint);
  if (!s.envCache.has(id)) {
    const tmp = new THREE.Scene();
    const skyClone = s.sky.mesh.clone();
    skyClone.material = s.sky.mat;
    tmp.add(skyClone);
    s.envCache.set(id, s.pmrem.fromScene(tmp, 0.06, 1, 600));
  }
  const env = s.envCache.get(id);
  if (!env) throw new Error(`missing environment for ${id}`);
  s.envTarget = env;
  s.scene.environment = env.texture;
  syncOpenRoofLighting(s);
  document
    .querySelectorAll<HTMLElement>("[data-time]")
    .forEach((b) => b.classList.toggle("active", b.dataset.time === id));
}
