import * as THREE from "three";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";

type RoofKind = "gable" | "hip" | "shed";
type WallFace = "px" | "nx" | "pz" | "nz";
type Vec3 = readonly [number, number, number];

export function buildNeighbors(
  _scene: THREE.Scene,
  mats: Materials,
  rec: HouseRecord,
): THREE.Group {
  const g = new THREE.Group();
  g.name = "neighbors";
  // North across the canal
  neighbor(g, mats, -18, -28, 0.2, 12, 9, 5.2, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 4, -32, -0.1, 11, 10, 4.8, mats.neighborB, mats.neighborRoofB, "hip");
  neighbor(g, mats, 24, -26, 0.4, 13, 9, 5.0, mats.neighborC, mats.neighborRoof, "gable");
  // East
  neighbor(g, mats, 24, 2, -0.6, 11, 9, 4.6, mats.neighborB, mats.neighborRoof, "shed");
  neighbor(g, mats, 27, 16, 0.3, 10, 8, 4.4, mats.neighborA, mats.neighborRoofB, "gable");
  // West
  neighbor(g, mats, -24, 3, 0.5, 12, 9, 4.7, mats.neighborC, mats.neighborRoof, "gable");
  neighbor(g, mats, -26, 18, -0.2, 10, 8, 4.3, mats.neighborB, mats.neighborRoofB, "hip");
  // South across the street
  neighbor(g, mats, -8, 26, Math.PI, 12, 9, 4.5, mats.neighborA, mats.neighborRoof, "gable");
  neighbor(g, mats, 10, 28, Math.PI + 0.1, 11, 9, 4.4, mats.neighborC, mats.neighborRoofB, "shed");

  // far land masses / simple green banks
  const far = new THREE.Mesh(new THREE.BoxGeometry(80, 1.2, 24), mats.grass);
  far.position.set(-10, 0.2, -48);
  far.receiveShadow = true;
  far.castShadow = false;
  g.add(far);

  rec.neighbors = g;
  return g;
}

function unitHash(x: number, z: number) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function neighbor(
  parent: THREE.Object3D,
  mats: Materials,
  x: number,
  z: number,
  rotY: number,
  w: number,
  d: number,
  h: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
  kind: RoofKind,
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.name = "neighbor";
  const wallTop = h + 0.1;
  addShell(g, mats, w, d, h, wallMat);

  const winMat = new THREE.MeshStandardMaterial({
    color: 0x8ea4b4,
    roughness: 0.22,
    metalness: 0.06,
    emissive: 0xffc080,
    emissiveIntensity: 0,
  });
  const wins: THREE.Object3D[] = [];
  const doorSide = unitHash(x, z) > 0.5 ? 1 : -1;
  const doorX = doorSide * Math.min(w * 0.2, w / 2 - 1.35);
  addFacade(g, mats, winMat, wins, w, d, h, doorX);
  addDoor(g, mats, winMat, wins, doorX, d / 2);
  addPorch(g, mats, roofMat, doorX, d / 2, w);
  const peak = addRoof(g, mats, kind, w, d, wallTop, wallMat, roofMat);
  const chimX = -doorSide * w * 0.28;
  const chimZ = kind === "shed" ? -d * 0.16 : d * 0.04;
  addChimney(g, mats, chimX, chimZ, wallTop - 0.2, peak);

  g.userData.windows = wins;
  g.userData.winMat = winMat;
  parent.add(g);
}

function addShell(
  g: THREE.Group,
  mats: Materials,
  w: number,
  d: number,
  h: number,
  wallMat: THREE.Material,
) {
  addBox(g, w + 0.2, 0.42, d + 0.2, 0, 0.21, 0, mats.plinth, null, {});
  addBox(g, w + 0.06, 0.055, d + 0.06, 0, 0.44, 0, mats.concrete, null, { noCast: true });
  addBox(g, w, h, d, 0, h / 2 + 0.1, 0, wallMat, null, {});
  addBox(g, w + 0.04, 0.06, d + 0.04, 0, h * 0.5, 0, mats.plinth, null, { noCast: true });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(g, 0.07, h, 0.07, sx * (w / 2), h / 2 + 0.1, sz * (d / 2), mats.frame, null, {
        noCast: true,
      });
    }
  }
}

function addOpening(
  g: THREE.Group,
  mats: Materials,
  winMat: THREE.Material,
  wins: THREE.Object3D[],
  face: WallFace,
  u: number,
  y: number,
  wall: number,
  ww: number,
  hh: number,
) {
  const frame = mats.frame;
  if (face === "pz" || face === "nz") {
    const s = face === "pz" ? 1 : -1;
    const z = wall + s * 0.025;
    const pane = addBox(g, ww, hh, 0.03, u, y, z + s * 0.012, winMat, null, { noShadow: true });
    wins.push(pane);
    addBox(g, ww + 0.12, hh + 0.12, 0.04, u, y, z, frame, null, { noCast: true });
    addBox(g, 0.03, hh, 0.018, u, y, z + s * 0.03, frame, null, { noCast: true });
    addBox(g, ww, 0.028, 0.018, u, y, z + s * 0.03, frame, null, { noCast: true });
    addBox(g, ww + 0.18, 0.045, 0.1, u, y - hh / 2 - 0.02, z + s * 0.02, mats.concrete, null, {
      noCast: true,
    });
    return;
  }
  if (face === "px" || face === "nx") {
    const s = face === "px" ? 1 : -1;
    const x = wall + s * 0.025;
    const pane = addBox(g, 0.03, hh, ww, x + s * 0.012, y, u, winMat, null, { noShadow: true });
    wins.push(pane);
    addBox(g, 0.04, hh + 0.12, ww + 0.12, x, y, u, frame, null, { noCast: true });
    addBox(g, 0.018, hh, 0.03, x + s * 0.03, y, u, frame, null, { noCast: true });
    addBox(g, 0.018, 0.028, ww, x + s * 0.03, y, u, frame, null, { noCast: true });
    addBox(g, 0.1, 0.045, ww + 0.18, x + s * 0.02, y - hh / 2 - 0.02, u, mats.concrete, null, {
      noCast: true,
    });
    return;
  }
  const _never: never = face;
  throw new Error(`Unhandled wall face ${_never}`);
}

function addFacade(
  g: THREE.Group,
  mats: Materials,
  winMat: THREE.Material,
  wins: THREE.Object3D[],
  w: number,
  d: number,
  h: number,
  doorX: number,
) {
  const cols = w >= 12 ? 4 : 3;
  const margin = 1.2;
  const span = w - margin * 2;
  const yLo = 1.55;
  const yHi = h - 1.15;
  const upper = yHi > yLo + 1.2;
  for (let i = 0; i < cols; i++) {
    const x = -w / 2 + margin + (i * span) / (cols - 1);
    const blocked = Math.abs(x - doorX) < 0.95;
    if (!blocked) {
      addOpening(g, mats, winMat, wins, "pz", x, yLo, d / 2, 0.92, 1.08);
      addOpening(g, mats, winMat, wins, "nz", x, yLo, -d / 2, 0.92, 1.08);
    }
    if (upper) {
      addOpening(g, mats, winMat, wins, "pz", x, yHi, d / 2, 0.86, 0.86);
      addOpening(g, mats, winMat, wins, "nz", x, yHi, -d / 2, 0.86, 0.86);
    }
  }
  const sideCols = d >= 9.5 ? 2 : 1;
  const sideMargin = 1.45;
  const sideSpan = d - sideMargin * 2;
  for (let i = 0; i < sideCols; i++) {
    const z =
      -d / 2 + sideMargin + (sideCols === 1 ? sideSpan / 2 : (i * sideSpan) / (sideCols - 1));
    for (const face of ["px", "nx"] as const) {
      const wall = face === "px" ? w / 2 : -w / 2;
      addOpening(g, mats, winMat, wins, face, z, yLo, wall, 0.84, 1.02);
      if (upper) addOpening(g, mats, winMat, wins, face, z, yHi, wall, 0.8, 0.8);
    }
  }
}

function addDoor(
  g: THREE.Group,
  mats: Materials,
  winMat: THREE.Material,
  wins: THREE.Object3D[],
  x: number,
  zWall: number,
) {
  const z = zWall + 0.03;
  addBox(g, 1.08, 2.36, 0.04, x, 1.22, z - 0.012, mats.frame, null, { noCast: true });
  addBox(g, 0.88, 2.08, 0.055, x, 1.12, z, mats.woodDark, null, {});
  const transom = addBox(g, 0.88, 0.26, 0.03, x, 2.3, z + 0.012, winMat, null, { noShadow: true });
  wins.push(transom);
  addBox(g, 0.04, 0.08, 0.03, x + 0.32, 1.08, z + 0.04, mats.steel, null, { noCast: true });
}

function addPorch(
  g: THREE.Group,
  mats: Materials,
  roofMat: THREE.Material,
  doorX: number,
  zWall: number,
  w: number,
) {
  const pw = Math.min(3.5, Math.max(2.5, w * 0.34));
  const pd = 1.35;
  const zc = zWall + pd / 2 + 0.04;
  addBox(g, pw, 0.1, pd, doorX, 0.07, zc, mats.deck, null, {});
  addBox(g, pw * 0.72, 0.06, 0.32, doorX, 0.03, zWall + pd + 0.16, mats.concrete, null, {
    noCast: true,
  });
  const postZ = zWall + pd - 0.1;
  for (const s of [-1, 1]) {
    addCyl(g, 0.065, 2.4, doorX + s * (pw / 2 - 0.14), 1.2, postZ, mats.woodDark);
  }
  addBox(g, pw - 0.16, 0.1, 0.1, doorX, 2.38, postZ, mats.woodDark, null, {});
  addBox(g, pw - 0.2, 0.08, 0.08, doorX, 2.36, zWall + 0.08, mats.woodDark, null, { noCast: true });
  const roof = addBox(g, pw + 0.5, 0.07, pd + 0.4, doorX, 2.55, zc - 0.02, roofMat, null, {});
  roof.rotation.x = -0.07;
  addBox(g, pw + 0.55, 0.1, 0.06, doorX, 2.46, zWall + pd + 0.12, mats.fascia, null, {});
  addCyl(g, 0.055, 0.05, doorX, 2.28, zWall + 0.16, mats.pathLight, { noShadow: true });
}

function addRoof(
  g: THREE.Group,
  mats: Materials,
  kind: RoofKind,
  w: number,
  d: number,
  wallTop: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
) {
  switch (kind) {
    case "gable":
      return addGable(g, mats, w, d, wallTop, wallMat, roofMat);
    case "hip":
      return addHip(g, mats, w, d, wallTop, roofMat);
    case "shed":
      return addShed(g, mats, w, d, wallTop, wallMat, roofMat);
    default: {
      const _never: never = kind;
      throw new Error(`Unhandled roof ${_never}`);
    }
  }
}

function addGable(
  g: THREE.Group,
  mats: Materials,
  w: number,
  d: number,
  wallTop: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
) {
  const pitch = 0.42;
  const ohZ = 0.4;
  const half = d / 2 + ohZ;
  const slopeLen = half / Math.cos(pitch);
  const rise = Math.tan(pitch) * half;
  const ridgeY = wallTop + rise;
  for (const sign of [-1, 1]) {
    const slope = addBox(
      g,
      w + 0.55,
      0.11,
      slopeLen,
      0,
      (wallTop + ridgeY) / 2,
      (sign * half) / 2,
      roofMat,
      null,
      {},
    );
    slope.rotation.x = -sign * pitch;
    for (const side of [-1, 1]) {
      const rake = addBox(
        g,
        0.07,
        0.1,
        slopeLen,
        side * (w / 2 + 0.3),
        (wallTop + ridgeY) / 2,
        (sign * half) / 2,
        mats.fascia,
        null,
        {},
      );
      rake.rotation.x = -sign * pitch;
    }
    addBox(g, w + 0.7, 0.16, 0.07, 0, wallTop + 0.02, sign * half, mats.fascia, null, {});
  }
  addBox(g, w + 0.35, 0.07, 0.16, 0, ridgeY + 0.04, 0, mats.fascia, null, {});
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.03);
    addDoubleTri(
      g,
      [x, wallTop, -half + 0.05],
      [x, wallTop, half - 0.05],
      [x, ridgeY - 0.06, 0],
      wallMat,
    );
  }
  return ridgeY;
}

function addHip(
  parent: THREE.Object3D,
  mats: Materials,
  w: number,
  d: number,
  wallTop: number,
  roofMat: THREE.Material,
): number {
  if (d > w) {
    const spin = new THREE.Group();
    spin.rotation.y = Math.PI / 2;
    parent.add(spin);
    return addHip(spin, mats, d, w, wallTop, roofMat);
  }
  const oh = 0.42;
  const hw = w / 2 + oh;
  const hd = d / 2 + oh;
  const rise = Math.tan(0.4) * hd;
  const y0 = wallTop;
  const y1 = wallTop + rise;
  const rx = Math.max(0.2, hw - hd);
  const buf: number[] = [];
  pushTri(buf, [-hw, y0, hd], [hw, y0, hd], [rx, y1, 0]);
  pushTri(buf, [-hw, y0, hd], [rx, y1, 0], [-rx, y1, 0]);
  pushTri(buf, [hw, y0, -hd], [-hw, y0, -hd], [-rx, y1, 0]);
  pushTri(buf, [hw, y0, -hd], [-rx, y1, 0], [rx, y1, 0]);
  pushTri(buf, [hw, y0, hd], [hw, y0, -hd], [rx, y1, 0]);
  pushTri(buf, [-hw, y0, -hd], [-hw, y0, hd], [-rx, y1, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(buf, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, roofMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  addBox(parent, hw * 2, 0.11, 0.07, 0, y0, hd, mats.fascia, null, {});
  addBox(parent, hw * 2, 0.11, 0.07, 0, y0, -hd, mats.fascia, null, {});
  addBox(parent, 0.07, 0.11, hd * 2, hw, y0, 0, mats.fascia, null, {});
  addBox(parent, 0.07, 0.11, hd * 2, -hw, y0, 0, mats.fascia, null, {});
  addBox(parent, rx * 2 + 0.3, 0.07, 0.16, 0, y1 + 0.03, 0, mats.fascia, null, {});
  return y1;
}

function addShed(
  g: THREE.Group,
  mats: Materials,
  w: number,
  d: number,
  wallTop: number,
  wallMat: THREE.Material,
  roofMat: THREE.Material,
) {
  const pitch = 0.24;
  const ohX = 0.34;
  const ohZ = 0.4;
  const run = d + ohZ * 2;
  const slopeLen = run / Math.cos(pitch);
  const rise = Math.tan(pitch) * run;
  const slab = addBox(g, w + ohX * 2, 0.1, slopeLen, 0, wallTop + rise / 2, 0, roofMat, null, {});
  slab.rotation.x = pitch;
  addBox(g, w + 0.08, rise, 0.08, 0, wallTop + rise / 2, -(d / 2) - 0.02, wallMat, null, {});
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.03);
    addDoubleTri(
      g,
      [x, wallTop, d / 2 + ohZ],
      [x, wallTop, -(d / 2 + ohZ)],
      [x, wallTop + rise - 0.04, -(d / 2 + ohZ)],
      wallMat,
    );
  }
  addBox(g, w + ohX * 2 + 0.08, 0.16, 0.07, 0, wallTop - 0.01, d / 2 + ohZ, mats.fascia, null, {});
  addBox(
    g,
    w + ohX * 2 + 0.08,
    0.14,
    0.07,
    0,
    wallTop + rise - 0.02,
    -(d / 2 + ohZ),
    mats.fascia,
    null,
    {},
  );
  return wallTop + rise;
}

function addChimney(
  g: THREE.Group,
  mats: Materials,
  x: number,
  z: number,
  baseY: number,
  peakY: number,
) {
  const top = peakY + 0.55;
  const height = Math.max(0.8, top - baseY);
  addBox(g, 0.58, height, 0.58, x, baseY + height / 2, z, mats.plinth, null, {});
  addBox(g, 0.82, 0.07, 0.82, x, top + 0.02, z, mats.concrete, null, {});
  addBox(g, 0.28, 0.18, 0.28, x, top + 0.13, z, mats.woodDark, null, {});
}

function pushTri(buf: number[], a: Vec3, b: Vec3, c: Vec3) {
  buf.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}

function addDoubleTri(parent: THREE.Object3D, a: Vec3, b: Vec3, c: Vec3, mat: THREE.Material) {
  const buf: number[] = [];
  pushTri(buf, a, b, c);
  pushTri(buf, a, c, b);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(buf, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function setNeighborGlow(neighbors: THREE.Object3D, amount: number) {
  if (!neighbors) return;
  neighbors.traverse((o) => {
    if (o.userData && o.userData.winMat) {
      o.userData.winMat.emissiveIntensity = amount * 0.7;
    }
  });
}
