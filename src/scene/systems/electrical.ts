import type * as THREE from "three";
import { Y_GF_CEIL, Y_GF_TOP, Y_L2_CEIL, Y_L2_TOP } from "../../config";
import type { HouseRecord } from "../../types";
import { addBox, BoxBatch, CylBatch, runAlong } from "../geom";
import type { Materials } from "../materials";
import { wirePath } from "./wire-path";

export function electrical(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
  const gold = new CylBatch(mats.wire, "wireGold", 6);
  const red = new CylBatch(mats.wireRed, "wireRed", 6);
  const devices = new BoxBatch(mats.outlet, "devices");

  const panelX = 6.35,
    panelZ = 5.4,
    panelY = 1.4;
  addBox(parent, 0.12, 0.9, 0.4, panelX, panelY, panelZ, mats.steel, rec, {});

  // Main home runs: along ceiling perimeters of each room, drops to outlets
  const yC = Y_GF_CEIL - 0.06;
  const yC2 = Y_L2_CEIL - 0.06;
  const yOut = Y_GF_TOP + 0.35;

  const rooms = [
    // living
    { x0: -7.0, x1: -1.6, z0: -2.05, z1: 6.05, y: yC, drops: true },
    // kitchen
    { x0: 2.55, x1: 6.65, z0: -2.05, z1: 6.05, y: yC, drops: true },
    // entry/hall
    { x0: -1.5, x1: 0.5, z0: 3.4, z1: 6.05, y: yC, drops: true },
    // wing bed
    { x0: -7.05, x1: -1.7, z0: -10.35, z1: -5.45, y: yC, drops: true },
    // guest bath
    { x0: -7.05, x1: -4.2, z0: -5.45, z1: -2.35, y: yC, drops: false },
    // master
    { x0: -7.05, x1: -0.2, z0: -2.05, z1: 3.25, y: yC2, drops: true, yDrop: Y_L2_TOP + 0.35 },
    // study
    { x0: 2.55, x1: 6.65, z0: -2.05, z1: 6.05, y: yC2, drops: true, yDrop: Y_L2_TOP + 0.35 },
  ];

  // feeder from panel up to GF ceiling then west
  wirePath(gold, panelX, panelY + 0.4, panelZ, panelX, yC, 1.0);
  wirePath(gold, panelX, yC, 1.0, -4, yC, 1.0);
  wirePath(gold, panelX, yC, 1.0, 1.5, yC2, 1.0);

  for (const rm of rooms) {
    // loop around room at ceiling
    const inset = 0.25;
    const x0 = rm.x0 + inset,
      x1 = rm.x1 - inset,
      z0 = rm.z0 + inset,
      z1 = rm.z1 - inset;
    const y = rm.y;
    wirePath(gold, x0, y, z0, x1, y, z0);
    wirePath(gold, x1, y, z0, x1, y, z1);
    wirePath(gold, x1, y, z1, x0, y, z1);
    wirePath(gold, x0, y, z1, x0, y, z0);
    if (rm.drops) {
      const yD = rm.yDrop || yOut;
      const pts: Array<[number, number]> = [
        [x0, z0],
        [x1, z0],
        [x0, z1],
        [x1, z1],
        [(x0 + x1) / 2, z0],
        [(x0 + x1) / 2, z1],
        [x0, (z0 + z1) / 2],
        [x1, (z0 + z1) / 2],
      ];
      for (const [x, z] of pts) {
        gold.add(0.01, y - yD, x, (y + yD) / 2, z);
        devices.add(0.04, 0.06, 0.04, x, yD, z);
      }
      // a few switches
      devices.add(0.04, 0.08, 0.04, x0 + 0.3, (rm.yDrop ? Y_L2_TOP : Y_GF_TOP) + 1.1, z1);
    }
    // ceiling fixture drops (short)
    gold.add(0.01, 0.08, (x0 + x1) / 2, y - 0.04, (z0 + z1) / 2);
  }

  // Red runs: a dedicated kitchen / mechanical circuit and a L2 homerun
  wirePath(red, panelX, panelY + 0.3, panelZ, panelX, yC, 5.0);
  wirePath(red, panelX, yC, 5.0, 4.5, yC, 0.3);
  wirePath(red, panelX, panelY + 0.2, panelZ, 1.5, yC2, 1.0);
  wirePath(red, 1.5, yC2, 1.0, -2.4, yC2, 1.3);

  // extra dense ceiling grid in kitchen and living
  for (const x of runAlong(-6.5, -2.0, 1.1, 0)) {
    wirePath(gold, x, yC, 0.2, x, yC, 5.4);
  }
  for (const z of runAlong(0.2, 5.4, 1.2, 0)) {
    wirePath(gold, -6.5, yC, z, -2.0, yC, z);
  }
  for (const x of runAlong(3.0, 6.3, 1.0, 0)) {
    wirePath(gold, x, yC, -1.5, x, yC, 5.4);
  }

  gold.flush(parent, { cast: false });
  red.flush(parent, { cast: false });
  devices.flush(parent, { cast: false, receive: false });
}
