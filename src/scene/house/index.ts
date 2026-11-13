import * as THREE from "three";
import { MAIN, SLAB, WALL_T, WING, Y_GF_CEIL, Y_GF_TOP, Y_L2_CEIL, Y_L2_TOP } from "../../config";
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

  // ——— Plinth ———
  const plinthH = 0.16;
  // Main plinth
  addBox(
    groups.walls,
    MAIN.x1 - MAIN.x0 + 0.16,
    plinthH,
    MAIN.z1 - MAIN.z0 + 0.16,
    (MAIN.x0 + MAIN.x1) / 2,
    plinthH / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.plinth,
    rec,
    { clip: true },
  );
  addBox(
    groups.walls,
    WING.x1 - WING.x0 + 0.16,
    plinthH,
    WING.z1 - WING.z0 + 0.16,
    (WING.x0 + WING.x1) / 2,
    plinthH / 2,
    (WING.z0 + WING.z1) / 2,
    mats.plinth,
    rec,
    { clip: true },
  );

  // ——— Floor slabs (masonry + finish floor) ———
  const mainW = MAIN.x1 - MAIN.x0;
  const mainD = MAIN.z1 - MAIN.z0;
  const wingW = WING.x1 - WING.x0;
  const wingD = WING.z1 - WING.z0;

  // GF concrete slab
  addBox(
    groups.masonry,
    mainW,
    SLAB,
    mainD,
    (MAIN.x0 + MAIN.x1) / 2,
    SLAB / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true },
  );
  addBox(
    groups.masonry,
    wingW,
    SLAB,
    wingD,
    (WING.x0 + WING.x1) / 2,
    SLAB / 2,
    (WING.z0 + WING.z1) / 2,
    mats.cmu,
    rec,
    { clip: true },
  );

  // GF oak floor (thin finish)
  const fl = 0.03;
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
    { clip: true, noCast: true },
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
    { clip: true, noCast: true },
  );

  // L2 slab with stair opening (compose around the well)
  // Stair well: x 0.52–2.52, z -1.7–2.7
  const well = { x0: 0.5, x1: 2.54, z0: -1.72, z1: 2.72 };
  const l2y = Y_L2_TOP - SLAB / 2;
  // west of well
  addBox(
    groups.masonry,
    well.x0 - MAIN.x0,
    SLAB,
    mainD,
    (MAIN.x0 + well.x0) / 2,
    l2y,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true },
  );
  // east of well
  addBox(
    groups.masonry,
    MAIN.x1 - well.x1,
    SLAB,
    mainD,
    (well.x1 + MAIN.x1) / 2,
    l2y,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true },
  );
  // north of well (between west/east already? wait west/east cover full depth — that's wrong)
  // Redo L2 slab as 4 pieces: west strip, east strip, north mid, south mid.

  // I already added west and east as full depth — that's correct (they don't include the well).
  // Mid north: x well, z from MAIN.z0 to well.z0
  addBox(
    groups.masonry,
    well.x1 - well.x0,
    SLAB,
    well.z0 - MAIN.z0,
    (well.x0 + well.x1) / 2,
    l2y,
    (MAIN.z0 + well.z0) / 2,
    mats.cmu,
    rec,
    { clip: true },
  );
  addBox(
    groups.masonry,
    well.x1 - well.x0,
    SLAB,
    MAIN.z1 - well.z1,
    (well.x0 + well.x1) / 2,
    l2y,
    (well.z1 + MAIN.z1) / 2,
    mats.cmu,
    rec,
    { clip: true },
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
    { clip: true, noCast: true },
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
    { clip: true, noCast: true },
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
    { clip: true, noCast: true },
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
    { clip: true, noCast: true },
  );

  // Ceilings (GF underside of L2 slab / wing roof later)
  const ceilT = 0.04;
  addBox(
    groups.walls,
    well.x0 - MAIN.x0 - 0.02,
    ceilT,
    mainD - 0.04,
    (MAIN.x0 + well.x0) / 2,
    Y_GF_CEIL + ceilT / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true },
  );
  addBox(
    groups.walls,
    MAIN.x1 - well.x1 - 0.02,
    ceilT,
    mainD - 0.04,
    (well.x1 + MAIN.x1) / 2,
    Y_GF_CEIL + ceilT / 2,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    ceilT,
    well.z0 - MAIN.z0,
    (well.x0 + well.x1) / 2,
    Y_GF_CEIL + ceilT / 2,
    (MAIN.z0 + well.z0) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true },
  );
  addBox(
    groups.walls,
    well.x1 - well.x0,
    ceilT,
    MAIN.z1 - well.z1,
    (well.x0 + well.x1) / 2,
    Y_GF_CEIL + ceilT / 2,
    (well.z1 + MAIN.z1) / 2,
    mats.interior,
    rec,
    { clip: true, noCast: true },
  );
  addBox(
    groups.walls,
    wingW - 0.04,
    ceilT,
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
    ceilT,
    mainD - 0.04,
    (MAIN.x0 + MAIN.x1) / 2,
    Y_L2_CEIL + ceilT / 2,
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
  addBox(
    groups.walls,
    WING.x1 - WING.x0,
    0.25,
    WALL_T,
    (WING.x0 + WING.x1) / 2,
    Y_GF_CEIL - 0.12,
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
