import * as THREE from "three";
import {
  FINISH_T,
  MAIN,
  STRUCT_T,
  WING,
  Y_GF_TOP,
  Y_GF_CEIL,
  Y_L2_TOP,
  Y_L2_CEIL,
  Y_L2_WALL_TOP,
} from "../../config";
import { addBox, addCyl, buildWall, BoxBatch, CylBatch, runAlong, solidRects } from "../geom";
import type { Materials } from "../materials";
import type { HouseGroups, HouseRecord, Wall } from "../../types";

export function buildSystems(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  buildMasonryShell(groups.masonry, rec.wallsData, mats, rec);
  buildFraming(groups.framing, rec, mats);
  buildInsulation(groups.insulation, rec, mats);
  buildHVAC(groups.hvac, mats, rec);
  buildElectrical(groups.electrical, rec, mats);
  buildPlumbing(groups.plumbing, mats, rec);
}

function buildMasonryShell(
  parent: THREE.Object3D,
  walls: Wall[],
  mats: Materials,
  rec: HouseRecord,
) {
  // Exterior CMU/concrete shell following exterior walls, slightly thicker, with same openings
  for (const w of walls) {
    if (w.kind !== "ext") continue;
    const mw = { ...w, t: w.t + 0.04, openings: w.openings };
    buildWall(parent, mw, mats.cmu, rec, { collide: false, clip: true });
  }
  // Foundation stem slightly below grade
  const mainW = MAIN.x1 - MAIN.x0 + 0.3;
  const mainD = MAIN.z1 - MAIN.z0 + 0.3;
  addBox(
    parent,
    mainW,
    0.4,
    mainD,
    (MAIN.x0 + MAIN.x1) / 2,
    -0.1,
    (MAIN.z0 + MAIN.z1) / 2,
    mats.concrete,
    rec,
    { clip: true },
  );
  addBox(
    parent,
    WING.x1 - WING.x0 + 0.3,
    0.4,
    WING.z1 - WING.z0 + 0.3,
    (WING.x0 + WING.x1) / 2,
    -0.1,
    (WING.z0 + WING.z1) / 2,
    mats.concrete,
    rec,
    { clip: true },
  );
}

function buildFraming(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
  const studs = new BoxBatch(mats.framing, "studs");
  const plates = new BoxBatch(mats.framing, "plates");
  const joists = new BoxBatch(mats.framing, "joists");
  const trusses = new BoxBatch(mats.framing, "trusses");

  const studW = 0.04,
    studD = 0.14,
    space = 0.406;
  for (const w of rec.wallsData) {
    const t = w.kind === "ext" ? studD : 0.09;
    const thickness = w.t;
    // plates
    plates.add(
      w.axis === "z" ? w.a1 - w.a0 : thickness,
      0.04,
      w.axis === "x" ? w.a1 - w.a0 : thickness,
      w.axis === "z" ? (w.a0 + w.a1) / 2 : w.pos,
      w.y0 + 0.02,
      w.axis === "x" ? (w.a0 + w.a1) / 2 : w.pos,
    );
    plates.add(
      w.axis === "z" ? w.a1 - w.a0 : thickness,
      0.04,
      w.axis === "x" ? w.a1 - w.a0 : thickness,
      w.axis === "z" ? (w.a0 + w.a1) / 2 : w.pos,
      w.y1 - 0.02,
      w.axis === "x" ? (w.a0 + w.a1) / 2 : w.pos,
    );
    // mid plate at L2 if wall is two-story
    if (w.y0 < Y_L2_TOP - 0.2 && w.y1 > Y_L2_TOP + 0.2) {
      plates.add(
        w.axis === "z" ? w.a1 - w.a0 : thickness,
        0.04,
        w.axis === "x" ? w.a1 - w.a0 : thickness,
        w.axis === "z" ? (w.a0 + w.a1) / 2 : w.pos,
        Y_L2_TOP - 0.02,
        w.axis === "x" ? (w.a0 + w.a1) / 2 : w.pos,
      );
    }
    // studs in solid regions, full height bands split by openings
    const xs = runAlong(w.a0 + 0.05, w.a1 - 0.05, space, 0);
    for (const a of xs) {
      // split stud around openings at this 'a'
      const blocked = (w.openings || []).filter((o) => a > o.a0 + 0.02 && a < o.a1 - 0.02);
      const segs = subtractY(
        w.y0,
        w.y1,
        blocked.map((o) => [o.y0, o.y1]),
      );
      for (const [ya, yb] of segs) {
        const h = yb - ya;
        if (h < 0.08) continue;
        const x = w.axis === "z" ? a : w.pos;
        const z = w.axis === "x" ? a : w.pos;
        const sx = w.axis === "z" ? studW : t;
        const sz = w.axis === "x" ? studW : t;
        studs.add(sx, h, sz, x, (ya + yb) / 2, z);
      }
    }
    // headers over openings
    for (const o of w.openings || []) {
      const x = w.axis === "z" ? (o.a0 + o.a1) / 2 : w.pos;
      const z = w.axis === "x" ? (o.a0 + o.a1) / 2 : w.pos;
      const sx = w.axis === "z" ? o.a1 - o.a0 + 0.1 : t;
      const sz = w.axis === "x" ? o.a1 - o.a0 + 0.1 : t;
      plates.add(sx, 0.12, sz, x, o.y1 + 0.07, z);
      // king studs
      const h = o.y1 - w.y0 + 0.12;
      for (const a of [o.a0 - 0.03, o.a1 + 0.03]) {
        const xx = w.axis === "z" ? a : w.pos;
        const zz = w.axis === "x" ? a : w.pos;
        const ssx = w.axis === "z" ? studW : t;
        const ssz = w.axis === "x" ? studW : t;
        if (a > w.a0 && a < w.a1) studs.add(ssx, h, ssz, xx, w.y0 + h / 2, zz);
      }
    }
  }

  // Floor joists L2, span north-south in main
  const jSpace = 0.4;
  // Sit in the L2 structural slab (+3.080 to +3.310), clear of the finish and the soffit.
  const jy = Y_L2_TOP - FINISH_T - STRUCT_T / 2;
  const jh = 0.22,
    jw = 0.05;
  for (const x of runAlong(MAIN.x0 + 0.15, MAIN.x1 - 0.15, jSpace, 0)) {
    // skip stair well
    const well = rec.well;
    if (x > well.x0 + 0.05 && x < well.x1 - 0.05) {
      const midN = (MAIN.z0 + well.z0) / 2;
      const midS = (well.z1 + MAIN.z1) / 2;
      joists.add(jw, jh, well.z0 - MAIN.z0 - 0.1, x, jy, midN);
      joists.add(jw, jh, MAIN.z1 - well.z1 - 0.1, x, jy, midS);
    } else {
      joists.add(jw, jh, MAIN.z1 - MAIN.z0 - 0.15, x, jy, (MAIN.z0 + MAIN.z1) / 2);
    }
  }
  // Wing ceiling joists
  for (const x of runAlong(WING.x0 + 0.15, WING.x1 - 0.15, jSpace, 0)) {
    joists.add(jw, 0.18, WING.z1 - WING.z0 - 0.15, x, 2.92, (WING.z0 + WING.z1) / 2);
  }

  // Roof trusses — triangular frames along X, sitting on main walls
  const meta = rec.roofMeta;
  const pitch = meta.pitch;
  const ridgeY = meta.ridgeY;
  const ridgeZ = meta.ridgeZ;
  const half = meta.half;
  const eaveY = Y_L2_WALL_TOP;
  for (const x of runAlong(MAIN.x0 + 0.2, MAIN.x1 - 0.2, 0.6, 0)) {
    // two rafters
    const rafterLen = half / Math.cos(pitch);
    const rafterH = 0.14,
      rafterT = 0.05;
    for (const sign of [-1, 1]) {
      const zMid = ridgeZ + sign * (half / 2);
      const yMid = (eaveY + ridgeY) / 2;
      trusses.add(rafterT, rafterH, rafterLen, x, yMid, zMid, 0, 0, -sign * pitch);
    }
    // ceiling joist of truss
    trusses.add(rafterT, 0.08, half * 2, x, eaveY + 0.04, ridgeZ);
    // a couple of webs
    trusses.add(rafterT, (ridgeY - eaveY) * 0.7, 0.06, x, eaveY + (ridgeY - eaveY) * 0.4, ridgeZ);
    trusses.add(0.04, 0.06, half * 0.55, x, eaveY + (ridgeY - eaveY) * 0.45, ridgeZ - half * 0.28);
    trusses.add(0.04, 0.06, half * 0.55, x, eaveY + (ridgeY - eaveY) * 0.45, ridgeZ + half * 0.28);
  }
  // Wing rafters
  const wPitch = meta.wingPitch;
  const wSpan = meta.wz1 - meta.wz0;
  for (const x of runAlong(meta.wx0 + 0.2, meta.wx1 - 0.2, 0.6, 0)) {
    const len = Math.hypot(wSpan, meta.yS - meta.yN);
    trusses.add(
      0.05,
      0.12,
      len,
      x,
      (meta.yS + meta.yN) / 2,
      (meta.wz0 + meta.wz1) / 2,
      0,
      0,
      -wPitch,
    );
  }

  // Posts at carport already in site; add a few interior columns near stair
  addBox(parent, 0.16, Y_L2_CEIL, 0.16, 0.6, Y_L2_CEIL / 2, -1.9, mats.framing, rec, {
    clip: true,
  });
  addBox(parent, 0.16, Y_L2_CEIL, 0.16, 2.44, Y_L2_CEIL / 2, -1.9, mats.framing, rec, {
    clip: true,
  });

  studs.flush(parent, { cast: true, receive: true });
  plates.flush(parent, { cast: true, receive: true });
  joists.flush(parent, { cast: true, receive: true });
  trusses.flush(parent, { cast: true, receive: true });
}

function subtractY(
  y0: number,
  y1: number,
  holes: Array<[number, number]>,
): Array<[number, number]> {
  const cuts = holes
    .map(([a, b]) => [Math.max(a, y0), Math.min(b, y1)] as [number, number])
    .filter(([a, b]) => b > a + 0.02);
  cuts.sort((p, q) => p[0] - q[0]);
  const segs: Array<[number, number]> = [];
  let y = y0;
  for (const [a, b] of cuts) {
    if (a > y + 0.03) segs.push([y, a]);
    y = Math.max(y, b);
  }
  if (y < y1 - 0.03) segs.push([y, y1]);
  return segs;
}

function buildInsulation(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
  const batts = new BoxBatch(mats.insulation, "batts");
  for (const w of rec.wallsData) {
    const t = Math.max(0.08, w.t - 0.06);
    const rects = solidRects(w.a0, w.a1, w.y0, w.y1, w.openings || []);
    for (const r of rects) {
      const sx = w.axis === "z" ? r.a1 - r.a0 - 0.02 : t;
      const sz = w.axis === "x" ? r.a1 - r.a0 - 0.02 : t;
      const sy = r.y1 - r.y0 - 0.04;
      if (sy < 0.05) continue;
      const x = w.axis === "z" ? (r.a0 + r.a1) / 2 : w.pos;
      const z = w.axis === "x" ? (r.a0 + r.a1) / 2 : w.pos;
      batts.add(sx, sy, sz, x, (r.y0 + r.y1) / 2, z);
    }
  }
  // floor / ceiling batts between joists
  const jSpace = 0.4;
  for (const x of runAlong(MAIN.x0 + 0.2, MAIN.x1 - 0.2, jSpace, 0.15)) {
    const well = rec.well;
    if (x > well.x0 && x < well.x1) continue;
    batts.add(
      jSpace - 0.08,
      0.14,
      MAIN.z1 - MAIN.z0 - 0.3,
      x,
      Y_L2_TOP - 0.16,
      (MAIN.z0 + MAIN.z1) / 2,
    );
    batts.add(
      jSpace - 0.08,
      0.12,
      MAIN.z1 - MAIN.z0 - 0.3,
      x,
      Y_L2_CEIL + 0.1,
      (MAIN.z0 + MAIN.z1) / 2,
    );
  }
  for (const x of runAlong(WING.x0 + 0.2, WING.x1 - 0.2, jSpace, 0.15)) {
    batts.add(jSpace - 0.08, 0.12, WING.z1 - WING.z0 - 0.3, x, 3.0, (WING.z0 + WING.z1) / 2);
  }
  batts.flush(parent, { cast: false, receive: true });
}

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

function buildHVAC(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
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

function wirePath(
  batch: CylBatch,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  r = 0.012,
) {
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
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.03) continue;
    const x = (a + d) / 2,
      y = (b + e) / 2,
      z = (c + f) / 2;
    let rotX = 0,
      rotZ = 0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) rotZ = Math.PI / 2;
    else if (Math.abs(dz) > Math.abs(dy)) rotX = Math.PI / 2;
    batch.add(r, len, x, y, z, rotX, rotZ, 0);
  }
}

function buildElectrical(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
  const gold = new CylBatch(mats.wire, "wireGold", 6);
  const red = new CylBatch(mats.wireRed, "wireRed", 6);
  const devices = new BoxBatch(mats.outlet, "devices");

  const panelX = 6.35,
    panelZ = 5.4,
    panelY = 1.4;
  addBox(parent, 0.12, 0.9, 0.4, panelX, panelY, panelZ, mats.steel, rec, {});

  // Main home runs: along ceiling perimeters of each room, drops to outlets
  const yC = Y_GF_CEIL - 0.06;
  const yC2 = Y_L2_CEIL - 0.06;
  const yOut = Y_GF_TOP + 0.35;

  const rooms = [
    // living
    { x0: -7.0, x1: -1.6, z0: -2.05, z1: 6.05, y: yC, drops: true },
    // kitchen
    { x0: 2.55, x1: 6.65, z0: -2.05, z1: 6.05, y: yC, drops: true },
    // entry/hall
    { x0: -1.5, x1: 0.5, z0: 3.4, z1: 6.05, y: yC, drops: true },
    // wing bed
    { x0: -7.05, x1: -1.7, z0: -10.35, z1: -5.45, y: yC, drops: true },
    // guest bath
    { x0: -7.05, x1: -4.2, z0: -5.45, z1: -2.35, y: yC, drops: false },
    // master
    { x0: -7.05, x1: -0.2, z0: -2.05, z1: 3.25, y: yC2, drops: true, yDrop: Y_L2_TOP + 0.35 },
    // study
    { x0: 2.55, x1: 6.65, z0: -2.05, z1: 6.05, y: yC2, drops: true, yDrop: Y_L2_TOP + 0.35 },
  ];

  // feeder from panel up to GF ceiling then west
  wirePath(gold, panelX, panelY + 0.4, panelZ, panelX, yC, 1.0);
  wirePath(gold, panelX, yC, 1.0, -4, yC, 1.0);
  wirePath(gold, panelX, yC, 1.0, 1.5, yC2, 1.0);

  for (const rm of rooms) {
    // loop around room at ceiling
    const inset = 0.25;
    const x0 = rm.x0 + inset,
      x1 = rm.x1 - inset,
      z0 = rm.z0 + inset,
      z1 = rm.z1 - inset;
    const y = rm.y;
    wirePath(gold, x0, y, z0, x1, y, z0);
    wirePath(gold, x1, y, z0, x1, y, z1);
    wirePath(gold, x1, y, z1, x0, y, z1);
    wirePath(gold, x0, y, z1, x0, y, z0);
    if (rm.drops) {
      const yD = rm.yDrop || yOut;
      const pts: Array<[number, number]> = [
        [x0, z0],
        [x1, z0],
        [x0, z1],
        [x1, z1],
        [(x0 + x1) / 2, z0],
        [(x0 + x1) / 2, z1],
        [x0, (z0 + z1) / 2],
        [x1, (z0 + z1) / 2],
      ];
      for (const [x, z] of pts) {
        gold.add(0.01, y - yD, x, (y + yD) / 2, z);
        devices.add(0.04, 0.06, 0.04, x, yD, z);
      }
      // a few switches
      devices.add(0.04, 0.08, 0.04, x0 + 0.3, (rm.yDrop ? Y_L2_TOP : Y_GF_TOP) + 1.1, z1);
    }
    // ceiling fixture drops (short)
    gold.add(0.01, 0.08, (x0 + x1) / 2, y - 0.04, (z0 + z1) / 2);
  }

  // Red runs: a dedicated kitchen / mechanical circuit and a L2 homerun
  wirePath(red, panelX, panelY + 0.3, panelZ, panelX, yC, 5.0);
  wirePath(red, panelX, yC, 5.0, 4.5, yC, 0.3);
  wirePath(red, panelX, panelY + 0.2, panelZ, 1.5, yC2, 1.0);
  wirePath(red, 1.5, yC2, 1.0, -2.4, yC2, 1.3);

  // extra dense ceiling grid in kitchen and living
  for (const x of runAlong(-6.5, -2.0, 1.1, 0)) {
    wirePath(gold, x, yC, 0.2, x, yC, 5.4);
  }
  for (const z of runAlong(0.2, 5.4, 1.2, 0)) {
    wirePath(gold, -6.5, yC, z, -2.0, yC, z);
  }
  for (const x of runAlong(3.0, 6.3, 1.0, 0)) {
    wirePath(gold, x, yC, -1.5, x, yC, 5.4);
  }

  gold.flush(parent, { cast: false });
  red.flush(parent, { cast: false });
  devices.flush(parent, { cast: false, receive: false });
}

function pipePath(
  batch: CylBatch,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  r = 0.025,
) {
  wirePath(batch, x0, y0, z0, x1, y1, z1, r);
}

function buildPlumbing(parent: THREE.Object3D, mats: Materials, rec: HouseRecord) {
  const hot = new CylBatch(mats.pipe, "pipeHot", 8);
  const cold = new CylBatch(mats.pipeCold, "pipeCold", 8);

  // Water heater in utility near east / carport door: x=6.1, z=4.7
  const hx = 6.15,
    hz = 4.7;
  addCyl(parent, 0.28, 1.2, hx, 0.74, hz, mats.fixture);
  addCyl(parent, 0.3, 0.08, hx, 1.36, hz, mats.steel, { noShadow: true });

  const yFloor = 0.08;
  const yCeil = Y_GF_CEIL - 0.18;
  // Main stack near powder / core
  const sx = 0.0,
    sz = 2.0;
  cold.add(0.05, Y_L2_CEIL + 0.4, sx, (Y_L2_CEIL + 0.4) / 2, sz);
  // vent through roof
  addCyl(parent, 0.04, 0.5, sx, rec.roofMeta.ridgeY - 0.6, sz, mats.pipe, {});

  // From heater to stack and out
  pipePath(hot, hx, 1.2, hz, sx, yCeil, sz, 0.022);
  pipePath(cold, hx, 0.4, hz, sx, yFloor, sz, 0.025);

  // Powder: vanity + toilet
  pipePath(cold, sx, yFloor, sz, 0.15, yFloor, 2.35, 0.02);
  pipePath(hot, sx, yCeil, sz, 0.15, 0.6, 2.35, 0.018);
  pipePath(cold, sx, yFloor, sz, -1.15, yFloor, 2.15, 0.03); // waste toward toilet
  addCyl(parent, 0.07, 0.2, -1.15, 0.2, 2.15, mats.pipe, {});

  // Kitchen sink at 6.15, -0.5
  pipePath(cold, hx, 0.4, hz, 6.15, 0.4, -0.5, 0.02);
  pipePath(hot, hx, 1.2, hz, 6.15, 0.7, -0.5, 0.018);
  addCyl(parent, 0.05, 0.4, 6.15, 0.3, -0.5, mats.pipe, {});

  // Guest bath
  pipePath(cold, sx, yFloor, sz, -6.4, yFloor, -3.6, 0.02);
  pipePath(hot, sx, yCeil, sz, -6.4, 0.6, -3.6, 0.018);
  pipePath(cold, -6.4, yFloor, -3.6, -6.5, yFloor, -4.7, 0.03);
  pipePath(cold, -6.4, yFloor, -3.6, -5.0, yFloor, -3.0, 0.025);
  addCyl(parent, 0.05, 0.35, -6.5, 0.22, -4.7, mats.pipe, {});

  // L2 baths — stack continues
  const y2 = Y_L2_TOP + 0.08;
  const y2c = Y_L2_CEIL - 0.18;
  pipePath(cold, sx, Y_L2_TOP - 0.2, sz, -6.4, y2, 4.7, 0.02);
  pipePath(hot, sx, y2c, sz, -6.4, y2 + 0.5, 4.7, 0.018);
  pipePath(cold, -6.4, y2, 4.7, -6.5, y2, 5.7, 0.03);
  pipePath(cold, -6.4, y2, 4.7, -2.95, y2, 5.5, 0.025);
  addCyl(parent, 0.05, 0.3, -6.5, y2 + 0.15, 5.7, mats.pipe, {});

  // Hall bath
  pipePath(cold, sx, y2, sz, 1.52, y2, 5.5, 0.02);
  pipePath(hot, sx, y2c, sz, 1.52, y2 + 0.5, 5.5, 0.018);
  pipePath(cold, 1.52, y2, 5.5, 0.9, y2, 3.5, 0.03);
  pipePath(cold, 1.52, y2, 5.5, 2.0, y2, 3.55, 0.025);

  // Outdoor hose bib
  pipePath(cold, hx, 0.4, hz, 6.9, 0.4, 5.4, 0.018);
  addCyl(parent, 0.025, 0.12, 6.95, 0.5, 5.4, mats.steel, { rotZ: Math.PI / 2 });

  // Pool fill / feature pipe (short)
  pipePath(cold, 0.15, yFloor, 2.35, 0.2, 0.2, -4.15, 0.02);

  hot.flush(parent, { cast: true });
  cold.flush(parent, { cast: true });

  // Visible fixtures already in furniture; add a few P-traps / valves as solids
  const traps: Array<[number, number, number]> = [
    [0.15, 0.35, 2.35],
    [6.15, 0.35, -0.5],
    [-6.4, 0.35, -3.6],
    [-6.4, Y_L2_TOP + 0.35, 4.7],
    [1.52, Y_L2_TOP + 0.35, 5.5],
  ];
  for (const [x, y, z] of traps) {
    addCyl(parent, 0.03, 0.18, x, y, z, mats.pipe, { noShadow: true });
    addCyl(parent, 0.03, 0.12, x + 0.08, y - 0.08, z, mats.pipe, {
      rotZ: Math.PI / 2,
      noShadow: true,
    });
  }
}
