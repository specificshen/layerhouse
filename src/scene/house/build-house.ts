import { MAIN } from "../../config";
import type { HouseRecord } from "../../types";
import { buildWall } from "../geom";
import type { Materials } from "../materials";
import { baseboards } from "./baseboards";
import { ceilings } from "./ceilings";
import { createHouseRecord } from "./create-house-record";
import { buildFenestration } from "./fenestration";
import { lintel } from "./lintel";
import { plinth } from "./plinth";
import { buildBalcony, buildCanopy, buildGableEnd, buildRoofs } from "./roof";
import { slabs } from "./slabs";
import { buildStairs } from "./stairs";
import { walkFloors } from "./walk-floors";
import { defineWalls } from "./walls";

export function buildHouse(mats: Materials): HouseRecord {
  const wallsData = defineWalls();
  const rec = createHouseRecord(wallsData);
  const groups = rec.groups;
  const roofGroup = rec.roofGroup;

  plinth(groups, mats, rec);
  slabs(groups, mats, rec);
  ceilings(groups, mats, rec, roofGroup);

  // ——— Walls ———
  for (const w of wallsData) {
    const mat =
      w.finish === "cedar" ? mats.cedar : w.finish === "interior" ? mats.interior : mats.stucco;
    buildWall(groups.walls, w, mat, rec, { collide: true, clip: true });
  }

  lintel(groups, mats, rec);
  buildFenestration(groups.fenestration, wallsData, mats, rec);
  baseboards(groups.walls, wallsData, mats, rec);
  buildStairs(groups.walls, groups.furniture, mats, rec, rec.well);

  buildRoofs(roofGroup, mats, rec);
  const rm = rec.roofMeta;
  buildGableEnd(groups.walls, MAIN.x0, mats.stucco, rec, rm.ridgeY, rm.ridgeZ, rm.half, rm.pitch);
  buildGableEnd(groups.walls, MAIN.x1, mats.stucco, rec, rm.ridgeY, rm.ridgeZ, rm.half, rm.pitch);
  buildBalcony(groups.walls, mats, rec);
  buildCanopy(groups.walls, mats, rec);
  walkFloors(rec);
  return rec;
}
