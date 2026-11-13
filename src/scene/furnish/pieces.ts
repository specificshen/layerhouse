import * as THREE from "three";
import { addBox, addCyl, addSphere } from "../geom";
import type { Materials } from "../materials";
import type { HouseRecord } from "../../types";
import {
  addArch,
  addBowl,
  addCushion,
  addPanel,
  addPillow,
  addRing,
  addRoll,
  addTaper,
} from "./forms";
import type { FurnishPalette } from "./palette";

function legs(
  parent: THREE.Object3D,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  height: number,
  mat: THREE.Material,
  rTop = 0.026,
  rBot = 0.015,
) {
  for (const x of [x0, x1]) {
    for (const z of [z0, z1]) {
      addTaper(parent, rTop, rBot, height, x, height / 2, z, mat);
    }
  }
}

function lounge(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const n = len > 1.5 ? 3 : 1;
  const armT = 0.12;
  legs(g, -len / 2 + 0.1, -0.28, len / 2 - 0.1, 0.3, 0.15, pal.walnut, 0.03, 0.016);
  addBox(g, len - 0.2, 0.045, 0.58, 0, 0.17, 0.0, pal.oakDark, rec, {});
  addCushion(g, len - 0.26, 0.028, 0.6, 0, 0.21, 0.03, pal.oak, { noCast: true });

  const inner = len - armT * 2 - 0.04;
  const seatW = inner / n;
  for (let i = 0; i < n; i++) {
    const px = -inner / 2 + seatW / 2 + i * seatW;
    addCushion(g, seatW - 0.03, 0.15, 0.6, px, 0.325, 0.06, pal.fabric);
    addCushion(g, seatW - 0.045, 0.4, 0.13, px, 0.56, -0.2, pal.moss, { rotX: -0.42 });
  }
  addBox(g, len - 0.22, 0.4, 0.04, 0, 0.46, -0.34, pal.oakDark, rec, {});
  addRoll(g, 0.038, len - 0.28, 0, 0.72, -0.33, pal.walnut);

  for (const sx of [-1, 1]) {
    addArch(g, armT, 0.36, 0.66, 0.07, sx * (len / 2 - armT / 2), 0.36, 0.02, pal.moss);
  }
  if (n > 1) {
    addPillow(g, 0.34, 0.2, 0.16, -len * 0.18, 0.48, 0.12, pal.rust, { rotY: 0.35, rotZ: 0.18 });
    addPillow(g, 0.28, 0.16, 0.14, len * 0.16, 0.46, 0.05, pal.sham, { rotY: -0.5, rotZ: -0.1 });
    const throwFold = addCushion(g, 0.42, 0.028, 0.32, len * 0.22, 0.43, 0.12, pal.sand, {
      noCast: true,
    });
    throwFold.rotation.y = -0.35;
    throwFold.rotation.z = 0.12;
  }
  parent.add(g);
}

export function sofa(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len = 2.4,
) {
  lounge(parent, pal, rec, x, y, z, rotY, len);
}

export function armchair(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  lounge(parent, pal, rec, x, y, z, rotY, 0.82);
}

type TableStyle = "plain" | "coffee" | "dining";

export function table(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h = 0.74,
  mat?: THREE.Material,
  style: TableStyle = "plain",
) {
  const topMat = mat ?? pal.oak;
  addCushion(parent, w, 0.04, d, x, y + h, z, topMat);
  const legH = h - 0.02;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addTaper(
        parent,
        0.028,
        0.015,
        legH,
        x + sx * (w / 2 - 0.08),
        y + legH / 2,
        z + sz * (d / 2 - 0.08),
        pal.walnut,
      );
    }
  }
  switch (style) {
    case "plain":
      break;
    case "coffee":
      addCushion(parent, w - 0.16, 0.018, d - 0.12, x, y + 0.16, z, pal.oakDark, { noCast: true });
      addCushion(parent, 0.22, 0.022, 0.15, x - 0.14, y + h + 0.032, z + 0.05, pal.rust, {
        noCast: true,
      });
      addCushion(parent, 0.16, 0.018, 0.12, x - 0.1, y + h + 0.05, z + 0.01, pal.sage, {
        noCast: true,
      });
      addBowl(parent, 0.08, x + 0.2, y + h + 0.02, z - 0.06, pal.clay, { noCast: true });
      break;
    case "dining":
      addCushion(parent, w * 0.62, 0.01, 0.26, x, y + h + 0.028, z, pal.sand, { noCast: true });
      addBowl(parent, 0.1, x, y + h + 0.015, z, pal.clay, { noCast: true });
      addCyl(parent, 0.014, 0.07, x - 0.32, y + h + 0.06, z, pal.sham, { noShadow: true });
      addCyl(parent, 0.014, 0.07, x + 0.32, y + h + 0.06, z, pal.sham, { noShadow: true });
      break;
    default: {
      const unexpected: never = style;
      return unexpected;
    }
  }
}

export function chair(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  legs(g, -0.16, -0.16, 0.16, 0.16, 0.44, pal.walnut, 0.016, 0.011);
  addCushion(g, 0.4, 0.045, 0.4, 0, 0.47, 0, pal.oak);
  const back = addArch(g, 0.34, 0.34, 0.03, 0.1, 0, 0.72, -0.16, pal.oak);
  back.rotation.x = -0.14;
  parent.add(g);
}

export function bed(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  king = false,
) {
  const w = king ? 1.9 : 1.5;
  const d = king ? 2.1 : 2.0;
  const duvetMat = king ? pal.sage : pal.sand;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  const headZ = -d / 2 + 0.04;
  const footZ = d / 2 - 0.04;
  legs(g, -w / 2 + 0.1, headZ + 0.08, w / 2 - 0.1, footZ - 0.06, 0.14, pal.walnut, 0.032, 0.018);
  addBox(g, 0.045, 0.08, d - 0.22, -w / 2 + 0.04, 0.2, 0.02, pal.oakDark, rec, {});
  addBox(g, 0.045, 0.08, d - 0.22, w / 2 - 0.04, 0.2, 0.02, pal.oakDark, rec, {});
  addBox(g, w - 0.06, 0.06, 0.045, 0, 0.2, headZ + 0.04, pal.oakDark, rec, {});
  addBox(g, w - 0.06, 0.06, 0.045, 0, 0.2, footZ - 0.02, pal.oakDark, rec, {});
  addCushion(g, w - 0.08, 0.035, d - 0.26, 0, 0.25, 0.02, pal.oakDark, { noCast: true });
  addCushion(g, w - 0.1, 0.15, d - 0.32, 0, 0.34, 0.03, pal.linen);

  addArch(g, w + 0.08, 0.74, 0.055, 0.2, 0, 0.54, headZ, pal.oakDark);
  addArch(g, w * 0.7, 0.46, 0.022, 0.12, 0, 0.5, headZ + 0.04, duvetMat, { noCast: true });
  for (const sx of [-1, 1]) {
    addPanel(g, 0.24, 0.42, 0.04, sx * (w / 2 - 0.02), 0.4, headZ + 0.14, pal.oakDark, {
      rotY: Math.PI / 2,
    });
  }
  addPanel(g, w - 0.02, 0.18, 0.04, 0, 0.3, footZ, pal.oakDark);

  const shamW = w * 0.34;
  const sleepW = w * 0.26;
  addPillow(g, shamW, 0.16, 0.34, -w * 0.18, 0.5, headZ + 0.32, pal.sham, { rotZ: 0.08 });
  addPillow(g, shamW, 0.15, 0.32, w * 0.18, 0.49, headZ + 0.3, pal.sham, { rotZ: -0.06 });
  addPillow(g, sleepW, 0.13, 0.26, -w * 0.16, 0.52, headZ + 0.52, pal.sheet, { rotY: 0.12 });
  addPillow(g, sleepW, 0.12, 0.24, w * 0.16, 0.51, headZ + 0.5, pal.sheet, { rotY: -0.1 });

  addCushion(g, w - 0.18, 0.02, 0.34, 0, 0.425, headZ + 0.72, pal.sheet, { noCast: true });
  addCushion(g, w - 0.12, 0.08, d * 0.48, 0, 0.47, d * 0.1, duvetMat);
  addCushion(g, w - 0.18, 0.03, 0.24, 0, 0.525, d * 0.1 - 0.22, pal.sheet, { noCast: true });
  addRoll(g, 0.058, w - 0.2, 0, 0.56, d * 0.1 - 0.05, duvetMat);

  parent.add(g);
}

export function nightstand(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const w = 0.46;
  const d = 0.38;
  legs(g, -w / 2 + 0.05, -d / 2 + 0.05, w / 2 - 0.05, d / 2 - 0.05, 0.1, pal.walnut, 0.02, 0.012);
  addBox(g, w - 0.04, 0.3, d - 0.06, 0, 0.28, -0.01, pal.oakDark, rec, {});
  addPanel(g, w - 0.07, 0.13, 0.016, 0, 0.24, d / 2 - 0.01, pal.oak);
  addPanel(g, w - 0.07, 0.12, 0.016, 0, 0.39, d / 2 - 0.01, pal.oak);
  addCyl(g, 0.008, 0.08, 0, 0.24, d / 2 + 0.012, pal.metal, { rotZ: Math.PI / 2, noShadow: true });
  addCyl(g, 0.008, 0.08, 0, 0.39, d / 2 + 0.012, pal.metal, { rotZ: Math.PI / 2, noShadow: true });
  addCushion(g, w + 0.04, 0.028, d + 0.02, 0, 0.46, 0, pal.oak);
  parent.add(g);
}

export function desk(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  w = 1.6,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addCushion(g, w, 0.035, 0.66, 0, 0.74, 0, pal.oak);
  for (const sx of [-1, 1]) {
    const px = sx * (w / 2 - 0.24);
    addBox(g, 0.38, 0.66, 0.52, px, 0.36, 0.02, pal.oakDark, rec, {});
    for (let i = 0; i < 3; i++) {
      const yy = 0.16 + i * 0.2;
      addPanel(g, 0.34, 0.16, 0.016, px, yy, -0.25, pal.oak);
      addCyl(g, 0.007, 0.07, px, yy, -0.27, pal.metal, { rotZ: Math.PI / 2, noShadow: true });
    }
  }
  addTaper(g, 0.012, 0.02, 0.08, 0.05, 0.8, -0.16, pal.metal, { noShadow: true });
  addPanel(g, 0.48, 0.3, 0.018, 0, 0.98, -0.2, pal.ink);
  addPanel(g, 0.44, 0.26, 0.01, 0, 0.98, -0.186, pal.screen, { noCast: true, noShadow: true });
  addCushion(g, 0.28, 0.012, 0.1, 0.02, 0.77, -0.02, pal.ink, { noCast: true });
  parent.add(g);
}

interface CabinetOpts {
  upper?: boolean;
  top?: boolean;
  topMat?: THREE.Material;
  sinkAt?: number;
  books?: boolean;
}

export function cabinetRun(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len: number,
  h: number,
  d = 0.58,
  opts: CabinetOpts = {},
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const upper = opts.upper === true;
  const kick = upper ? 0 : 0.1;
  const bodyH = h - kick;
  const bodyY = kick + bodyH / 2;
  addBox(g, 0.018, bodyH, d - 0.02, -len / 2 + 0.01, bodyY, 0, pal.oakDark, rec, {});
  addBox(g, 0.018, bodyH, d - 0.02, len / 2 - 0.01, bodyY, 0, pal.oakDark, rec, {});
  addBox(g, len - 0.02, 0.02, d - 0.04, 0, kick + 0.012, 0, pal.oakDark, rec, { noCast: true });
  addBox(g, len - 0.03, bodyH - 0.02, 0.016, 0, bodyY, -d / 2 + 0.012, pal.oakDark, rec, {
    noCast: true,
  });
  if (!upper) {
    addBox(g, len - 0.06, kick - 0.015, 0.02, 0, kick / 2, -d / 2 + 0.02, pal.ink, rec, {
      noCast: true,
    });
  }

  const n = Math.max(1, Math.round(len / (upper ? 0.42 : 0.48)));
  const bay = len / n;
  const doorH = bodyH - 0.05;
  const doorY = kick + 0.025 + doorH / 2;
  for (let i = 0; i < n; i++) {
    const px = -len / 2 + bay * (i + 0.5);
    addPanel(g, bay - 0.014, doorH, 0.016, px, doorY, d / 2 + 0.004, pal.oak);
    const hand = px + (i % 2 === 0 ? 1 : -1) * bay * 0.28;
    addCyl(g, 0.007, Math.min(0.12, doorH * 0.28), hand, doorY, d / 2 + 0.018, pal.metal, {
      rotZ: Math.PI / 2,
      noShadow: true,
    });
  }

  if (upper) {
    addBox(g, len, 0.02, d, 0, h - 0.012, 0, pal.oak, rec, { noCast: true });
  } else if (opts.top !== false) {
    addCushion(g, len + 0.05, 0.04, d + 0.06, 0, h + 0.02, 0.015, opts.topMat ?? pal.stone);
  }

  if (opts.sinkAt !== undefined) {
    const sx = opts.sinkAt;
    addCyl(g, 0.15, 0.04, sx, h + 0.03, 0.04, pal.ink, { noShadow: true });
    addCyl(g, 0.012, 0.2, sx, h + 0.14, -d * 0.22, mats.steel, { noShadow: true });
    addCyl(g, 0.01, 0.16, sx, h + 0.22, -d * 0.05, mats.steel, {
      rotX: Math.PI / 2,
      noShadow: true,
    });
  }

  if (opts.books) {
    const tones = [pal.rust, pal.moss, pal.oakDark, pal.sage, pal.sand];
    let cursor = -len / 2 + 0.18;
    let i = 0;
    while (cursor < len / 2 - 0.2 && i < 6) {
      const bw = 0.06 + (i % 3) * 0.012;
      const bh = 0.07 + (i % 2) * 0.02;
      const tone = tones[i % tones.length] ?? pal.oakDark;
      addBox(g, bw, bh, 0.16, cursor, h + 0.04 + bh / 2, 0.02, tone, rec, { noCast: true });
      cursor += bw + 0.02;
      i += 1;
    }
  }

  parent.add(g);
  return g;
}

export function island(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
) {
  const h = 0.88;
  cabinetRun(parent, pal, mats, rec, x, y, z, 0, w, h, d, { top: true, topMat: pal.stone });
  addCushion(parent, 0.5, 0.018, 0.44, x, y + h + 0.05, z - 0.06, pal.ink, { noCast: true });
  for (const sx of [-0.12, 0.12]) {
    for (const sz of [-0.1, 0.08]) {
      addRing(parent, 0.055, 0.007, x + sx, y + h + 0.064, z - 0.06 + sz, pal.metal, {
        noCast: true,
        noShadow: true,
      });
    }
  }
  addCushion(parent, 0.32, 0.016, 0.22, x + 0.42, y + h + 0.05, z + 0.16, pal.oak, {
    noCast: true,
  });
  addBowl(parent, 0.07, x + 0.46, y + h + 0.05, z + 0.16, pal.clay, { noCast: true });
  for (const sz of [-0.16, 0.18]) {
    stool(parent, pal, mats, x - w / 2 - 0.34, y, z + sz);
  }
}

function stool(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  x: number,
  y: number,
  z: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addTaper(g, 0.012, 0.009, 0.6, sx * 0.11, 0.3, sz * 0.11, mats.steel, {
        rotZ: -sx * 0.06,
        rotX: sz * 0.06,
        noShadow: true,
      });
    }
  }
  addRing(g, 0.13, 0.006, 0, 0.16, 0, mats.steel, { noShadow: true, noCast: true });
  addCyl(g, 0.16, 0.035, 0, 0.62, 0, pal.oak);
  addCushion(g, 0.3, 0.03, 0.3, 0, 0.65, 0, pal.moss, { noCast: true });
  parent.add(g);
}

export function fridge(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const w = 0.74;
  const h = 1.86;
  const d = 0.66;
  addBox(g, w - 0.06, 0.08, d - 0.08, 0, 0.04, 0, pal.ink, rec, {});
  addBox(g, w - 0.04, h - 0.16, d - 0.05, 0, 0.08 + (h - 0.16) / 2, -0.01, pal.appliance, rec, {});
  const split = 0.62;
  addPanel(g, w - 0.06, split - 0.04, 0.02, 0, 0.12 + (split - 0.04) / 2, d / 2, pal.appliance);
  addPanel(
    g,
    w - 0.06,
    h - split - 0.16,
    0.02,
    0,
    split + 0.06 + (h - split - 0.16) / 2,
    d / 2,
    pal.appliance,
  );
  addCyl(g, 0.008, 0.28, w * 0.32, 0.38, d / 2 + 0.02, pal.metal, { noShadow: true });
  addCyl(g, 0.008, 0.42, w * 0.32, 1.15, d / 2 + 0.02, pal.metal, { noShadow: true });
  addBox(g, w - 0.1, 0.03, 0.012, 0, h - 0.06, d / 2 - 0.01, pal.ink, rec, { noCast: true });
  parent.add(g);
}

export function hood(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  floorY: number,
  z: number,
) {
  addCushion(parent, 0.9, 0.07, 0.56, x, floorY + 2.02, z, pal.metal);
  addCushion(parent, 0.58, 0.1, 0.36, x, floorY + 2.14, z, pal.ink);
  addBox(parent, 0.32, 0.48, 0.26, x, floorY + 2.4, z, pal.metal, rec, {});
  addSphere(parent, 0.04, x, floorY + 1.96, z, mats.lampBulb, { noShadow: true });
}

export function bench(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  legs(g, -len / 2 + 0.08, -0.12, len / 2 - 0.08, 0.12, 0.38, pal.walnut, 0.02, 0.012);
  addCushion(g, len, 0.035, 0.34, 0, 0.42, 0, pal.oak);
  addCushion(g, len - 0.08, 0.045, 0.28, 0, 0.46, 0, pal.moss, { noCast: true });
  parent.add(g);
}

export function plant(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  x: number,
  y: number,
  z: number,
) {
  addTaper(parent, 0.11, 0.08, 0.16, x, y + 0.08, z, pal.clay);
  addCushion(parent, 0.16, 0.02, 0.16, x, y + 0.17, z, pal.oakDark, { noCast: true });
  addPillow(parent, 0.28, 0.22, 0.26, x, y + 0.34, z, pal.leaf, { noCast: true });
  addPillow(parent, 0.18, 0.16, 0.18, x + 0.08, y + 0.42, z + 0.04, pal.leaf, { noCast: true });
  addPillow(parent, 0.14, 0.12, 0.14, x - 0.07, y + 0.4, z - 0.02, pal.leaf, { noCast: true });
}

export function bookcase(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  w = 1.2,
  h = 2.1,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const d = 0.28;
  addBox(g, 0.02, h, d, -w / 2 + 0.01, h / 2, 0, pal.oak, rec, {});
  addBox(g, 0.02, h, d, w / 2 - 0.01, h / 2, 0, pal.oak, rec, {});
  addBox(g, w, 0.02, d, 0, h - 0.01, 0, pal.oak, rec, {});
  addBox(g, w, 0.025, d, 0, 0.02, 0, pal.oakDark, rec, {});
  addBox(g, w - 0.04, h - 0.06, 0.012, 0, h / 2, -d / 2 + 0.01, pal.oakDark, rec, { noCast: true });
  const tones = [pal.rust, pal.moss, pal.sage, pal.oakDark, pal.sand];
  const shelves = 3;
  for (let i = 1; i <= shelves; i++) {
    const shelfY = (i * (h - 0.08)) / (shelves + 1);
    addBox(g, w - 0.05, 0.018, d - 0.04, 0, shelfY, 0.01, pal.oak, rec, { noCast: true });
    let cursor = -w / 2 + 0.08;
    let bi = 0;
    while (cursor < w / 2 - 0.1 && bi < 8) {
      const bw = 0.045 + ((i + bi) % 3) * 0.012;
      const bh = 0.2 + ((bi + i) % 3) * 0.025;
      const tone = tones[(i + bi) % tones.length] ?? pal.oakDark;
      addBox(g, bw, bh, 0.18, cursor + bw / 2, shelfY + 0.02 + bh / 2, 0.02, tone, rec, {
        noCast: true,
      });
      cursor += bw + 0.01;
      bi += 1;
    }
  }
  parent.add(g);
}

export function art(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  w: number,
  h: number,
  color: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, w + 0.08, h + 0.08, 0.025, 0, 0, 0, pal.oakDark, rec, { noCast: true });
  addBox(g, w + 0.03, h + 0.03, 0.012, 0, 0, 0.012, pal.sheet, rec, {
    noCast: true,
    noShadow: true,
  });
  const paint = pal.linen.clone();
  paint.color.setHex(color);
  paint.map = null;
  paint.clippingPlanes = [];
  paint.clipShadows = true;
  addBox(g, w, h, 0.01, 0, 0, 0.02, paint, rec, { noCast: true, noShadow: true });
  parent.add(g);
}

export function rug(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  color: number,
) {
  const mat = pal.fabric.clone();
  mat.color.setHex(color);
  mat.map = null;
  mat.clippingPlanes = [];
  mat.clipShadows = true;
  addBox(parent, w, 0.018, d, x, y + 0.01, z, mat, rec, { noCast: true, clip: true });
}

export function tv(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  legs(g, -0.58, -0.12, 0.58, 0.12, 0.28, pal.walnut, 0.018, 0.011);
  addCushion(g, 1.36, 0.035, 0.36, 0, 0.32, 0, pal.oak);
  addPanel(g, 0.62, 0.14, 0.016, -0.34, 0.2, 0.16, pal.oakDark);
  addPanel(g, 0.62, 0.14, 0.016, 0.34, 0.2, 0.16, pal.oakDark);
  addTaper(g, 0.03, 0.045, 0.1, 0, 0.4, -0.02, pal.metal, { noShadow: true });
  addPanel(g, 1.18, 0.68, 0.02, 0, 0.92, -0.08, pal.ink);
  addPanel(g, 1.1, 0.6, 0.01, 0, 0.92, -0.066, pal.screen, { noCast: true, noShadow: true });
  parent.add(g);
}

export function toilet(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addCyl(g, 0.18, 0.36, 0, 0.18, 0.04, pal.appliance);
  addRing(g, 0.15, 0.018, 0, 0.38, 0.04, pal.appliance, { noShadow: true });
  addBox(g, 0.34, 0.36, 0.14, 0, 0.46, -0.18, pal.appliance, rec, {});
  addCushion(g, 0.3, 0.02, 0.12, 0, 0.65, -0.18, pal.appliance, { noCast: true });
  addCyl(g, 0.012, 0.08, 0.1, 0.5, -0.1, pal.metal, { noShadow: true });
  parent.add(g);
}

export function vanity(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  w = 1.1,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  cabinetRun(g, pal, mats, rec, 0, 0, 0, 0, w, 0.72, 0.46, { top: true, topMat: pal.stone });
  addBowl(g, 0.14, 0, 0.76, 0.02, pal.appliance, { noCast: true });
  addCyl(g, 0.012, 0.16, 0, 0.9, -0.12, mats.steel, { noShadow: true });
  addCyl(g, 0.01, 0.12, 0, 0.96, -0.02, mats.steel, { rotX: Math.PI / 2, noShadow: true });
  parent.add(g);
}

export function tub(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, 1.55, 0.08, 0.62, 0, 0.06, 0, pal.ink, rec, {});
  addBox(g, 1.68, 0.28, 0.74, 0, 0.26, 0, pal.appliance, rec, {});
  addCushion(g, 1.78, 0.05, 0.84, 0, 0.42, 0, pal.appliance);
  addCushion(g, 1.4, 0.04, 0.48, 0, 0.4, 0, pal.tile, { noCast: true });
  addCyl(g, 0.012, 0.22, 0.62, 0.58, -0.2, pal.metal, { noShadow: true });
  addCyl(g, 0.01, 0.16, 0.5, 0.66, -0.12, pal.metal, { rotZ: Math.PI / 2, noShadow: true });
  parent.add(g);
}

export function shower(
  parent: THREE.Object3D,
  pal: FurnishPalette,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addCushion(g, 1.02, 0.05, 0.92, 0, 0.03, 0, pal.tile);
  addBox(g, 0.9, 0.08, 0.06, 0, 0.08, 0.4, pal.stone, rec, {});
  addBox(g, 0.02, 2.0, 0.9, -0.49, 1.0, 0, mats.glassSimple, rec, { noShadow: true });
  addBox(g, 1.0, 2.0, 0.02, 0, 1.0, -0.44, mats.glassSimple, rec, { noShadow: true });
  addCyl(g, 0.012, 0.28, 0.28, 1.85, -0.36, mats.steel, { noShadow: true });
  addSphere(g, 0.04, 0.28, 1.7, -0.28, pal.metal, { noShadow: true });
  parent.add(g);
}
