import type * as THREE from "three";
import { MAIN, WING, Y_L2_CEIL, Y_L2_TOP } from "../../config";
import type { HouseRecord } from "../../types";
import { BoxBatch, runAlong, solidRects } from "../geom";
import type { Materials } from "../materials";

export function insulation(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
  const batts = new BoxBatch(mats.insulation, "batts");
  for (const w of rec.wallsData) {
    const t = Math.max(0.08, w.t - 0.06);
    const rects = solidRects(w.a0, w.a1, w.y0, w.y1, w.openings || []);
    for (const r of rects) {
      const sx = w.axis === "z" ? r.a1 - r.a0 - 0.02 : t;
      const sz = w.axis === "x" ? r.a1 - r.a0 - 0.02 : t;
      const sy = r.y1 - r.y0 - 0.04;
      if (sy < 0.05) continue;
      const x = w.axis === "z" ? (r.a0 + r.a1) / 2 : w.pos;
      const z = w.axis === "x" ? (r.a0 + r.a1) / 2 : w.pos;
      batts.add(sx, sy, sz, x, (r.y0 + r.y1) / 2, z);
    }
  }
  // floor / ceiling batts between joists
  const jSpace = 0.4;
  for (const x of runAlong(MAIN.x0 + 0.2, MAIN.x1 - 0.2, jSpace, 0.15)) {
    const well = rec.well;
    if (x > well.x0 && x < well.x1) continue;
    batts.add(
      jSpace - 0.08,
      0.14,
      MAIN.z1 - MAIN.z0 - 0.3,
      x,
      Y_L2_TOP - 0.16,
      (MAIN.z0 + MAIN.z1) / 2,
    );
    batts.add(
      jSpace - 0.08,
      0.12,
      MAIN.z1 - MAIN.z0 - 0.3,
      x,
      Y_L2_CEIL + 0.1,
      (MAIN.z0 + MAIN.z1) / 2,
    );
  }
  for (const x of runAlong(WING.x0 + 0.2, WING.x1 - 0.2, jSpace, 0.15)) {
    batts.add(jSpace - 0.08, 0.12, WING.z1 - WING.z0 - 0.3, x, 3.0, (WING.z0 + WING.z1) / 2);
  }
  batts.flush(parent, { cast: false, receive: true });
}
