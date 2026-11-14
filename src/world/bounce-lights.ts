import * as THREE from "three";
import { RectAreaLightTexturesLib } from "three/addons/lights/RectAreaLightTexturesLib.js";
import { float, positionWorld, smoothstep, uniform, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";
import { RectAreaLightNode } from "three/webgpu";
import { TOD } from "@/config";
import type { TimeId } from "@/types";
import {
  BOUNCE_PANELS,
  emissionBasis,
  evaluateBounce,
  driveFromRecipe,
  type BounceBox,
  type BouncePanel,
} from "./bounce";

function makeChannels() {
  return {
    r: uniform(0),
    g: uniform(0),
    b: uniform(0),
    gain: uniform(1),
  };
}

type Channels = ReturnType<typeof makeChannels>;

interface BounceEntry {
  panel: BouncePanel;
  area: THREE.RectAreaLight | null;
  point: THREE.PointLight | null;
  channels: Channels | null;
}

const byScene = new WeakMap<THREE.Scene, BounceEntry[]>();

let areaReady: boolean | null = null;

function ensureAreaLights(): boolean {
  if (areaReady !== null) return areaReady;
  try {
    RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
    areaReady = true;
  } catch (error) {
    console.warn("Rect area bounce unavailable; using contained point lights.", error);
    areaReady = false;
  }
  return areaReady;
}

function axisMask(coord: (typeof positionWorld)["x"], min: number, max: number, feather: number) {
  const enter = smoothstep(float(min - feather), float(min), coord);
  const leave = smoothstep(float(max), float(max + feather), coord);
  return enter.mul(float(1).sub(leave));
}

function roomMask(box: BounceBox, feather: number, featherY: number) {
  return axisMask(positionWorld.x, box.minX, box.maxX, feather)
    .mul(axisMask(positionWorld.y, box.minY, box.maxY, featherY))
    .mul(axisMask(positionWorld.z, box.minZ, box.maxZ, feather));
}

function orient(light: THREE.RectAreaLight, panel: BouncePanel) {
  const basis = emissionBasis(
    [panel.nx, panel.ny, panel.nz],
    [panel.axisX, panel.axisY, panel.axisZ],
  );
  const matrix = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(basis.x.x, basis.x.y, basis.x.z),
    new THREE.Vector3(basis.y.x, basis.y.y, basis.y.z),
    new THREE.Vector3(basis.z.x, basis.z.y, basis.z.z),
  );
  light.quaternion.setFromRotationMatrix(matrix);
}

function addArea(
  parent: THREE.Object3D,
  panel: BouncePanel,
): { light: THREE.RectAreaLight; channels: Channels } {
  const light = new THREE.RectAreaLight(0xffffff, 1, panel.width, panel.height);
  light.name = "bounce";
  light.position.set(panel.x, panel.y, panel.z);
  orient(light, panel);
  const channels = makeChannels();
  const tinted = light as THREE.RectAreaLight & { colorNode?: Node };
  tinted.colorNode = vec3(channels.r, channels.g, channels.b)
    .mul(channels.gain)
    .mul(roomMask(panel.box, panel.feather, panel.featherY));
  parent.add(light);
  return { light, channels };
}

function addPoint(parent: THREE.Object3D, panel: BouncePanel): THREE.PointLight {
  const dx = panel.box.maxX - panel.box.minX;
  const dy = panel.box.maxY - panel.box.minY;
  const dz = panel.box.maxZ - panel.box.minZ;
  const distance = Math.min(6.2, Math.max(dx, dy, dz) * 0.55);
  const light = new THREE.PointLight(0xffffff, 0, distance, 2);
  light.name = "bounce";
  light.position.set(panel.x, panel.y, panel.z);
  light.castShadow = false;
  parent.add(light);
  return light;
}

/**
 * Indirect panels for the house and court. Rect lights are the real path.
 * If the LTC tables cannot be built, the same luminances fall back to short
 * point lights so the frame still draws.
 */
export function addBounceLights(scene: THREE.Scene) {
  const area = ensureAreaLights();
  const entries: BounceEntry[] = [];
  for (const panel of BOUNCE_PANELS) {
    if (area) {
      const { light, channels } = addArea(scene, panel);
      entries.push({ panel, area: light, point: null, channels });
    } else {
      entries.push({ panel, area: null, point: addPoint(scene, panel), channels: null });
    }
  }
  byScene.set(scene, entries);
  syncBounceLights(scene, "dusk", 0);
}

/** Push panel luminance. Call when the time of day or the roof opening changes, not every frame. */
export function syncBounceLights(scene: THREE.Scene, timeId: TimeId, open: number) {
  const entries = byScene.get(scene);
  if (!entries) return;
  const drive = driveFromRecipe(TOD[timeId]);
  const openAmt = Math.min(1, Math.max(0, open));
  for (const entry of entries) {
    const lit = evaluateBounce(entry.panel, drive);
    const roof = entry.panel.outdoor ? 1 - openAmt * 0.12 : 1 - openAmt * 0.78;
    const channels = entry.channels;
    if (entry.area && channels) {
      channels.r.value = lit.r;
      channels.g.value = lit.g;
      channels.b.value = lit.b;
      channels.gain.value = roof;
      continue;
    }
    const point = entry.point;
    if (!point) continue;
    const peak = Math.max(lit.r, lit.g, lit.b, 1e-4);
    point.color.setRGB(lit.r / peak, lit.g / peak, lit.b / peak);
    point.intensity = peak * roof * 3.2;
  }
}
