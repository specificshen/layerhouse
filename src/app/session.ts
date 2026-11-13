import type * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type BloomNode from "three/addons/tsl/display/BloomNode.js";
import type {
  ClippingGroup,
  CubeRenderTarget,
  PMREMGenerator,
  PostProcessing,
  WebGPURenderer,
} from "three/webgpu";
import type { Materials } from "../scene/materials";
import type { SkyHandle } from "../scene/sky";
import type { CutDir, HouseRecord, LayerId, Mode, TimeId, ViewMode } from "../types";

export interface BloomState {
  strength: number;
  radius: number;
  threshold: number;
}

export interface CamAnim {
  active: boolean;
  t: number;
  dur: number;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  t0: THREE.Vector3;
  t1: THREE.Vector3;
}

export interface WalkState {
  on: boolean;
  yaw: number;
  pitch: number;
  keys: Record<string, boolean | undefined>;
  vy: number;
  grounded: boolean;
  pointer: boolean;
}

export interface Session {
  canvas: HTMLCanvasElement;
  renderer: WebGPURenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  pipeline: PostProcessing;
  bloom: BloomState;
  bloomNode: BloomNode;
  backendName: string;
  hemi: THREE.HemisphereLight;
  amb: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  sky: SkyHandle;
  sunDisc: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  mats: Materials;
  rec: HouseRecord;
  neighbors: THREE.Group;
  waterGrp: THREE.Group;
  clipPlanes: THREE.Plane[];
  clipGroup: ClippingGroup;
  clipCache: Map<THREE.Material, THREE.Material>;
  capGroup: THREE.Group;
  sectionBox: THREE.Group;
  pmrem: PMREMGenerator;
  envTarget: CubeRenderTarget | null;
  cam: CamAnim;
  walk: WalkState;
  mode: Mode;
  timeId: TimeId;
  xrayLayer: LayerId;
  cutDir: CutDir;
  cutValue: number;
  prevMode: ViewMode;
  roofY: number;
}
