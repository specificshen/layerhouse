import type { Session } from "@/world/session";
import { nearestDoorIndex } from "./nearest-door";

export function toggleNearestDoor(s: Session) {
  const index = nearestDoorIndex(s.rec.doors, s.camera.position);
  const best = index >= 0 ? s.rec.doors[index] : undefined;
  if (best) best.target = best.target > 0.5 ? 0 : 1;
}
