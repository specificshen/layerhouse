import { CAM } from "../config";
import type { CutDir, Mode, Vec3 } from "../types";
import type { Session } from "./session";

export function orbitPreset(mode: Mode, cutDir: CutDir) {
  if (mode === "cut") {
    return CAM[cutDir === "side" ? "cutSide" : cutDir === "front" ? "cutFront" : "cut"];
  }
  if (mode === "exterior" || mode === "exploded" || mode === "xray") return CAM[mode];
  return CAM.exploded;
}

export function lerpCam(s: Session, pos: Vec3 | number[], target: Vec3 | number[], dur = 0.95) {
  s.cam.active = true;
  s.cam.t = 0;
  s.cam.dur = dur;
  s.cam.p0.copy(s.camera.position);
  s.cam.p1.set(pos[0]!, pos[1]!, pos[2]!);
  s.cam.t0.copy(s.orbit.target);
  s.cam.t1.set(target[0]!, target[1]!, target[2]!);
}

export function tickCamera(s: Session, dt: number) {
  if (!s.cam.active || s.walk.on) return;
  s.cam.t += dt / s.cam.dur;
  const u = s.cam.t >= 1 ? 1 : s.cam.t * s.cam.t * (3 - 2 * s.cam.t);
  s.camera.position.lerpVectors(s.cam.p0, s.cam.p1, u);
  s.orbit.target.lerpVectors(s.cam.t0, s.cam.t1, u);
  if (s.cam.t >= 1) s.cam.active = false;
}
