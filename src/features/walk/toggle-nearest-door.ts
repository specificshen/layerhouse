import type { Session } from "../../app/session";

export function toggleNearestDoor(s: Session) {
  let best: (typeof s.rec.doors)[number] | null = null;
  let bd = 2.2;
  for (const d of s.rec.doors) {
    const dist = Math.hypot(d.x - s.camera.position.x, d.z - s.camera.position.z);
    if (dist < bd && s.camera.position.y > d.y0 - 0.5 && s.camera.position.y < d.y1 + 0.8) {
      best = d;
      bd = dist;
    }
  }
  if (best) best.target = best.target > 0.5 ? 0 : 1;
}
