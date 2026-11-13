import { MAIN, WING, Y_GF_TOP } from "../../config";
import type { HouseGroups, HouseRecord } from "../../types";
import { addBox } from "../geom";
import type { Materials } from "../materials";

export function plinth(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
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
}
