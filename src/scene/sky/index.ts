import * as THREE from "three";
import { TOD } from "../../config";
import type { TimeId } from "../../types";

const vert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vDir = w.xyz - cameraPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uGlow;
  uniform float uSunSharp;
  uniform float uCloud;
  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.72, max(h, 0.0)));
    col = mix(uBottom, col, smoothstep(-0.22, 0.06, h));
    col += uHorizon * 0.18 * exp(-abs(h) * 8.0);
    vec2 cuv = dir.xz / max(h + 0.35, 0.08);
    float c1 = sin(cuv.x * 1.6 + cuv.y * 0.55);
    float c2 = sin(cuv.x * 3.2 - cuv.y * 2.3);
    float c3 = sin((cuv.x + cuv.y) * 0.8);
    float clouds = smoothstep(0.2, 0.85, c1 * 0.5 + c2 * 0.28 + c3 * 0.22 + 0.12);
    clouds *= smoothstep(0.02, 0.32, h);
    vec3 cloudCol = mix(uHorizon, vec3(1.0), 0.62);
    col = mix(col, cloudCol, clouds * uCloud * 0.5);
    vec3 sunD = normalize(uSunDir);
    float mu = max(dot(dir, sunD), 0.0);
    float disc = pow(mu, uSunSharp);
    float glow = pow(mu, 12.0) * uGlow;
    float haze = pow(mu, 4.0) * uGlow * 0.35;
    col += uSunColor * (disc * 2.6 + glow + haze);
    if (h < 0.0) {
      col = mix(col, uBottom, smoothstep(0.0, -0.4, h) * 0.35);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface SkyHandle {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  mat: THREE.ShaderMaterial;
}

export function createSky(): SkyHandle {
  const geo = new THREE.SphereGeometry(400, 48, 32);
  const mat = new THREE.ShaderMaterial({
    name: "LayerHouseSky",
    uniforms: {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uGlow: { value: 1 },
      uSunSharp: { value: 256 },
      uCloud: { value: 0.4 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.name = "sky";
  return { mesh, mat };
}

export function applySky(sky: SkyHandle, timeId: TimeId) {
  const t = TOD[timeId];
  const u = sky.mat.uniforms as {
    uTop: { value: THREE.Color };
    uHorizon: { value: THREE.Color };
    uBottom: { value: THREE.Color };
    uSunColor: { value: THREE.Color };
    uSunDir: { value: THREE.Vector3 };
    uGlow: { value: number };
    uSunSharp: { value: number };
    uCloud: { value: number };
  };
  u.uTop.value.setHex(t.top);
  u.uHorizon.value.setHex(t.horizon);
  u.uBottom.value.setHex(t.bottom);
  u.uSunColor.value.setHex(t.sunColor);
  u.uSunDir.value.set(t.sunDir[0], t.sunDir[1], t.sunDir[2]).normalize();
  u.uGlow.value = t.glow;
  u.uSunSharp.value = timeId === "night" ? 800 : timeId === "day" ? 400 : 180;
  const cloud =
    timeId === "day" ? 0.28 : timeId === "dawn" ? 0.32 : timeId === "dusk" ? 0.18 : 0.05;
  u.uCloud.value = cloud;
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
