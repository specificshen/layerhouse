import * as THREE from "three";
import { Y_GF_TOP, Y_L2_TOP } from "@/config";
import { addBox, addCyl, registerMeshClip } from "@/geom";
import type { Materials } from "@/materials";
import type { HouseRecord, Well } from "@/types";

export function buildStairs(
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
  // start at south (well.z1), go north. Top of the 16th tread is flush with L2 FFL.
  const cap = 0.03;
  for (let i = 0; i < n; i++) {
    const z = well.z1 - 0.04 - (i + 0.5) * tread;
    const riserTop = Y_GF_TOP + (i + 1) * riser;
    const bodyH = riser - cap;
    addBox(wallsGrp, w, bodyH, tread - 0.01, xc, riserTop - cap - bodyH / 2, z, mats.woodMid, rec, {
      clip: true,
    });
    addBox(wallsGrp, w, cap, tread, xc, riserTop - cap / 2, z, mats.floor, rec, {
      clip: true,
      noCast: true,
      name: i === n - 1 ? "asm-stair-top" : undefined,
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
  // Handrail follows the flight; balusters land on each tread.
  const railH = 0.92;
  const runZ = well.z0 - well.z1;
  const railLen = Math.hypot(runZ, rise) * 0.94;
  const dir = new THREE.Vector3(0, rise, runZ).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const euler = new THREE.Euler().setFromQuaternion(quat, "XYZ");
  const midZ = (well.z0 + well.z1) / 2;
  const midY = (Y_GF_TOP + Y_L2_TOP) / 2 + railH;
  for (const side of [-1, 1]) {
    const x = xc + side * (w / 2 - 0.06);
    const rail = addBox(wallsGrp, 0.035, 0.028, railLen, x, midY, midZ, mats.steel, rec, {
      rotX: euler.x,
      rotY: euler.y,
      rotZ: euler.z,
    });
    registerMeshClip(rec, rail, false);
    for (let i = 0; i < n; i += 1) {
      const z = well.z1 - 0.04 - (i + 0.5) * tread;
      const yBase = Y_GF_TOP + (i + 1) * riser;
      const t = (well.z1 - z) / (well.z1 - well.z0);
      const yTop = Y_GF_TOP + t * rise + railH;
      if (yTop - yBase < 0.2) continue;
      addCyl(wallsGrp, 0.008, yTop - yBase, x, (yBase + yTop) / 2, z, mats.steel);
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
