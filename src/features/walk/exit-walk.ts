import type { Session } from "../../app/session";

export function exitWalk(s: Session) {
  s.walk.on = false;
  s.walk.pointer = false;
  s.orbit.enabled = true;
  s.canvas.style.cursor = "";
  if (document.pointerLockElement) document.exitPointerLock();
}
