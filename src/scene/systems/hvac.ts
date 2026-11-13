import type * as THREE from "three";
import { Y_GF_CEIL, Y_L2_CEIL } from "../../config";
import type { HouseRecord } from "../../types";
import { addBox, addCyl, BoxBatch, CylBatch } from "../geom";
import type { Materials } from "../materials";

function addDuctXYZ(
  _cyl: CylBatch | null,
  box: BoxBatch,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  s = 0.22,
) {
  // Manhattan path Y then X then Z
  const pts: Array<[number, number, number]> = [
    [x0, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b, c] = pts[i]!;
    const [d, e, f] = pts[i + 1]!;
    const dx = d - a,
      dy = e - b,
      dz = f - c;
    const len = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
    if (len < 0.05) continue;
    const x = (a + d) / 2,
      y = (b + e) / 2,
      z = (c + f) / 2;
    if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) {
      box.add(s, len, s, x, y, z);
    } else if (Math.abs(dx) >= Math.abs(dz)) {
      box.add(len, s, s, x, y, z);
    } else {
      box.add(s, s, len, x, y, z);
    }
  }
  // elbow box at joints
  box.add(s * 1.15, s * 1.15, s * 1.15, x0, y1, z0);
  box.add(s * 1.15, s * 1.15, s * 1.15, x1, y1, z0);
}

export function hvac(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const ducts = new BoxBatch(mats.duct, "ducts");
  // Air handler in "mechanical" closet-ish: east of stair at GF, x=2.9, z=2.0? Put in carport-adjacent utility: x=5.8, z=5.4 along east, or a closet under L2 hall. Use x=6.0, z=5.4 GF utility.
  const ahx = 5.95,
    ahy = 0.85,
    ahz = 5.35;
  addBox(parent, 0.7, 1.4, 0.55, ahx, ahy, ahz, mats.duct, rec, {});
  addBox(parent, 0.5, 0.15, 0.4, ahx, 1.6, ahz, mats.steel, rec, {});

  // Main trunk in L2 floor / GF ceiling cavity, running west-east then branches
  const ty = Y_GF_CEIL + 0.12;
  addDuctXYZ(null, ducts, ahx, 1.55, ahz, 1.5, ty, 1.0, 0.28);
  // west branch to living
  addDuctXYZ(null, ducts, 1.5, ty, 1.0, -5.5, ty, 1.0, 0.2);
  addDuctXYZ(null, ducts, -5.5, ty, 1.0, -5.5, ty, 4.5, 0.16);
  addDuctXYZ(null, ducts, -3.5, ty, 1.0, -3.5, ty, 4.5, 0.16);
  // east/kitchen
  addDuctXYZ(null, ducts, 1.5, ty, 1.0, 5.5, ty, 1.0, 0.2);
  addDuctXYZ(null, ducts, 5.5, ty, 1.0, 5.5, ty, 4.8, 0.16);
  addDuctXYZ(null, ducts, 4.2, ty, 1.0, 4.2, ty, 4.0, 0.16);
  // wing
  addDuctXYZ(null, ducts, -5.5, ty, 1.0, -5.5, ty, -8.0, 0.16);
  addDuctXYZ(null, ducts, -3.5, ty, 1.0, -3.5, ty, -4.0, 0.14);
  // L2 trunk
  const ty2 = Y_L2_CEIL + 0.14;
  addDuctXYZ(null, ducts, 1.5, ty, 1.0, 1.5, ty2, 1.0, 0.24);
  addDuctXYZ(null, ducts, 1.5, ty2, 1.0, -5.0, ty2, 1.0, 0.2);
  addDuctXYZ(null, ducts, 1.5, ty2, 1.0, 5.6, ty2, 1.0, 0.2);
  addDuctXYZ(null, ducts, -3.2, ty2, 1.0, -3.2, ty2, 4.6, 0.16);
  addDuctXYZ(null, ducts, 4.8, ty2, 1.0, 4.8, ty2, 4.8, 0.16);

  // supply boots (ceiling diffusers)
  const boots: Array<[number, number, number]> = [
    [-4.5, ty, 2.2],
    [-5.8, ty, 4.6],
    [-3.2, ty, 4.4],
    [4.3, ty, 3.6],
    [5.6, ty, 1.2],
    [4.4, ty, 0.4],
    [-4.5, ty, -7.8],
    [-5.8, ty, -3.8],
    [-2.5, ty2, 1.3],
    [-5.4, ty2, 4.4],
    [5.0, ty2, 0.8],
    [4.6, ty2, 4.4],
    [1.5, ty2, 4.4],
  ];
  for (const [x, y, z] of boots) {
    ducts.add(0.32, 0.06, 0.32, x, y - 0.08, z);
  }

  ducts.flush(parent, { cast: true, receive: true });

  // Outdoor condenser at east, south of carport / beside east wall
  const cx = 8.4,
    cz = 0.2;
  addBox(parent, 0.95, 0.85, 0.7, cx, 0.45, cz, mats.steel, rec, {});
  addBox(parent, 0.9, 0.7, 0.12, cx, 0.5, cz + 0.32, mats.duct, rec, {});
  // fan
  addCyl(parent, 0.28, 0.08, cx, 0.9, cz, mats.duct, { noShadow: true });
  // line set to AH
  const lines = new CylBatch(mats.pipeCold, "lineset", 6);
  lines.add(0.025, Math.abs(cx - ahx), (cx + ahx) / 2, 0.25, cz, 0, Math.PI / 2, 0);
  lines.add(0.025, Math.abs(cz - ahz), ahx, 0.25, (cz + ahz) / 2, Math.PI / 2, 0, 0);
  lines.add(0.02, 1.2, ahx, 0.85, ahz + 0.3);
  lines.flush(parent, { cast: false });
}
