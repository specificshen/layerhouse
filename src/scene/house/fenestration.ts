import * as THREE from "three";
import { addBox, addCyl } from "../geom";
import type { Materials } from "../materials";
import type { DoorStyle, HouseRecord, Wall, WallAxis } from "../../types";

/** Local X of the hinge. −1 is the −X side of the door group. */
export function leafHingeAt(axis: WallAxis, hinge: "a0" | "a1"): -1 | 1 {
  if (axis === "z") return hinge === "a0" ? -1 : 1;
  return hinge === "a0" ? 1 : -1;
}

export function buildFenestration(
  parent: THREE.Object3D,
  walls: Wall[],
  mats: Materials,
  rec: HouseRecord,
) {
  for (const w of walls) {
    for (const o of w.openings || []) {
      const axis = w.axis;
      const midA = (o.a0 + o.a1) / 2;
      const midY = (o.y0 + o.y1) / 2;
      const wA = o.a1 - o.a0;
      const h = o.y1 - o.y0;
      const x = axis === "z" ? midA : w.pos;
      const z = axis === "x" ? midA : w.pos;
      const rotY = axis === "x" ? Math.PI / 2 : 0;
      if (o.type === "door") {
        addDoor(
          parent,
          {
            x,
            y: midY,
            z,
            w: wA,
            h,
            rotY,
            style: o.style,
            axis,
            pos: w.pos,
            a0: o.a0,
            a1: o.a1,
            y0: o.y0,
            y1: o.y1,
            hinge: o.hinge,
            openSign: o.openSign,
          },
          mats,
          rec,
        );
      } else {
        addWindow(parent, { x, y: midY, z, w: wA, h, rotY, style: o.style }, mats, rec);
      }
    }
  }
}

interface FenestrationOpts {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  rotY: number;
  style: DoorStyle;
  axis?: WallAxis;
  pos?: number;
  a0?: number;
  a1?: number;
  y0?: number;
  y1?: number;
}

interface DoorOpts extends FenestrationOpts {
  axis: WallAxis;
  pos: number;
  a0: number;
  a1: number;
  y0: number;
  y1: number;
  hinge?: "a0" | "a1";
  openSign?: 1 | -1;
}

function addWindow(parent: THREE.Object3D, o: FenestrationOpts, mats: Materials, rec: HouseRecord) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  g.rotation.y = o.rotY || 0;
  const fw = 0.055;
  const depth = 0.16;
  const innerW = o.w - fw * 2;
  const innerH = o.h - fw * 2;
  addBox(g, fw, o.h, depth, -o.w / 2 + fw / 2, 0, 0, mats.frame, rec, { clip: true });
  addBox(g, fw, o.h, depth, o.w / 2 - fw / 2, 0, 0, mats.frame, rec, { clip: true });
  addBox(g, o.w + 0.04, 0.05, depth + 0.04, 0, o.h / 2 - 0.01, 0, mats.frame, rec, { clip: true });
  addBox(g, o.w + 0.1, 0.055, depth + 0.1, 0, -o.h / 2 + 0.01, 0, mats.frame, rec, { clip: true });

  const cols = o.style === "sidelight" ? 0 : Math.max(0, Math.round(innerW / 0.82) - 1);
  for (let i = 1; i <= cols; i++) {
    const px = -innerW / 2 + (innerW * i) / (cols + 1);
    addBox(g, 0.028, innerH - 0.02, 0.045, px, 0.01, 0.02, mats.frame, rec, {});
  }
  if (o.style !== "sidelight" && innerH > 1.2) {
    addBox(g, innerW, 0.026, 0.045, 0, innerH * 0.06, 0.02, mats.frame, rec, {});
  }

  const pane = addBox(g, innerW - 0.02, innerH - 0.02, 0.018, 0, 0.01, 0, mats.glassSimple, rec, {
    noShadow: true,
  });
  pane.name = "glass";
  pane.renderOrder = 3;
  const warm = addBox(g, innerW - 0.04, innerH - 0.04, 0.008, 0, 0.01, 0.02, mats.glassWarm, rec, {
    noShadow: true,
  });
  warm.renderOrder = 2;
  warm.name = "glassWarm";
  parent.add(g);
  return g;
}

function addDoor(parent: THREE.Object3D, o: DoorOpts, mats: Materials, rec: HouseRecord) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  g.rotation.y = o.rotY || 0;
  const fw = 0.05;
  const depth = 0.12;
  addBox(g, fw, o.h, depth, -o.w / 2 + fw / 2, 0, 0, mats.frame, rec, {});
  addBox(g, fw, o.h, depth, o.w / 2 - fw / 2, 0, 0, mats.frame, rec, {});
  addBox(g, o.w, fw, depth, 0, o.h / 2 - fw / 2, 0, mats.frame, rec, {});
  const slabW = o.w - fw * 2 - 0.01;
  const slabH = o.h - fw - 0.01;
  const leaf = new THREE.Group();
  leaf.name = "leaf";
  const style = o.style;
  const sliding = style === "slider";
  if (!sliding && o.openSign !== 1 && o.openSign !== -1) {
    throw new Error(`hinged door at (${o.x}, ${o.z}) is missing a swing`);
  }
  if (!sliding && o.hinge !== "a0" && o.hinge !== "a1") {
    throw new Error(`hinged door at (${o.x}, ${o.z}) is missing a hinge`);
  }
  const hingeAt = sliding ? -1 : leafHingeAt(o.axis, o.hinge ?? "a0");
  // Leaf geometry is authored with the hinge at the origin and the panel toward +X.
  // `ext` mirrors that panel when the hinge sits on the +X jamb.
  const ext = sliding ? 1 : -hingeAt;
  leaf.position.set((sliding ? -1 : hingeAt) * (o.w / 2 - fw), 0, 0);
  const lx = (x: number) => ext * x;
  const mat = style === "interior" ? mats.woodMid : mats.woodDark;
  const slab = addBox(leaf, slabW, slabH, 0.05, lx(slabW / 2), -fw / 2, 0, mat, rec, {});
  slab.name = "doorSlab";
  if (style === "pivot" || style === "garden") {
    addBox(leaf, 0.16, slabH - 0.36, 0.02, lx(slabW * 0.28), -fw / 2, 0.02, mats.glassSimple, rec, {
      noShadow: true,
    });
    addBox(leaf, 0.16, slabH - 0.36, 0.02, lx(slabW * 0.72), -fw / 2, 0.02, mats.glassSimple, rec, {
      noShadow: true,
    });
    addBox(leaf, 0.04, 0.22, 0.012, lx(slabW - 0.16), 0.02, 0.04, mats.steel, rec, {
      noShadow: true,
    });
    addCyl(leaf, 0.011, 0.92, lx(slabW - 0.16), 0.02, 0.055, mats.steel, { noShadow: true });
    addCyl(leaf, 0.02, 0.05, lx(0.03), slabH / 2 - fw, 0, mats.steel, { noShadow: true });
    addCyl(leaf, 0.024, 0.04, lx(0.03), -slabH / 2, 0, mats.steel, { noShadow: true });
  } else if (sliding) {
    addBox(
      leaf,
      slabW * 0.46,
      slabH - 0.16,
      0.02,
      slabW * 0.3,
      -fw / 2,
      0.02,
      mats.glassSimple,
      rec,
      { noShadow: true },
    );
    addBox(
      leaf,
      slabW * 0.46,
      slabH - 0.16,
      0.02,
      slabW * 0.72,
      -fw / 2,
      0.02,
      mats.glassSimple,
      rec,
      { noShadow: true },
    );
  } else {
    addCyl(leaf, 0.012, 0.16, lx(slabW - 0.12), 0.02, 0.045, mats.steel, {
      rotX: Math.PI / 2,
      noShadow: true,
    });
    addCyl(leaf, 0.016, 0.14, lx(0.02), slabH * 0.22, 0.01, mats.steel, { noShadow: true });
    addCyl(leaf, 0.016, 0.14, lx(0.02), -slabH * 0.18, 0.01, mats.steel, { noShadow: true });
  }
  g.add(leaf);
  parent.add(g);
  rec.doors.push({
    group: g,
    leaf,
    open: 0,
    target: 0,
    openSign: o.openSign ?? 1,
    closedX: leaf.position.x,
    // world-ish collision when closed
    x: o.x,
    z: o.z,
    w: o.w,
    axis: o.axis,
    pos: o.pos,
    a0: o.a0,
    a1: o.a1,
    y0: o.y0,
    y1: o.y1,
    style,
  });
  if (style === "pivot") {
    rec.hotspots.push({
      id: "door",
      labelZh: "枢轴门",
      labelEn: "Pivot door",
      position: new THREE.Vector3(o.x, o.y + 0.2, o.z + 0.4),
      object: g,
    });
  }
  return g;
}
