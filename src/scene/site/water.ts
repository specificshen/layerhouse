import {
  bumpMap,
  cameraPosition,
  cos,
  dot,
  float,
  materialColor,
  max,
  normalize,
  positionWorld,
  pow,
  reflector,
  screenUV,
  sin,
  time,
  vec2,
  vec3,
} from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import type { Object3D } from "three";
import { QUALITY } from "@/config";

function rippleHeight(scale: number, speed: number) {
  return sin(positionWorld.x.mul(scale).add(time.mul(speed)))
    .add(sin(positionWorld.z.mul(scale * 1.17).sub(time.mul(speed * 0.72))))
    .add(
      sin(
        positionWorld.x
          .mul(scale * 0.45)
          .add(positionWorld.z.mul(scale * 0.62))
          .add(time.mul(speed * 0.4)),
      ).mul(0.55),
    );
}

function fresnel(power: number, floor: number, gain: number) {
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const facing = max(dot(viewDir, vec3(0, 1, 0)), float(0));
  return pow(float(1).sub(facing), float(power)).mul(gain).add(floor);
}

export function createCanalMaterial() {
  const material = new MeshPhysicalNodeMaterial({
    color: 0x3a5060,
    roughness: 0.16,
    metalness: 0.14,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    envMapIntensity: 1.35,
  });
  material.normalNode = bumpMap(rippleHeight(0.32, 0.55), float(0.4));
  material.emissiveNode = materialColor.mul(fresnel(2.2, 0.04, 0.22));
  return material;
}

export interface PoolWater {
  material: MeshPhysicalNodeMaterial;
  reflectionTarget: Object3D | null;
}

/** One continuous sheet. Planar reflection is optional so a slow GPU can drop it. */
export function createPoolWater(): PoolWater {
  const material = new MeshPhysicalNodeMaterial({
    color: 0x1a4246,
    roughness: 0.07,
    metalness: 0.04,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    envMapIntensity: 0.55,
  });
  material.normalNode = bumpMap(rippleHeight(2.5, 1.25), float(0.16));
  let reflectionTarget: Object3D | null = null;
  if (QUALITY.poolReflection) {
    const mirror = reflector({
      resolutionScale: QUALITY.poolReflectScale,
      bounces: false,
    });
    const wobble = vec2(
      sin(positionWorld.x.mul(1.8).add(time.mul(1.15))),
      cos(positionWorld.z.mul(2.15).sub(time.mul(0.85))),
    ).mul(0.007);
    mirror.uvNode = screenUV.flipX().add(wobble);
    material.emissiveNode = mirror.rgb.mul(fresnel(1.5, 0.38, 0.58));
    reflectionTarget = mirror.target;
  }
  return { material, reflectionTarget };
}
