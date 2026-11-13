import type * as THREE from "three";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Materials } from "../scene/materials";
import type { SkyHandle } from "../scene/sky";
import type { CutDir, HouseRecord, LayerId, Mode, TimeId, ViewMode } from "../types";

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
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
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
  clipCache: Map<THREE.Material, THREE.Material>;
  capGroup: THREE.Group;
  sectionBox: THREE.Group;
  pmrem: THREE.PMREMGenerator;
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
