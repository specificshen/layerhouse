import type { Session } from "@/world/session";
import { applyWalkLook } from "./apply-walk-look";
import { pitchDelta, yawDelta } from "./look";

export function bindWalkPointer(s: Session) {
  let draggingLook = false;
  let lx = 0;
  let ly = 0;
  s.canvas.addEventListener("mousedown", (e) => {
    if (!s.walk.on || e.button !== 0) return;
    draggingLook = true;
    lx = e.clientX;
    ly = e.clientY;
    try {
      s.canvas.requestPointerLock();
    } catch {
      /* pointer lock is optional */
    }
  });
  document.addEventListener("pointerlockchange", () => {
    s.walk.pointer = document.pointerLockElement === s.canvas;
  });
  window.addEventListener("mousemove", (e) => {
    if (!s.walk.on) return;
    let dx = 0;
    let dy = 0;
    if (s.walk.pointer) {
      dx = e.movementX;
      dy = e.movementY;
    } else if (draggingLook) {
      dx = e.clientX - lx;
      dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    } else return;
    s.walk.yaw += yawDelta(dx);
    s.walk.pitch = Math.max(-1.2, Math.min(1.2, s.walk.pitch + pitchDelta(dy)));
    applyWalkLook(s);
  });
  window.addEventListener("mouseup", () => {
    draggingLook = false;
  });
}
