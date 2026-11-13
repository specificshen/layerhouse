import type { Session } from "../../app/session";
import type { Vec3 } from "../../types";

export function lerpCam(s: Session, pos: Vec3 | number[], target: Vec3 | number[], dur = 0.95) {
  s.cam.active = true;
  s.cam.t = 0;
  s.cam.dur = dur;
  s.cam.p0.copy(s.camera.position);
  s.cam.p1.set(pos[0]!, pos[1]!, pos[2]!);
  s.cam.t0.copy(s.orbit.target);
  s.cam.t1.set(target[0]!, target[1]!, target[2]!);
}
