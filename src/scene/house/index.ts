import * as THREE from "three";
import {
  FINISH_T,
  MAIN,
  STRUCT_T,
  WALL_T,
  WING,
  Y_GF_CEIL,
  Y_GF_TOP,
  Y_L2_CEIL,
  Y_L2_TOP,
} from "../../config";
import { addBox, buildWall, solidRects } from "../geom";
import type { Wall } from "../../types";
import type { Materials } from "../materials";
import type {
  ClipBox,
  CollisionBox,
  DoorRecord,
  FloorPad,
  Hotspot,
  HouseRecord,
  StairRun,
} from "../../types";
import { buildFenestration } from "./fenestration";
import { buildRoofs, buildGableEnd, buildBalcony, buildCanopy } from "./roof";
import { buildStairs } from "./stairs";
import { defineWalls } from "./walls";

export function buildHouse(mats: Materials): HouseRecord {
  const rec = {
    clipBoxes: [] as ClipBox[],
    collisions: [] as CollisionBox[],
    floors: [] as FloorPad[],
    stairs: [] as StairRun[],
    lamps: [] as THREE.PointLight[],
    hotspots: [] as Hotspot[],
    doors: [] as DoorRecord[],
    orientedClips: [],
    roofClipBoxes: [],
  } as unknown as HouseRecord;
  const groups = {
    framing: new THREE.Group(),
    masonry: new THREE.Group(),
    roof: new THREE.Group(),
    walls: new THREE.Group(),
    insulation: new THREE.Group(),
    fenestration: new THREE.Group(),
    hvac: new THREE.Group(),
    electrical: new THREE.Group(),
    plumbing: new THREE.Group(),
    furniture: new THREE.Group(),
    site: new THREE.Group(),
    landscape: new THREE.Group(),
  };
  for (const [k, g] of Object.entries(groups)) g.name = k;

  const wallsData = defineWalls();
  const roofGroup = groups.roof;

  // Perimeter skirt only. A full-footprint plinth sat 20 mm above FFL and hid the oak finish.
  // Outer face matches the old skirt (80 mm outside the wall center). Top meets the wall at FFL.
  const plinthH = Y_GF_TOP;
  const skirt = 0.08;
  const plinthY = plinthH / 2;
  const plinthStrip = (w: number, d: number, x: number, z: number) => {
    if (w < 0.02 || d < 0.02) return;
    addBox(groups.walls, w, plinthH, d, x, plinthY, z, mats.plinth, rec, { clip: true });
  };
  plinthStrip(MAIN.x1 - MAIN.x0 + skirt * 2, skirt, (MAIN.x0 + MAIN.x1) / 2, MAIN.z1 + skirt / 2);
  plinthStrip(
    MAIN.x1 - WING.x1 + skirt,
    skirt,
    (WING.x1 + MAIN.x1 + skirt) / 2,
    MAIN.z0 - skirt / 2,
  );
  plinthStrip(skirt, MAIN.z1 - MAIN.z0, MAIN.x1 + skirt / 2, (MAIN.z0 + MAIN.z1) / 2);
  plinthStrip(skirt, MAIN.z1 - MAIN.z0, MAIN.x0 - skirt / 2, (MAIN.z0 + MAIN.z1) / 2);
  plinthStrip(WING.x1 - WING.x0 + skirt * 2, skirt, (WING.x0 + WING.x1) / 2, WING.z0 - skirt / 2);
  plinthStrip(skirt, WING.z1 - WING.z0, WING.x0 - skirt / 2, (WING.z0 + WING.z1) / 2);
  plinthStrip(skirt, WING.z1 - WING.z0, WING.x1 + skirt / 2, (WING.z0 + WING.z1) / 2);

  // ——— Floor slabs (masonry + finish floor) ———
  // FFL stays +0.140 / +3.340. Structure is STRUCT_T, finish is FINISH_T on top.
  // L1 structure −0.120–+0.110. L2 structure +3.080–+3.310. Sheet A-06 / NOTES.
  const mainW = MAIN.x1 - MAIN.x0;
  const mainD = MAIN.z1 - MAIN.z0;
  const wingW = WING.x1 - WING.x0;
  const wingD = WING.z1 - WING.z0;
  const fl = FINISH_T;
  const gfStructTop = Y_GF_TOP - fl;
  const gfStructY = gfStructTop - STRUCT_T / 2;
  const l2StructTop = Y_L2_TOP - fl;
  const l2y = l2StructTop - STRUCT_T / 2;

  addBox(
    groups.masonry,
    mainW,
    STRUCT_T,
    mainD,
    (MAIN.x0 + MAIN.x1) / 2,
    gfStructY,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-gf-struct", capColor: 0x8a8c8e },
  );
  addBox(
    groups.masonry,
    wingW,
    STRUCT_T,
    wingD,
    (WING.x0 + WING.x1) / 2,
    gfStructY,
    (WING.z0 + WING.z1) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-gf-struct", capColor: 0x8a8c8e },
  );

  addBox(
    groups.walls,
    mainW - 0.04,
    fl,
    mainD - 0.04,
    (MAIN.x0 + MAIN.x1) / 2,
    Y_GF_TOP - fl / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-gf-finish", capColor: 0xc4895a },
  );
  addBox(
    groups.walls,
    wingW - 0.04,
    fl,
    wingD - 0.04,
    (WING.x0 + WING.x1) / 2,
    Y_GF_TOP - fl / 2,
    (WING.z0 + WING.z1) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-gf-finish", capColor: 0xc4895a },
  );

  // L2 slab with stair opening (compose around the well)
  // Stair well: x 0.52–2.52, z -1.7–2.7
  const well = { x0: 0.5, x1: 2.54, z0: -1.72, z1: 2.72 };
  // west of well
  addBox(
    groups.masonry,
    well.x0 - MAIN.x0,
    STRUCT_T,
    mainD,
    (MAIN.x0 + well.x0) / 2,
    l2y,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-l2-struct", capColor: 0x8a8c8e },
  );
  // east of well
  addBox(
    groups.masonry,
    MAIN.x1 - well.x1,
    STRUCT_T,
    mainD,
    (well.x1 + MAIN.x1) / 2,
    l2y,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-l2-struct", capColor: 0x8a8c8e },
  );
  // West and east strips run the full depth and stop at the well. Close the north and south.
  addBox(
    groups.masonry,
    well.x1 - well.x0,
    STRUCT_T,
    well.z0 - MAIN.z0,
    (well.x0 + well.x1) / 2,
    l2y,
    (MAIN.z0 + well.z0) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-l2-struct", capColor: 0x8a8c8e },
  );
  addBox(
    groups.masonry,
    well.x1 - well.x0,
    STRUCT_T,
    MAIN.z1 - well.z1,
    (well.x0 + well.x1) / 2,
    l2y,
    (well.z1 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true, name: "asm-l2-struct", capColor: 0x8a8c8e },
  );

  // L2 oak
  const l2fy = Y_L2_TOP - fl / 2;
  addBox(
    groups.walls,
    well.x0 - MAIN.x0 - 0.02,
    fl,
    mainD - 0.04,
    (MAIN.x0 + well.x0) / 2,
    l2fy,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-l2-finish", capColor: 0xc4895a },
  );
  addBox(
    groups.walls,
    MAIN.x1 - well.x1 - 0.02,
    fl,
    mainD - 0.04,
    (well.x1 + MAIN.x1) / 2,
    l2fy,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-l2-finish", capColor: 0xc4895a },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    fl,
    well.z0 - MAIN.z0 - 0.02,
    (well.x0 + well.x1) / 2,
    l2fy,
    (MAIN.z0 + well.z0) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-l2-finish", capColor: 0xc4895a },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    fl,
    MAIN.z1 - well.z1 - 0.02,
    (well.x0 + well.x1) / 2,
    l2fy,
    (well.z1 + MAIN.z1) / 2,
    mats.floor,
    rec,
    { clip: true, noCast: true, name: "asm-l2-finish", capColor: 0xc4895a },
  );

  // GF soffit stays at +3.050. Keep it under the L2 soffit (+3.080) so the plaster
  // does not intersect the slab.
  const l2Soffit = l2StructTop - STRUCT_T;
  const gfCeilT = Math.min(0.024, l2Soffit - Y_GF_CEIL - 0.004);
  const upperCeilT = 0.04;
  addBox(
    groups.walls,
    well.x0 - MAIN.x0 - 0.02,
    gfCeilT,
    mainD - 0.04,
    (MAIN.x0 + well.x0) / 2,
    Y_GF_CEIL + gfCeilT / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true, name: "asm-gf-ceil", capColor: 0xe7e0d4 },
  );
  addBox(
    groups.walls,
    MAIN.x1 - well.x1 - 0.02,
    gfCeilT,
    mainD - 0.04,
    (well.x1 + MAIN.x1) / 2,
    Y_GF_CEIL + gfCeilT / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true, name: "asm-gf-ceil", capColor: 0xe7e0d4 },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    gfCeilT,
    well.z0 - MAIN.z0,
    (well.x0 + well.x1) / 2,
    Y_GF_CEIL + gfCeilT / 2,
    (MAIN.z0 + well.z0) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true, name: "asm-gf-ceil", capColor: 0xe7e0d4 },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    gfCeilT,
    MAIN.z1 - well.z1,
    (well.x0 + well.x1) / 2,
    Y_GF_CEIL + gfCeilT / 2,
    (well.z1 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true, name: "asm-gf-ceil", capColor: 0xe7e0d4 },
  );
  addBox(
    groups.walls,
    wingW - 0.04,
    upperCeilT,
    wingD - 0.04,
    (WING.x0 + WING.x1) / 2,
    2.98,
    (WING.z0 + WING.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true },
  );
  // L2 ceiling rides with the roof so Exploded opens the rooms like a dollhouse.
  addBox(
    roofGroup,
    mainW - 0.04,
    upperCeilT,
    mainD - 0.04,
    (MAIN.x0 + MAIN.x1) / 2,
    Y_L2_CEIL + upperCeilT / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true, lifts: true },
  );

  // ——— Walls ———
  for (const w of wallsData) {
    const mat =
      w.finish === "cedar" ? mats.cedar : w.finish === "interior" ? mats.interior : mats.stucco;
    buildWall(groups.walls, w, mat, rec, { collide: true, clip: true });
  }

  // Interior lintel / returns at living→wing opening (z = MAIN.z0, x = WING range)
  // Low wall stubs not needed; add a header beam in walls for the 5.6m opening
  const lintelH = 0.25;
  const lintelTop = Y_GF_CEIL - 0.004;
  addBox(
    groups.walls,
    WING.x1 - WING.x0,
    lintelH,
    WALL_T,
    (WING.x0 + WING.x1) / 2,
    lintelTop - lintelH / 2,
    MAIN.z0,
    mats.stucco,
    rec,
    { clip: true },
  );

  // ——— Fenestration ———
  buildFenestration(groups.fenestration, wallsData, mats, rec);

  addBaseboards(groups.walls, wallsData, mats, rec);

  // ——— Stairs ———
  buildStairs(groups.walls, groups.furniture, mats, rec, well);

  // ——— Roof ———
  buildRoofs(roofGroup, mats, rec);
  const rm = rec.roofMeta;
  buildGableEnd(groups.walls, MAIN.x0, mats.stucco, rec, rm.ridgeY, rm.ridgeZ, rm.half, rm.pitch);
  buildGableEnd(groups.walls, MAIN.x1, mats.stucco, rec, rm.ridgeY, rm.ridgeZ, rm.half, rm.pitch);

  // ——— Balcony ———
  buildBalcony(groups.walls, mats, rec);

  // ——— Entry canopy ———
  buildCanopy(groups.walls, mats, rec);

  // Walkable floors
  rec.floors.push({
    x0: MAIN.x0 + 0.08,
    x1: MAIN.x1 - 0.08,
    z0: MAIN.z0 + 0.08,
    z1: MAIN.z1 - 0.08,
    y: Y_GF_TOP,
    level: 0,
  });
  rec.floors.push({
    x0: WING.x0 + 0.08,
    x1: WING.x1 - 0.08,
    z0: WING.z0 + 0.08,
    z1: WING.z1 - 0.08,
    y: Y_GF_TOP,
    level: 0,
  });
  rec.floors.push({
    x0: MAIN.x0 + 0.08,
    x1: well.x0 - 0.02,
    z0: MAIN.z0 + 0.08,
    z1: MAIN.z1 - 0.08,
    y: Y_L2_TOP,
    level: 1,
  });
  rec.floors.push({
    x0: well.x1 + 0.02,
    x1: MAIN.x1 - 0.08,
    z0: MAIN.z0 + 0.08,
    z1: MAIN.z1 - 0.08,
    y: Y_L2_TOP,
    level: 1,
  });
  rec.floors.push({
    x0: well.x0,
    x1: well.x1,
    z0: MAIN.z0 + 0.08,
    z1: well.z0,
    y: Y_L2_TOP,
    level: 1,
  });
  rec.floors.push({
    x0: well.x0,
    x1: well.x1,
    z0: well.z1,
    z1: MAIN.z1 - 0.08,
    y: Y_L2_TOP,
    level: 1,
  });
  // balcony
  rec.floors.push({ x0: 0.4, x1: 4.25, z0: -3.4, z1: MAIN.z0 - 0.05, y: Y_L2_TOP, level: 1 });

  rec.wallsData = wallsData;
  rec.well = well;
  rec.groups = groups;
  rec.roofGroup = roofGroup;
  return rec;
}

function addBaseboards(parent: THREE.Object3D, walls: Wall[], mats: Materials, rec: HouseRecord) {
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
