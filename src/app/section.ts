import * as THREE from "three";
import { ClippingGroup } from "three/webgpu";
import type { ClipBox, LayerId, OrientedClip } from "../types";
import type { Session } from "./session";
import { mustEl } from "../ui/dom";

const EDGES: Array<[number, number]> = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

let capKey = "";

export function cutRange(s: Session) {
  if (s.cutDir === "top") return { min: 0.15, max: 9.2, def: 4.3 };
  if (s.cutDir === "side") return { min: -11.2, max: 7.0, def: 1.0 };
  return { min: -8.0, max: 8.0, def: 1.2 };
}

export function mountClipGroup(s: Session) {
  const parent = s.rec.groups.walls.parent;
  if (!parent) throw new Error("house root missing");
  const group = new ClippingGroup();
  group.name = "clipGroup";
  group.enabled = false;
  group.clipShadows = true;
  group.clippingPlanes = s.clipPlanes;
  for (const id of CLIP_TARGETS) group.add(s.rec.groups[id]);
  parent.add(group);
  s.clipGroup = group;
}

export function updateCut(s: Session) {
  if (s.mode !== "cut") {
    capKey = "";
    return;
  }
  const key = `${s.cutDir}:${s.cutValue.toFixed(3)}:${s.roofY.toFixed(3)}:${s.capColors ? 1 : 0}`;
  if (key === capKey && s.clipPlanes.length > 0) return;
  capKey = key;
  s.clipGroup.enabled = true;
  const plane = new THREE.Plane();
  if (s.cutDir === "top") plane.set(new THREE.Vector3(0, -1, 0), s.cutValue);
  else if (s.cutDir === "side") plane.set(new THREE.Vector3(0, 0, -1), s.cutValue);
  else plane.set(new THREE.Vector3(-1, 0, 0), s.cutValue);
  s.clipPlanes.length = 0;
  s.clipPlanes.push(plane);
  rebuildCaps(s, plane);
  rebuildSectionBox(s);
  mustEl<HTMLElement>("cut-meter").textContent = `${s.cutValue.toFixed(1)} m`;
}

function axisOf(plane: THREE.Plane): "x" | "y" | "z" {
  const n = plane.normal;
  if (Math.abs(n.y) > 0.5) return "y";
  if (Math.abs(n.z) > 0.5) return "z";
  return "x";
}

function pushAabb(
  out: number[],
  boxes: ClipBox[],
  yLift: number,
  axis: "x" | "y" | "z",
  c: number,
  capColor: number | undefined,
  useColors: boolean,
) {
  for (const b of boxes) {
    if (useColors) {
      if (capColor === undefined) {
        if (b.capColor !== undefined) continue;
      } else if (b.capColor !== capColor) continue;
    }
    const minY = b.min.y + yLift;
    const maxY = b.max.y + yLift;
    if (axis === "y") {
      if (c <= minY + 0.001 || c >= maxY - 0.001) continue;
      pushRect(out, b.min.x, b.min.z, b.max.x, b.max.z, "y", c);
    } else if (axis === "z") {
      if (c <= b.min.z + 0.001 || c >= b.max.z - 0.001) continue;
      pushRect(out, b.min.x, minY, b.max.x, maxY, "z", c);
    } else if (c > b.min.x + 0.001 && c < b.max.x - 0.001) {
      pushRect(out, b.min.z, minY, b.max.z, maxY, "x", c);
    }
  }
}

function pushRect(
  out: number[],
  a0: number,
  b0: number,
  a1: number,
  b1: number,
  axis: "x" | "y" | "z",
  c: number,
) {
  const q: Array<[number, number]> = [
    [a0, b0],
    [a1, b0],
    [a1, b1],
    [a0, b0],
    [a1, b1],
    [a0, b1],
  ];
  for (const [u, v] of q) {
    if (axis === "y") out.push(u, c, v);
    else if (axis === "z") out.push(u, v, c);
    else out.push(c, v, u);
  }
}

function obbPolygon(clip: OrientedClip, plane: THREE.Plane, yLift: number): THREE.Vector3[] {
  const center = clip.center.clone();
  if (clip.lifts) center.y += yLift;
  const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(clip.quat);
  const ay = new THREE.Vector3(0, 1, 0).applyQuaternion(clip.quat);
  const az = new THREE.Vector3(0, 0, 1).applyQuaternion(clip.quat);
  const corner = (sx: number, sy: number, sz: number) =>
    center
      .clone()
      .addScaledVector(ax, sx * clip.half.x)
      .addScaledVector(ay, sy * clip.half.y)
      .addScaledVector(az, sz * clip.half.z);
  const corners = [
    corner(-1, -1, -1),
    corner(1, -1, -1),
    corner(-1, 1, -1),
    corner(1, 1, -1),
    corner(-1, -1, 1),
    corner(1, -1, 1),
    corner(-1, 1, 1),
    corner(1, 1, 1),
  ];
  const pts: THREE.Vector3[] = [];
  for (const [i, j] of EDGES) {
    const a = corners[i]!;
    const b = corners[j]!;
    const da = plane.distanceToPoint(a);
    const db = plane.distanceToPoint(b);
    if (Math.abs(da) < 1e-4) pts.push(a.clone());
    else if (da * db < 0) pts.push(a.clone().lerp(b, da / (da - db)));
  }
  const unique: THREE.Vector3[] = [];
  for (const p of pts) {
    if (!unique.some((u) => u.distanceToSquared(p) < 1e-8)) unique.push(p);
  }
  if (unique.length < 3) return [];
  const centroid = new THREE.Vector3();
  for (const p of unique) centroid.add(p);
  centroid.multiplyScalar(1 / unique.length);
  const normal = plane.normal;
  const tmp = Math.abs(normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3().crossVectors(tmp, normal).normalize();
  const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();
  return unique
    .map((p) => {
      const d = p.clone().sub(centroid);
      return { p, a: Math.atan2(d.dot(yAxis), d.dot(xAxis)) };
    })
    .sort((p, q) => p.a - q.a)
    .map((e) => e.p);
}

function rebuildCaps(s: Session, plane: THREE.Plane) {
  s.capGroup.clear();
  const axis = axisOf(plane);
  const lift = s.rec.roofGroup.position.y;
  const useColors = s.capColors;
  const colors = new Set<number>();
  if (useColors) {
    for (const box of s.rec.clipBoxes) if (box.capColor !== undefined) colors.add(box.capColor);
    for (const box of s.rec.roofClipBoxes) if (box.capColor !== undefined) colors.add(box.capColor);
  }
  const out: number[] = [];
  pushAabb(out, s.rec.clipBoxes, 0, axis, s.cutValue, undefined, useColors);
  pushAabb(out, s.rec.roofClipBoxes, lift, axis, s.cutValue, undefined, useColors);
  for (const clip of s.rec.orientedClips) {
    const poly = obbPolygon(clip, plane, lift);
    if (poly.length < 3) continue;
    const a = poly[0]!;
    for (let i = 1; i < poly.length - 1; i++) {
      const b = poly[i]!;
      const c = poly[i + 1]!;
      out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  }
  addCapMesh(s, out, s.mats.sectionCap);
  if (!useColors) return;
  for (const color of colors) {
    const tinted: number[] = [];
    pushAabb(tinted, s.rec.clipBoxes, 0, axis, s.cutValue, color, true);
    pushAabb(tinted, s.rec.roofClipBoxes, lift, axis, s.cutValue, color, true);
    const mat = new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    addCapMesh(s, tinted, mat);
  }
}

function addCapMesh(s: Session, positions: number[], material: THREE.Material) {
  if (positions.length < 9) return;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, material);
  mesh.renderOrder = 2;
  s.capGroup.add(mesh);
}

function rebuildSectionBox(s: Session) {
  s.sectionBox.clear();
  const box = new THREE.Box3(
    new THREE.Vector3(-8.0, -0.2, -11.2),
    new THREE.Vector3(7.5, 9.2, 7.0),
  );
  const helper = new THREE.Box3Helper(box, 0xd0d6dc);
  const helperMat = helper.material as THREE.LineBasicMaterial;
  helperMat.transparent = true;
  helperMat.opacity = 0.55;
  s.sectionBox.add(helper);
  const g = new THREE.BufferGeometry();
  let pts: number[];
  const cutValue = s.cutValue;
  if (s.cutDir === "top") {
    pts = [
      -8,
      cutValue,
      -11.2,
      7.5,
      cutValue,
      -11.2,
      7.5,
      cutValue,
      7,
      -8,
      cutValue,
      7,
      -8,
      cutValue,
      -11.2,
    ];
  } else if (s.cutDir === "side") {
    pts = [
      -8,
      -0.2,
      cutValue,
      7.5,
      -0.2,
      cutValue,
      7.5,
      9.2,
      cutValue,
      -8,
      9.2,
      cutValue,
      -8,
      -0.2,
      cutValue,
    ];
  } else {
    pts = [
      cutValue,
      -0.2,
      -11.2,
      cutValue,
      -0.2,
      7,
      cutValue,
      9.2,
      7,
      cutValue,
      9.2,
      -11.2,
      cutValue,
      -0.2,
      -11.2,
    ];
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  s.sectionBox.add(new THREE.Line(g, s.mats.sectionLine));
}

export const CLIP_TARGETS: LayerId[] = [
  "framing",
  "masonry",
  "roof",
  "walls",
  "insulation",
  "fenestration",
  "hvac",
  "electrical",
  "plumbing",
  "furniture",
];
