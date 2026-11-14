import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CAM, ROOF_LIFT } from "@/config";
import {
  applyQualityQuery,
  applyRendererSize,
  createFrameGate,
  createPipeline,
  createRenderer,
  frameAction,
  markDrawn,
  noteInput,
  previewBackendName,
  readBackendName,
  scheduleDelayMs,
  wantsWebGLBackend,
} from "@/engine";
import type { FrameGate } from "@/engine";
import { lerpCam, orbitPreset, tickCamera } from "@/features/camera";
import { createFilm, filmAutostart } from "@/features/film";
import type { FilmController } from "@/features/film";
import { createHotspots } from "@/features/hotspots";
import { setHouseVisibility } from "@/features/layers/visibility";
import {
  bindWalkPointer,
  enterWalk,
  exitWalk,
  syncDoorPrompt,
  toggleNearestDoor,
  updateDoors,
  updateWalk,
} from "@/features/walk";
import { createMaterials, createTextures } from "@/materials";
import { furnishHouse } from "@/scene/furnish";
import { buildHouse } from "@/scene/house";
import { buildLandscape, buildSite, buildWater } from "@/scene/site";
import { buildContext } from "@/scene/site/context";
import { createSky, createSunDisc } from "@/scene/sky";
import { buildSystems } from "@/scene/systems";
import type { ViewMode } from "@/types";
import { cutPanel } from "@/ui/cut-panel";
import { mustEl } from "@/ui/dom";
import { createHelpDialog } from "@/ui/help-dialog";
import { bindHud, syncModeChrome } from "@/ui/hud";
import { hideLoader, loadStatus, nextPaint, paintLoader, showLoadStep } from "@/ui/loader";
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
import { presentExplodedDusk, warmupPlan } from "@/world/warm";

const params = new URLSearchParams(location.search);
applyQualityQuery(params);
const forceWebGL = wantsWebGLBackend(params);

async function boot() {
  mustEl<HTMLElement>("skip").addEventListener("click", hideLoader);
  const plan = warmupPlan();
  const total = 5 + plan.length + 1;
  let step = 0;
  const mark = async (status: string) => {
    await showLoadStep(step, total, status);
    step += 1;
  };

  await mark(loadStatus("scene"));
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

  await mark(loadStatus("site"));
  buildSite(rec.groups, mats, rec);

  await mark(loadStatus("trees"));
  buildLandscape(rec.groups, mats, rec);

  await mark(loadStatus("systems"));
  buildSystems(rec.groups, mats, rec);
  const houseRoot = new THREE.Group();
  houseRoot.name = "houseRoot";
  for (const group of Object.values(rec.groups)) houseRoot.add(group);
  scene.add(houseRoot);
  const context = buildContext(mats, rec);
  scene.add(context);
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
    context,
    waterGrp,
  });
  mountClipGroup(session);
  addRoomBounce(scene);

  const hotspots = createHotspots(scene, camera, canvas, rec, () => session.mode);
  let film: FilmController | null = null;

  function setMode(next: ViewMode) {
    if (film?.isPlaying()) return;
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
    applyTime: (id) => {
      if (film?.isPlaying()) return;
      applyTime(session, id);
    },
    resetView() {
      if (film?.isPlaying()) return;
      if (session.mode === "walk") setMode(session.prevMode);
      const preset = orbitPreset(session.mode, session.cutDir);
      lerpCam(session, preset.pos, preset.target, 0.7);
    },
    setCutDir(dir) {
      if (film?.isPlaying()) return;
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
      if (film?.isPlaying()) return;
      session.cutValue = value;
      updateCut(session);
    },
    onReturn: () => {
      if (film?.isPlaying()) {
        film.stop();
        return;
      }
      setMode(session.prevMode || "exploded");
    },
    getCutRange: () => cutRange(session),
    getLayer: () => session.xrayLayer,
    setLayer(id) {
      if (film?.isPlaying()) return;
      session.xrayLayer = id;
      setHouseVisibility(session);
    },
  });

  bindWalkPointer(session);
  canvas.addEventListener("mousemove", (event) => {
    if (film?.isPlaying()) return;
    hotspots.onMouseMove(event);
  });
  mustEl<HTMLButtonElement>("btn-film").addEventListener("click", () => film?.toggle());

  const gate = createFrameGate(performance.now());
  const poke = () => {
    noteInput(gate, performance.now());
    if (frameTimer === 0) return;
    if (scheduleDelayMs(gate, performance.now()) >= 8) return;
    window.clearTimeout(frameTimer);
    frameTimer = 0;
    scheduleFrame();
  };
  window.addEventListener("pointerdown", poke);
  window.addEventListener("pointermove", poke);
  window.addEventListener("wheel", poke, { passive: true });

  window.addEventListener("keydown", (event) => {
    poke();
    if (
      event.code === "KeyP" &&
      !event.repeat &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      film?.toggle();
    }
    session.walk.keys[event.code] = true;
    if (event.code === "Escape") {
      if (film?.isPlaying()) film.stop();
      else if (help.isOpen()) help.close();
      else if (session.mode === "walk") setMode(session.prevMode || "exploded");
    }
    if ((event.code === "KeyE" || event.code === "KeyF") && session.mode === "walk") {
      toggleNearestDoor(session);
    }
  });
  window.addEventListener("keyup", (event) => {
    poke();
    session.walk.keys[event.code] = false;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    applyRendererSize(renderer, window.innerWidth, window.innerHeight, window.devicePixelRatio);
  });

  const heldCam = new THREE.Vector3();
  const heldTarget = new THREE.Vector3();
  const clock = new THREE.Clock();
  let roofTarget = ROOF_LIFT;
  let lightKey = "";
  let looping = false;
  let frameHandle = 0;
  let frameTimer = 0;

  function cameraMoved() {
    const moved =
      camera.position.distanceToSquared(heldCam) > 1e-8 ||
      orbit.target.distanceToSquared(heldTarget) > 1e-8;
    heldCam.copy(camera.position);
    heldTarget.copy(orbit.target);
    return moved;
  }

  function drawFrame() {
    const dt = Math.min(0.05, clock.getDelta());
    film?.tick(dt, document.hidden);
    roofTarget = session.mode === "exploded" ? ROOF_LIFT : 0;
    session.roofY += (roofTarget - session.roofY) * Math.min(1, dt * 5.5);
    rec.roofGroup.position.y = session.roofY;
    const nextKey = `${session.mode}|${session.timeId}|${session.roofY.toFixed(3)}`;
    if (nextKey !== lightKey) {
      lightKey = nextKey;
      syncOpenRoofLighting(session);
    }
    if (session.mode === "cut") updateCut(session);
    if (!film?.isPlaying()) {
      tickCamera(session, dt);
      if (session.walk.on) updateWalk(session, dt);
      else orbit.update();
    }
    updateDoors(session, dt);
    hotspots.updateLabel();
    syncDoorPrompt(session);
    pipeline.render();
  }

  function scheduleFrame() {
    if (!looping || document.hidden || frameHandle !== 0 || frameTimer !== 0) return;
    const delay = scheduleDelayMs(gate, performance.now());
    if (delay > 4) {
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        frameHandle = requestAnimationFrame(onFrame);
      }, delay);
      return;
    }
    frameHandle = requestAnimationFrame(onFrame);
  }

  function onFrame(now: number) {
    frameHandle = 0;
    const action = frameAction(gate, now, document.hidden);
    if (action === "stop") return;
    if (action === "draw") {
      markDrawn(gate, now);
      drawFrame();
      if (cameraMoved()) noteInput(gate, now);
    }
    scheduleFrame();
  }

  function stopFrames() {
    if (frameHandle !== 0) cancelAnimationFrame(frameHandle);
    if (frameTimer !== 0) window.clearTimeout(frameTimer);
    frameHandle = 0;
    frameTimer = 0;
  }

  function arm(gateNow: FrameGate) {
    clock.getDelta();
    noteInput(gateNow, performance.now());
    gateNow.lastDrawn = -1;
    heldCam.copy(camera.position);
    heldTarget.copy(orbit.target);
    scheduleFrame();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopFrames();
      return;
    }
    if (looping) arm(gate);
  });

  await mark(loadStatus("gpu"));
  await renderer.init();
  session.backendName = readBackendName(renderer.backend as { isWebGPUBackend?: boolean });
  mustEl<HTMLElement>("gfx").textContent = session.backendName;

  for (const warm of plan) {
    await mark(warm.status);
    warm.run(session);
  }

  await mark(loadStatus("ready"));
  presentExplodedDusk(session);
  syncModeChrome("exploded");
  film = createFilm({
    session,
    syncMode: syncModeChrome,
    closeHelp: () => help.close(),
    dismissHover: () => hotspots.dismiss(),
    noteActivity: () => noteInput(gate, performance.now()),
  });
  if (typeof __LAYERHOUSE_DEV__ === "undefined" || __LAYERHOUSE_DEV__) {
    const controls = film;
    attachDemo(session, setMode, houseRoot, {
      start: () => controls.start(),
      stop: () => controls.stop(),
      seek: (seconds) => controls.seek(seconds),
      state: () => controls.state(),
    });
  }

  paintLoader(total, total, loadStatus("ready"));
  await nextPaint();
  looping = true;
  arm(gate);
  hideLoader();
  if (filmAutostart(params)) film.start(false);
}

void boot();
