import { describe, expect, test } from "bun:test";
import { heightAt } from "../src/scene/house";
import type { FloorPad, HouseRecord, StairRun } from "../src/types";

function record(floors: FloorPad[], stairs: StairRun[] = []): HouseRecord {
  return { floors, stairs } as HouseRecord;
}

const ground: FloorPad = { x0: 0, x1: 4, z0: 0, z1: 4, y: 0.14, level: 0 };
const upper: FloorPad = { x0: 0, x1: 4, z0: 0, z1: 4, y: 3.34, level: 1 };
const stair: StairRun = { x0: 1, x1: 2, zStart: 0, zEnd: 4, yStart: 0.14, yEnd: 3.34 };

describe("heightAt", () => {
  test("returns 0 when no floor contains the point", () => {
    expect(heightAt(record([]), 1, 1)).toBe(0);
    expect(heightAt(record([ground]), 9, 1)).toBe(0);
  });

  test("picks the highest floor at or below the eye limit", () => {
    const rec = record([upper, ground]);
    expect(heightAt(rec, 1, 1)).toBe(3.34);
    expect(heightAt(rec, 1, 1, 0.2)).toBe(0.14);
    expect(heightAt(rec, 1, 1, 3)).toBe(3.34);
  });

  test("includes a floor exactly at the limit and the pad edges", () => {
    const rec = record([ground]);
    expect(heightAt(rec, 0, 0, 0.14 - 0.45)).toBe(0.14);
    expect(heightAt(rec, 4, 4)).toBe(0.14);
  });

  test("interpolates a stair and prefers it over a floor", () => {
    const rec = record([upper, ground], [stair]);
    expect(heightAt(rec, 1.5, 0)).toBeCloseTo(0.14);
    expect(heightAt(rec, 1.5, 2)).toBeCloseTo(1.74);
    expect(heightAt(rec, 1.5, 4)).toBeCloseTo(3.34);
  });

  test("ignores a stair outside its footprint and uses the first stair that matches", () => {
    const other: StairRun = { x0: 1, x1: 2, zStart: 0, zEnd: 4, yStart: 10, yEnd: 10 };
    const rec = record([ground], [stair, other]);
    expect(heightAt(rec, 0.5, 2)).toBe(0.14);
    expect(heightAt(rec, 1.5, 2)).toBeCloseTo(1.74);
  });

  test("clamps the stair blend at the ends of a reversed run", () => {
    const reversed: StairRun = { x0: 0, x1: 1, zStart: 4, zEnd: 0, yStart: 3, yEnd: 0 };
    const rec = record([], [reversed]);
    expect(heightAt(rec, 0.5, 4)).toBeCloseTo(3);
    expect(heightAt(rec, 0.5, 0)).toBeCloseTo(0);
    expect(heightAt(rec, 0.5, 2)).toBeCloseTo(1.5);
  });
});
