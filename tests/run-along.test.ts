import { describe, expect, test } from "bun:test";
import { runAlong } from "../src/scene/geom";

describe("runAlong", () => {
  test("includes both ends when the span divides evenly", () => {
    expect(runAlong(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  test("rounds the division count and spaces the points evenly", () => {
    const points = runAlong(0, 10, 3);
    expect(points).toHaveLength(4);
    expect(points[0]).toBe(0);
    expect(points[3]).toBe(10);
    expect(points[1]).toBeCloseTo(10 / 3);
    expect(points[2]).toBeCloseTo(20 / 3);
  });

  test("still places the two ends when the span is shorter than the spacing", () => {
    expect(runAlong(0, 0.1, 1)).toEqual([0, 0.1]);
  });

  test("returns nothing when the inset consumes the span", () => {
    expect(runAlong(0, 1, 0.2, 0.6)).toEqual([]);
    expect(runAlong(5, 5, 1)).toEqual([]);
    expect(runAlong(2, 1, 0.5)).toEqual([]);
  });

  test("insets both ends before dividing", () => {
    expect(runAlong(0, 10, 2, 1)).toEqual([1, 3, 5, 7, 9]);
  });
});
