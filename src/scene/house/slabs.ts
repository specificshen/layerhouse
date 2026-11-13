import { FINISH_T, MAIN, STRUCT_T, WING, Y_GF_TOP, Y_L2_TOP } from "../../config";
import type { HouseGroups, HouseRecord } from "../../types";
import { addBox } from "../geom";
import type { Materials } from "../materials";

export function slabs(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
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
}
