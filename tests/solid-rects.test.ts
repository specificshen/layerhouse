import { describe, expect, test } from "bun:test";
import { solidRects } from "../src/scene/geom";

const opening = (a0: number, a1: number, y0: number, y1: number) => ({ a0, a1, y0, y1 });

describe("solidRects", () => {
  test("returns the wall itself when there are no openings", () => {
    expect(solidRects(0, 10, 0, 3)).toEqual([{ a0: 0, a1: 10, y0: 0, y1: 3 }]);
  });

  test("splits a band around an opening and keeps the solid above and below", () => {
    expect(solidRects(0, 10, 0, 3, [opening(2, 4, 1, 2)])).toEqual([
      { a0: 0, a1: 10, y0: 0, y1: 1 },
      { a0: 0, a1: 2, y0: 1, y1: 2 },
      { a0: 4, a1: 10, y0: 1, y1: 2 },
      { a0: 0, a1: 10, y0: 2, y1: 3 },
    ]);
  });

  test("clips an opening to the wall and drops a band that is fully open", () => {
    expect(solidRects(0, 4, 0, 3, [opening(-1, 10, 1, 2)])).toEqual([
      { a0: 0, a1: 4, y0: 0, y1: 1 },
      { a0: 0, a1: 4, y0: 2, y1: 3 },
    ]);
  });

  test("merges overlapping openings on the same band", () => {
    expect(solidRects(0, 10, 0, 2, [opening(2.5, 5, 0, 2), opening(1, 3, 0, 2)])).toEqual([
      { a0: 0, a1: 1, y0: 0, y1: 2 },
      { a0: 5, a1: 10, y0: 0, y1: 2 },
    ]);
  });

  test("skips bands thinner than 15 mm and ignores openings outside the wall", () => {
    expect(solidRects(0, 4, 0, 1, [opening(1, 2, 0.5, 0.51), opening(1, 2, -2, -1)])).toEqual([
      { a0: 0, a1: 4, y0: 0, y1: 0.5 },
      { a0: 0, a1: 4, y0: 0.51, y1: 1 },
    ]);
  });

  test("drops a sliver narrower than 12 mm beside an opening", () => {
    expect(solidRects(0, 4, 0, 1, [opening(0.005, 3.99, 0, 1)])).toEqual([]);
  });
});
