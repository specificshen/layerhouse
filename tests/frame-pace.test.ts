import { describe, expect, test } from "bun:test";
import {
  ACTIVE_HZ,
  IDLE_AFTER_MS,
  IDLE_HZ,
  createFrameGate,
  frameAction,
  markDrawn,
  noteInput,
  scheduleDelayMs,
} from "@/engine/frame-pace";

function countDraws(hidden: boolean, idle: boolean, hz: number, seconds: number): number {
  const gate = createFrameGate(idle ? -IDLE_AFTER_MS - 1 : 0);
  let draws = 0;
  const step = 1000 / hz;
  const samples = Math.round(seconds * hz);
  for (let i = 0; i <= samples; i++) {
    const now = i * step;
    if (frameAction(gate, now, hidden) === "draw") {
      draws += 1;
      markDrawn(gate, now);
    }
  }
  return draws;
}

describe("frame pace", () => {
  test("a hidden tab does not draw and stops the loop", () => {
    const gate = createFrameGate(0);
    expect(frameAction(gate, 0, true)).toBe("stop");
    expect(frameAction(gate, 1000, true)).toBe("stop");
    expect(countDraws(true, false, 120, 1)).toBe(0);
  });

  test("an active 120Hz stream draws at 60fps, not every refresh", () => {
    const draws = countDraws(false, false, 120, 1);
    // Inclusive of t = 0 and t = 1s, a 60Hz cadence lands on 61 timestamps.
    expect(draws).toBeGreaterThanOrEqual(ACTIVE_HZ);
    expect(draws).toBeLessThanOrEqual(ACTIVE_HZ + 1);
  });

  test("two seconds without input drops the cadence to 30fps", () => {
    const gate = createFrameGate(0);
    markDrawn(gate, 0);
    const idleAt = IDLE_AFTER_MS + 5;
    expect(frameAction(gate, idleAt, false)).toBe("draw");
    markDrawn(gate, idleAt);
    expect(frameAction(gate, idleAt + 1000 / ACTIVE_HZ, false)).toBe("wait");
    expect(frameAction(gate, idleAt + 1000 / IDLE_HZ, false)).toBe("draw");

    const idleDraws = countDraws(false, true, 120, 1);
    expect(idleDraws).toBeGreaterThanOrEqual(IDLE_HZ);
    expect(idleDraws).toBeLessThanOrEqual(IDLE_HZ + 3);
  });

  test("pointer or key input returns the cadence to 60fps", () => {
    const gate = createFrameGate(0);
    const t = IDLE_AFTER_MS + 500;
    markDrawn(gate, t);
    noteInput(gate, t);
    expect(frameAction(gate, t + 1000 / ACTIVE_HZ, false)).toBe("draw");
    expect(scheduleDelayMs(gate, t)).toBeGreaterThan(15);
    expect(scheduleDelayMs(gate, t)).toBeLessThan(18);
  });

  test("the next frame is due immediately on the first draw", () => {
    const gate = createFrameGate(0);
    expect(frameAction(gate, 0, false)).toBe("draw");
    expect(scheduleDelayMs(gate, 0)).toBe(0);
  });
});
