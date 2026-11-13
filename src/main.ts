import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PMREMGenerator, WebGPURenderer } from "three/webgpu";
import { addRoomBounce, applyTime, syncOpenRoofLighting } from "./app/lighting";
import { createPipeline } from "./app/post";
import { cutRange, mountClipGroup, updateCut } from "./app/section";
import type { Session } from "./app/session";
import { CAM, EYE, QUALITY, ROOF_LIFT } from "./config";
import { lerpCam, orbitPreset, tickCamera } from "./features/camera";
import { createHotspots } from "./features/hotspots";
import { setHouseVisibility } from "./features/layers/visibility";
import {
  applyWalkLook,
  bindWalkPointer,
  enterWalk,
  exitWalk,
  toggleNearestDoor,
  updateDoors,
  updateWalk,
} from "./features/walk";
import { buildHouse, heightAt } from "./scene/house";
import { furnishHouse } from "./scene/furnish";
import { createMaterials, createTextures } from "./scene/materials";
import { createSky, createSunDisc } from "./scene/sky";
import { buildLandscape, buildSite, buildWater } from "./scene/site";
import { buildNeighbors } from "./scene/site/neighbors";
import { buildSystems } from "./scene/systems";
import type { CutDir, DemoApi, LayerId, Vec3, ViewMode } from "./types";
import { cutPanel } from "./ui/cut-panel";
import { mustEl, setActive } from "./ui/dom";
import { createHelpDialog } from "./ui/help-dialog";
import { bindHud, syncModeChrome } from "./ui/hud";
const params = new URLSearchParams(location.search);
if (params.get("fx") === "low") {
  QUALITY.ao = false;
  QUALITY.ssr = false;
  QUALITY.poolReflection = false;
}
const forceWebGL = params.get("backend") === "webgl";

const canvas = mustEl<HTMLCanvasElement>("c");
const renderer = new WebGPURenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  forceWebGL,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x1a2030, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8a6a72, 0.018);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.12, 600);
camera.position.set(...CAM.exploded.pos);
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(...CAM.exploded.target);
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.minDistance = 2.4;
orbit.maxDistance = 80;
orbit.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
};

const sky = createSky();
scene.add(sky.mesh);
const sunDisc = createSunDisc();
scene.add(sunDisc);

const hemi = new THREE.HemisphereLight(0xe8a888, 0x3a3a48, 0.48);
scene.add(hemi);
const amb = new THREE.AmbientLight(0x4a4058, 0.22);
scene.add(amb);
const sun = new THREE.DirectionalLight(0xff8a62, 0.95);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.03;
scene.add(sun);
scene.add(sun.target);
sun.target.position.set(0, 0, -1);

const fill = new THREE.DirectionalLight(0x6a70a8, 0.18);
fill.position.set(8, 10, -14);
scene.add(fill);

const textures = createTextures();
const mats = createMaterials(textures);
const rec = buildHouse(mats);
furnishHouse(rec.groups, mats, rec);
buildSite(rec.groups, mats, rec);
buildLandscape(rec.groups, mats, rec);
buildSystems(rec.groups, mats, rec);

const houseRoot = new THREE.Group();
houseRoot.name = "houseRoot";
for (const group of Object.values(rec.groups)) houseRoot.add(group);
scene.add(houseRoot);

const neighbors = buildNeighbors(mats, rec);
scene.add(neighbors);
const waterGrp = buildWater(rec);
scene.add(waterGrp);

const bloom = { strength: 0.22, radius: 0.35, threshold: 0.88 };
const { pipeline, bloomNode } = createPipeline(renderer, scene, camera, bloom);

const session: Session = {
  canvas,
  renderer,
  scene,
  camera,
  orbit,
  pipeline,
  bloom,
  bloomNode,
  backendName: forceWebGL ? "WebGL2" : "WebGPU",
  hemi,
  amb,
  sun,
  fill,
  sky,
  sunDisc,
  mats,
  rec,
  neighbors,
  waterGrp,
  clipPlanes: [],
  clipGroup: null as unknown as Session["clipGroup"],
  clipCache: new Map(),
  capGroup: new THREE.Group(),
  sectionBox: new THREE.Group(),
  pmrem: new PMREMGenerator(renderer),
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

mountClipGroup(session);
addRoomBounce(scene);

const hotspots = createHotspots(scene, camera, canvas, rec, () => session.mode);

function setMode(next: ViewMode) {
  if (next === session.mode && next !== "cut") return;
  if (session.mode === "walk" && next !== "walk") exitWalk(session);
  if (next !== "walk" && session.mode !== "boot" && session.mode !== "walk")
    session.prevMode = session.mode;
  session.mode = next;
  syncModeChrome(next);
  setHouseVisibility(session);
  if (next === "cut") updateCut(session);
  else {
    session.clipPlanes.length = 0;
    session.clipGroup.enabled = false;
    session.capGroup.clear();
  }
  if (next === "walk") enterWalk(session);
  else {
    orbit.enabled = true;
    const preset = orbitPreset(next, session.cutDir);
    lerpCam(session, preset.pos, preset.target);
  }
}

const help = createHelpDialog();

bindHud({
  setMode,
  applyTime: (id) => applyTime(session, id),
  resetView() {
    if (session.mode === "walk") setMode(session.prevMode);
    const preset = orbitPreset(session.mode, session.cutDir);
    lerpCam(session, preset.pos, preset.target, 0.7);
  },
  setCutDir(dir) {
    session.cutDir = dir;
    const range = cutRange(session);
    session.cutValue = range.def;
    const slider = mustEl<HTMLInputElement>("cut-slider");
    slider.value = String(cutPanel(range, session.cutValue, "meters"));
    updateCut(session);
    const key = dir === "side" ? "cutSide" : dir === "front" ? "cutFront" : "cut";
    lerpCam(session, CAM[key].pos, CAM[key].target, 0.8);
  },
  onCutInput(value) {
    session.cutValue = value;
    updateCut(session);
  },
  onReturn: () => setMode(session.prevMode || "exploded"),
  getCutRange: () => cutRange(session),
  getLayer: () => session.xrayLayer,
  setLayer(id) {
    session.xrayLayer = id;
    setHouseVisibility(session);
  },
});

bindWalkPointer(session);
canvas.addEventListener("mousemove", (event) => hotspots.onMouseMove(event));

window.addEventListener("keydown", (event) => {
  session.walk.keys[event.code] = true;
  if (event.code === "Escape") {
    if (help.isOpen()) help.close();
    else if (session.mode === "walk") setMode(session.prevMode || "exploded");
  }
  if ((event.code === "KeyE" || event.code === "KeyF") && session.mode === "walk") {
    toggleNearestDoor(session);
  }
});
window.addEventListener("keyup", (event) => {
  session.walk.keys[event.code] = false;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let roofTarget = ROOF_LIFT;
let lightKey = "";

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  roofTarget = session.mode === "exploded" ? ROOF_LIFT : 0;
  session.roofY += (roofTarget - session.roofY) * Math.min(1, dt * 5.5);
  rec.roofGroup.position.y = session.roofY;
  const nextKey = `${session.mode}|${session.timeId}|${session.roofY.toFixed(3)}`;
  if (nextKey !== lightKey) {
    lightKey = nextKey;
    syncOpenRoofLighting(session);
  }
  if (session.mode === "cut") updateCut(session);
  tickCamera(session, dt);
  if (session.walk.on) updateWalk(session, dt);
  else orbit.update();
  updateDoors(session, dt);
  hotspots.updateLabel();
  pipeline.render();
}

function hideLoader() {
  const el = document.getElementById("loader");
  if (!el) return;
  el.classList.add("gone");
  setTimeout(() => {
    el.remove();
  }, 700);
}
mustEl<HTMLElement>("skip").addEventListener("click", hideLoader);

async function start() {
  await renderer.init();
  const gpuBackend = renderer.backend as { isWebGPUBackend?: boolean };
  session.backendName = gpuBackend.isWebGPUBackend === true ? "WebGPU" : "WebGL2";
  mustEl<HTMLElement>("gfx").textContent = session.backendName;
  applyTime(session, "dusk");
  setMode("exploded");
  setHouseVisibility(session);
  mustEl<HTMLElement>("loadbar").style.width = "100%";
  animate();
  setTimeout(hideLoader, 400);
}
void start();

const demo: DemoApi = {
  setMode,
  applyTime: (id) => applyTime(session, id),
  setLayer(id: LayerId) {
    session.xrayLayer = id;
    setActive("#layer-list button", (button) => button.dataset.layer === id);
    setHouseVisibility(session);
  },
  setCut(dir: CutDir, value: number) {
    if (session.mode !== "cut") setMode("cut");
    session.cutDir = dir;
    session.cutValue = value;
    setActive("#cut-panel [data-cut]", (button) => button.dataset.cut === dir);
    const range = cutRange(session);
    mustEl<HTMLInputElement>("cut-slider").value = String(cutPanel(range, value, "meters"));
    updateCut(session);
    const preset = CAM[dir === "side" ? "cutSide" : dir === "front" ? "cutFront" : "cut"];
    camera.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
    orbit.target.set(preset.target[0], preset.target[1], preset.target[2]);
    orbit.update();
    session.cam.active = false;
  },
  snapCam(pos: Vec3 | number[], target: Vec3 | number[]) {
    camera.position.set(pos[0]!, pos[1]!, pos[2]!);
    orbit.target.set(target[0]!, target[1]!, target[2]!);
    orbit.update();
    session.cam.active = false;
  },
  walkTo(x: number, z: number, yaw: number, pitch = 0.02) {
    if (session.mode !== "walk") setMode("walk");
    session.cam.active = false;
    camera.position.set(x, heightAt(rec, x, z, 0.25) + EYE, z);
    session.walk.yaw = yaw;
    session.walk.pitch = pitch;
    applyWalkLook(session);
  },
  openDoor() {
    rec.doors.forEach((door) => {
      if (door.style === "pivot") door.target = 1;
    });
  },
  setRoof(y: number) {
    session.roofY = y;
    rec.roofGroup.position.y = y;
    syncOpenRoofLighting(session);
  },
  showLayer(id, visible) {
    rec.groups[id].visible = visible;
  },
  showNeighbors(visible: boolean) {
    neighbors.visible = visible;
  },
  colorCaps(on: boolean) {
    session.capColors = on;
    if (session.mode === "cut") updateCut(session);
  },
  measure(prefix: string) {
    const out: Record<string, { y0: number; y1: number }> = {};
    houseRoot.updateWorldMatrix(true, true);
    waterGrp.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    const visit = (obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.name.startsWith(prefix)) {
        box.setFromObject(obj);
        const cur = out[obj.name];
        if (!cur) out[obj.name] = { y0: box.min.y, y1: box.max.y };
        else {
          cur.y0 = Math.min(cur.y0, box.min.y);
          cur.y1 = Math.max(cur.y1, box.max.y);
        }
      }
    };
    houseRoot.traverse(visit);
    waterGrp.traverse(visit);
    return out;
  },
  get state() {
    return {
      mode: session.mode,
      timeId: session.timeId,
      xrayLayer: session.xrayLayer,
      cutDir: session.cutDir,
      cutValue: session.cutValue,
      roofY: session.roofY,
    };
  },
};
window.__demo = demo;
