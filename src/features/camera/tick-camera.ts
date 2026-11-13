import type { Session } from "../../app/session";

export function tickCamera(s: Session, dt: number) {
  if (!s.cam.active || s.walk.on) return;
  s.cam.t += dt / s.cam.dur;
  const u = s.cam.t >= 1 ? 1 : s.cam.t * s.cam.t * (3 - 2 * s.cam.t);
  s.camera.position.lerpVectors(s.cam.p0, s.cam.p1, u);
  s.orbit.target.lerpVectors(s.cam.t0, s.cam.t1, u);
  if (s.cam.t >= 1) s.cam.active = false;
}
