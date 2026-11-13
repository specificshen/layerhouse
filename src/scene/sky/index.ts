import * as THREE from "three";
import {
  abs,
  cameraPosition,
  color,
  dot,
  exp,
  float,
  max,
  mix,
  normalize,
  positionWorld,
  pow,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { TOD } from "../../config";
import type { TimeId } from "../../types";

const uTop = uniform(new THREE.Color());
const uHorizon = uniform(new THREE.Color());
const uBottom = uniform(new THREE.Color());
const uSunColor = uniform(new THREE.Color());
const uSunDir = uniform(new THREE.Vector3(0, 1, 0));
const uDayZenith = uniform(color(0x3a7dba));
const uDayHaze = uniform(color(0xf0e4d4));
const uGlow = uniform(1);
const uSunSharp = uniform(256);
const uCloud = uniform(0.4);
const uDay = uniform(0);

function nightSky(dir: Node<"vec3">, h: Node<"float">) {
  let col = mix(uHorizon, uTop, smoothstep(0, 0.72, max(h, float(0))));
  col = mix(uBottom, col, smoothstep(-0.22, 0.06, h));
  col = col.add(uHorizon.mul(float(0.18)).mul(exp(abs(h).mul(-8))));
  const cuv = vec2(dir.x, dir.z).div(max(h.add(0.35), float(0.08)));
  const c1 = sin(cuv.x.mul(1.6).add(cuv.y.mul(0.55)));
  const c2 = sin(cuv.x.mul(3.2).sub(cuv.y.mul(2.3)));
  const c3 = sin(cuv.x.add(cuv.y).mul(0.8));
  let clouds = smoothstep(0.55, 0.92, c1.mul(0.55).add(c2.mul(0.3)).add(c3.mul(0.2)));
  clouds = clouds.mul(smoothstep(0.18, 0.55, h));
  const cloudCol = mix(uHorizon, vec3(0.97, 0.98, 1), float(0.45));
  col = mix(col, cloudCol, clouds.mul(uCloud).mul(0.85));
  const sunD = normalize(uSunDir);
  const mu = max(dot(dir, sunD), float(0));
  const disc = pow(mu, uSunSharp);
  const glow = pow(mu, float(12)).mul(uGlow);
  const haze = pow(mu, float(4)).mul(uGlow).mul(0.35);
  col = col.add(uSunColor.mul(disc.mul(2.6).add(glow).add(haze)));
  return vec3(mix(col, uBottom, smoothstep(0, -0.4, h).mul(0.35)));
}

function daySky(dir: Node<"vec3">, h: Node<"float">) {
  const elev = max(h, float(0));
  const t = smoothstep(0, 0.13, elev);
  let col = mix(uDayHaze, uDayZenith, t);
  const lip = exp(abs(elev.sub(0.016)).mul(-36));
  col = mix(col, uDayHaze.mul(1.03), lip.mul(0.32));
  const along = dir.x.mul(6).add(dir.z.mul(2.5));
  const wisp = sin(along)
    .mul(0.55)
    .add(sin(along.mul(2.2).add(1.3)).mul(0.3))
    .add(sin(dir.z.mul(10)).mul(0.15));
  const band = smoothstep(0, 0.03, elev).mul(float(1).sub(smoothstep(0.065, 0.145, elev)));
  const streaks = smoothstep(0.4, 0.82, wisp.mul(0.5).add(0.5)).mul(band);
  col = mix(col, vec3(0.97, 0.975, 0.97), streaks.mul(0.3));
  const high = smoothstep(0.15, 0.46, elev);
  col = mix(col, uDayZenith, high);
  const cuv = vec2(dir.x, dir.z).div(max(h.add(0.4), float(0.1)));
  const hc = sin(cuv.x.mul(1.25).add(cuv.y.mul(0.4)))
    .mul(0.6)
    .add(sin(cuv.y.mul(1.7)).mul(0.4));
  let highCloud = smoothstep(0.38, 0.9, hc.mul(0.5).add(0.5)).mul(smoothstep(0.2, 0.48, elev));
  highCloud = highCloud.mul(float(1).sub(smoothstep(0.75, 0.95, elev)));
  col = mix(col, vec3(0.96, 0.97, 0.985), highCloud.mul(0.24));
  const sunD = normalize(uSunDir);
  const mu = max(dot(dir, sunD), float(0));
  col = col.add(
    uSunColor.mul(
      pow(mu, float(40))
        .mul(0.4)
        .add(pow(mu, float(4)).mul(0.14)),
    ),
  );
  return vec3(mix(col, uBottom, smoothstep(0, -0.35, h).mul(0.4)));
}

export interface SkyHandle {
  mesh: THREE.Mesh<THREE.SphereGeometry, MeshBasicNodeMaterial>;
  mat: MeshBasicNodeMaterial;
}

export function createSky(): SkyHandle {
  const dir = normalize(positionWorld.sub(cameraPosition));
  const h = dir.y;
  const mat = new MeshBasicNodeMaterial();
  mat.name = "LayerHouseSky";
  const night = nightSky(dir, h as Node<"float">);
  const day = daySky(dir, h as Node<"float">);
  const dayWeight = float(uDay);
  mat.colorNode = night.mul(float(1).sub(dayWeight)).add(day.mul(dayWeight));
  mat.side = THREE.BackSide;
  mat.depthWrite = false;
  mat.depthTest = false;
  mat.fog = false;
  mat.toneMapped = true;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 32), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.name = "sky";
  return { mesh, mat };
}

export function applySky(sky: SkyHandle, timeId: TimeId) {
  const t = TOD[timeId];
  uTop.value.setHex(t.top);
  uHorizon.value.setHex(t.horizon);
  uBottom.value.setHex(t.bottom);
  uSunColor.value.setHex(t.sunColor);
  uSunDir.value.set(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize();
  uGlow.value = t.glow;
  uSunSharp.value = timeId === "night" ? 800 : timeId === "day" ? 400 : 180;
  const cloud =
    timeId === "day" ? 0.55 : timeId === "dawn" ? 0.28 : timeId === "dusk" ? 0.16 : 0.04;
  uCloud.value = cloud;
  uDay.value = timeId === "day" ? 1 : 0;
  void sky;
}

export function createSunDisc(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const g = new THREE.SphereGeometry(4.2, 24, 16);
  const m = new THREE.MeshBasicMaterial({
    color: 0xfff0c8,
    toneMapped: true,
    fog: false,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.name = "sunDisc";
  return mesh;
}

export function placeSun(
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>,
  timeId: TimeId,
  radius = 280,
) {
  const t = TOD[timeId];
  const d = new THREE.Vector3(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize();
  mesh.position.copy(d).multiplyScalar(radius);
  mesh.material.color.setHex(t.sunColor);
  mesh.visible = timeId !== "night" && t.sunDir[1] > 0.05;
  mesh.scale.setScalar(timeId === "day" ? 0.7 : 1.15);
}
