import { describe, expect, test } from "bun:test";
import { lookDirection, lookRight, pitchDelta, yawDelta } from "@/features/walk/look";

function alongRight(yaw: number, nextYaw: number): number {
  const ahead = lookDirection(yaw, 0);
  const turned = lookDirection(nextYaw, 0);
  const right = lookRight(yaw);
  return (turned.x - ahead.x) * right.x + (turned.z - ahead.z) * right.z;
}

describe("walk mouse look", () => {
  test("moving the mouse right turns the view right", () => {
    const yaw = 0.4;
    const next = yaw + yawDelta(24);
    expect(next).toBeGreaterThan(yaw);
    expect(alongRight(yaw, next)).toBeGreaterThan(0);
  });

  test("moving the mouse left turns the view left", () => {
    const yaw = 0.4;
    const next = yaw + yawDelta(-24);
    expect(next).toBeLessThan(yaw);
    expect(alongRight(yaw, next)).toBeLessThan(0);
  });

  test("mouse down looks down and mouse up looks up", () => {
    expect(pitchDelta(10)).toBeLessThan(0);
    expect(pitchDelta(-10)).toBeGreaterThan(0);
    expect(lookDirection(0, pitchDelta(10)).y).toBeLessThan(0);
    expect(lookDirection(0, pitchDelta(-10)).y).toBeGreaterThan(0);
  });
});
