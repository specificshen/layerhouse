import * as THREE from "three";
import type { HouseRecord } from "@/types";

export function registerMeshClip(rec: HouseRecord, mesh: THREE.Object3D, lifts = false) {
  mesh.updateWorldMatrix(true, false);
  const center = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  mesh.matrixWorld.decompose(center, quat, scale);
  rec.orientedClips.push({
    center,
    quat,
    half: new THREE.Vector3(
      Math.abs(scale.x) * 0.5,
      Math.abs(scale.y) * 0.5,
      Math.abs(scale.z) * 0.5,
    ),
    lifts,
  });
}

interface MeshFlags {
  noShadow?: boolean;
  noCast?: boolean;
  name?: string;
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  clip?: boolean;
  collide?: boolean;
  /** Section cap follows the rigid roof lift. */
  lifts?: boolean;
  /** Section-cap tint for the floor assembly proof. Ignored unless colored caps are on. */
  capColor?: number;
  seg?: 4 | 6 | 8;
  low?: boolean;
}

interface WallRect {
  a0: number;
  a1: number;
  y0: number;
  y1: number;
}

interface OpeningSpan {
  a0: number;
  a1: number;
  y0: number;
  y1: number;
}

interface BoxItem {
  sx: number;
  sy: number;
  sz: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  rotX: number;
}

interface CylItem {
  r: number;
  h: number;
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotZ: number;
  rotY: number;
}

interface BatchFlushFlags {
  cast?: boolean;
  receive?: boolean;
  clip?: boolean;
  rec?: HouseRecord | null;
}

const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cyl4: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  sphere: new THREE.SphereGeometry(0.5, 14, 10),
  sphereLow: new THREE.SphereGeometry(0.5, 8, 6),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  coneLow: new THREE.ConeGeometry(0.5, 1, 7),
  plane: new THREE.PlaneGeometry(1, 1),
};

function makeBox(
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
) {
  const m = new THREE.Mesh(GEO.box, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function addBox(
  parent: THREE.Object3D,
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rec?: HouseRecord | null,
  flags: MeshFlags = {},
) {
  const m = makeBox(sx, sy, sz, x, y, z, mat);
  if (flags.noShadow) {
    m.castShadow = false;
    m.receiveShadow = false;
  }
  if (flags.noCast) m.castShadow = false;
  if (flags.name) m.name = flags.name;
  if (flags.rotY !== undefined) m.rotation.y = flags.rotY;
  if (flags.rotX !== undefined) m.rotation.x = flags.rotX;
  if (flags.rotZ !== undefined) m.rotation.z = flags.rotZ;
  parent.add(m);
  const hx = sx / 2,
    hy = sy / 2,
    hz = sz / 2;
  if (flags.clip && rec) {
    const box: {
      min: THREE.Vector3;
      max: THREE.Vector3;
      capColor?: number;
    } = {
      min: new THREE.Vector3(x - hx, y - hy, z - hz),
      max: new THREE.Vector3(x + hx, y + hy, z + hz),
    };
    if (flags.capColor !== undefined) box.capColor = flags.capColor;
    if (flags.lifts) rec.roofClipBoxes.push(box);
    else rec.clipBoxes.push(box);
  }
  if (flags.collide && rec) {
    rec.collisions.push({
      x0: x - hx,
      x1: x + hx,
      z0: z - hz,
      z1: z + hz,
      y0: y - hy,
      y1: y + hy,
    });
  }
  return m;
}

export function addCyl(
  parent: THREE.Object3D,
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: MeshFlags = {},
) {
  const geo = flags.seg === 6 ? GEO.cyl6 : flags.seg === 4 ? GEO.cyl4 : GEO.cyl;
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(r * 2, h, r * 2);
  m.position.set(x, y, z);
  if (flags.rotX) m.rotation.x = flags.rotX;
  if (flags.rotZ) m.rotation.z = flags.rotZ;
  if (flags.rotY) m.rotation.y = flags.rotY;
  m.castShadow = !flags.noShadow;
  m.receiveShadow = !flags.noShadow;
  parent.add(m);
  return m;
}

export function addSphere(
  parent: THREE.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: MeshFlags = {},
) {
  const m = new THREE.Mesh(flags.low ? GEO.sphereLow : GEO.sphere, mat);
  m.scale.setScalar(r * 2);
  m.position.set(x, y, z);
  m.castShadow = !flags.noShadow;
  m.receiveShadow = !flags.noShadow;
  parent.add(m);
  return m;
}

/** Subtract openings from a wall rectangle; return remaining solid rects in (a,y). */
export function solidRects(
  a0: number,
  a1: number,
  y0: number,
  y1: number,
  openings: OpeningSpan[] = [],
): WallRect[] {
  const ys = [y0, y1];
  for (const o of openings) {
    ys.push(o.y0, o.y1);
  }
  const uniq = [...new Set(ys.map((v) => +v.toFixed(5)))].sort((a, b) => a - b);
  const rects = [];
  for (let i = 0; i < uniq.length - 1; i++) {
    const ya = uniq[i]!;
    const yb = uniq[i + 1]!;
    if (yb - ya < 0.015) continue;
    if (ya < y0 - 1e-5 || yb > y1 + 1e-5) continue;
    const cuts: Array<[number, number]> = [];
    for (const o of openings) {
      if (o.y0 < yb - 1e-5 && o.y1 > ya + 1e-5) cuts.push([o.a0, o.a1]);
    }
    cuts.sort((p, q) => p[0] - q[0]);
    let x = a0;
    for (const [c0, c1] of cuts) {
      const cc0 = Math.max(c0, a0);
      const cc1 = Math.min(c1, a1);
      if (cc0 > x + 0.012) rects.push({ a0: x, a1: Math.min(cc0, a1), y0: ya, y1: yb });
      x = Math.max(x, cc1);
    }
    if (x < a1 - 0.012) rects.push({ a0: x, a1, y0: ya, y1: yb });
  }
  return rects;
}

/**
 * Build an axis-aligned wall from solid rects.
 * axis 'z' means the wall is constant-z (runs along x).
 * axis 'x' means constant-x (runs along z).
 */
export function buildWall(
  parent: THREE.Object3D,
  wall: {
    axis: "x" | "z";
    pos: number;
    a0: number;
    a1: number;
    y0: number;
    y1: number;
    t: number;
    openings?: OpeningSpan[];
  },
  mat: THREE.Material,
  rec?: HouseRecord | null,
  flags: MeshFlags = {},
) {
  const rects = solidRects(wall.a0, wall.a1, wall.y0, wall.y1, wall.openings || []);
  const t = wall.t;
  const meshes = [];
  for (const r of rects) {
    const sx = wall.axis === "z" ? r.a1 - r.a0 : t;
    const sz = wall.axis === "x" ? r.a1 - r.a0 : t;
    const sy = r.y1 - r.y0;
    const x = wall.axis === "z" ? (r.a0 + r.a1) / 2 : wall.pos;
    const z = wall.axis === "x" ? (r.a0 + r.a1) / 2 : wall.pos;
    const y = (r.y0 + r.y1) / 2;
    meshes.push(
      addBox(parent, sx, sy, sz, x, y, z, mat, rec, {
        clip: flags.clip !== false,
        collide: flags.collide,
        noCast: flags.noCast,
      }),
    );
  }
  return meshes;
}

/** Instanced-mesh collector for many similar boxes (studs, wires). */
export class BoxBatch {
  material: THREE.Material;
  name: string;
  items: BoxItem[];
  constructor(material: THREE.Material, name = "batch") {
    this.material = material;
    this.name = name;
    this.items = [];
  }
  add(
    sx: number,
    sy: number,
    sz: number,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    rotZ = 0,
    rotX = 0,
  ) {
    this.items.push({ sx, sy, sz, x, y, z, rotY, rotZ, rotX });
  }
  flush(
    parent: THREE.Object3D,
    { cast = true, receive = true, clip = false, rec = null }: BatchFlushFlags = {},
  ) {
    if (!this.items.length) return null;
    const mesh = new THREE.InstancedMesh(GEO.box, this.material, this.items.length);
    mesh.name = this.name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = false;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]!;
      e.set(it.rotX || 0, it.rotY || 0, it.rotZ || 0);
      q.setFromEuler(e);
      p.set(it.x, it.y, it.z);
      s.set(it.sx, it.sy, it.sz);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      if (clip && rec && !it.rotX && !it.rotY && !it.rotZ) {
        rec.clipBoxes.push({
          min: new THREE.Vector3(it.x - it.sx / 2, it.y - it.sy / 2, it.z - it.sz / 2),
          max: new THREE.Vector3(it.x + it.sx / 2, it.y + it.sy / 2, it.z + it.sz / 2),
        });
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }
}

export class CylBatch {
  material: THREE.Material;
  name: string;
  geo: THREE.CylinderGeometry;
  items: CylItem[];
  constructor(material: THREE.Material, name = "cyl", seg = 8) {
    this.material = material;
    this.name = name;
    this.geo = seg === 6 ? GEO.cyl6 : seg === 4 ? GEO.cyl4 : GEO.cyl;
    this.items = [];
  }
  add(r: number, h: number, x: number, y: number, z: number, rotX = 0, rotZ = 0, rotY = 0) {
    this.items.push({ r, h, x, y, z, rotX, rotZ, rotY });
  }
  flush(parent: THREE.Object3D, { cast = true, receive = false }: BatchFlushFlags = {}) {
    if (!this.items.length) return null;
    const mesh = new THREE.InstancedMesh(this.geo, this.material, this.items.length);
    mesh.name = this.name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = false;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const e = new THREE.Euler();
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]!;
      e.set(it.rotX, it.rotY, it.rotZ);
      q.setFromEuler(e);
      p.set(it.x, it.y, it.z);
      s.set(it.r * 2, it.h, it.r * 2);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }
}

export function runAlong(a0: number, a1: number, spacing: number, inset = 0): number[] {
  const start = a0 + inset;
  const end = a1 - inset;
  const span = end - start;
  if (span <= 0) return [];
  const n = Math.max(1, Math.round(span / spacing));
  const step = span / n;
  const out = [];
  for (let i = 0; i <= n; i++) out.push(start + i * step);
  return out;
}
