import type * as THREE from "three";
import { Y_GF_CEIL, Y_L2_CEIL, Y_L2_TOP } from "@/config";
import type { HouseRecord } from "@/types";
import { addCyl, CylBatch } from "@/geom";
import type { Materials } from "@/materials";
import { wirePath } from "./wire-path";

function pipePath(
  batch: CylBatch,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  r = 0.025,
) {
  wirePath(batch, x0, y0, z0, x1, y1, z1, r);
}

export function plumbing(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const hot = new CylBatch(mats.pipe, "pipeHot", 8);
  const cold = new CylBatch(mats.pipeCold, "pipeCold", 8);

  // Water heater in utility near east / carport door: x=6.1, z=4.7
  const hx = 6.15,
    hz = 4.7;
  addCyl(parent, 0.28, 1.2, hx, 0.74, hz, mats.fixture);
  addCyl(parent, 0.3, 0.08, hx, 1.36, hz, mats.steel, { noShadow: true });

  const yFloor = 0.08;
  const yCeil = Y_GF_CEIL - 0.18;
  // Main stack near powder / core
  const sx = 0.0,
    sz = 2.0;
  cold.add(0.05, Y_L2_CEIL + 0.4, sx, (Y_L2_CEIL + 0.4) / 2, sz);
  // vent through roof
  addCyl(parent, 0.04, 0.5, sx, rec.roofMeta.ridgeY - 0.6, sz, mats.pipe, {});

  // From heater to stack and out
  pipePath(hot, hx, 1.2, hz, sx, yCeil, sz, 0.022);
  pipePath(cold, hx, 0.4, hz, sx, yFloor, sz, 0.025);

  // Powder: vanity + toilet
  pipePath(cold, sx, yFloor, sz, 0.15, yFloor, 2.35, 0.02);
  pipePath(hot, sx, yCeil, sz, 0.15, 0.6, 2.35, 0.018);
  pipePath(cold, sx, yFloor, sz, -1.15, yFloor, 2.15, 0.03); // waste toward toilet
  addCyl(parent, 0.07, 0.2, -1.15, 0.2, 2.15, mats.pipe, {});

  // Kitchen sink at 6.15, -0.5
  pipePath(cold, hx, 0.4, hz, 6.15, 0.4, -0.5, 0.02);
  pipePath(hot, hx, 1.2, hz, 6.15, 0.7, -0.5, 0.018);
  addCyl(parent, 0.05, 0.4, 6.15, 0.3, -0.5, mats.pipe, {});

  // Guest bath
  pipePath(cold, sx, yFloor, sz, -6.4, yFloor, -3.6, 0.02);
  pipePath(hot, sx, yCeil, sz, -6.4, 0.6, -3.6, 0.018);
  pipePath(cold, -6.4, yFloor, -3.6, -6.5, yFloor, -4.7, 0.03);
  pipePath(cold, -6.4, yFloor, -3.6, -5.0, yFloor, -3.0, 0.025);
  addCyl(parent, 0.05, 0.35, -6.5, 0.22, -4.7, mats.pipe, {});

  // L2 baths — stack continues
  const y2 = Y_L2_TOP + 0.08;
  const y2c = Y_L2_CEIL - 0.18;
  pipePath(cold, sx, Y_L2_TOP - 0.2, sz, -6.4, y2, 4.7, 0.02);
  pipePath(hot, sx, y2c, sz, -6.4, y2 + 0.5, 4.7, 0.018);
  pipePath(cold, -6.4, y2, 4.7, -6.5, y2, 5.7, 0.03);
  pipePath(cold, -6.4, y2, 4.7, -2.95, y2, 5.5, 0.025);
  addCyl(parent, 0.05, 0.3, -6.5, y2 + 0.15, 5.7, mats.pipe, {});

  // Hall bath
  pipePath(cold, sx, y2, sz, 1.52, y2, 5.5, 0.02);
  pipePath(hot, sx, y2c, sz, 1.52, y2 + 0.5, 5.5, 0.018);
  pipePath(cold, 1.52, y2, 5.5, 0.9, y2, 3.5, 0.03);
  pipePath(cold, 1.52, y2, 5.5, 2.0, y2, 3.55, 0.025);

  // Outdoor hose bib
  pipePath(cold, hx, 0.4, hz, 6.9, 0.4, 5.4, 0.018);
  addCyl(parent, 0.025, 0.12, 6.95, 0.5, 5.4, mats.steel, { rotZ: Math.PI / 2 });

  // Pool fill / feature pipe (short)
  pipePath(cold, 0.15, yFloor, 2.35, 0.2, 0.2, -4.15, 0.02);

  hot.flush(parent, { cast: true });
  cold.flush(parent, { cast: true });

  // Visible fixtures already in furniture; add a few P-traps / valves as solids
  const traps: Array<[number, number, number]> = [
    [0.15, 0.35, 2.35],
    [6.15, 0.35, -0.5],
    [-6.4, 0.35, -3.6],
    [-6.4, Y_L2_TOP + 0.35, 4.7],
    [1.52, Y_L2_TOP + 0.35, 5.5],
  ];
  for (const [x, y, z] of traps) {
    addCyl(parent, 0.03, 0.18, x, y, z, mats.pipe, { noShadow: true });
    addCyl(parent, 0.03, 0.12, x + 0.08, y - 0.08, z, mats.pipe, {
      rotZ: Math.PI / 2,
      noShadow: true,
    });
  }
}
