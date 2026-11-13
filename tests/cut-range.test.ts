import { describe, expect, test } from "bun:test";
import { cutRange } from "../src/app/section";
import type { CutDir } from "../src/types";
import type { Session } from "../src/app/session";

function session(cutDir: CutDir): Session {
  return { cutDir } as Session;
}

describe("cutRange", () => {
  test("returns the top, side, and front ranges", () => {
    expect(cutRange(session("top"))).toEqual({ min: 0.15, max: 9.2, def: 4.3 });
    expect(cutRange(session("side"))).toEqual({ min: -11.2, max: 7.0, def: 1.0 });
    expect(cutRange(session("front"))).toEqual({ min: -8.0, max: 8.0, def: 1.2 });
  });
});
