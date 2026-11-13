import type * as THREE from "three";
import { MAIN, WALL_T, WING, Y_GF_CEIL } from "../../config";
import { addBox } from "../geom";
import type { HouseRecord } from "../../types";
import type { FurnishPalette } from "./palette";

interface CrownRun {
  axis: "x" | "z";
  fixed: number;
  a0: number;
  a1: number;
  y: number;
  /** +1 projects the lip toward +axis, -1 toward -axis. */
  face: 1 | -1;
}

function layCrown(parent: THREE.Object3D, pal: FurnishPalette, rec: HouseRecord, run: CrownRun) {
  const len = run.a1 - run.a0;
  if (len < 0.25) return;
  const mid = (run.a0 + run.a1) / 2;
  const drop = 0.048;
  const lip = 0.04;
  const yLip = run.y - 0.012;
  const yDrop = run.y - drop / 2;
  if (run.axis === "z") {
    const z0 = run.fixed + run.face * 0.008;
    addBox(parent, len, drop, 0.014, mid, yDrop, z0, pal.trim, rec, { noCast: true });
    addBox(parent, len, 0.016, lip, mid, yLip, z0 + run.face * (lip / 2), pal.trim, rec, {
      noCast: true,
    });
    return;
  }
  const x0 = run.fixed + run.face * 0.008;
  addBox(parent, 0.014, drop, len, x0, yDrop, mid, pal.trim, rec, { noCast: true });
  addBox(parent, lip, 0.016, len, x0 + run.face * (lip / 2), yLip, mid, pal.trim, rec, {
    noCast: true,
  });
}

/** Painted crown and a few ceiling beams. Baseboards stay on the shell. */
export function addCloseTrim(parent: THREE.Object3D, pal: FurnishPalette, rec: HouseRecord) {
  const t = WALL_T / 2;
  const y = Y_GF_CEIL;
  const south = MAIN.z1 - t;
  const north = MAIN.z0 + t;
  const west = MAIN.x0 + t;
  const east = MAIN.x1 - t;
  const runs: CrownRun[] = [
    { axis: "z", fixed: south, a0: MAIN.x0 + 0.12, a1: -1.7, y, face: -1 },
    { axis: "z", fixed: south, a0: 0.9, a1: MAIN.x1 - 0.15, y, face: -1 },
    { axis: "x", fixed: west, a0: MAIN.z0 + 0.15, a1: MAIN.z1 - 0.12, y, face: 1 },
    { axis: "x", fixed: east, a0: MAIN.z0 + 0.15, a1: MAIN.z1 - 0.12, y, face: -1 },
    { axis: "z", fixed: north, a0: -1.4, a1: MAIN.x1 - 0.15, y, face: 1 },
    { axis: "z", fixed: MAIN.z0 + 0.02, a0: MAIN.x0 + 0.15, a1: -1.7, y, face: -1 },
    { axis: "x", fixed: -1.57, a0: 4.5, a1: MAIN.z1 - 0.16, y, face: -1 },
    { axis: "x", fixed: -1.43, a0: 4.5, a1: MAIN.z1 - 0.16, y, face: 1 },
  ];

  const wingCeil = 2.96;
  const wz0 = WING.z0 + t;
  const wz1 = -5.52;
  const wx0 = WING.x0 + t;
  const wx1 = WING.x1 - t;
  runs.push(
    { axis: "x", fixed: wx0, a0: wz0 + 0.08, a1: wz1 - 0.06, y: wingCeil, face: 1 },
    { axis: "x", fixed: wx1, a0: wz0 + 0.08, a1: wz1 - 0.06, y: wingCeil, face: -1 },
    { axis: "z", fixed: wz0, a0: wx0 + 0.08, a1: wx1 - 0.08, y: wingCeil, face: 1 },
    { axis: "z", fixed: wz1, a0: wx0 + 0.08, a1: wx1 - 0.08, y: wingCeil, face: -1 },
  );

  for (const run of runs) layCrown(parent, pal, rec, run);

  addBox(parent, 0.08, 0.06, 4.4, -6.05, y - 0.045, 2.35, pal.oakDark, rec, { noCast: true });
  addBox(parent, 0.08, 0.06, 4.4, -2.6, y - 0.045, 2.35, pal.oakDark, rec, { noCast: true });
  addBox(parent, 2.8, 0.06, 0.08, 4.7, y - 0.045, 2.2, pal.oakDark, rec, { noCast: true });

  // Picture rail on the solid entry pier, above the framed print and clear of glazing.
  addBox(parent, 0.02, 0.018, 1.05, -1.66, 2.18, 5.4, pal.oakDark, rec, { noCast: true });
}
