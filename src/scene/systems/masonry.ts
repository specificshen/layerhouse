import type * as THREE from "three";
import { MAIN, WING } from "@/config";
import type { HouseRecord, Wall } from "@/types";
import { addBox, buildWall } from "@/geom";
import type { Materials } from "@/materials";

export function masonry(parent: THREE.Object3D, walls: Wall[], mats: Materials, rec: HouseRecord) {
  // Exterior CMU/concrete shell following exterior walls, slightly thicker, with same openings
  for (const w of walls) {
    if (w.kind !== "ext") continue;
    const mw = { ...w, t: w.t + 0.04, openings: w.openings };
    buildWall(parent, mw, mats.cmu, rec, { collide: false, clip: true });
  }
  // Foundation stem slightly below grade
  const mainW = MAIN.x1 - MAIN.x0 + 0.3;
  const mainD = MAIN.z1 - MAIN.z0 + 0.3;
  addBox(
    parent,
    mainW,
    0.4,
    mainD,
    (MAIN.x0 + MAIN.x1) / 2,
    -0.1,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.concrete,
    rec,
    { clip: true },
  );
  addBox(
    parent,
    WING.x1 - WING.x0 + 0.3,
    0.4,
    WING.z1 - WING.z0 + 0.3,
    (WING.x0 + WING.x1) / 2,
    -0.1,
    (WING.z0 + WING.z1) / 2,
    mats.concrete,
    rec,
    { clip: true },
  );
}
