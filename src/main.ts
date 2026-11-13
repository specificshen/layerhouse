import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CAM, ROOF_LIFT } from "@/config";
import {
  applyQualityQuery,
  createPipeline,
  createRenderer,
  previewBackendName,
  readBackendName,
  wantsWebGLBackend,
} from "@/engine";
import { lerpCam, orbitPreset, tickCamera } from "@/features/camera";
import { createHotspots } from "@/features/hotspots";
import { setHouseVisibility } from "@/features/layers/visibility";
import {
  bindWalkPointer,
  enterWalk,
  exitWalk,
  toggleNearestDoor,
  updateDoors,
  updateWalk,
} from "@/features/walk";
import { createMaterials, createTextures } from "@/materials";
import { furnishHouse } from "@/scene/furnish";
import { buildHouse } from "@/scene/house";
import { buildLandscape, buildSite, buildWater } from "@/scene/site";
import { buildNeighbors } from "@/scene/site/neighbors";
import { createSky, createSunDisc } from "@/scene/sky";
import { buildSystems } from "@/scene/systems";
import type { ViewMode } from "@/types";
import { cutPanel } from "@/ui/cut-panel";
import { mustEl } from "@/ui/dom";
import { createHelpDialog } from "@/ui/help-dialog";
import { bindHud, syncModeChrome } from "@/ui/hud";
import {
  addRoomBounce,
  applyTime,
  attachDemo,
  createDuskLights,
  createSession,
  cutRange,
  mountClipGroup,
  syncOpenRoofLighting,
  updateCut,
} from "@/world";

const params = new URLSearchParams(location.search);
applyQualityQuery(params);
const forceWebGL = wantsWebGLBackend(params);

const canvas = mustEl<HTMLCanvasElement>("c");
const renderer = createRenderer(canvas, forceWebGL);

const scene = new THREE.Scene();
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
const { hemi, amb, sun, fill } = createDuskLights(scene);

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

const session = createSession({
  canvas,
  renderer,
  scene,
  camera,
  orbit,
  pipeline,
  bloom,
  bloomNode,
  backendName: previewBackendName(forceWebGL),
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
});
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
  session.backendName = readBackendName(renderer.backend as { isWebGPUBackend?: boolean });
  mustEl<HTMLElement>("gfx").textContent = session.backendName;
  applyTime(session, "dusk");
  setMode("exploded");
  setHouseVisibility(session);
  mustEl<HTMLElement>("loadbar").style.width = "100%";
  animate();
  setTimeout(hideLoader, 400);
}
void start();

if (typeof __LAYERHOUSE_DEV__ === "undefined" || __LAYERHOUSE_DEV__) {
  attachDemo(session, setMode, houseRoot);
}
