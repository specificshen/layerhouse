import * as THREE from "three";
import type { HouseRecord } from "../../types";
import { addBox } from "../geom";
import type { Materials } from "../materials";

/** Greens stay in the same family as the site palette, with enough spread to model a crown. */
const PINE_DEEP = new THREE.Color(0x132e1a);
const PINE_MID = new THREE.Color(0x1e4a28);
const PINE_LIT = new THREE.Color(0x3a6a38);
const PINE_TIP = new THREE.Color(0x5c8844);
const MAPLE_DEEP = new THREE.Color(0x183616);
const MAPLE_MID = new THREE.Color(0x2f5a28);
const MAPLE_LIT = new THREE.Color(0x3d6830);
const MAPLE_WARM = new THREE.Color(0x5a7c36);

const UP = new THREE.Vector3(0, 1, 0);
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _n = new THREE.Vector3();

interface FoliageMats {
  pine: THREE.MeshStandardMaterial;
  maple: THREE.MeshStandardMaterial;
  shrub: THREE.MeshStandardMaterial;
}

let foliage: FoliageMats | null = null;

function foliageMats(): FoliageMats {
  if (foliage) return foliage;
  foliage = {
    pine: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0,
      flatShading: true,
      vertexColors: true,
    }),
    maple: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0,
      vertexColors: true,
    }),
    shrub: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
      vertexColors: true,
    }),
  };
  return foliage;
}

function makeRng(seed: number): () => number {
  let s = Math.imul(Math.floor(seed * 1000) || 1, 0x9e3779b1) >>> 0;
  if (s === 0) s = 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function orthoFrame(forward: THREE.Vector3, hint: THREE.Vector3) {
  const f = forward.clone();
  if (f.lengthSq() < 1e-10) f.set(0, 1, 0);
  else f.normalize();
  const right = new THREE.Vector3().crossVectors(hint, f);
  if (right.lengthSq() < 1e-8) {
    right.crossVectors(new THREE.Vector3(1, 0, 0), f);
    if (right.lengthSq() < 1e-8) right.set(0, 0, 1);
  }
  right.normalize();
  const up = new THREE.Vector3().crossVectors(f, right).normalize();
  return { forward: f, right, up };
}

class MeshAccum {
  private pos: number[] = [];
  private nrm: number[] = [];
  private col: number[] = [];

  tri(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    na: THREE.Vector3,
    nb: THREE.Vector3,
    nc: THREE.Vector3,
    color: THREE.Color | null,
  ) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.nrm.push(na.x, na.y, na.z, nb.x, nb.y, nb.z, nc.x, nc.y, nc.z);
    if (color)
      this.col.push(
        color.r,
        color.g,
        color.b,
        color.r,
        color.g,
        color.b,
        color.r,
        color.g,
        color.b,
      );
  }

  face(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color | null) {
    _ab.subVectors(b, a);
    _ac.subVectors(c, a);
    _n.crossVectors(_ab, _ac);
    if (_n.lengthSq() < 1e-12) return;
    _n.normalize();
    this.tri(a, b, c, _n, _n, _n, color);
  }

  geometry(): THREE.BufferGeometry | null {
    if (this.pos.length === 0) return null;
    if (this.col.length !== 0 && this.col.length !== this.pos.length) {
      throw new Error("foliage color buffer does not match positions");
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(this.nrm, 3));
    if (this.col.length > 0)
      geo.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    return geo;
  }
}

function addMesh(
  parent: THREE.Object3D,
  acc: MeshAccum,
  mat: THREE.Material,
  name: string,
  receive = true,
) {
  const geo = acc.geometry();
  if (!geo) return;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = receive;
  parent.add(mesh);
}

function pointOnPolyline(pts: readonly THREE.Vector3[], u: number): THREE.Vector3 {
  const lengths = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += pts[i]!.distanceTo(pts[i - 1]!);
    lengths.push(total);
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last || total < 1e-6) return (first ?? new THREE.Vector3()).clone();
  const target = Math.min(1, Math.max(0, u)) * total;
  for (let i = 1; i < pts.length; i++) {
    const here = lengths[i]!;
    if (target <= here) {
      const span = here - lengths[i - 1]!;
      const f = span < 1e-6 ? 0 : (target - lengths[i - 1]!) / span;
      return pts[i - 1]!.clone().lerp(pts[i]!, f);
    }
  }
  return last.clone();
}

function ringFrame(tangent: THREE.Vector3, prevRight: THREE.Vector3 | null) {
  const forward = tangent.clone();
  if (forward.lengthSq() < 1e-10) forward.set(0, 1, 0);
  else forward.normalize();
  let right: THREE.Vector3;
  if (prevRight) {
    right = prevRight.clone().addScaledVector(forward, -prevRight.dot(forward));
    if (right.lengthSq() < 1e-8) right = orthoFrame(forward, UP).right;
    else right.normalize();
  } else {
    right = orthoFrame(forward, UP).right;
  }
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  return { right, up };
}

function addTube(acc: MeshAccum, points: THREE.Vector3[], radii: number[], sides: number) {
  if (points.length < 2 || points.length !== radii.length) return;
  const rings: THREE.Vector3[][] = [];
  const normals: THREE.Vector3[][] = [];
  let prevRight: THREE.Vector3 | null = null;
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)]!;
    const next = points[Math.min(points.length - 1, i + 1)]!;
    const { right, up } = ringFrame(_ab.subVectors(next, prev), prevRight);
    prevRight = right;
    const radius = Math.max(0.006, radii[i]!);
    const ring: THREE.Vector3[] = [];
    const nrm: THREE.Vector3[] = [];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const radial = right.clone().multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a));
      nrm.push(radial);
      ring.push(points[i]!.clone().addScaledVector(radial, radius));
    }
    rings.push(ring);
    normals.push(nrm);
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const ring = rings[i]!;
    const next = rings[i + 1]!;
    const na = normals[i]!;
    const nb = normals[i + 1]!;
    for (let k = 0; k < sides; k++) {
      const k2 = (k + 1) % sides;
      const a = ring[k]!;
      const b = ring[k2]!;
      const c = next[k2]!;
      const d = next[k]!;
      acc.tri(a, b, c, na[k]!, na[k2]!, nb[k2]!, null);
      acc.tri(a, c, d, na[k]!, nb[k2]!, nb[k]!, null);
    }
  }
  const cap = (ring: THREE.Vector3[], center: THREE.Vector3, outward: boolean) => {
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k]!;
      const b = ring[(k + 1) % ring.length]!;
      if (outward) acc.face(center, b, a, null);
      else acc.face(center, a, b, null);
    }
  };
  const first = rings[0];
  const last = rings[rings.length - 1];
  const p0 = points[0];
  const pN = points[points.length - 1];
  if (first && p0) cap(first, p0, false);
  if (last && pN) cap(last, pN, true);
}

function addSpike(
  acc: MeshAccum,
  base: THREE.Vector3,
  dir: THREE.Vector3,
  length: number,
  radius: number,
  color: THREE.Color,
) {
  if (length < 0.02) return;
  const { right, up } = orthoFrame(dir, UP);
  const tip = base.clone().addScaledVector(dir, length);
  const ring: THREE.Vector3[] = [];
  const sides = 6;
  for (let k = 0; k < sides; k++) {
    const a = (k / sides) * Math.PI * 2 + 0.4;
    ring.push(
      base
        .clone()
        .addScaledVector(right, Math.cos(a) * radius)
        .addScaledVector(up, Math.sin(a) * radius),
    );
  }
  for (let k = 0; k < sides; k++) {
    const a = ring[k]!;
    const b = ring[(k + 1) % sides]!;
    acc.face(a, b, tip, color);
    acc.face(base, b, a, color);
  }
}

/** Needle wedges in rings along a branch, fuller toward the middle and tip. */
function addBough(
  acc: MeshAccum,
  root: THREE.Vector3,
  mid: THREE.Vector3,
  tip: THREE.Vector3,
  length: number,
  whorlT: number,
  rnd: () => number,
) {
  const axis = tip.clone().sub(root);
  if (axis.lengthSq() < 1e-8) return;
  axis.normalize();
  const { right, up } = orthoFrame(axis, UP);
  const phase = rnd() * Math.PI * 2;
  const rings = 5 + (length > 1 ? 1 : 0);
  for (let ring = 0; ring < rings; ring++) {
    if (ring === 1 && rnd() > 0.72) continue;
    const t = rings === 1 ? 0.75 : ring / (rings - 1);
    const u = 0.36 + Math.pow(t, 0.8) * 0.6;
    const p = pointOnPolyline([root, mid, tip], u);
    const env = 0.5 + 0.5 * Math.sin(t * Math.PI);
    const per = rnd() > 0.78 ? 3 : 5;
    for (let k = 0; k < per; k++) {
      const ang = phase + ring * 0.9 + (k / per) * Math.PI * 2;
      const droop = -0.48 + whorlT * 0.28;
      const dir = right
        .clone()
        .multiplyScalar(Math.cos(ang))
        .addScaledVector(up, Math.sin(ang) * 0.48 + droop)
        .addScaledVector(axis, 0.16 + t * 0.28);
      if (dir.y < -0.72) dir.y = -0.72;
      if (dir.lengthSq() < 1e-8) continue;
      dir.normalize();
      const stretch = k === 0 ? 1.22 : 0.78 + ((ring + k) % 3) * 0.12;
      const len = (0.28 + Math.min(0.34, length * 0.22)) * env * stretch;
      const base = p.clone().addScaledVector(dir, 0.02);
      if (base.y < 0.04) continue;
      const young = whorlT > 0.66 && t > 0.7 && k % 2 === 0;
      const color = young
        ? PINE_TIP
        : dir.y > 0.2
          ? PINE_LIT
          : (ring + k) % 2 === 0
            ? PINE_MID
            : PINE_DEEP;
      addSpike(acc, base, dir, len, Math.max(0.028, len * 0.24), color);
    }
  }
}

function addCandle(acc: MeshAccum, tip: THREE.Vector3, rnd: () => number, s: number) {
  const n = 8 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const az = (i / n) * Math.PI * 2 + rnd() * 0.35;
    const lean = 0.12 + rnd() * 0.38;
    const dir = new THREE.Vector3(Math.cos(az) * lean, 1, Math.sin(az) * lean).normalize();
    const len = s * (0.14 + rnd() * 0.16);
    addSpike(acc, tip, dir, len, len * 0.11, rnd() > 0.35 ? PINE_TIP : PINE_LIT);
  }
}

function coniferRadius(t: number, s: number) {
  const flare = Math.pow(1 - t, 4.2) * 0.72;
  const taper = Math.pow(1 - t, 1.15);
  return s * (0.01 + 0.155 * taper + 0.08 * flare);
}

interface Spine {
  pts: THREE.Vector3[];
  rad: number[];
}

function pineSpine(h: number, s: number, rnd: () => number): Spine {
  const leanAz = rnd() * Math.PI * 2;
  const lean = (rnd() - 0.42) * 0.2 * s;
  const bow = (rnd() - 0.5) * 0.16 * s;
  const steps = 7;
  const pts: THREE.Vector3[] = [];
  const rad: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k = Math.sin(t * Math.PI);
    pts.push(
      new THREE.Vector3(
        Math.cos(leanAz) * (lean * t + bow * k),
        h * t - 0.02,
        Math.sin(leanAz) * (lean * t * 0.65 - bow * k * 0.35),
      ),
    );
    rad.push(coniferRadius(t, s));
  }
  return { pts, rad };
}

function sampleSpine(spine: Spine, t: number) {
  const n = spine.pts.length - 1;
  const f = Math.min(n - 1e-4, Math.max(0, t * n));
  const i = Math.floor(f);
  const u = f - i;
  const p = spine.pts[i]!.clone().lerp(spine.pts[i + 1]!, u);
  const r = spine.rad[i]! + (spine.rad[i + 1]! - spine.rad[i]!) * u;
  return { p, r };
}

function addRoots(acc: MeshAccum, s: number, rnd: () => number) {
  const n = 4;
  const baseAz = rnd() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    if (rnd() > 0.85) continue;
    const az = baseAz + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.45;
    const len = s * (0.18 + rnd() * 0.16);
    const a = new THREE.Vector3(Math.cos(az) * s * 0.05, 0.06, Math.sin(az) * s * 0.05);
    const b = new THREE.Vector3(Math.cos(az) * len, 0.015, Math.sin(az) * len);
    addTube(acc, [a, b], [s * 0.055, s * 0.02], 5);
  }
}

function addPineBranch(
  wood: MeshAccum,
  foliage: MeshAccum,
  root: THREE.Vector3,
  az: number,
  droop: number,
  length: number,
  r0: number,
  whorlT: number,
  rnd: () => number,
  s: number,
) {
  const dir = new THREE.Vector3(
    Math.cos(az) * Math.cos(droop),
    -Math.sin(droop),
    Math.sin(az) * Math.cos(droop),
  );
  if (dir.lengthSq() < 1e-8) return;
  dir.normalize();
  const upturn = whorlT > 0.62 ? (whorlT - 0.5) * 0.5 : 0;
  const mid = root.clone().addScaledVector(dir, length * 0.56);
  mid.y -= length * (0.03 + droop * 0.04);
  const tip = root.clone().addScaledVector(dir, length);
  tip.y += length * upturn;
  addTube(wood, [root, mid, tip], [r0, r0 * 0.48, Math.max(s * 0.008, r0 * 0.16)], 5);
  addBough(foliage, root, mid, tip, length, whorlT, rnd);
  if (whorlT > 0.72 && rnd() > 0.55) addCandle(foliage, tip, rnd, s * 0.35);
}

function sectorWeight(az: number, gapAz: number) {
  const d = Math.atan2(Math.sin(az - gapAz), Math.cos(az - gapAz));
  const gap = 0.85;
  if (Math.abs(d) > gap) return 1;
  return 0.35 + 0.65 * (Math.abs(d) / gap);
}

function mapleProfile(theta: number) {
  const lobes = Math.cos(theta * 5);
  const body = 0.32 + 0.68 * Math.pow(Math.max(0, lobes), 0.48);
  const tip = Math.pow(Math.max(0, Math.cos(theta)), 10) * 0.18;
  const notch = Math.pow(Math.max(0, -Math.cos(theta)), 8) * 0.1;
  return Math.max(0.14, body + tip - notch);
}

function addMapleLeaf(
  acc: MeshAccum,
  center: THREE.Vector3,
  normal: THREE.Vector3,
  radius: number,
  spin: number,
  color: THREE.Color,
) {
  const { right, up } = orthoFrame(normal, UP);
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);
  const tx = right.clone().multiplyScalar(cs).addScaledVector(up, sn);
  const ty = up.clone().multiplyScalar(cs).addScaledVector(right, -sn);
  const steps = 16;
  const rim: THREE.Vector3[] = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = radius * mapleProfile(theta);
    const cup = -Math.pow(r / radius, 2) * radius * 0.07;
    rim.push(
      center
        .clone()
        .addScaledVector(tx, Math.cos(theta) * r)
        .addScaledVector(ty, Math.sin(theta) * r)
        .addScaledVector(normal, cup),
    );
  }
  const thick = Math.max(0.01, radius * 0.04);
  const centerB = center.clone().addScaledVector(normal, -thick);
  const back = rim.map((p) => p.clone().addScaledVector(normal, -thick));
  for (let i = 0; i < steps; i++) {
    const a = rim[i]!;
    const b = rim[(i + 1) % steps]!;
    acc.face(center, a, b, color);
    acc.face(centerB, back[(i + 1) % steps]!, back[i]!, color);
  }
}

function addLeafCluster(
  acc: MeshAccum,
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  scale: number,
  rnd: () => number,
) {
  const { right, up } = orthoFrame(dir, UP);
  const n = 18 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const along = (rnd() - 0.35) * scale * 0.34;
    const side = (rnd() - 0.5) * scale * 0.26;
    const lift = (rnd() - 0.2) * scale * 0.16;
    const center = origin
      .clone()
      .addScaledVector(dir, along)
      .addScaledVector(right, side)
      .addScaledVector(up, lift);
    if (center.y < 0.12) center.y = 0.12;
    const nrm = up
      .clone()
      .multiplyScalar(0.82)
      .addScaledVector(dir, (rnd() - 0.2) * 0.5)
      .addScaledVector(right, (rnd() - 0.5) * 0.55)
      .normalize();
    const color =
      nrm.y > 0.7 ? MAPLE_WARM : nrm.y > 0.22 ? MAPLE_LIT : lift < 0 ? MAPLE_DEEP : MAPLE_MID;
    addMapleLeaf(acc, center, nrm, scale * (0.3 + rnd() * 0.12), rnd() * Math.PI * 2, color);
    if (i % 3 === 0) {
      const lifted = center.clone().addScaledVector(nrm, scale * 0.1);
      addMapleLeaf(
        acc,
        lifted,
        nrm,
        scale * (0.2 + rnd() * 0.08),
        rnd() * Math.PI * 2,
        nrm.y > 0.4 ? MAPLE_LIT : MAPLE_MID,
      );
    }
  }
}

/** Leaf clusters strung along the outer limb, longer than they are tall. */
function addMapleCrown(
  acc: MeshAccum,
  end: THREE.Vector3,
  dir: THREE.Vector3,
  scale: number,
  rnd: () => number,
) {
  const reach = scale * 0.9;
  const stations = [0.0, 0.24, 0.48, 0.72, 0.94];
  for (let i = 0; i < stations.length; i++) {
    if (i === 0 && rnd() > 0.88) continue;
    const along = (stations[i]! - 0.18) * reach;
    const p = end.clone().addScaledVector(dir, along);
    const cluster = scale * (0.66 + stations[i]! * 0.2) * (0.94 + rnd() * 0.1);
    addLeafCluster(acc, p, dir, cluster, rnd);
    if (i % 2 === 0) {
      const { right } = orthoFrame(dir, UP);
      const side = p.clone().addScaledVector(right, scale * 0.16 * (i === 0 ? 1 : -1));
      addLeafCluster(acc, side, dir, cluster * 0.82, rnd);
    }
  }
  addLeafCluster(acc, end, dir, scale * 0.7, rnd);
}

function growLeader(
  wood: MeshAccum,
  foliage: MeshAccum,
  start: THREE.Vector3,
  dirIn: THREE.Vector3,
  length: number,
  radius: number,
  scale: number,
  capY: number,
  rnd: () => number,
  primary: boolean,
) {
  const dir = dirIn.clone();
  if (dir.y < 0.12) dir.y = 0.12;
  dir.normalize();
  const end = start.clone().addScaledVector(dir, length);
  if (end.y > capY) end.y = capY;
  const { up, right } = orthoFrame(dir, UP);
  const mid = start.clone().lerp(end, 0.52);
  mid.addScaledVector(up, length * (0.07 + rnd() * 0.06));
  mid.addScaledVector(right, length * (rnd() - 0.5) * 0.1);
  addTube(wood, [start, mid, end], [radius, radius * 0.55, Math.max(0.008, radius * 0.22)], 5);

  const children = primary ? 2 : 1;
  for (let i = 0; i < children; i++) {
    const u = primary ? 0.4 + i * 0.26 : 0.58;
    const at = pointOnPolyline([start, mid, end], u);
    const swing = (i === 0 ? 1 : -1) * (0.75 + rnd() * 0.4);
    const childDir = dir.clone().applyAxisAngle(UP, swing);
    childDir.y += 0.16 + rnd() * 0.24;
    if (childDir.y < 0.16) childDir.y = 0.16;
    childDir.normalize();
    const childLen = length * (0.46 + rnd() * 0.18);
    const childR = radius * (0.48 - i * 0.06);
    const childStart = at.clone().addScaledVector(childDir, radius * 0.4);
    const childEnd = childStart.clone().addScaledVector(childDir, childLen);
    if (childEnd.y > capY) childEnd.y = capY;
    const cmid = childStart.clone().lerp(childEnd, 0.5);
    cmid.y += childLen * (0.06 + rnd() * 0.05);
    addTube(
      wood,
      [childStart, cmid, childEnd],
      [childR, childR * 0.5, Math.max(0.007, childR * 0.2)],
      5,
    );
    if (rnd() > 0.35) {
      const twigDir = childDir.clone().applyAxisAngle(UP, (rnd() - 0.5) * 0.9);
      twigDir.y += 0.22 + rnd() * 0.2;
      twigDir.normalize();
      const twigLen = childLen * (0.38 + rnd() * 0.16);
      const twigStart = pointOnPolyline([childStart, cmid, childEnd], 0.62);
      const twigEnd = twigStart.clone().addScaledVector(twigDir, twigLen);
      if (twigEnd.y > capY) twigEnd.y = capY;
      addTube(wood, [twigStart, twigEnd], [childR * 0.42, Math.max(0.006, childR * 0.12)], 4);
      addMapleCrown(foliage, twigEnd, twigDir, scale * 0.62, rnd);
    }
    addMapleCrown(foliage, childEnd, childDir, scale * (primary ? 0.86 : 0.7), rnd);
  }
  addMapleCrown(foliage, end, dir, scale * (primary ? 1 : 0.78), rnd);
}

export function planter(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  z: number,
  w: number,
  d: number,
) {
  addBox(parent, w, 0.42, d, x, 0.21, z, mats.concrete, rec, {});
  addBox(parent, w - 0.08, 0.06, d - 0.08, x, 0.44, z, mats.soil, rec, { noCast: true });
  shrub(parent, mats, x, z, Math.min(w, d) * 0.42, 0.62);
}

/** Irregular whorled conifer: flared taper, uneven branch lengths, needle pads instead of stacked cones. */
export function pine(
  parent: THREE.Object3D,
  mats: Materials,
  x: number,
  z: number,
  s: number,
  h: number,
) {
  const g = new THREE.Group();
  g.name = "pine";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 13.1 + z * 7.7);
  const wood = new MeshAccum();
  const foliage = new MeshAccum();
  const spine = pineSpine(h, s, rnd);
  addTube(wood, spine.pts, spine.rad, 12);
  addRoots(wood, s, rnd);

  const gapAz = rnd() * Math.PI * 2;
  const weak = 1 + Math.floor(rnd() * 3);
  const whorls = 6;
  let spin = rnd() * Math.PI * 2;
  for (let i = 0; i < whorls; i++) {
    const u = i / (whorls - 1);
    const whorlT = 0.34 + Math.pow(u, 0.9) * 0.62 + (rnd() - 0.5) * 0.016;
    const sample = sampleSpine(spine, whorlT);
    spin += 0.85 + rnd() * 0.55;
    const count = 5 + (i % 2) + (rnd() > 0.65 ? 1 : 0);
    const weakMul = i === weak ? 0.58 : 1;
    for (let k = 0; k < count; k++) {
      const az = spin + (k / count) * Math.PI * 2 + (rnd() - 0.5) * 0.42;
      const sector = sectorWeight(az, gapAz);
      if (rnd() > 0.62 + 0.36 * sector) continue;
      const droop = THREE.MathUtils.lerp(0.82, 0.08, whorlT) + (rnd() - 0.5) * 0.2;
      const length =
        s *
        THREE.MathUtils.lerp(1.28, 0.3, Math.pow(whorlT, 0.88)) *
        (0.68 + rnd() * 0.48) *
        weakMul *
        (0.55 + 0.45 * sector);
      const outward = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      const root = sample.p.clone().addScaledVector(outward, sample.r * 0.8);
      const r0 = Math.max(s * 0.012, sample.r * 0.26);
      addPineBranch(wood, foliage, root, az, droop, length, r0, whorlT, rnd, s);
    }
  }

  const stubN = 2 + (rnd() > 0.5 ? 1 : 0);
  for (let i = 0; i < stubN; i++) {
    const whorlT = 0.16 + rnd() * 0.08;
    const sample = sampleSpine(spine, whorlT);
    const az = rnd() * Math.PI * 2;
    const outward = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const root = sample.p.clone().addScaledVector(outward, sample.r * 0.85);
    addPineBranch(
      wood,
      foliage,
      root,
      az,
      0.4 + rnd() * 0.25,
      s * (0.26 + rnd() * 0.2),
      sample.r * 0.2,
      whorlT,
      rnd,
      s,
    );
  }

  if (rnd() > 0.2) {
    const sample = sampleSpine(spine, 0.22 + rnd() * 0.06);
    const az = gapAz + (rnd() - 0.5) * 0.4;
    const dir = new THREE.Vector3(Math.cos(az), -0.55, Math.sin(az)).normalize();
    const start = sample.p.clone().addScaledVector(dir, sample.r * 0.7);
    const tip = start.clone().addScaledVector(dir, s * (0.32 + rnd() * 0.2));
    addTube(wood, [start, tip], [sample.r * 0.16, s * 0.008], 4);
  }

  const top = sampleSpine(spine, 1);
  addCandle(foliage, top.p, rnd, s * 0.7);

  addMesh(g, wood, mats.trunk, "pine-wood");
  addMesh(g, foliage, foliageMats().pine, "pine-needles", false);
  parent.add(g);
}

/** Forked maple: curved leaders, leaf clusters along the outer limbs. */
export function maple(
  parent: THREE.Object3D,
  mats: Materials,
  _rec: HouseRecord,
  x: number,
  z: number,
  s: number,
  h: number,
) {
  const g = new THREE.Group();
  g.name = "maple";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 9.2 + z * 4.4);
  const wood = new MeshAccum();
  const leaves = new MeshAccum();
  const fork = h * (0.46 + rnd() * 0.05);
  const leanAz = rnd() * Math.PI * 2;
  const lean = (rnd() - 0.5) * 0.1 * s;
  const base = new THREE.Vector3(0, -0.02, 0);
  const top = new THREE.Vector3(Math.cos(leanAz) * lean, fork, Math.sin(leanAz) * lean * 0.8);
  const mid = base.clone().lerp(top, 0.5);
  mid.add(
    new THREE.Vector3(Math.cos(leanAz + 1.4) * s * 0.035, 0, Math.sin(leanAz + 1.4) * s * 0.035),
  );
  const rBase = s * 0.115;
  addTube(wood, [base, mid, top], [rBase * 1.55, rBase * 0.58, rBase * 0.22], 12);
  addRoots(wood, s * 0.8, rnd);

  const leaderDir = new THREE.Vector3(
    Math.cos(leanAz) * 0.34,
    1,
    Math.sin(leanAz) * 0.34,
  ).normalize();
  growLeader(
    wood,
    leaves,
    top,
    leaderDir,
    s * (0.92 + rnd() * 0.22),
    rBase * 0.46,
    s,
    h * 1.06,
    rnd,
    true,
  );

  const limbs = [
    {
      t: 0.76,
      az: leanAz + 2.05 + rnd() * 0.5,
      elev: 0.68 + rnd() * 0.22,
      len: s * (0.82 + rnd() * 0.2),
      rad: s * 0.042,
    },
    {
      t: 0.5,
      az: leanAz + 3.9 + rnd() * 0.55,
      elev: 0.4 + rnd() * 0.16,
      len: s * (0.66 + rnd() * 0.18),
      rad: s * 0.032,
    },
  ];
  for (const limb of limbs) {
    const at = pointOnPolyline([base, mid, top], limb.t);
    const dir = new THREE.Vector3(
      Math.cos(limb.az) * Math.cos(limb.elev),
      Math.sin(limb.elev),
      Math.sin(limb.az) * Math.cos(limb.elev),
    );
    const start = at.clone().addScaledVector(dir, rBase * 0.25);
    growLeader(wood, leaves, start, dir, limb.len, limb.rad, s * 0.92, h * 1.06, rnd, false);
  }

  addMesh(g, wood, mats.trunk, "maple-wood");
  addMesh(g, leaves, foliageMats().maple, "maple-crown", false);
  parent.add(g);
}

export function shrub(
  parent: THREE.Object3D,
  _mats: Materials,
  x: number,
  z: number,
  r: number,
  h = 0.7,
) {
  const g = new THREE.Group();
  g.name = "shrub";
  g.position.set(x, 0, z);
  const rnd = makeRng(x * 3.7 + z * 8.1);
  const acc = new MeshAccum();
  const height = h / 0.7;
  const n = 24;
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = r * Math.pow(rnd(), 0.7) * 0.55;
    const y = r * (0.26 + rnd() * 0.48) * height * (1 - dist / (r * 2.1));
    const center = new THREE.Vector3(Math.cos(ang) * dist, Math.max(0.05, y), Math.sin(ang) * dist);
    const nrm = new THREE.Vector3(Math.cos(ang) * 0.22, 0.94, Math.sin(ang) * 0.22).normalize();
    const color = y > r * 0.42 ? MAPLE_LIT : rnd() > 0.4 ? MAPLE_MID : MAPLE_DEEP;
    addMapleLeaf(acc, center, nrm, r * (0.4 + rnd() * 0.18), ang + rnd() * 0.6, color);
  }
  addMesh(g, acc, foliageMats().shrub, "shrub-leaves", false);
  parent.add(g);
}
