import * as THREE from "three";
import { MAIN, ROOF, WING, Y_L2_TOP, Y_L2_WALL_TOP } from "../../config";
import { addBox, addCyl, registerMeshClip } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

function standingSeams(
  parent: THREE.Object3D,
  mats: Materials,
  length: number,
  slopeLen: number,
  th: number,
) {
  const seams = Math.max(4, Math.round(length / 0.46));
  for (let i = 0; i <= seams; i++) {
    const x = -length / 2 + (i * length) / seams;
    addBox(parent, 0.016, 0.032, slopeLen + 0.04, x, th * 0.5 + 0.01, 0, mats.roofSeam, null, {});
  }
}

export function buildRoofs(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
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
    const yMid = (Y_L2_WALL_TOP + ridgeY) / 2;
    const zMid = ridgeZ + sign * (half / 2);
    g.position.set(cx, yMid + 0.05, zMid);
    g.rotation.x = sign * pitch;
    parent.add(g);
    const panel = addBox(g, length, th, slopeLen, 0, 0, 0, mats.roof, rec, {});
    registerMeshClip(rec, panel, true);
    standingSeams(g, mats, length, slopeLen, th);

    const eaveY = Y_L2_WALL_TOP - 0.06;
    const eaveZ = ridgeZ + sign * (half + 0.02);
    addBox(parent, length + 0.1, 0.24, 0.07, cx, eaveY, eaveZ, mats.fascia, rec, {
      clip: true,
      lifts: true,
    });
    // Horizontal soffit closing the overhang back to the wall plate.
    const wallZ = sign > 0 ? MAIN.z1 : MAIN.z0;
    const span = Math.abs(eaveZ - wallZ);
    if (span > 0.08) {
      addBox(
        parent,
        length - 0.04,
        0.04,
        span,
        cx,
        eaveY - 0.02,
        (eaveZ + wallZ) / 2,
        mats.soffit,
        rec,
        {
          clip: true,
          lifts: true,
          noCast: true,
        },
      );
    }
    return g;
  }
  slope(1);
  slope(-1);

  addBox(parent, length + 0.12, 0.05, 0.22, cx, ridgeY + 0.07, ridgeZ, mats.roofSeam, rec, {
    clip: true,
    lifts: true,
  });
  addBox(parent, length + 0.12, 0.035, 0.08, cx, ridgeY + 0.11, ridgeZ, mats.fascia, rec, {
    clip: true,
    lifts: true,
  });

  const rakeLen = slopeLen;
  for (const side of [-1, 1]) {
    const x = cx + side * (length / 2 + 0.01);
    for (const sign of [-1, 1]) {
      const g = new THREE.Group();
      const yMid = (Y_L2_WALL_TOP + ridgeY) / 2;
      const zMid = ridgeZ + sign * (half / 2);
      g.position.set(x, yMid, zMid);
      g.rotation.x = sign * pitch;
      parent.add(g);
      const bar = addBox(g, 0.07, 0.18, rakeLen, 0, 0, 0, mats.fascia, rec, {});
      registerMeshClip(rec, bar, true);
    }
  }

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
  wg.position.set((wx0 + wx1) / 2, (yS + yN) / 2, (wz0 + wz1) / 2);
  wg.rotation.x = -wingPitch;
  parent.add(wg);
  const wpanel = addBox(wg, wLen, th, wingSlope, 0, 0, 0, mats.roof, rec, {});
  registerMeshClip(rec, wpanel, true);
  standingSeams(wg, mats, wLen, wingSlope, th);
  addBox(parent, wLen + 0.08, 0.2, 0.07, (wx0 + wx1) / 2, yN - 0.04, wz0 - 0.02, mats.fascia, rec, {
    clip: true,
    lifts: true,
  });
  addBox(
    parent,
    wLen + 0.08,
    0.18,
    0.07,
    (wx0 + wx1) / 2,
    yS - 0.02,
    wz1 + 0.02,
    mats.fascia,
    rec,
    {
      clip: true,
      lifts: true,
    },
  );
  const wingSoffit = Math.max(0.2, wz1 - WING.z1);
  addBox(
    parent,
    wLen - 0.05,
    0.035,
    wingSoffit,
    (wx0 + wx1) / 2,
    yS - 0.12,
    (WING.z1 + wz1) / 2,
    mats.soffit,
    rec,
    { clip: true, lifts: true, noCast: true },
  );

  rec.roofMeta = { ridgeY, ridgeZ, half, pitch, length, cx, yS, yN, wx0, wx1, wz0, wz1, wingPitch };

  rec.hotspots.push({
    id: "roof",
    labelZh: "折线金属屋面",
    labelEn: "Standing-seam roof",
    position: new THREE.Vector3(cx, ridgeY + 0.45, ridgeZ + 2),
    object: parent,
  });
}

export function buildGableEnd(
  parent: THREE.Object3D,
  x: number,
  mat: THREE.Material,
  _rec: HouseRecord,
  ridgeY: number,
  ridgeZ: number,
  half: number,
  _pitch: number,
) {
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

export function buildBalcony(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const x0 = 0.4,
    x1 = 4.25,
    z0 = -3.45,
    z1 = MAIN.z0 + 0.02;
  const y = Y_L2_TOP - 0.08;
  addBox(parent, x1 - x0, 0.12, z1 - z0, (x0 + x1) / 2, y, (z0 + z1) / 2, mats.deck, rec, {
    clip: true,
  });
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
    {
      clip: true,
    },
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
    {
      clip: true,
    },
  );
}

export function buildCanopy(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const x = -0.95,
    z = MAIN.z1 + 0.95,
    y = 2.72;
  addBox(parent, 3.4, 0.08, 1.9, x, y, z, mats.fascia, rec, { clip: true });
  addBox(parent, 3.28, 0.025, 1.78, x, y - 0.06, z, mats.soffit, rec, { clip: true, noCast: true });
  addCyl(parent, 0.035, y, x - 1.45, y / 2, MAIN.z1 + 1.55, mats.steel);
  addCyl(parent, 0.035, y, x + 1.45, y / 2, MAIN.z1 + 1.55, mats.steel);
  addCyl(parent, 0.06, 0.02, x - 1.45, 0.02, MAIN.z1 + 1.55, mats.steel, { noShadow: true });
  addCyl(parent, 0.06, 0.02, x + 1.45, 0.02, MAIN.z1 + 1.55, mats.steel, { noShadow: true });
}
