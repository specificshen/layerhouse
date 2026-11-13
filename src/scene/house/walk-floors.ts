import { MAIN, WING, Y_GF_TOP, Y_L2_TOP } from "../../config";
import type { HouseRecord } from "../../types";

export function walkFloors(rec: HouseRecord) {
  const well = rec.well;
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
}
