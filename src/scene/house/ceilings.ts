import type * as THREE from "three";
import { FINISH_T, MAIN, STRUCT_T, WING, Y_GF_CEIL, Y_L2_CEIL, Y_L2_TOP } from "@/config";
import type { HouseGroups, HouseRecord } from "@/types";
import { addBox } from "@/geom";
import type { Materials } from "@/materials";

export function ceilings(
  groups: HouseGroups,
  mats: Materials,
  rec: HouseRecord,
  roofGroup: THREE.Group,
) {
  const mainW = MAIN.x1 - MAIN.x0;
  const mainD = MAIN.z1 - MAIN.z0;
  const wingW = WING.x1 - WING.x0;
  const wingD = WING.z1 - WING.z0;
  const fl = FINISH_T;
  const l2StructTop = Y_L2_TOP - fl;
  const well = rec.well;
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
}
