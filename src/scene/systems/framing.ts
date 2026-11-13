import type * as THREE from "three";
import { FINISH_T, MAIN, STRUCT_T, WING, Y_L2_CEIL, Y_L2_TOP, Y_L2_WALL_TOP } from "@/config";
import type { HouseRecord } from "@/types";
import { addBox, BoxBatch, runAlong } from "@/geom";
import type { Materials } from "@/materials";

export function framing(parent: THREE.Object3D, rec: HouseRecord, mats: Materials) {
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
