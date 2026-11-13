import * as THREE from "three";
import {
  MAIN,
  WING,
  Y_GF_TOP,
  Y_GF_CEIL,
  Y_L2_TOP,
  Y_L2_CEIL,
  Y_L2_WALL_TOP,
  WALL_T,
  INT_WALL_T,
  SLAB,
  ROOF,
} from "./config";
import { addBox, addCyl, buildWall } from "./geom";
import type { Materials } from "./materials";
import type {
  ClipBox,
  CollisionBox,
  DoorRecord,
  DoorStyle,
  FloorPad,
  Hotspot,
  HouseRecord,
  StairRun,
  Wall,
  WallAxis,
  Well,
} from "./types";

export function defineWalls(): Wall[] {
  const T = WALL_T;
  const TI = INT_WALL_T;
  const y0 = Y_GF_TOP;
  const y1 = Y_L2_WALL_TOP;
  const yWing = 3.12;
  const walls: Wall[] = [];

  // —— Exterior, main south facade (street) ——
  walls.push({
    id: "ext-south",
    axis: "z",
    pos: MAIN.z1,
    a0: MAIN.x0,
    a1: MAIN.x1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: -6.45, a1: -4.05, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: -3.9, a1: -2.45, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: -2.15, a1: 0.2, y0: y0, y1: 2.58, type: "door", style: "pivot" },
      { a0: 0.2, a1: 0.72, y0: y0, y1: 2.58, type: "window", style: "sidelight" },
      { a0: 2.15, a1: 4.25, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: 4.4, a1: 6.45, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: -6.45, a1: -3.55, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: -3.35, a1: -1.15, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.45, a1: 6.45, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main north (courtyard), only east of the wing joint ——
  walls.push({
    id: "ext-north-main",
    axis: "z",
    pos: MAIN.z0,
    a0: WING.x1,
    a1: MAIN.x1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: 0.15, a1: 5.25, y0: y0, y1: 2.98, type: "window", style: "slider" },
      { a0: 5.45, a1: 6.5, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: 0.55, a1: 3.55, y0: Y_L2_TOP, y1: 5.78, type: "door", style: "slider" },
      { a0: 3.85, a1: 6.5, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main east ——
  walls.push({
    id: "ext-east",
    axis: "x",
    pos: MAIN.x1,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: -1.5, a1: 1.4, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: 3.2, a1: 4.3, y0: y0, y1: 2.35, type: "door", style: "side" },
      { a0: 4.55, a1: 5.9, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: -1.7, a1: 1.6, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.2, a1: 5.9, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main west (two stories) ——
  walls.push({
    id: "ext-west-main",
    axis: "x",
    pos: MAIN.x0,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: 0.15, a1: 2.45, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: 2.7, a1: 5.7, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: -1.55, a1: 1.7, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.0, a1: 5.7, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— West wing exteriors (cedar, one story) ——
  walls.push({
    id: "ext-west-wing",
    axis: "x",
    pos: WING.x0,
    a0: WING.z0,
    a1: WING.z1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      { a0: -9.9, a1: -7.15, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
      { a0: -5.85, a1: -3.15, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
    ],
  });
  walls.push({
    id: "ext-north-wing",
    axis: "z",
    pos: WING.z0,
    a0: WING.x0,
    a1: WING.x1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      { a0: -6.0, a1: -3.2, y0: y0, y1: 2.5, type: "door", style: "garden" },
      { a0: -7.0, a1: -6.15, y0: 1.05, y1: 2.35, type: "window", style: "fixed" },
      { a0: -3.0, a1: -1.85, y0: 1.05, y1: 2.35, type: "window", style: "fixed" },
    ],
  });
  walls.push({
    id: "ext-east-wing",
    axis: "x",
    pos: WING.x1,
    a0: WING.z0,
    a1: WING.z1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      { a0: -10.15, a1: -6.35, y0: y0, y1: 2.7, type: "window", style: "slider" },
      { a0: -5.85, a1: -2.55, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
    ],
  });

  // Opening between living (main west) and the wing — cased opening in the shared wall line at z = MAIN.z0, x = WING
  // There is no exterior wall there; add short structural returns only (handled as interior lintel later).

  // —— Interior GF ——
  // Partial wall living / entry
  walls.push({
    id: "int-living-entry",
    axis: "x",
    pos: -1.5,
    a0: 4.35,
    a1: MAIN.z1,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Stair west
  walls.push({
    id: "int-stair-w",
    axis: "x",
    pos: 0.52,
    a0: -2.05,
    a1: 2.85,
    y0,
    y1: Y_L2_WALL_TOP,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      { a0: 2.05, a1: 2.85, y0, y1: 2.2, type: "door", style: "interior" }, // to powder / hall
    ],
  });
  // Stair east
  walls.push({
    id: "int-stair-e",
    axis: "x",
    pos: 2.52,
    a0: -2.05,
    a1: 4.5,
    y0,
    y1: Y_L2_WALL_TOP,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      { a0: 3.55, a1: 4.4, y0: Y_L2_TOP, y1: 5.5, type: "door", style: "interior" }, // L2 bath
      { a0: 2.9, a1: 3.7, y0, y1: 2.2, type: "door", style: "interior" }, // GF to kitchen
    ],
  });
  // Powder enclosure
  walls.push({
    id: "int-powder-s",
    axis: "z",
    pos: 3.35,
    a0: -1.5,
    a1: 0.52,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: -0.95, a1: -0.25, y0, y1: 2.15, type: "door", style: "interior" }],
  });
  walls.push({
    id: "int-powder-n",
    axis: "z",
    pos: 1.35,
    a0: -1.5,
    a1: 0.52,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Wing: guest bath (south of bedroom)
  walls.push({
    id: "int-guest-bath-n",
    axis: "z",
    pos: -5.45,
    a0: WING.x0,
    a1: WING.x1,
    y0,
    y1: yWing - 0.02,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: -3.55, a1: -2.75, y0, y1: 2.15, type: "door", style: "interior" }],
  });
  walls.push({
    id: "int-guest-bath-e",
    axis: "x",
    pos: -4.15,
    a0: -5.45,
    a1: -2.2,
    y0,
    y1: yWing - 0.02,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: -3.7, a1: -2.95, y0, y1: 2.15, type: "door", style: "interior" }],
  });

  // —— Interior L2 ——
  // Master / hall at x = -0.15
  walls.push({
    id: "int-master",
    axis: "x",
    pos: -0.15,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: -0.3, a1: 0.55, y0: Y_L2_TOP, y1: 5.5, type: "door", style: "interior" }],
  });
  // Master bath south-west
  walls.push({
    id: "int-mbath-n",
    axis: "z",
    pos: 3.25,
    a0: MAIN.x0,
    a1: -2.35,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: -6.3, a1: -5.5, y0: Y_L2_TOP, y1: 5.5, type: "door", style: "interior" }],
  });
  walls.push({
    id: "int-mcloset",
    axis: "x",
    pos: -4.35,
    a0: 3.25,
    a1: MAIN.z1,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [{ a0: 3.35, a1: 4.15, y0: Y_L2_TOP, y1: 5.5, type: "door", style: "interior" }],
  });
  // L2 hall bath south of stair (x 0.52–2.52 already have walls; close south & a door is on stair-e)
  walls.push({
    id: "int-lbath-n",
    axis: "z",
    pos: 2.95,
    a0: 0.52,
    a1: 2.52,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Study west wall is stair-e at 2.52, already 2-story

  return walls;
}

export function buildHouse(mats: Materials): HouseRecord {
  const rec = {
    clipBoxes: [] as ClipBox[],
    collisions: [] as CollisionBox[],
    floors: [] as FloorPad[],
    stairs: [] as StairRun[],
    lamps: [] as THREE.PointLight[],
    hotspots: [] as Hotspot[],
    doors: [] as DoorRecord[],
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
    { clip: true, noCast: true },
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

  // Warm interior fill planes just inside large glass (helps dusk/night glow)
  addWarmFills(groups.walls, mats, rec);

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

function addWarmFills(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  // Just inside large glazed openings, a faintly emissive plane
  const t = 0.02;
  // North slider GF
  addBox(parent, 5.0, 2.7, t, 2.7, 1.5, MAIN.z0 + 0.18, mats.warmFill, rec, {
    clip: true,
    noShadow: true,
  });
  // South living windows
  addBox(parent, 2.3, 1.5, t, -5.25, 1.75, MAIN.z1 - 0.18, mats.warmFill, rec, {
    clip: true,
    noShadow: true,
  });
  addBox(parent, 1.3, 1.5, t, -3.17, 1.75, MAIN.z1 - 0.18, mats.warmFill, rec, {
    clip: true,
    noShadow: true,
  });
}

function buildFenestration(
  parent: THREE.Object3D,
  walls: Wall[],
  mats: Materials,
  rec: HouseRecord,
) {
  for (const w of walls) {
    for (const o of w.openings || []) {
      const axis = w.axis;
      const midA = (o.a0 + o.a1) / 2;
      const midY = (o.y0 + o.y1) / 2;
      const wA = o.a1 - o.a0;
      const h = o.y1 - o.y0;
      const x = axis === "z" ? midA : w.pos;
      const z = axis === "x" ? midA : w.pos;
      const rotY = axis === "x" ? Math.PI / 2 : 0;
      if (o.type === "door") {
        addDoor(
          parent,
          {
            x,
            y: midY,
            z,
            w: wA,
            h,
            rotY,
            style: o.style,
            axis,
            pos: w.pos,
            a0: o.a0,
            a1: o.a1,
            y0: o.y0,
            y1: o.y1,
          },
          mats,
          rec,
        );
      } else {
        addWindow(parent, { x, y: midY, z, w: wA, h, rotY, style: o.style }, mats, rec);
      }
    }
  }
}

interface FenestrationOpts {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  rotY: number;
  style: DoorStyle;
  axis?: WallAxis;
  pos?: number;
  a0?: number;
  a1?: number;
  y0?: number;
  y1?: number;
}

interface DoorOpts extends FenestrationOpts {
  axis: WallAxis;
  pos: number;
  a0: number;
  a1: number;
  y0: number;
  y1: number;
}

function addWindow(parent: THREE.Object3D, o: FenestrationOpts, mats: Materials, rec: HouseRecord) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  g.rotation.y = o.rotY || 0;
  const fw = 0.05;
  const depth = 0.12;
  const glassZ = 0;
  // frame: left, right, head, sill
  const innerW = o.w - fw * 2;
  const innerH = o.h - fw * 2;
  addBox(g, fw, o.h, depth, -o.w / 2 + fw / 2, 0, 0, mats.frame, rec, { noCast: false });
  addBox(g, fw, o.h, depth, o.w / 2 - fw / 2, 0, 0, mats.frame, rec, { noCast: false });
  addBox(g, o.w, fw, depth, 0, o.h / 2 - fw / 2, 0, mats.frame, rec, {});
  addBox(g, o.w, fw + 0.02, depth + 0.04, 0, -o.h / 2 + fw / 2, 0.02, mats.frame, rec, {});
  // mullions
  if (o.style === "band" || o.style === "slider" || innerW > 2.2) {
    const n = innerW > 3.5 ? 3 : 1;
    for (let i = 1; i <= n; i++) {
      const px = -o.w / 2 + (o.w * i) / (n + 1);
      addBox(g, 0.035, innerH, depth - 0.02, px, 0, 0, mats.frame, rec, {});
    }
  }
  if (o.style === "band" && innerH > 1.4) {
    addBox(g, innerW, 0.03, depth - 0.02, 0, 0.05, 0, mats.frame, rec, {});
  }
  const glassMat = o.style === "sidelight" ? mats.glassSimple : mats.glassSimple;
  const pane = addBox(g, innerW - 0.01, innerH - 0.01, 0.02, 0, 0, glassZ, glassMat, rec, {
    noShadow: true,
  });
  pane.name = "glass";
  // slightly warm glass copy for night, same pane uses glassWarm via swap later — keep a second almost-hidden warm pane
  const warm = addBox(g, innerW - 0.01, innerH - 0.01, 0.018, 0, 0, -0.01, mats.glassWarm, rec, {
    noShadow: true,
  });
  warm.name = "glassWarm";
  parent.add(g);
  return g;
}

function addDoor(parent: THREE.Object3D, o: DoorOpts, mats: Materials, rec: HouseRecord) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  g.rotation.y = o.rotY || 0;
  const fw = 0.05;
  const depth = 0.12;
  addBox(g, fw, o.h, depth, -o.w / 2 + fw / 2, 0, 0, mats.frame, rec, {});
  addBox(g, fw, o.h, depth, o.w / 2 - fw / 2, 0, 0, mats.frame, rec, {});
  addBox(g, o.w, fw, depth, 0, o.h / 2 - fw / 2, 0, mats.frame, rec, {});
  const slabW = o.w - fw * 2 - 0.01;
  const slabH = o.h - fw - 0.01;
  const leaf = new THREE.Group();
  leaf.name = "leaf";
  // pivot at left
  leaf.position.set(-o.w / 2 + fw, 0, 0);
  const style = o.style;
  const mat = style === "interior" ? mats.woodMid : mats.woodDark;
  const slab = addBox(leaf, slabW, slabH, 0.05, slabW / 2, -fw / 2, 0, mat, rec, {});
  slab.name = "doorSlab";
  if (style === "pivot" || style === "garden") {
    // vertical glass slit
    addBox(leaf, 0.18, slabH - 0.3, 0.02, slabW * 0.72, -fw / 2, 0.02, mats.glassSimple, rec, {
      noShadow: true,
    });
    // handle
    addCyl(leaf, 0.015, 0.22, slabW - 0.12, 0.05, 0.05, mats.steel, {
      rotX: Math.PI / 2,
      noShadow: true,
    });
  } else if (style === "slider") {
    addBox(
      leaf,
      slabW * 0.46,
      slabH - 0.16,
      0.02,
      slabW * 0.3,
      -fw / 2,
      0.02,
      mats.glassSimple,
      rec,
      { noShadow: true },
    );
    addBox(
      leaf,
      slabW * 0.46,
      slabH - 0.16,
      0.02,
      slabW * 0.72,
      -fw / 2,
      0.02,
      mats.glassSimple,
      rec,
      { noShadow: true },
    );
  } else {
    addCyl(leaf, 0.012, 0.14, slabW - 0.1, 0.0, 0.04, mats.steel, {
      rotX: Math.PI / 2,
      noShadow: true,
    });
  }
  g.add(leaf);
  parent.add(g);
  rec.doors.push({
    group: g,
    leaf,
    open: 0,
    target: 0,
    hingeSign: 1,
    // world-ish collision when closed
    x: o.x,
    z: o.z,
    w: o.w,
    axis: o.axis,
    pos: o.pos,
    a0: o.a0,
    a1: o.a1,
    y0: o.y0,
    y1: o.y1,
    style,
  });
  if (style === "pivot") {
    rec.hotspots.push({
      id: "door",
      labelZh: "枢轴门",
      labelEn: "Pivot door",
      position: new THREE.Vector3(o.x, o.y + 0.2, o.z + 0.4),
      object: g,
    });
  }
  return g;
}

function buildStairs(
  wallsGrp: THREE.Object3D,
  _furnGrp: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  well: Well,
) {
  const rise = Y_L2_TOP - Y_GF_TOP;
  const n = 16;
  const riser = rise / n;
  const tread = (well.z1 - well.z0 - 0.15) / n;
  const x0 = well.x0 + 0.06;
  const x1 = well.x1 - 0.06;
  const w = x1 - x0;
  const xc = (x0 + x1) / 2;
  // start at south (well.z1), go north
  for (let i = 0; i < n; i++) {
    const z = well.z1 - 0.04 - (i + 0.5) * tread;
    const y = Y_GF_TOP + (i + 1) * riser - riser / 2;
    addBox(wallsGrp, w, riser, tread - 0.01, xc, y, z, mats.woodMid, rec, { clip: true });
    // tread cap
    addBox(wallsGrp, w, 0.03, tread, xc, Y_GF_TOP + (i + 1) * riser + 0.015, z, mats.floor, rec, {
      clip: true,
      noCast: true,
    });
  }
  // stringers
  addBox(
    wallsGrp,
    0.06,
    rise + 0.1,
    well.z1 - well.z0,
    x0 + 0.02,
    Y_GF_TOP + rise / 2,
    (well.z0 + well.z1) / 2,
    mats.woodDark,
    rec,
    { clip: true },
  );
  addBox(
    wallsGrp,
    0.06,
    rise + 0.1,
    well.z1 - well.z0,
    x1 - 0.02,
    Y_GF_TOP + rise / 2,
    (well.z0 + well.z1) / 2,
    mats.woodDark,
    rec,
    { clip: true },
  );
  // simple steel handrail
  const railY1 = 0.95;
  for (let side of [-1, 1]) {
    const x = xc + side * (w / 2 - 0.05);
    addBox(
      wallsGrp,
      0.03,
      0.03,
      well.z1 - well.z0 - 0.2,
      x,
      Y_GF_TOP + rise * 0.5 + railY1,
      (well.z0 + well.z1) / 2,
      mats.steel,
      rec,
      { clip: true },
    );
    for (let i = 1; i < n; i += 2) {
      const z = well.z1 - 0.04 - (i + 0.5) * tread;
      const y0 = Y_GF_TOP + (i + 1) * riser;
      const y1 = y0 + railY1;
      addCyl(wallsGrp, 0.01, y1 - y0, x, (y0 + y1) / 2, z, mats.steel);
    }
  }
  rec.stairs.push({
    x0,
    x1,
    zStart: well.z1,
    zEnd: well.z0,
    yStart: Y_GF_TOP,
    yEnd: Y_L2_TOP,
  });
}

function buildRoofs(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const pitch = ROOF.pitch;
  const oh = ROOF.overhang;
  const th = ROOF.thickness;
  const ridgeZ = ROOF.ridgeZ;
  const half = (MAIN.z1 - MAIN.z0) / 2 + oh;
  const slopeLen = half / Math.cos(pitch);
  const ridgeY = Y_L2_WALL_TOP + Math.tan(pitch) * half;
  const length = MAIN.x1 - MAIN.x0 + oh * 2;
  const cx = (MAIN.x0 + MAIN.x1) / 2;

  function slope(sign: number) {
    const g = new THREE.Group();
    // plane centered, rotated about X
    const yMid = (Y_L2_WALL_TOP + ridgeY) / 2;
    const zMid = ridgeZ + sign * (half / 2);
    const panel = addBox(g, length, th, slopeLen, 0, 0, 0, mats.roof, rec, {});
    panel.rotation.x = sign * pitch;
    g.position.set(cx, yMid + 0.05, zMid);
    // fascia at eave
    const eaveY = Y_L2_WALL_TOP - 0.04;
    const eaveZ = ridgeZ + sign * half;
    addBox(parent, length + 0.04, 0.16, 0.06, cx, eaveY, eaveZ, mats.fascia, rec, {});
    parent.add(g);
    return g;
  }
  slope(1);
  slope(-1);
  // ridge cap
  addBox(parent, length + 0.06, 0.08, 0.16, cx, ridgeY + 0.04, ridgeZ, mats.fascia, rec, {});
  // rake / gable end fascias
  const rakeLen = slopeLen;
  for (const side of [-1, 1]) {
    const x = cx + side * (length / 2);
    for (const sign of [-1, 1]) {
      const g = new THREE.Group();
      const yMid = (Y_L2_WALL_TOP + ridgeY) / 2;
      const zMid = ridgeZ + sign * (half / 2);
      const bar = addBox(g, 0.06, 0.16, rakeLen, 0, 0, 0, mats.fascia, rec, {});
      bar.rotation.x = sign * pitch;
      g.position.set(x, yMid, zMid);
      parent.add(g);
    }
  }

  // Gable ends are added to the walls group in buildHouse so they stay when the roof lifts.

  // Wing shed roof, sloping down to the north
  const wx0 = WING.x0 - oh * 0.7;
  const wx1 = WING.x1 + oh * 0.45;
  const wz0 = WING.z0 - oh * 0.8;
  const wz1 = WING.z1 + 0.15;
  const wLen = wx1 - wx0;
  const wDepth = wz1 - wz0;
  const yS = ROOF.wingEaveSouth;
  const yN = ROOF.wingEaveNorth;
  const wingPitch = Math.atan2(yS - yN, wDepth);
  const wingSlope = Math.hypot(wDepth, yS - yN);
  const wg = new THREE.Group();
  const wpanel = addBox(wg, wLen, th, wingSlope, 0, 0, 0, mats.roof, rec, {});
  wpanel.rotation.x = wingPitch; // north is -Z, slope down toward -Z: rotate +X?
  // box's local +Z goes toward south if we position at center and rotate around X positively: +rotX moves +Z up...
  // We want south eave high, north eave low. Center at mid depth, mid height.
  wg.position.set((wx0 + wx1) / 2, (yS + yN) / 2, (wz0 + wz1) / 2);
  // If we rotate rotX = +wingPitch, the south (+Z) edge goes down. We need the opposite.
  wpanel.rotation.x = -wingPitch;
  parent.add(wg);
  addBox(parent, wLen + 0.04, 0.14, 0.06, (wx0 + wx1) / 2, yN - 0.02, wz0, mats.fascia, rec, {});
  addBox(parent, wLen + 0.04, 0.14, 0.06, (wx0 + wx1) / 2, yS - 0.02, wz1, mats.fascia, rec, {});

  rec.roofMeta = { ridgeY, ridgeZ, half, pitch, length, cx, yS, yN, wx0, wx1, wz0, wz1, wingPitch };

  rec.hotspots.push({
    id: "roof",
    labelZh: "折线金属屋面",
    labelEn: "Standing-seam roof",
    position: new THREE.Vector3(cx, ridgeY + 0.4, ridgeZ + 2),
    object: parent,
  });
}

function buildGableEnd(
  parent: THREE.Object3D,
  x: number,
  mat: THREE.Material,
  _rec: HouseRecord,
  ridgeY: number,
  ridgeZ: number,
  half: number,
  _pitch: number,
) {
  // Approximate the triangular gable with two thin sloped boxes (or a series of steps).
  // Use a custom shape geometry for a clean triangle.
  const y0 = Y_L2_WALL_TOP;
  const shape = new THREE.Shape();
  shape.moveTo(ridgeZ - half, y0);
  shape.lineTo(ridgeZ, ridgeY);
  shape.lineTo(ridgeZ + half, y0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
  geo.rotateY(-Math.PI / 2);
  geo.translate(x - 0.09, 0, 0);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
}

function buildBalcony(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const x0 = 0.4,
    x1 = 4.25,
    z0 = -3.45,
    z1 = MAIN.z0 + 0.02;
  const y = Y_L2_TOP - 0.08;
  addBox(parent, x1 - x0, 0.12, z1 - z0, (x0 + x1) / 2, y, (z0 + z1) / 2, mats.deck, rec, {
    clip: true,
  });
  // steel edge rail
  const railH = 1.05;
  const posts = 5;
  for (let i = 0; i < posts; i++) {
    const x = x0 + 0.08 + (i / (posts - 1)) * (x1 - x0 - 0.16);
    addCyl(parent, 0.018, railH, x, Y_L2_TOP + railH / 2, z0 + 0.05, mats.steel);
  }
  for (const z of [z0 + 0.05, (z0 + z1) / 2]) {
    addBox(parent, x1 - x0, 0.025, 0.025, (x0 + x1) / 2, Y_L2_TOP + railH, z, mats.steel, rec, {
      clip: true,
    });
    addBox(parent, x1 - x0, 0.025, 0.025, (x0 + x1) / 2, Y_L2_TOP + 0.45, z, mats.steel, rec, {
      clip: true,
    });
  }
  // sides
  addBox(
    parent,
    0.025,
    0.025,
    z1 - z0,
    x0 + 0.06,
    Y_L2_TOP + railH,
    (z0 + z1) / 2,
    mats.steel,
    rec,
    { clip: true },
  );
  addBox(
    parent,
    0.025,
    0.025,
    z1 - z0,
    x1 - 0.06,
    Y_L2_TOP + railH,
    (z0 + z1) / 2,
    mats.steel,
    rec,
    { clip: true },
  );
}

function buildCanopy(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  // Cantilevered steel-and-wood canopy over the pivot door
  const x = -0.95,
    z = MAIN.z1 + 0.95,
    y = 2.72;
  addBox(parent, 3.4, 0.08, 1.9, x, y, z, mats.fascia, rec, { clip: true });
  addBox(parent, 3.4, 0.03, 1.9, x, y - 0.06, z, mats.deck, rec, { clip: true });
  // slim posts slightly inset
  addCyl(parent, 0.03, y, x - 1.4, y / 2, MAIN.z1 + 1.55, mats.steel);
  addCyl(parent, 0.03, y, x + 1.4, y / 2, MAIN.z1 + 1.55, mats.steel);
}

export function heightAt(rec: HouseRecord, x: number, z: number): number {
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
  let best = null;
  for (const f of rec.floors) {
    if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1) {
      if (!best || f.y > best.y) best = f;
    }
  }
  return best ? best.y : 0;
}
