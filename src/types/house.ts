import type * as THREE from "three";
import type { LayerId } from "./ids";

export type WallAxis = "x" | "z";
export type WallKind = "ext" | "int";
export type WallFinish = "stucco" | "cedar" | "interior";
export type OpeningType = "window" | "door";
export type OpeningStyle =
  "fixed" | "pivot" | "sidelight" | "band" | "slider" | "interior" | "side" | "garden";
export type DoorStyle = OpeningStyle;

export interface Opening {
  a0: number;
  a1: number;
  y0: number;
  y1: number;
  type: OpeningType;
  style: OpeningStyle;
  /** Hinge at the lesser (a0) or greater (a1) end of the opening. Sliders omit this. */
  hinge?: "a0" | "a1";
  /** Sign of `leaf.rotation.y` when the leaf is open. From sheets A-02 / A-03. */
  openSign?: 1 | -1;
}

export interface Wall {
  id: string;
  axis: WallAxis;
  pos: number;
  a0: number;
  a1: number;
  y0: number;
  y1: number;
  t: number;
  kind: WallKind;
  finish: WallFinish;
  openings: Opening[];
}

export interface ClipBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  /** Optional section-cap tint. Used only when colored assembly caps are on. */
  capColor?: number;
}

/** Oriented box used for section caps on rotated pieces (roof slopes, rakes, rails). */
export interface OrientedClip {
  center: THREE.Vector3;
  half: THREE.Vector3;
  quat: THREE.Quaternion;
  /** Added to center.y while the rigid roof is lifted. */
  lifts: boolean;
}

export interface CollisionBox {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
}

export interface FloorPad {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
  level: number;
}

export interface StairRun {
  x0: number;
  x1: number;
  zStart: number;
  zEnd: number;
  yStart: number;
  yEnd: number;
}

export interface DoorRecord {
  group: THREE.Group;
  leaf: THREE.Group;
  open: number;
  target: number;
  /** Sign of `leaf.rotation.y` at full swing. Sliders ignore this and translate. */
  openSign: number;
  closedX: number;
  x: number;
  z: number;
  w: number;
  axis: WallAxis;
  pos: number;
  a0: number;
  a1: number;
  y0: number;
  y1: number;
  style: DoorStyle;
}

export interface Hotspot {
  id: string;
  labelZh: string;
  labelEn: string;
  position: THREE.Vector3;
  object?: THREE.Object3D;
}

export interface Well {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export interface RoofMeta {
  ridgeY: number;
  ridgeZ: number;
  half: number;
  pitch: number;
  length: number;
  cx: number;
  yS: number;
  yN: number;
  wx0: number;
  wx1: number;
  wz0: number;
  wz1: number;
  wingPitch: number;
}

export interface PoolMeta {
  px: number;
  pz: number;
  pw: number;
  pd: number;
}

export interface WaterRecord {
  canal: THREE.Object3D;
  overlay: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>;
  pool: THREE.Object3D;
  poolTint: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  poolFloor: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  poolMid: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  poolDeep: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  caustic: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  poolSheen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  group: THREE.Group;
}

export type HouseGroups = Record<LayerId, THREE.Group>;

export interface HouseRecord {
  clipBoxes: ClipBox[];
  /** Clip boxes parented to the roof group; section caps follow `roofGroup.position.y`. */
  roofClipBoxes: ClipBox[];
  orientedClips: OrientedClip[];
  collisions: CollisionBox[];
  floors: FloorPad[];
  stairs: StairRun[];
  lamps: THREE.PointLight[];
  hotspots: Hotspot[];
  doors: DoorRecord[];
  groups: HouseGroups;
  roofGroup: THREE.Group;
  wallsData: Wall[];
  well: Well;
  roofMeta: RoofMeta;
  poolMeta?: PoolMeta;
  water?: WaterRecord;
  ground?: THREE.Mesh;
  neighbors?: THREE.Group;
}
