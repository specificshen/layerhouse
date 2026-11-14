import { describe, expect, test } from "bun:test";
import { LOAD_KINDS, loadFraction, loadStatus } from "@/ui/loader";

describe("loader progress", () => {
  test("the bar starts visible, advances, and reaches full only at the end", () => {
    const start = loadFraction(0, 8);
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan(loadFraction(1, 8));
    expect(loadFraction(3, 8)).toBeGreaterThan(loadFraction(2, 8));
    expect(loadFraction(7, 8)).toBeLessThan(1);
    expect(loadFraction(8, 8)).toBe(1);
  });

  test("every stage has its own status line", () => {
    const seen = new Set<string>();
    for (const kind of LOAD_KINDS) {
      const status = loadStatus(kind);
      expect(status.trim().length).toBeGreaterThan(0);
      expect(seen.has(status)).toBe(false);
      seen.add(status);
    }
  });
});
