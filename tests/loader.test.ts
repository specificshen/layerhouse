import { describe, expect, test } from "bun:test";
import { LOAD_KINDS, PAINT_FALLBACK_MS, loadFraction, loadStatus, nextPaint } from "@/ui/loader";
import type { PaintClock } from "@/ui/loader";

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

describe("loader paint yield", () => {
  function fakeClock() {
    let frameCb: (() => void) | null = null;
    let timerCb: (() => void) | null = null;
    let timerMs = 0;
    const clock: PaintClock = {
      requestFrame(callback) {
        frameCb = callback;
        return 1;
      },
      cancelFrame() {
        frameCb = null;
      },
      setTimer(callback, ms) {
        timerCb = callback;
        timerMs = ms;
        return 2;
      },
      clearTimer() {
        timerCb = null;
      },
    };
    return {
      clock,
      frame: () => frameCb,
      timer: () => timerCb,
      timerMs: () => timerMs,
    };
  }

  test("a delivered frame resolves and cancels the fallback", async () => {
    const fake = fakeClock();
    const pending = nextPaint(fake.clock);
    expect(fake.timerMs()).toBe(PAINT_FALLBACK_MS);
    expect(PAINT_FALLBACK_MS).toBeGreaterThanOrEqual(50);
    expect(PAINT_FALLBACK_MS).toBeLessThanOrEqual(100);
    fake.frame()?.();
    await pending;
    expect(fake.timer()).toBeNull();
  });

  test("the fallback resolves when no animation frame arrives", async () => {
    const fake = fakeClock();
    const pending = nextPaint(fake.clock);
    expect(fake.frame()).not.toBeNull();
    fake.timer()?.();
    await pending;
    expect(fake.frame()).toBeNull();
  });
});
