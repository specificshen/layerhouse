import * as THREE from "three";
import { CARPORT, LOT, WATER_EDGE } from "../../config";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

export function buildFence(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const slatH = 0.08,
    gap = 0.07,
    n = 5,
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
  run(LOT.x0 + 0.4, WATER_EDGE + 0.4, LOT.x0 + 0.4, 12.4);
  // Street-side fence sits on the lot line so living-room glass looks onto lawn, not a wood wall.
  run(LOT.x0 + 0.4, 12.4, -2.4, 12.4);
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
  for (const [x, z] of posts) {
    addCyl(parent, 0.07, y - 0.08, x, (y - 0.08) / 2, z, mats.steel);
    addCyl(parent, 0.11, 0.04, x, y - 0.16, z, mats.steel, { noShadow: true });
    addCyl(parent, 0.1, 0.03, x, 0.02, z, mats.steel, { noShadow: true });
  }
  const roof = new THREE.Group();
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  roof.position.set(cx, y, cz);
  roof.rotation.z = -0.045;
  parent.add(roof);
  const rw = x1 - x0 + 0.55;
  const rd = z1 - z0 + 0.4;
  addBox(roof, rw, 0.05, rd, 0, 0.02, 0, mats.roof, rec, {});
  const seams = 7;
  for (let i = 0; i <= seams; i++) {
    const sx = -rw / 2 + (i * rw) / seams;
    addBox(roof, 0.018, 0.028, rd + 0.04, sx, 0.055, 0, mats.roofSeam, null, {});
  }
  addBox(roof, rw - 0.2, 0.016, rd - 0.16, 0, -0.035, 0, mats.soffit, rec, { noCast: true });
  for (let i = 0; i < 3; i++) {
    const sz = -rd / 2 + 0.55 + (i * (rd - 1.1)) / 2;
    addBox(roof, rw - 0.45, 0.07, 0.07, 0, -0.08, sz, mats.steel, rec, {});
  }
  // Near (south) edge is what the street camera reads; hang a deeper fascia there.
  addBox(roof, rw + 0.08, 0.22, 0.07, 0, -0.06, rd / 2, mats.fascia, rec, {});
  addBox(roof, rw + 0.06, 0.12, 0.05, 0, -0.02, -rd / 2, mats.fascia, rec, {});
  addBox(roof, 0.06, 0.16, rd, -rw / 2, -0.02, 0, mats.fascia, rec, {});
  addBox(roof, 0.06, 0.16, rd, rw / 2, -0.02, 0, mats.fascia, rec, {});
  // rotation.z is negative, so the east eave is the low side.
  addBox(roof, 0.07, 0.05, rd + 0.06, rw / 2 + 0.02, -0.03, 0, mats.fascia, rec, {});
  addBox(parent, rw - 0.2, 0.08, 0.1, cx, y - 0.18, z0 + 0.45, mats.steel, rec, {});
  addBox(parent, rw - 0.2, 0.08, 0.1, cx, y - 0.18, z1 - 0.45, mats.steel, rec, {});
  addBox(parent, 0.04, y - 0.22, 0.04, x1 - 0.02, (y - 0.22) / 2, z1 - 0.12, mats.steel, rec, {});
  // Threshold the street sees in front of the eave, past the roof overhang.
  addBox(parent, x1 - x0 - 0.7, 0.035, 0.85, cx, 0.028, z1 + 0.22, mats.concrete, rec, {
    noCast: true,
  });
  const padX0 = x0 + 0.55;
  const padX1 = x1 - 0.9;
  const padZ0 = z0 + 0.45;
  const padZ1 = z1 - 0.9;
  addBox(
    parent,
    padX1 - padX0,
    0.04,
    padZ1 - padZ0,
    (padX0 + padX1) / 2,
    0.03,
    (padZ0 + padZ1) / 2,
    mats.concrete,
    rec,
    { noCast: true },
  );
  addBox(
    parent,
    0.12,
    0.07,
    1.25,
    padX0 + 0.65,
    0.065,
    (padZ0 + padZ1) / 2 + 0.2,
    mats.concrete,
    rec,
    {
      noCast: true,
    },
  );
  addBox(
    parent,
    0.12,
    0.07,
    1.25,
    padX0 + 1.95,
    0.065,
    (padZ0 + padZ1) / 2 + 0.2,
    mats.concrete,
    rec,
    {
      noCast: true,
    },
  );
  rec.floors.push({ x0, x1, z0, z1, y: 0.04, level: 0 });
}

const LAWN_BAND = 1.55;

function lawnBand(base: THREE.MeshStandardMaterial, scale: number) {
  const mat = base.clone();
  mat.name = "lawnBand";
  mat.userData.scale = scale;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -1;
  mat.polygonOffsetUnits = -4;
  return mat;
}

const LAWN_BLOCKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-7.8, 7.4, -2.8, 6.8],
  [-7.8, -1.3, -11.2, -1.6],
  [-2.0, 7.3, -10.8, -1.6],
  [6.5, 11.7, 1.0, 6.7],
  [-0.5, 8.9, 5.4, 13.5],
  [-3.5, 1.6, 5.9, 10.3],
  [0.8, 4.0, -15.6, -9.6],
];

const LAWN_HOUSES: ReadonlyArray<readonly [number, number, number]> = [
  [-18, -28, 8.4],
  [4, -32, 8.4],
  [24, -26, 8.6],
  [24, 2, 7.8],
  [27, 16, 7.2],
  [-24, 3, 7.8],
  [-26, 18, 7.2],
  [-8, 26, 8.2],
  [10, 28, 8.2],
];

function lawnBlocked(x: number, z: number) {
  if (z < -11.6 || z > 13.05) return true;
  for (const [x0, x1, z0, z1] of LAWN_BLOCKS) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return true;
  }
  for (const [hx, hz, radius] of LAWN_HOUSES) {
    const dx = x - hx;
    const dz = z - hz;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

function mowField(
  land: THREE.Object3D,
  even: THREE.Material,
  odd: THREE.Material,
  rec: HouseRecord,
) {
  const x0 = -20;
  const x1 = 22;
  const z0 = -11.2;
  const z1 = 12.9;
  const step = 0.55;
  let column = 0;
  for (let x = x0; x < x1; x += LAWN_BAND) {
    const mat = column % 2 === 0 ? even : odd;
    column += 1;
    let run: number | null = null;
    const flush = (zEnd: number) => {
      if (run === null) return;
      const depth = zEnd - run;
      if (depth > 0.8) {
        addBox(
          land,
          LAWN_BAND - 0.04,
          0.018,
          depth,
          x + LAWN_BAND / 2,
          0.026,
          (run + zEnd) / 2,
          mat,
          rec,
          {
            noCast: true,
          },
        );
      }
      run = null;
    };
    for (let z = z0; z <= z1; z += step) {
      if (lawnBlocked(x + LAWN_BAND / 2, z)) flush(z);
      else if (run === null) run = z;
    }
    flush(z1);
  }
}

function curbRun(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  sx: number,
  sz: number,
  x: number,
  z: number,
) {
  addBox(parent, sx, 0.09, sz, x, 0.05, z, mats.concrete, rec, {});
  const timberX = sx >= sz ? x : x + Math.sign(x) * (sx / 2 + 0.08);
  const timberZ = sz > sx ? z : z + Math.sign(z) * (sz / 2 + 0.08);
  const timberSX = sx >= sz ? sx : 0.06;
  const timberSZ = sz > sx ? sz : 0.06;
  addBox(parent, timberSX, 0.045, timberSZ, timberX, 0.04, timberZ, mats.woodDark, rec, {
    noCast: true,
  });
}

/** Drive curb, timber lawn edge, and alternating mow bands over the open yard. */
export function buildLotDressing(
  site: THREE.Object3D,
  land: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
) {
  // Outside the existing paver rectangle (x -0.1..8.5, z 5.8..13) and the entry path.
  curbRun(site, mats, rec, 0.22, 7.15, 8.78, 9.45);
  curbRun(site, mats, rec, 9.15, 0.2, 4.2, 13.2);
  curbRun(site, mats, rec, 0.18, 3.05, -0.28, 11.45);
  curbRun(site, mats, rec, 0.16, 3.15, -3.2, 8.05);

  const even = lawnBand(mats.grass, 1);
  const odd = lawnBand(mats.grass, 0.78);
  mowField(land, even, odd, rec);
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
