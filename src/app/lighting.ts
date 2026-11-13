import * as THREE from "three";
import { ROOF_LIFT, TOD } from "../config";
import { setGrassColor, setLampIntensity } from "../scene/materials";
import { applySky, placeSun } from "../scene/sky";
import { setNeighborGlow } from "../scene/site/neighbors";
import type { TimeId } from "../types";
import type { Session } from "./session";

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
  const floorEnv = 0.4 * (1 - open * 0.9);
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
  if (s.rec.water) {
    const nightish = s.timeId !== "day";
    s.rec.water.pool.visible = !nightish;
    const tint = s.rec.water.poolTint.material;
    tint.toneMapped = !nightish;
    tint.opacity = nightish ? 0.72 : 0.32;
    tint.emissive.setHex(nightish ? 0x1ec4ba : 0x0a3a38);
    tint.emissiveIntensity = nightish ? 0.85 : 0.06;
    tint.roughness = nightish ? 0.22 : 0.18;
    const fl = s.rec.water.poolFloor.material;
    fl.toneMapped = !nightish;
    fl.emissive.setHex(nightish ? 0x128f88 : 0x0a3030);
    fl.emissiveIntensity = nightish ? 0.7 : 0.04;
  }
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
    if (o.name === "poolLight") o.intensity = t.poolGlow * (id === "day" ? 0.12 : 2.6);
  });
  s.mats.pathLight.emissiveIntensity = t.lamps * 1.8;
  s.mats.poolTile.emissiveIntensity = t.poolGlow * (id === "day" ? 0.05 : 0.9);
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
  setNeighborGlow(s.neighbors, t.windowWarm * 0.9);
  setGrassColor(s.mats, t.grass);
  syncLawnBands(s);
  namedLights(s, id);
  if (s.rec.water) {
    s.rec.water.overlay.material.color.setHex(t.waterTint);
    s.rec.water.poolTint.material.color.setHex(id === "day" ? 0x3a6a68 : 0x148a86);
    s.rec.water.poolTint.material.emissive.setHex(id === "day" ? 0x0a3a38 : 0x2ee0d4);
    s.rec.water.poolFloor.material.color.setHex(id === "day" ? 0x1a4a48 : 0x146e6c);
    s.rec.water.poolFloor.material.emissive.setHex(id === "day" ? 0x0a3030 : 0x1ad8cc);
  }
  syncOpenRoofLighting(s);
  requestAnimationFrame(() => {
    try {
      const tmp = new THREE.Scene();
      const skyClone = s.sky.mesh.clone();
      skyClone.material = s.sky.mat;
      tmp.add(skyClone);
      const env = s.pmrem.fromScene(tmp, 0.04, 0.1, 20);
      s.scene.environment = env.texture;
    } catch {
      /* environment map is optional */
    }
  });
  document
    .querySelectorAll<HTMLElement>("[data-time]")
    .forEach((b) => b.classList.toggle("active", b.dataset.time === id));
}
