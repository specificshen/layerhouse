import * as THREE from "three";
import { Y_GF_CEIL, Y_GF_TOP, Y_L2_CEIL, Y_L2_TOP } from "../../config";
import { addBox, addCyl, addSphere } from "../geom";
import type { Materials } from "../materials";
import type { HouseGroups, HouseRecord } from "../../types";
import { addCone } from "./forms";
import { createFurnishPalette } from "./palette";
import {
  armchair,
  art,
  bed,
  bench,
  bookcase,
  cabinetRun,
  chair,
  desk,
  fridge,
  hood,
  island,
  nightstand,
  plant,
  rug,
  shower,
  sofa,
  table,
  toilet,
  tub,
  tv,
  vanity,
} from "./pieces";
import { addCloseTrim } from "./trim";

type LampKind = "pendant" | "recessed" | "sconce" | "floor" | "table";

function lamp(
  parent: THREE.Object3D,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  mats: Materials,
  kind: LampKind = "pendant",
  intensity = 1,
) {
  switch (kind) {
    case "pendant":
      addCyl(parent, 0.008, 0.32, x, y - 0.16, z, mats.steel, { noShadow: true });
      addCone(parent, 0.16, 0.14, x, y - 0.42, z, mats.lampShade, { noShadow: true });
      addSphere(parent, 0.04, x, y - 0.4, z, mats.lampBulb, { noShadow: true });
      break;
    case "recessed":
      addCyl(parent, 0.09, 0.03, x, y, z, mats.steel, { noShadow: true });
      addCyl(parent, 0.07, 0.02, x, y - 0.02, z, mats.lampBulb, { noShadow: true });
      break;
    case "sconce":
      addCyl(parent, 0.03, 0.012, x, y, z, mats.steel, { rotX: Math.PI / 2, noShadow: true });
      addCone(parent, 0.07, 0.1, x, y, z + 0.06, mats.lampShade, {
        rotX: Math.PI / 2,
        noShadow: true,
      });
      break;
    case "floor":
      addCyl(parent, 0.08, 0.03, x, Y_GF_TOP + 0.015, z, mats.steel);
      addCyl(parent, 0.012, 1.28, x, Y_GF_TOP + 0.66, z, mats.steel);
      addCone(parent, 0.18, 0.16, x, Y_GF_TOP + 1.38, z, mats.lampShade);
      break;
    case "table":
      addCyl(parent, 0.05, 0.02, x, y + 0.01, z, mats.woodDark);
      addCyl(parent, 0.01, 0.18, x, y + 0.11, z, mats.steel, { noShadow: true });
      addCone(parent, 0.08, 0.1, x, y + 0.24, z, mats.lampShade, { noShadow: true });
      break;
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
  const lightY = kind === "floor" ? Y_GF_TOP + 1.32 : kind === "table" ? y + 0.2 : y - 0.22;
  const light = new THREE.PointLight(0xffc888, 0, 7.5, 2);
  light.position.set(x, lightY, z);
  light.userData.base = intensity;
  parent.add(light);
  rec.lamps.push(light);
  return undefined;
}

export function furnishHouse(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  const f = groups.furniture;
  const pal = createFurnishPalette(mats);
  const y0 = Y_GF_TOP;
  const y2 = Y_L2_TOP;

  addCloseTrim(f, pal, rec);

  // —— Living. West glazing stays clear: no cards, no curtains over the glass. ——
  rug(f, pal, rec, -4.3, y0, 2.0, 3.4, 2.6, 0x3a4038);
  sofa(f, pal, rec, -4.4, y0, 0.55, 0, 2.6);
  armchair(f, pal, rec, -2.55, y0, 2.4, -Math.PI / 3);
  armchair(f, pal, rec, -6.05, y0, 2.6, Math.PI / 4);
  table(f, pal, -4.3, y0, 2.15, 1.2, 0.7, 0.4, pal.oakDark, "coffee");
  tv(f, pal, -5.8, y0, 3.15, Math.PI / 2);
  bench(f, pal, -6.84, y0, 1.25, Math.PI / 2, 1.5);
  bench(f, pal, -1.84, y0, 5.45, Math.PI / 2, 0.84);
  plant(f, pal, -2.45, y0, 4.65);
  lamp(f, rec, -4.3, Y_GF_CEIL - 0.02, 1.6, mats, "recessed", 0.9);
  lamp(f, rec, -5.6, Y_GF_CEIL - 0.02, 3.4, mats, "recessed", 0.7);
  lamp(f, rec, -3.0, Y_GF_CEIL - 0.02, 3.4, mats, "recessed", 0.7);
  lamp(f, rec, -6.3, y0, 4.6, mats, "floor", 0.55);
  art(f, pal, rec, -1.66, y0 + 1.5, 5.4, -Math.PI / 2, 0.62, 0.42, 0x8d9a86);

  // —— Dining ——
  table(f, pal, 4.3, y0, 3.6, 1.8, 0.9, 0.75, pal.oak, "dining");
  for (const dz of [-0.55, 0.55]) {
    chair(f, pal, 3.55, y0, 3.6 + dz, dz < 0 ? 0 : Math.PI);
    chair(f, pal, 5.05, y0, 3.6 + dz, dz < 0 ? 0 : Math.PI);
  }
  chair(f, pal, 4.3, y0, 2.95, 0);
  chair(f, pal, 4.3, y0, 4.25, Math.PI);
  lamp(f, rec, 3.85, 2.85, 3.6, mats, "pendant", 1.1);
  lamp(f, rec, 4.75, 2.85, 3.6, mats, "pendant", 1.1);

  // East counter sits under the sill. Uppers and the fridge stay on the solid pier.
  cabinetRun(f, pal, mats, rec, 6.38, y0, 0, Math.PI / 2, 2.9, 0.9, 0.58, { sinkAt: -0.85 });
  addBox(f, 0.016, 0.14, 2.45, 6.688, y0 + 0.99, -0.05, pal.tile, rec, { noCast: true });
  fridge(f, pal, rec, 6.34, y0, 1.9, Math.PI / 2);
  cabinetRun(f, pal, mats, rec, 6.5, y0 + 1.48, 2.62, Math.PI / 2, 0.76, 0.68, 0.34, {
    upper: true,
  });
  island(f, pal, mats, rec, 4.4, y0, 0.4, 1.7, 0.82);
  hood(f, pal, mats, rec, 4.4, y0, 0.4);
  lamp(f, rec, 4.4, Y_GF_CEIL - 0.02, 0.4, mats, "recessed", 0.75);
  lamp(f, rec, 6.15, Y_GF_CEIL - 0.02, 0.2, mats, "recessed", 0.55);
  lamp(f, rec, 4.2, Y_GF_CEIL - 0.02, 5.2, mats, "recessed", 0.6);

  // —— Entry ——
  lamp(f, rec, -0.9, Y_GF_CEIL - 0.02, 5.0, mats, "recessed", 0.7);
  lamp(f, rec, -0.95, 2.62, 7.15, mats, "recessed", 0.8);

  // —— Powder ——
  toilet(f, pal, rec, -1.15, y0, 2.15, Math.PI);
  vanity(f, pal, mats, rec, 0.15, y0, 2.35, Math.PI / 2, 0.8);
  lamp(f, rec, -0.5, Y_GF_CEIL - 0.02, 2.35, mats, "recessed", 0.4);

  // —— Guest bedroom ——
  bed(f, pal, rec, -4.4, y0, -8.3, Math.PI, false);
  nightstand(f, pal, rec, -5.55, y0, -7.45);
  nightstand(f, pal, rec, -3.25, y0, -7.45);
  cabinetRun(f, pal, mats, rec, -6.89, y0, -6.3, -Math.PI / 2, 1.2, 0.76, 0.4, {
    topMat: pal.oak,
  });
  plant(f, pal, -6.72, y0 + 0.82, -6.3);
  armchair(f, pal, rec, -2.7, y0, -6.4, -Math.PI / 2);
  lamp(f, rec, -4.4, 2.92, -8.0, mats, "recessed", 0.6);
  lamp(f, rec, -5.55, y0 + 0.48, -7.45, mats, "table", 0.28);
  lamp(f, rec, -3.25, y0 + 0.48, -7.45, mats, "table", 0.28);
  art(f, pal, rec, -4.2, y0 + 1.5, -5.58, Math.PI, 0.62, 0.42, 0x6e7c88);

  // —— Guest bath ——
  vanity(f, pal, mats, rec, -6.4, y0, -3.6, Math.PI / 2, 1.0);
  toilet(f, pal, rec, -6.5, y0, -4.7, Math.PI / 2);
  shower(f, pal, mats, rec, -5.0, y0, -3.0, 0);
  lamp(f, rec, -5.6, 2.92, -3.8, mats, "recessed", 0.45);

  // —— L2 master. Bookcase is on the interior wall, not the west band of glass. ——
  bed(f, pal, rec, -2.4, y2, 1.3, Math.PI / 2, true);
  nightstand(f, pal, rec, -1.7, y2, 2.58);
  nightstand(f, pal, rec, -1.7, y2, -0.05);
  bench(f, pal, -3.95, y2, 1.3, Math.PI / 2, 1.05);
  bookcase(f, pal, rec, -0.4, y2, -1.15, Math.PI / 2, 1.15, 1.45);
  armchair(f, pal, rec, -5.5, y2, -0.15, 0.55);
  rug(f, pal, rec, -2.6, y2, 1.3, 2.4, 2.0, 0x4a4038);
  lamp(f, rec, -2.4, Y_L2_CEIL - 0.02, 1.3, mats, "recessed", 0.8);
  lamp(f, rec, -5.5, Y_L2_CEIL - 0.02, 0.4, mats, "recessed", 0.5);
  lamp(f, rec, -1.7, y2 + 0.48, 2.58, mats, "table", 0.28);
  lamp(f, rec, -1.7, y2 + 0.48, -0.05, mats, "table", 0.28);
  art(f, pal, rec, -4.2, y2 + 1.45, 3.12, Math.PI, 0.64, 0.44, 0xa89078);

  vanity(f, pal, mats, rec, -6.4, y2, 4.7, Math.PI / 2, 1.3);
  toilet(f, pal, rec, -6.5, y2, 5.7, Math.PI / 2);
  tub(f, pal, rec, -2.95, y2, 5.5, 0);
  lamp(f, rec, -5.0, Y_L2_CEIL - 0.02, 4.8, mats, "recessed", 0.45);

  // —— L2 hall bath ——
  vanity(f, pal, mats, rec, 1.52, y2, 5.5, Math.PI, 1.0);
  toilet(f, pal, rec, 0.9, y2, 3.5, -Math.PI / 2);
  shower(f, pal, mats, rec, 2.0, y2, 3.55, 0);
  lamp(f, rec, 1.5, Y_L2_CEIL - 0.02, 4.4, mats, "recessed", 0.4);

  // —— Study. Tall case is on the solid west wall; the east band only gets a sill shelf. ——
  desk(f, pal, rec, 5.4, y2, 0.6, -Math.PI / 2, 1.8);
  chair(f, pal, 4.7, y2, 0.6, Math.PI / 2);
  bookcase(f, pal, rec, 2.78, y2, 5.2, -Math.PI / 2, 1.25, 1.55);
  cabinetRun(f, pal, mats, rec, 6.53, y2, 4.1, Math.PI / 2, 2.15, 0.42, 0.32, {
    topMat: pal.oak,
    books: true,
  });
  armchair(f, pal, rec, 3.5, y2, 5.0, Math.PI * 0.8);
  lamp(f, rec, 5.0, Y_L2_CEIL - 0.02, 1.0, mats, "recessed", 0.7);
  lamp(f, rec, 4.8, Y_L2_CEIL - 0.02, 4.6, mats, "recessed", 0.5);
  lamp(f, rec, 5.22, y2 + 0.78, 0.35, mats, "table", 0.32);
  art(f, pal, rec, 2.7, y2 + 1.5, 1.4, Math.PI / 2, 0.56, 0.4, 0x7f8c78);

  lamp(f, rec, 1.5, Y_L2_CEIL - 0.02, -0.6, mats, "recessed", 0.5);
  lamp(f, rec, 1.5, Y_GF_CEIL - 0.02, 4.6, mats, "recessed", 0.4);
  lamp(f, rec, 2.3, y2 + 1.4, -2.35, mats, "sconce", 0.4);
}
