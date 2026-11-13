import type { HouseRecord } from "../../types";

export function heightAt(rec: HouseRecord, x: number, z: number, feetY?: number): number {
  for (const s of rec.stairs) {
    if (x >= s.x0 && x <= s.x1) {
      const zMin = Math.min(s.zStart, s.zEnd);
      const zMax = Math.max(s.zStart, s.zEnd);
      if (z >= zMin && z <= zMax) {
        const t = (s.zStart - z) / (s.zStart - s.zEnd);
        return s.yStart + Math.max(0, Math.min(1, t)) * (s.yEnd - s.yStart);
      }
    }
  }
  const limit = feetY === undefined ? Number.POSITIVE_INFINITY : feetY + 0.45;
  let best = 0;
  let found = false;
  for (const f of rec.floors) {
    if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1 && f.y <= limit) {
      if (!found || f.y > best) {
        best = f.y;
        found = true;
      }
    }
  }
  return best;
}
