import type * as THREE from "three";
import { WATER_EDGE } from "../../config";
import type { Session } from "../../app/session";

export function resolveCollision(s: Session, p: THREE.Vector3, r = 0.28) {
  for (const c of s.rec.collisions) {
    if (p.y + 0.4 < c.y0 || p.y - 1.2 > c.y1) continue;
    const x0 = c.x0 - r,
      x1 = c.x1 + r,
      z0 = c.z0 - r,
      z1 = c.z1 + r;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
      const l = p.x - x0,
        ri = x1 - p.x,
        bo = p.z - z0,
        t = z1 - p.z;
      const m = Math.min(l, ri, bo, t);
      if (m === l) p.x = x0;
      else if (m === ri) p.x = x1;
      else if (m === bo) p.z = z0;
      else p.z = z1;
    }
  }
  if (p.z < WATER_EDGE + 0.35) {
    const onDock = s.rec.floors.some(
      (f) => f.y > 0.2 && p.x >= f.x0 && p.x <= f.x1 && p.z >= f.z0 && p.z <= f.z1,
    );
    if (!onDock) p.z = WATER_EDGE + 0.35;
  }
}
