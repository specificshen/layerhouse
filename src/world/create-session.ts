import * as THREE from "three";
import type BloomNode from "three/addons/tsl/display/BloomNode.js";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { PostProcessing, WebGPURenderer } from "three/webgpu";
import { PMREMGenerator } from "three/webgpu";
import { ROOF_LIFT } from "@/config";
import type { Materials } from "@/materials";
import type { SkyHandle } from "@/scene/sky";
import type { HouseRecord } from "@/types";
import type { BloomState, Session } from "./session";

export function createSession(parts: {
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
  context: THREE.Group;
  waterGrp: THREE.Group;
}): Session {
  const {
    canvas,
    renderer,
    scene,
    camera,
    orbit,
    pipeline,
    bloom,
    bloomNode,
    backendName,
    hemi,
    amb,
    sun,
    fill,
    sky,
    sunDisc,
    mats,
    rec,
    context,
    waterGrp,
  } = parts;
  const session: Session = {
    canvas,
    renderer,
    scene,
    camera,
    orbit,
    pipeline,
    bloom,
    bloomNode,
    backendName,
    hemi,
    amb,
    sun,
    fill,
    sky,
    sunDisc,
    mats,
    rec,
    context,
    waterGrp,
    clipPlanes: [],
    clipGroup: null as unknown as Session["clipGroup"],
    clipCache: new Map(),
    capGroup: new THREE.Group(),
    sectionBox: new THREE.Group(),
    pmrem: new PMREMGenerator(renderer),
    envCache: new Map(),
    envTarget: null,
    cam: {
      active: false,
      t: 1,
      dur: 0.95,
      p0: camera.position.clone(),
      p1: camera.position.clone(),
      t0: orbit.target.clone(),
      t1: orbit.target.clone(),
    },
    walk: {
      on: false,
      yaw: Math.PI,
      pitch: 0.04,
      keys: {},
      vy: 0,
      grounded: true,
      pointer: false,
    },
    mode: "boot",
    timeId: "dusk",
    xrayLayer: "framing",
    cutDir: "top",
    cutValue: 4.3,
    capColors: false,
    prevMode: "exploded",
    roofY: ROOF_LIFT,
  };
  session.capGroup.name = "sectionCaps";
  session.sectionBox.name = "sectionBox";
  scene.add(session.capGroup);
  scene.add(session.sectionBox);
  rec.roofGroup.position.y = ROOF_LIFT;
  return session;
}
