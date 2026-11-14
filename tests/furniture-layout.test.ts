import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { addShaker } from "@/scene/furnish/forms";
import {
  FINISH_SPEC,
  PAGE_TONE,
  type FinishSpec,
  relativeLuminance,
} from "@/scene/furnish/finish-spec";
import {
  ROOM_SHELL,
  SEEN_FOOTPRINTS,
  WEST_GLASS,
  footprintsOverlap,
  type Footprint,
} from "@/scene/furnish/layout";

function byId(id: string): Footprint {
  const found = SEEN_FOOTPRINTS.find((box) => box.id === id);
  if (!found) throw new Error(`missing footprint ${id}`);
  return found;
}

function assertFinish(spec: FinishSpec) {
  const luma = relativeLuminance(spec.color);
  switch (spec.role) {
    case "broad":
      expect(luma).toBeGreaterThan(0.04);
      expect(luma).toBeLessThan(0.55);
      expect(spec.roughness).toBeGreaterThanOrEqual(0.4);
      expect(spec.metalness).toBeLessThan(0.2);
      return;
    case "metal":
      expect(luma).toBeGreaterThan(0.05);
      expect(luma).toBeLessThan(0.3);
      expect(spec.roughness).toBeGreaterThan(0.25);
      expect(spec.metalness).toBeGreaterThan(0.4);
      expect(spec.metalness).toBeLessThan(0.85);
      return;
    case "glass":
      expect(luma).toBeLessThan(0.08);
      expect(spec.roughness).toBeGreaterThan(0.15);
      expect(spec.roughness).toBeLessThan(0.45);
      return;
    default: {
      const unexpected: never = spec.role;
      throw new Error(`unhandled finish role ${String(unexpected)}`);
    }
  }
}

describe("furniture the visitor sees", () => {
  test("stays inside its room and off the west glass", () => {
    for (const box of SEEN_FOOTPRINTS) {
      const shell = ROOM_SHELL[box.room];
      expect(box.minX).toBeGreaterThanOrEqual(shell.minX);
      expect(box.maxX).toBeLessThanOrEqual(shell.maxX);
      expect(box.minZ).toBeGreaterThanOrEqual(shell.minZ);
      expect(box.maxZ).toBeLessThanOrEqual(shell.maxZ);
      const overGlass = box.maxZ > WEST_GLASS.z0 && box.minZ < WEST_GLASS.z1;
      if (box.room === "living" && overGlass) {
        expect(box.minX).toBeGreaterThan(WEST_GLASS.innerX);
      }
    }
  });

  test("the coffee table stays clear of the sofa, and the island stays clear of the dining table", () => {
    expect(footprintsOverlap(byId("sofa"), byId("coffee"))).toBe(false);
    expect(footprintsOverlap(byId("island"), byId("dining-table"))).toBe(false);
    expect(footprintsOverlap(byId("island"), byId("stool-south"))).toBe(false);
    expect(footprintsOverlap(byId("stool-south"), byId("stool-north"))).toBe(false);
  });
});

describe("furniture finishes", () => {
  test("broad surfaces can take a bounce, and metal is not a mirror", () => {
    expect(FINISH_SPEC.length).toBeGreaterThan(0);
    for (const spec of FINISH_SPEC) assertFinish(spec);
  });

  test("a book page stays warm and does not blow out", () => {
    const luma = relativeLuminance(PAGE_TONE);
    expect(luma).toBeGreaterThan(0.2);
    expect(luma).toBeLessThan(0.5);
  });
});

describe("shaker fronts", () => {
  test("the frame is open so the panel sits behind it", () => {
    const parent = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial();
    addShaker(parent, 0.4, 0.6, 0.016, 0.042, 0, 0, 0, mat, mat);
    parent.updateMatrixWorld(true);
    const center = new THREE.Raycaster(new THREE.Vector3(0, 0, 0.25), new THREE.Vector3(0, 0, -1));
    const rail = new THREE.Raycaster(new THREE.Vector3(0.18, 0, 0.25), new THREE.Vector3(0, 0, -1));
    const centerHits = center.intersectObjects(parent.children, true);
    const railHits = rail.intersectObjects(parent.children, true);
    expect(centerHits.length).toBeGreaterThan(0);
    expect(railHits.length).toBeGreaterThan(0);
    const centerZ = centerHits[0]?.point.z ?? 0;
    const railZ = railHits[0]?.point.z ?? 0;
    expect(centerZ).toBeLessThan(railZ - 0.004);
    mat.dispose();
  });

  test("a short drawer panel sits just behind the rail", () => {
    const parent = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial();
    addShaker(parent, 0.54, 0.15, 0.016, 0.02, 0, 0, 0, mat, mat, {}, mat, 0.0035);
    parent.updateMatrixWorld(true);
    const center = new THREE.Raycaster(new THREE.Vector3(0, 0, 0.25), new THREE.Vector3(0, 0, -1));
    const rail = new THREE.Raycaster(new THREE.Vector3(0.26, 0, 0.25), new THREE.Vector3(0, 0, -1));
    const centerZ = center.intersectObjects(parent.children, true)[0]?.point.z ?? 0;
    const railZ = rail.intersectObjects(parent.children, true)[0]?.point.z ?? 0;
    expect(railZ - centerZ).toBeGreaterThan(0.002);
    expect(railZ - centerZ).toBeLessThan(0.006);
    mat.dispose();
  });
});
