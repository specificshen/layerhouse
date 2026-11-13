import type * as THREE from "three";
import { Y_GF_TOP, Y_L2_TOP } from "@/config";
import type { HouseRecord, Wall } from "@/types";
import { addBox, solidRects } from "@/geom";
import type { Materials } from "@/materials";

export function baseboards(
  parent: THREE.Object3D,
  walls: Wall[],
  mats: Materials,
  rec: HouseRecord,
) {
  const h = 0.1;
  const d = 0.03;
  for (const w of walls) {
    for (const floorY of [Y_GF_TOP, Y_L2_TOP]) {
      if (w.y0 > floorY + 0.05 || w.y1 < floorY + h) continue;
      const y = floorY + h / 2;
      const spans = solidRects(w.a0, w.a1, floorY, floorY + h, w.openings);
      const inward = w.axis === "z" ? Math.sign(2 - w.pos) || -1 : Math.sign(-w.pos) || 1;
      const faces = w.kind === "int" ? [-1, 1] : [inward];
      for (const span of spans) {
        const len = span.a1 - span.a0;
        if (len < 0.3) continue;
        const mid = (span.a0 + span.a1) / 2;
        for (const face of faces) {
          const inset = face * (w.t / 2 + d / 2 - 0.004);
          if (w.axis === "z") {
            addBox(parent, len, h, d, mid, y, w.pos + inset, mats.woodDark, rec, {
              clip: true,
              noCast: true,
            });
          } else {
            addBox(parent, d, h, len, w.pos + inset, y, mid, mats.woodDark, rec, {
              clip: true,
              noCast: true,
            });
          }
        }
      }
    }
  }
}
