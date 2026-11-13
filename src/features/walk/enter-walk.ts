import { CAM, EYE } from "@/config";
import { heightAt } from "@/scene/house";
import type { Session } from "@/world/session";
import { applyWalkLook } from "./apply-walk-look";

const walkStart = CAM.walkStart;

export function enterWalk(s: Session) {
  s.walk.on = true;
  s.walk.yaw = walkStart.yaw;
  s.walk.pitch = walkStart.pitch;
  s.orbit.enabled = false;
  s.camera.position.set(
    walkStart.pos[0],
    heightAt(s.rec, walkStart.pos[0], walkStart.pos[2]) + EYE,
    walkStart.pos[2],
  );
  applyWalkLook(s);
  s.canvas.style.cursor = "grab";
}
