import * as THREE from "three";

interface FormFlags {
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  noCast?: boolean;
  noShadow?: boolean;
}

const geos = new Map<string, THREE.BufferGeometry>();

function q(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function cached(key: string, build: () => THREE.BufferGeometry): THREE.BufferGeometry {
  const hit = geos.get(key);
  if (hit) return hit;
  const geo = build();
  geo.computeVertexNormals();
  geos.set(key, geo);
  return geo;
}

function place(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  if (flags.rotX) mesh.rotation.x = flags.rotX;
  if (flags.rotY) mesh.rotation.y = flags.rotY;
  if (flags.rotZ) mesh.rotation.z = flags.rotZ;
  const shadow = flags.noShadow !== true;
  mesh.castShadow = shadow && flags.noCast !== true;
  mesh.receiveShadow = shadow;
  parent.add(mesh);
  return mesh;
}

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001));
  shape.moveTo(x + rr, y);
  shape.lineTo(x + w - rr, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + rr);
  shape.lineTo(x + w, y + h - rr);
  shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  shape.lineTo(x + rr, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - rr);
  shape.lineTo(x, y + rr);
  shape.quadraticCurveTo(x, y, x + rr, y);
  return shape;
}

function archShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  const rr = Math.max(0.001, Math.min(r, w * 0.48, h * 0.46));
  shape.moveTo(x0, y0);
  shape.lineTo(x0, y0 + h - rr);
  shape.quadraticCurveTo(x0, y0 + h, x0 + rr, y0 + h);
  shape.lineTo(x0 + w - rr, y0 + h);
  shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w, y0 + h - rr);
  shape.lineTo(x0 + w, y0);
  shape.closePath();
  return shape;
}

function extrude(shape: THREE.Shape, thick: number, bevel: number): THREE.BufferGeometry {
  const bevelThickness = Math.min(bevel * 0.55, thick * 0.28);
  const useBevel = bevelThickness > 0.003 && thick > bevelThickness * 2 + 0.004;
  const depth = useBevel ? thick - bevelThickness * 2 : thick;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: useBevel,
    bevelThickness: useBevel ? bevelThickness : 0,
    bevelSize: useBevel ? Math.min(bevel, thick * 0.45) : 0,
    bevelSegments: 3,
    curveSegments: 6,
    steps: 1,
  });
  const total = depth + (useBevel ? bevelThickness * 2 : 0);
  geo.translate(0, 0, -total / 2);
  return geo;
}

/** Horizontal soft slab. Thickness is Y, footprint is X by Z. */
export function addCushion(
  parent: THREE.Object3D,
  w: number,
  thick: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const bevel = Math.min(0.05, thick * 0.42, w * 0.2, d * 0.2);
  const geo = cached(`cush:${q(w)}:${q(thick)}:${q(d)}:${q(bevel)}`, () => {
    const g = extrude(roundedRect(w, d, Math.max(0.004, bevel * 1.2)), thick, bevel);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  return place(parent, geo, x, y, z, mat, flags);
}

/** Vertical panel, width X, height Y, thickness Z. */
export function addPanel(
  parent: THREE.Object3D,
  w: number,
  h: number,
  thick: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const bevel = Math.min(0.012, thick * 0.4, w * 0.08, h * 0.08);
  const geo = cached(`panel:${q(w)}:${q(h)}:${q(thick)}:${q(bevel)}`, () =>
    extrude(roundedRect(w, h, Math.max(0.003, bevel)), thick, bevel),
  );
  return place(parent, geo, x, y, z, mat, flags);
}

/** Upholstered panel with a rounded top. Width X, height Y, thickness Z. */
export function addArch(
  parent: THREE.Object3D,
  w: number,
  h: number,
  thick: number,
  radius: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(`arch:${q(w)}:${q(h)}:${q(thick)}:${q(radius)}`, () =>
    extrude(archShape(w, h, radius), thick, Math.min(0.012, thick * 0.3)),
  );
  return place(parent, geo, x, y, z, mat, flags);
}

/** Squashed sphere. Reads as a pillow from plan and elevation. */
export function addPillow(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached("pillow", () => new THREE.SphereGeometry(0.5, 16, 12));
  const mesh = place(parent, geo, x, y, z, mat, flags);
  mesh.scale.set(w, h, d);
  return mesh;
}

/** Cylinder lying along local X. */
export function addRoll(
  parent: THREE.Object3D,
  radius: number,
  length: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(`roll:${q(radius)}:${q(length)}`, () => {
    const g = new THREE.CylinderGeometry(radius, radius, length, 12);
    g.rotateZ(Math.PI / 2);
    return g;
  });
  return place(parent, geo, x, y, z, mat, flags);
}

export function addTaper(
  parent: THREE.Object3D,
  rTop: number,
  rBot: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(
    `tap:${q(rTop)}:${q(rBot)}:${q(h)}`,
    () => new THREE.CylinderGeometry(rTop, rBot, h, 12),
  );
  return place(parent, geo, x, y, z, mat, flags);
}

/** Apex toward +Y, base toward -Y. */
export function addCone(
  parent: THREE.Object3D,
  radius: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(`cone:${q(radius)}:${q(h)}`, () => new THREE.ConeGeometry(radius, h, 14));
  return place(parent, geo, x, y, z, mat, flags);
}

export function addBowl(
  parent: THREE.Object3D,
  radius: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(`bowl:${q(radius)}`, () => {
    const pts = [
      new THREE.Vector2(radius * 0.08, 0),
      new THREE.Vector2(radius * 0.9, 0),
      new THREE.Vector2(radius, radius * 0.16),
      new THREE.Vector2(radius * 0.82, radius * 0.4),
      new THREE.Vector2(radius * 0.5, radius * 0.46),
    ];
    return new THREE.LatheGeometry(pts, 14);
  });
  return place(parent, geo, x, y, z, mat, flags);
}

/** Flat ring in the XZ plane. */
export function addRing(
  parent: THREE.Object3D,
  radius: number,
  tube: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  flags: FormFlags = {},
): THREE.Mesh {
  const geo = cached(`ring:${q(radius)}:${q(tube)}`, () => {
    const g = new THREE.TorusGeometry(radius, tube, 6, 16);
    g.rotateX(Math.PI / 2);
    return g;
  });
  return place(parent, geo, x, y, z, mat, flags);
}
