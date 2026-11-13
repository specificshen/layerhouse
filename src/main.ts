import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { lerpCam, orbitPreset, tickCamera } from "./app/camera";
import { mustEl } from "./app/dom";
import { bindHud, closeHelp, isHelpOpen, syncModeChrome } from "./app/hud";
import { createHotspots } from "./app/hotspots";
import { applyTime, syncOpenRoofLighting } from "./app/lighting";
import { CLIP_TARGETS, cutRange, enableClipping, updateCut } from "./app/section";
import type { Session } from "./app/session";
import { setHouseVisibility } from "./app/visibility";
import {
  applyWalkLook,
  bindWalkPointer,
  enterWalk,
  exitWalk,
  toggleNearestDoor,
  updateDoors,
  updateWalk,
} from "./app/walk";
import { CAM, EYE, ROOF_LIFT } from "./config";
import { furnishHouse } from "./scene/furnish";
import { buildHouse, heightAt } from "./scene/house";
import { createMaterials, createTextures } from "./scene/materials";
import { createSky, createSunDisc } from "./scene/sky";
import { buildLandscape, buildSite, buildWater } from "./scene/site";
import { buildNeighbors } from "./scene/site/neighbors";
import { buildSystems } from "./scene/systems";
import type { CutDir, DemoApi, LayerId, Vec3, ViewMode } from "./types";

const canvas = mustEl<HTMLCanvasElement>("c");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  stencil: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.localClippingEnabled = true;
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
buildSite(scene, rec.groups, mats, rec);
buildLandscape(rec.groups, mats, rec);
buildSystems(rec.groups, mats, rec);

const houseRoot = new THREE.Group();
houseRoot.name = "houseRoot";
for (const group of Object.values(rec.groups)) houseRoot.add(group);
scene.add(houseRoot);

const neighbors = buildNeighbors(scene, mats, rec);
scene.add(neighbors);
const waterGrp = buildWater(scene, rec);
scene.add(waterGrp);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.22,
  0.35,
  0.88,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const session: Session = {
  canvas,
  renderer,
  scene,
  camera,
  orbit,
  composer,
  bloom,
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
  clipCache: new Map(),
  capGroup: new THREE.Group(),
  sectionBox: new THREE.Group(),
  pmrem: new THREE.PMREMGenerator(renderer),
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
  prevMode: "exploded",
  roofY: ROOF_LIFT,
};
session.capGroup.name = "sectionCaps";
session.sectionBox.name = "sectionBox";
scene.add(session.capGroup);
scene.add(session.sectionBox);
rec.roofGroup.position.y = ROOF_LIFT;

for (const id of CLIP_TARGETS) enableClipping(session, rec.groups[id]);

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
    session.capGroup.clear();
  }
  if (next === "walk") enterWalk(session);
  else {
    orbit.enabled = true;
    const preset = orbitPreset(next, session.cutDir);
    lerpCam(session, preset.pos, preset.target);
  }
}

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
    slider.value = String(((session.cutValue - range.min) / (range.max - range.min)) * 100);
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
    if (isHelpOpen()) closeHelp();
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
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
let roofTarget = ROOF_LIFT;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());
  roofTarget = session.mode === "exploded" ? ROOF_LIFT : 0;
  session.roofY += (roofTarget - session.roofY) * Math.min(1, dt * 5.5);
  rec.roofGroup.position.y = session.roofY;
  syncOpenRoofLighting(session);
  if (session.mode === "cut") updateCut(session);
  tickCamera(session, dt);
  if (session.walk.on) updateWalk(session, dt);
  else orbit.update();
  updateDoors(session, dt);
  hotspots.updateLabel();
  composer.render();
}

function hideLoader() {
  const el = mustEl<HTMLElement>("loader");
  el.classList.add("gone");
  setTimeout(() => {
    el.remove();
  }, 700);
}
mustEl<HTMLElement>("skip").addEventListener("click", hideLoader);

applyTime(session, "dusk");
setMode("exploded");
setHouseVisibility(session);
mustEl<HTMLElement>("loadbar").style.width = "100%";
animate();
setTimeout(hideLoader, 900);

const demo: DemoApi = {
  setMode,
  applyTime: (id) => applyTime(session, id),
  setLayer(id: LayerId) {
    session.xrayLayer = id;
    document
      .querySelectorAll<HTMLElement>("#layer-list button")
      .forEach((button) => button.classList.toggle("active", button.dataset.layer === id));
    setHouseVisibility(session);
  },
  setCut(dir: CutDir, value: number) {
    if (session.mode !== "cut") setMode("cut");
    session.cutDir = dir;
    session.cutValue = value;
    document
      .querySelectorAll<HTMLElement>("#cut-panel [data-cut]")
      .forEach((button) => button.classList.toggle("active", button.dataset.cut === dir));
    const range = cutRange(session);
    mustEl<HTMLInputElement>("cut-slider").value = String(
      ((value - range.min) / (range.max - range.min)) * 100,
    );
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
