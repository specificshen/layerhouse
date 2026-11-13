import { MAIN, WALL_T, WING, Y_GF_CEIL } from "@/config";
import type { HouseGroups, HouseRecord } from "@/types";
import { addBox } from "@/geom";
import type { Materials } from "@/materials";

export function lintel(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
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
}
