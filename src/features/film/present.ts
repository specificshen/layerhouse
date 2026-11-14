import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ROOF_LIFT } from "@/config";
import { setHouseVisibility } from "@/features/layers/visibility";
import { applyWalkLook, exitWalk } from "@/features/walk";
import type { Mode, ViewMode } from "@/types";
import { applyTime, syncOpenRoofLighting } from "@/world/lighting";
import type { Session } from "@/world/session";
import { updateCut } from "@/world/section";
import type { ViewStamp } from "./run";
import { entryDoorOpen, type FilmSample } from "./timeline";

function asView(mode: Mode): ViewMode {
  switch (mode) {
    case "boot":
      return "exploded";
    case "exterior":
    case "exploded":
    case "cut":
    case "xray":
    case "walk":
      return mode;
    default: {
      const unexpected: never = mode;
      return unexpected;
    }
  }
}

function clearOrbitDelta(orbit: OrbitControls) {
  const withDelta = orbit as OrbitControls & {
    _sphericalDelta?: { set: (x: number, y: number, z: number) => void };
  };
  withDelta._sphericalDelta?.set(0, 0, 0);
}

function clearClip(s: Session) {
  s.clipPlanes.length = 0;
  s.clipGroup.enabled = false;
  s.capGroup.clear();
}

function placeCamera(s: Session, position: FilmSample["position"], target: FilmSample["target"]) {
  s.camera.position.set(position[0], position[1], position[2]);
  s.orbit.target.set(target[0], target[1], target[2]);
  s.camera.lookAt(target[0], target[1], target[2]);
  s.cam.active = false;
}

function entryPivot(s: Session) {
  return s.rec.doors.find((door) => door.style === "pivot");
}

function syncEntryDoor(s: Session, sample: FilmSample, snap: boolean) {
  const door = entryPivot(s);
  if (!door) return;
  door.target = entryDoorOpen(sample.beat, sample.position[2]) ? 1 : 0;
  if (snap) door.open = door.target;
}

export function seatRoof(s: Session, lifted: boolean) {
  s.roofY = lifted ? ROOF_LIFT : 0;
  s.rec.roofGroup.position.y = s.roofY;
  syncOpenRoofLighting(s);
}

export function captureView(s: Session): ViewStamp {
  return {
    mode: asView(s.mode),
    timeId: s.timeId,
    cutDir: s.cutDir,
    cutValue: s.cutValue,
    xrayLayer: s.xrayLayer,
    prevMode: s.prevMode,
    position: [s.camera.position.x, s.camera.position.y, s.camera.position.z],
    target: [s.orbit.target.x, s.orbit.target.y, s.orbit.target.z],
    walkOn: s.walk.on,
    yaw: s.walk.yaw,
    pitch: s.walk.pitch,
    entryDoor: entryPivot(s)?.target ?? 0,
  };
}

export function suspendForFilm(s: Session) {
  if (s.walk.on) exitWalk(s);
  s.orbit.enabled = false;
  s.cam.active = false;
  s.canvas.style.cursor = "";
  clearOrbitDelta(s.orbit);
}

export function applyFilmSample(s: Session, sample: FilmSample, snapDoor = false) {
  if (s.walk.on) exitWalk(s);
  s.orbit.enabled = false;
  s.cam.active = false;
  if (s.mode !== sample.mode) {
    if (s.mode === "cut") clearClip(s);
    s.mode = sample.mode;
    setHouseVisibility(s);
  }
  if (sample.mode === "cut") {
    if (s.cutDir !== sample.cutDir || s.cutValue !== sample.cutValue || s.clipPlanes.length === 0) {
      s.cutDir = sample.cutDir;
      s.cutValue = sample.cutValue;
      updateCut(s);
    }
  }
  if (s.timeId !== sample.timeId) applyTime(s, sample.timeId);
  syncEntryDoor(s, sample, snapDoor);
  placeCamera(s, sample.position, sample.target);
}

export function restoreView(s: Session, stamp: ViewStamp) {
  if (s.walk.on) exitWalk(s);
  s.mode = stamp.mode;
  s.prevMode = stamp.prevMode;
  s.xrayLayer = stamp.xrayLayer;
  s.cutDir = stamp.cutDir;
  s.cutValue = stamp.cutValue;
  if (stamp.mode === "cut") updateCut(s);
  else clearClip(s);
  setHouseVisibility(s);
  applyTime(s, stamp.timeId);
  const door = entryPivot(s);
  if (door) door.target = stamp.entryDoor;
  placeCamera(s, stamp.position, stamp.target);
  clearOrbitDelta(s.orbit);
  if (stamp.walkOn) {
    s.walk.on = true;
    s.walk.yaw = stamp.yaw;
    s.walk.pitch = stamp.pitch;
    s.walk.pointer = false;
    s.walk.vy = 0;
    s.walk.grounded = true;
    s.orbit.enabled = false;
    s.canvas.style.cursor = "grab";
    applyWalkLook(s);
    return;
  }
  s.walk.on = false;
  s.orbit.enabled = true;
  s.canvas.style.cursor = "";
  s.orbit.update();
}

/** Keep the hero framing, and put the dial's remembered cut back. */
export function restoreIdleCut(s: Session, stamp: ViewStamp) {
  s.prevMode = stamp.prevMode;
  s.cutDir = stamp.cutDir;
  s.cutValue = stamp.cutValue;
  s.xrayLayer = stamp.xrayLayer;
}

export function releaseOrbit(s: Session) {
  s.cam.active = false;
  s.walk.on = false;
  s.walk.pointer = false;
  s.orbit.enabled = true;
  s.canvas.style.cursor = "";
  clearOrbitDelta(s.orbit);
  s.orbit.update();
}
