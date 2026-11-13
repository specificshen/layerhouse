import * as THREE from "three";
import { Y_GF_TOP, Y_GF_CEIL, Y_L2_TOP, Y_L2_CEIL } from "../../config";
import { addBox, addCyl, addSphere } from "../geom";
import type { Materials } from "../materials";
import type { HouseGroups, HouseRecord } from "../../types";

type LampKind = "pendant" | "recessed" | "sconce" | "floor";

function lamp(
  parent: THREE.Object3D,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  mats: Materials,
  kind: LampKind = "pendant",
  intensity = 1,
) {
  if (kind === "pendant") {
    addCyl(parent, 0.012, 0.28, x, y - 0.1, z, mats.steel, { noShadow: true });
    addCyl(parent, 0.16, 0.08, x, y - 0.28, z, mats.lampShade);
    addSphere(parent, 0.05, x, y - 0.3, z, mats.lampBulb, { noShadow: true });
  } else if (kind === "recessed") {
    addCyl(parent, 0.09, 0.03, x, y, z, mats.steel, { noShadow: true });
    addCyl(parent, 0.07, 0.02, x, y - 0.02, z, mats.lampBulb, { noShadow: true });
  } else if (kind === "sconce") {
    addBox(parent, 0.06, 0.16, 0.08, x, y, z, mats.steel, rec, { noShadow: true });
    addCyl(parent, 0.05, 0.1, x, y, z + 0.07, mats.lampShade, { noShadow: true });
  } else if (kind === "floor") {
    addCyl(parent, 0.08, 0.04, x, Y_GF_TOP + 0.02, z, mats.steel);
    addCyl(parent, 0.015, 1.35, x, Y_GF_TOP + 0.7, z, mats.steel);
    addCyl(parent, 0.18, 0.14, x, Y_GF_TOP + 1.42, z, mats.lampShade);
  }
  const light = new THREE.PointLight(0xffc888, 0, 7.5, 2);
  light.position.set(x, kind === "floor" ? Y_GF_TOP + 1.35 : y - 0.25, z);
  light.userData.base = intensity;
  parent.add(light);
  rec.lamps.push(light);
}

function sofa(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len = 2.4,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, len, 0.38, 0.92, 0, 0.22, 0, mats.fabric, rec, {});
  addBox(g, len, 0.42, 0.18, 0, 0.52, -0.36, mats.fabric, rec, {});
  addBox(g, 0.16, 0.38, 0.88, -len / 2 + 0.1, 0.48, 0.02, mats.cushionB, rec, {});
  addBox(g, 0.16, 0.38, 0.88, len / 2 - 0.1, 0.48, 0.02, mats.cushionB, rec, {});
  const n = len > 2 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const px = -len / 2 + 0.4 + (i * (len - 0.8)) / Math.max(1, n - 1);
    addBox(g, 0.46, 0.12, 0.42, px, 0.48, 0.08, mats.cushionC, rec, {});
  }
  parent.add(g);
}

function armchair(
  parent: THREE.Object3D,
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
  addBox(g, 0.78, 0.36, 0.78, 0, 0.22, 0, mats.cushionB, rec, {});
  addBox(g, 0.78, 0.4, 0.16, 0, 0.52, -0.3, mats.cushionB, rec, {});
  addBox(g, 0.12, 0.32, 0.7, -0.34, 0.42, 0.02, mats.fabric, rec, {});
  addBox(g, 0.12, 0.32, 0.7, 0.34, 0.42, 0.02, mats.fabric, rec, {});
  parent.add(g);
}

function table(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h = 0.74,
  mat?: THREE.Material,
) {
  addBox(parent, w, 0.04, d, x, y + h, z, mat || mats.woodMid, rec, {});
  const inset = 0.08;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      addBox(
        parent,
        0.06,
        h - 0.02,
        0.06,
        x + sx * (w / 2 - inset),
        y + h / 2,
        z + sz * (d / 2 - inset),
        mats.woodDark,
        rec,
        {},
      );
    }
}

function chair(
  parent: THREE.Object3D,
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
  addBox(g, 0.42, 0.04, 0.42, 0, 0.46, 0, mats.woodMid, rec, {});
  addBox(g, 0.42, 0.38, 0.05, 0, 0.68, -0.18, mats.woodMid, rec, {});
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      addCyl(g, 0.02, 0.46, sx * 0.16, 0.23, sz * 0.16, mats.woodDark);
    }
  parent.add(g);
}

function bed(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  king = false,
) {
  const w = king ? 1.9 : 1.5;
  const d = king ? 2.1 : 2.0;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, w + 0.1, 0.28, d + 0.08, 0, 0.18, 0, mats.woodDark, rec, {});
  addBox(g, w + 0.06, 0.72, 0.08, 0, 0.58, -d / 2, mats.woodDark, rec, {});
  const duvet = mats.linen.clone();
  duvet.color.setHex(king ? 0xb7c4b4 : 0xc4b0a0);
  addBox(g, w - 0.06, 0.16, d - 0.08, 0, 0.4, 0.02, mats.linen, rec, {});
  addBox(g, w - 0.08, 0.08, d * 0.72, 0, 0.5, 0.12, duvet, rec, {});
  addBox(g, w * 0.55, 0.05, 0.42, 0, 0.54, d * 0.28, mats.cushionC, rec, { noCast: true });
  const pillow = mats.linen.clone();
  pillow.color.setHex(0xf4efe6);
  addBox(g, 0.52, 0.14, 0.34, -w * 0.22, 0.58, -d / 2 + 0.32, pillow, rec, {});
  addBox(g, 0.52, 0.14, 0.34, w * 0.22, 0.58, -d / 2 + 0.32, pillow, rec, {});
  if (king) {
    addBox(g, 0.42, 0.1, 0.28, 0, 0.64, -d / 2 + 0.46, pillow, rec, { noCast: true });
  }
  parent.add(g);
}

function nightstand(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
) {
  addBox(parent, 0.48, 0.5, 0.4, x, y + 0.25, z, mats.woodMid, rec, {});
}

function desk(
  parent: THREE.Object3D,
  mats: Materials,
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
  addBox(g, w, 0.04, 0.7, 0, 0.74, 0, mats.woodMid, rec, {});
  addBox(g, 0.42, 0.7, 0.66, -w / 2 + 0.22, 0.35, 0, mats.woodDark, rec, {});
  addBox(g, 0.42, 0.7, 0.66, w / 2 - 0.22, 0.35, 0, mats.woodDark, rec, {});
  parent.add(g);
}

function cabinets(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  rotY: number,
  len: number,
  h: number,
  d = 0.58,
  mat?: THREE.Material,
) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  addBox(g, len, h, d, 0, h / 2, 0, mat || mats.woodMid, rec, {});
  const n = Math.max(1, Math.round(len / 0.45));
  for (let i = 1; i < n; i++) {
    addBox(
      g,
      0.012,
      h - 0.06,
      d - 0.04,
      -len / 2 + (i * len) / n,
      h / 2,
      0.01,
      mats.woodDark,
      rec,
      { noCast: true },
    );
  }
  parent.add(g);
}

function island(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
) {
  addBox(parent, w, 0.88, d, x, y + 0.44, z, mats.woodDark, rec, {});
  addBox(parent, w + 0.06, 0.05, d + 0.06, x, y + 0.9, z, mats.concrete, rec, {});
}

function toilet(
  parent: THREE.Object3D,
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
  addCyl(g, 0.2, 0.4, 0, 0.2, 0.06, mats.fixture);
  addBox(g, 0.38, 0.42, 0.16, 0, 0.45, -0.2, mats.fixture, rec, {});
  addCyl(g, 0.16, 0.04, 0, 0.42, 0.06, mats.fixture, { noShadow: true });
  parent.add(g);
}

function vanity(
  parent: THREE.Object3D,
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
  addBox(g, w, 0.7, 0.48, 0, 0.35, 0, mats.woodMid, rec, {});
  addBox(g, w + 0.04, 0.03, 0.5, 0, 0.72, 0, mats.fixture, rec, {});
  addCyl(g, 0.16, 0.08, 0, 0.76, 0.04, mats.fixture, { noShadow: true });
  addCyl(g, 0.015, 0.18, 0, 0.86, -0.12, mats.steel, { noShadow: true });
  addCyl(g, 0.015, 0.12, 0, 0.92, -0.04, mats.steel, { rotX: Math.PI / 2, noShadow: true });
  parent.add(g);
}

function tub(
  parent: THREE.Object3D,
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
  addBox(g, 1.7, 0.5, 0.75, 0, 0.25, 0, mats.fixture, rec, {});
  addBox(g, 1.5, 0.12, 0.55, 0, 0.42, 0, mats.pipeCold, rec, { noShadow: true });
  parent.add(g);
}

function shower(
  parent: THREE.Object3D,
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
  addBox(g, 1.0, 0.04, 0.9, 0, 0.02, 0, mats.concrete, rec, {});
  addBox(g, 0.02, 2.0, 0.9, -0.49, 1.0, 0, mats.glassSimple, rec, { noShadow: true });
  addBox(g, 1.0, 2.0, 0.02, 0, 1.0, -0.44, mats.glassSimple, rec, { noShadow: true });
  addCyl(g, 0.012, 0.4, 0.3, 1.7, -0.38, mats.steel, { noShadow: true });
  parent.add(g);
}

function rug(
  parent: THREE.Object3D,
  mats: Materials,
  rec: HouseRecord,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  color: number,
) {
  const m = mats.fabric.clone();
  m.color.setHex(color);
  m.map = null;
  addBox(parent, w, 0.02, d, x, y + 0.01, z, m, rec, { noCast: true, clip: true });
}

function tv(
  parent: THREE.Object3D,
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
  addBox(g, 1.5, 0.06, 0.4, 0, 0.22, 0, mats.woodDark, rec, {});
  addBox(g, 1.28, 0.72, 0.05, 0, 1.0, -0.1, mats.steel, rec, {});
  const screen = mats.steel.clone();
  screen.color.setHex(0x111418);
  screen.metalness = 0.4;
  screen.roughness = 0.3;
  addBox(g, 1.22, 0.66, 0.03, 0, 1.0, -0.07, screen, rec, { noShadow: true });
  parent.add(g);
}

function bookcase(
  parent: THREE.Object3D,
  mats: Materials,
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
  addBox(g, w, h, 0.32, 0, h / 2, 0, mats.woodMid, rec, {});
  const bookColors = [0x6a3a32, 0x2e3a48, 0x8a7048, 0x3d4a3a, 0x5a4038];
  for (let i = 1; i < 4; i++) {
    const shelfY = (i * h) / 4;
    addBox(g, w - 0.06, 0.03, 0.28, 0, shelfY, 0.01, mats.woodDark, rec, { noCast: true });
    let xCursor = -w / 2 + 0.08;
    let bi = 0;
    while (xCursor < w / 2 - 0.12 && bi < 8) {
      const bw = 0.05 + ((i + bi) % 3) * 0.015;
      const bh = 0.22 + ((bi + i) % 3) * 0.03;
      const cover = mats.fabric.clone();
      cover.color.setHex(bookColors[(i + bi) % bookColors.length]!);
      cover.map = null;
      addBox(g, bw, bh, 0.2, xCursor + bw / 2, shelfY + 0.02 + bh / 2, 0.02, cover, rec, {
        noCast: true,
      });
      xCursor += bw + 0.012;
      bi += 1;
    }
  }
  parent.add(g);
}

function art(
  parent: THREE.Object3D,
  mats: Materials,
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
  addBox(g, w + 0.06, h + 0.06, 0.03, 0, 0, 0, mats.woodDark, rec, { noCast: true });
  const paint = mats.linen.clone();
  paint.color.setHex(color);
  paint.map = null;
  addBox(g, w, h, 0.012, 0, 0, 0.02, paint, rec, { noCast: true, noShadow: true });
  parent.add(g);
}

export function furnishHouse(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  const f = groups.furniture;
  const y0 = Y_GF_TOP;
  const y2 = Y_L2_TOP;

  // —— Living (west main) ——
  rug(f, mats, rec, -4.3, y0, 2.0, 3.4, 2.6, 0x3a4038);
  sofa(f, mats, rec, -4.4, y0, 0.55, 0, 2.6);
  armchair(f, mats, rec, -2.55, y0, 2.4, -Math.PI / 3);
  armchair(f, mats, rec, -6.05, y0, 2.6, Math.PI / 4);
  table(f, mats, rec, -4.3, y0, 2.15, 1.2, 0.7, 0.38, mats.woodDark);
  tv(f, mats, rec, -4.4, y0, 5.55, Math.PI);
  lamp(f, rec, -4.3, Y_GF_CEIL - 0.02, 1.6, mats, "recessed", 0.9);
  lamp(f, rec, -5.6, Y_GF_CEIL - 0.02, 3.4, mats, "recessed", 0.7);
  lamp(f, rec, -3.0, Y_GF_CEIL - 0.02, 3.4, mats, "recessed", 0.7);
  lamp(f, rec, -6.3, y0, 4.6, mats, "floor", 0.55);
  art(f, mats, rec, -6.95, y0 + 1.55, 1.7, Math.PI / 2, 1.15, 0.78, 0x8d9a86);
  art(f, mats, rec, -5.4, y0 + 1.45, 0.35, 0, 0.55, 0.7, 0xc4a080);

  // —— Dining / kitchen (east main) ——
  table(f, mats, rec, 4.3, y0, 3.6, 1.8, 0.9, 0.75, mats.woodMid);
  for (const dz of [-0.55, 0.55]) {
    chair(f, mats, rec, 3.7, y0, 3.6 + dz, dz < 0 ? 0 : Math.PI);
    chair(f, mats, rec, 4.9, y0, 3.6 + dz, dz < 0 ? 0 : Math.PI);
  }
  chair(f, mats, rec, 4.3, y0, 3.6 - 0.7, 0);
  chair(f, mats, rec, 4.3, y0, 3.6 + 0.7, Math.PI);
  lamp(f, rec, 3.85, 2.85, 3.6, mats, "pendant", 1.1);
  lamp(f, rec, 4.75, 2.85, 3.6, mats, "pendant", 1.1);

  // Kitchen counters along east wall and north
  cabinets(f, mats, rec, 6.25, y0, 0.4, 0, 3.4, 0.88, 0.6, mats.woodMid);
  addBox(f, 3.4, 0.04, 0.64, 6.25, y0 + 0.9, 0.4, mats.concrete, rec, {});
  cabinets(f, mats, rec, 6.25, y0 + 1.5, 0.4, 0, 3.4, 0.9, 0.4, mats.woodDark); // uppers
  island(f, mats, rec, 4.55, y0, 0.3, 2.1, 0.85);
  lamp(f, rec, 4.55, 2.85, 0.3, mats, "pendant", 0.9);
  lamp(f, rec, 6.0, Y_GF_CEIL - 0.02, 1.6, mats, "recessed", 0.6);
  lamp(f, rec, 4.2, Y_GF_CEIL - 0.02, 5.2, mats, "recessed", 0.6);
  // cooktop dots
  addBox(f, 0.55, 0.02, 0.5, 6.25, y0 + 0.94, 0.9, mats.steel, rec, { noShadow: true });
  addCyl(f, 0.12, 0.06, 6.15, y0 + 0.96, -0.5, mats.fixture, { noShadow: true }); // sink
  addCyl(f, 0.012, 0.2, 6.15, y0 + 1.08, -0.62, mats.steel, { noShadow: true });

  // —— Entry ——
  addBox(f, 0.9, 0.7, 0.35, -0.9, y0 + 0.35, 5.7, mats.woodDark, rec, {}); // bench/console
  lamp(f, rec, -0.9, Y_GF_CEIL - 0.02, 5.0, mats, "recessed", 0.7);
  lamp(f, rec, -0.95, 2.62, 7.15, mats, "recessed", 0.8); // porch under canopy

  // —— Powder ——
  toilet(f, mats, rec, -1.15, y0, 2.15, Math.PI);
  vanity(f, mats, rec, 0.15, y0, 2.35, Math.PI / 2, 0.8);
  lamp(f, rec, -0.5, Y_GF_CEIL - 0.02, 2.35, mats, "recessed", 0.4);

  // —— Guest bedroom (north wing) ——
  bed(f, mats, rec, -4.4, y0, -8.3, Math.PI, false);
  nightstand(f, mats, rec, -5.4, y0, -9.15);
  nightstand(f, mats, rec, -3.4, y0, -9.15);
  armchair(f, mats, rec, -2.3, y0, -6.5, -Math.PI / 2);
  lamp(f, rec, -4.4, 2.92, -8.0, mats, "recessed", 0.6);
  lamp(f, rec, -5.4, y0 + 0.55, -9.15, mats, "sconce", 0.3);
  art(f, mats, rec, -4.5, y0 + 1.5, -10.25, 0, 0.9, 0.6, 0x6e7c88);

  // —— Guest bath ——
  vanity(f, mats, rec, -6.4, y0, -3.6, Math.PI / 2, 1.0);
  toilet(f, mats, rec, -6.5, y0, -4.7, Math.PI / 2);
  shower(f, mats, rec, -5.0, y0, -3.0, 0);
  lamp(f, rec, -5.6, 2.92, -3.8, mats, "recessed", 0.45);

  // —— L2 Master ——
  bed(f, mats, rec, -2.4, y2, 1.3, Math.PI / 2, true);
  nightstand(f, mats, rec, -3.5, y2, 0.2);
  nightstand(f, mats, rec, -3.5, y2, 2.4);
  bookcase(f, mats, rec, -6.7, y2, 1.4, Math.PI / 2, 1.8, 2.0);
  armchair(f, mats, rec, -5.4, y2, 5.0, Math.PI);
  rug(f, mats, rec, -2.6, y2, 1.3, 2.4, 2.0, 0x4a4038);
  lamp(f, rec, -2.4, Y_L2_CEIL - 0.02, 1.3, mats, "recessed", 0.8);
  lamp(f, rec, -5.5, Y_L2_CEIL - 0.02, 4.2, mats, "recessed", 0.5);
  lamp(f, rec, -3.5, y2 + 0.55, 0.2, mats, "sconce", 0.3);
  art(f, mats, rec, -6.9, y2 + 1.55, 1.5, Math.PI / 2, 0.85, 1.05, 0xa89078);

  // Master bath
  vanity(f, mats, rec, -6.4, y2, 4.7, Math.PI / 2, 1.3);
  toilet(f, mats, rec, -6.5, y2, 5.7, Math.PI / 2);
  tub(f, mats, rec, -2.95, y2, 5.5, 0);
  lamp(f, rec, -5.0, Y_L2_CEIL - 0.02, 4.8, mats, "recessed", 0.45);

  // —— L2 hall bath ——
  vanity(f, mats, rec, 1.52, y2, 5.5, Math.PI, 1.0);
  toilet(f, mats, rec, 0.9, y2, 3.5, -Math.PI / 2);
  shower(f, mats, rec, 2.0, y2, 3.55, 0);
  lamp(f, rec, 1.5, Y_L2_CEIL - 0.02, 4.4, mats, "recessed", 0.4);

  // —— Study ——
  desk(f, mats, rec, 5.4, y2, 0.6, -Math.PI / 2, 1.8);
  chair(f, mats, rec, 4.7, y2, 0.6, Math.PI / 2);
  bookcase(f, mats, rec, 6.4, y2, 3.6, -Math.PI / 2, 2.2, 2.2);
  armchair(f, mats, rec, 3.5, y2, 5.0, Math.PI * 0.8);
  lamp(f, rec, 5.0, Y_L2_CEIL - 0.02, 1.0, mats, "recessed", 0.7);
  lamp(f, rec, 4.8, Y_L2_CEIL - 0.02, 4.6, mats, "recessed", 0.5);
  art(f, mats, rec, 4.6, y2 + 1.6, 5.95, Math.PI, 1.05, 0.72, 0x7f8c78);

  // hallway lamps
  lamp(f, rec, 1.5, Y_L2_CEIL - 0.02, -0.6, mats, "recessed", 0.5);
  lamp(f, rec, 1.5, Y_GF_CEIL - 0.02, 4.6, mats, "recessed", 0.4);

  // balcony sconce
  lamp(f, rec, 2.3, y2 + 1.4, -2.35, mats, "sconce", 0.4);
}
