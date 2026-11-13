import type * as THREE from "three";

/** Discrete observer modes on the outer dial (plus an internal boot sentinel). */
export const VIEW_MODE_IDS = ["exterior", "exploded", "cut", "xray", "walk"] as const;
export type ViewMode = (typeof VIEW_MODE_IDS)[number];
export type Mode = ViewMode | "boot";

export const TIME_IDS = ["night", "dawn", "day", "dusk"] as const;
export type TimeId = (typeof TIME_IDS)[number];

export const LAYER_IDS = [
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
  "site",
  "landscape",
] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export const CUT_DIRS = ["top", "side", "front"] as const;
export type CutDir = (typeof CUT_DIRS)[number];

export const CAMERA_PRESET_IDS = [
  "exterior",
  "exploded",
  "cut",
  "cutSide",
  "cutFront",
  "xray",
] as const;
export type CameraPresetId = (typeof CAMERA_PRESET_IDS)[number];

export type Vec3 = readonly [number, number, number];

export type Axis = "x" | "y" | "z";
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

export interface DemoApi {
  setMode: (next: ViewMode) => void;
  applyTime: (id: TimeId) => void;
  setLayer: (id: LayerId) => void;
  setCut: (dir: CutDir, value: number) => void;
  snapCam: (pos: Vec3 | number[], target: Vec3 | number[]) => void;
  walkTo: (x: number, z: number, yaw: number, pitch?: number) => void;
  openDoor: () => void;
  setRoof: (y: number) => void;
  /** Proof hook. Normal modes keep masonry hidden; a section shot can turn it on. */
  showLayer: (id: LayerId, visible: boolean) => void;
  showNeighbors: (visible: boolean) => void;
  /** Tint floor assembly caps so the finish reads against the structural slab. */
  colorCaps: (on: boolean) => void;
  /** World Y extents of meshes whose names start with `prefix`. */
  measure: (prefix: string) => Record<string, { y0: number; y1: number }>;
  readonly state: DemoState;
}

export function isViewMode(v: string | undefined): v is ViewMode {
  return v !== undefined && (VIEW_MODE_IDS as readonly string[]).includes(v);
}

export function isTimeId(v: string | undefined): v is TimeId {
  return v !== undefined && (TIME_IDS as readonly string[]).includes(v);
}

export function isLayerId(v: string | undefined): v is LayerId {
  return v !== undefined && (LAYER_IDS as readonly string[]).includes(v);
}

export function isCutDir(v: string | undefined): v is CutDir {
  return v !== undefined && (CUT_DIRS as readonly string[]).includes(v);
}

export function isCameraPresetId(v: string | undefined): v is CameraPresetId {
  return v !== undefined && (CAMERA_PRESET_IDS as readonly string[]).includes(v);
}

declare global {
  interface Window {
    __demo: DemoApi;
  }
}

export {};
