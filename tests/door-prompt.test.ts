import { describe, expect, test } from "bun:test";
import {
  DOOR_REACH,
  doorPromptVisible,
  nearestDoorIndex,
  type DoorReach,
} from "@/features/walk/nearest-door";

const door: DoorReach = { x: 0, z: 0, y0: 0.1, y1: 2.2 };

describe("door prompt", () => {
  test("a door inside the interact range is the one the prompt uses", () => {
    const index = nearestDoorIndex([door], { x: 1.2, y: 1.6, z: 0.4 });
    expect(index).toBe(0);
    expect(doorPromptVisible(true, index)).toBe(true);
  });

  test("the prompt hides outside the range, off the floor, and while orbiting", () => {
    expect(nearestDoorIndex([door], { x: DOOR_REACH, y: 1.6, z: 0 })).toBe(-1);
    expect(nearestDoorIndex([door], { x: 0.4, y: 4.2, z: 0 })).toBe(-1);
    expect(doorPromptVisible(false, 0)).toBe(false);
    expect(doorPromptVisible(true, -1)).toBe(false);
  });

  test("the nearer door wins", () => {
    const far: DoorReach = { x: 1.6, z: 0, y0: 0.1, y1: 2.2 };
    const near: DoorReach = { x: 0.4, z: 0.2, y0: 0.1, y1: 2.2 };
    expect(nearestDoorIndex([far, near], { x: 0, y: 1.6, z: 0 })).toBe(1);
  });
});
