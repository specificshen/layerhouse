import * as THREE from "three";
import { CARPORT, LOT, WATER_EDGE } from "../../config";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

export function buildFence(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const slatH = 0.11,
    gap = 0.028,
    n = 7,
    h = n * (slatH + gap);
  function run(x0: number, z0: number, x1: number, z1: number) {
    const dx = x1 - x0,
      dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const rotY = Math.atan2(dx, dz);
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    const posts = Math.max(2, Math.round(len / 1.7));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const px = x0 + dx * t;
      const pz = z0 + dz * t;
      addBox(parent, 0.1, h + 0.22, 0.1, px, (h + 0.22) / 2, pz, mats.fence, rec, {});
      addBox(parent, 0.14, 0.04, 0.14, px, h + 0.2, pz, mats.woodDark, rec, { noCast: true });
    }
    for (let i = 0; i < n; i++) {
      const y = 0.16 + i * (slatH + gap);
      addBox(parent, 0.035, slatH, len - 0.08, cx, y, cz, mats.fence, rec, { rotY, noCast: true });
    }
    addBox(parent, 0.06, 0.045, len, cx, h + 0.08, cz, mats.woodDark, rec, { rotY });
  }
  // west lot
  run(LOT.x0 + 0.4, WATER_EDGE + 0.4, LOT.x0 + 0.4, 8.5);
  // south-west (leave entry/drive open)
  run(LOT.x0 + 0.4, 8.5, -3.2, 8.5);
  // east
  run(LOT.x1 - 0.6, WATER_EDGE + 0.8, LOT.x1 - 0.6, 7.2);
  run(11.6, 7.2, LOT.x1 - 0.6, 7.2);
}

export function buildCarport(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const { x0, x1, z0, z1 } = CARPORT;
  const y = 2.85;
  const posts: Array<[number, number]> = [
    [x0 + 0.25, z0 + 0.25],
    [x1 - 0.25, z0 + 0.25],
    [x0 + 0.25, z1 - 0.25],
    [x1 - 0.25, z1 - 0.25],
  ];
  for (const [x, z] of posts) addCyl(parent, 0.07, y, x, y / 2, z, mats.steel);
  addBox(
    parent,
    x1 - x0 + 0.3,
    0.08,
    z1 - z0 + 0.3,
    (x0 + x1) / 2,
    y,
    (z0 + z1) / 2,
    mats.fascia,
    rec,
    {},
  );
  addBox(
    parent,
    x1 - x0 + 0.3,
    0.03,
    z1 - z0 + 0.3,
    (x0 + x1) / 2,
    y - 0.06,
    (z0 + z1) / 2,
    mats.deck,
    rec,
    {},
  );
  rec.floors.push({ x0, x1, z0, z1, y: 0.04, level: 0 });
}

export function buildDock(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const x0 = 1.1,
    x1 = 3.6,
    z0 = -15.2,
    z1 = -10.2;
  const plank = 0.16;
  const gap = 0.018;
  for (let z = z0 + plank / 2; z < z1; z += plank + gap) {
    addBox(parent, x1 - x0 - 0.08, 0.045, plank, (x0 + x1) / 2, 0.28, z, mats.deck, rec, {
      noCast: true,
    });
  }
  addBox(parent, 0.12, 0.1, z1 - z0, x0 + 0.16, 0.18, (z0 + z1) / 2, mats.woodDark, rec, {});
  addBox(parent, 0.12, 0.1, z1 - z0, x1 - 0.16, 0.18, (z0 + z1) / 2, mats.woodDark, rec, {});
  for (let i = 0; i < 5; i++) {
    const z = z0 + 0.4 + i * ((z1 - z0 - 0.8) / 4);
    addCyl(parent, 0.07, 0.95, x0 + 0.16, -0.12, z, mats.woodDark);
    addCyl(parent, 0.07, 0.95, x1 - 0.16, -0.12, z, mats.woodDark);
  }
  for (const x of [x0 + 0.04, x1 - 0.04]) {
    addBox(parent, 0.045, 0.04, z1 - z0 - 0.15, x, 0.92, (z0 + z1) / 2, mats.woodDark, rec, {});
    for (let i = 0; i < 6; i++) {
      const z = z0 + 0.35 + i * ((z1 - z0 - 0.7) / 5);
      addBox(parent, 0.04, 0.62, 0.04, x, 0.6, z, mats.woodDark, rec, {});
    }
  }
  rec.floors.push({ x0, x1, z0, z1, y: 0.3, level: 0 });
  rec.hotspots.push({
    id: "dock",
    labelZh: "临水栈道",
    labelEn: "Water dock",
    position: new THREE.Vector3((x0 + x1) / 2, 1.0, z0 + 1.2),
    object: parent,
  });
}
