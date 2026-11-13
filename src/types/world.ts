import type { CutDir, LayerId, Mode, TimeId } from "./ids";

export type Vec3 = readonly [number, number, number];

export interface OrbitPreset {
  readonly pos: Vec3;
  readonly target: Vec3;
}

export interface WalkPreset {
  readonly pos: Vec3;
  readonly yaw: number;
  readonly pitch: number;
}

export interface TimeRecipe {
  top: number;
  horizon: number;
  bottom: number;
  sunColor: number;
  sunDir: Vec3;
  sunSize: number;
  glow: number;
  hemiSky: number;
  hemiGround: number;
  hemi: number;
  amb: number;
  ambInt: number;
  sunInt: number;
  sunColorDir: number;
  fillInt: number;
  fillColor: number;
  exposure: number;
  fog: number;
  fogDen: number;
  lamps: number;
  windowWarm: number;
  poolGlow: number;
  waterTint: number;
  grass: number;
  shadow: number;
}

export interface DemoState {
  mode: Mode;
  timeId: TimeId;
  xrayLayer: LayerId;
  cutDir: CutDir;
  cutValue: number;
  roofY: number;
}
