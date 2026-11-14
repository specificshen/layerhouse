import { describe, expect, test } from "bun:test";
import { LAYER_IDS, TIME_IDS } from "@/types";
import { timeStatus, warmupPlan } from "@/world/warm";

describe("warmup plan", () => {
  test("covers every time of day and every dial mode before the first click", () => {
    const steps = warmupPlan();
    const ids = steps.map((step) => step.id);
    for (const id of TIME_IDS) {
      expect(ids).toContain(`time:${id}`);
      expect(timeStatus(id).length).toBeGreaterThan(0);
    }
    for (const mode of ["exterior", "exploded", "cut", "walk"] as const) {
      expect(ids).toContain(`mode:${mode}`);
    }
    for (const layer of LAYER_IDS) expect(ids).toContain(`mode:xray:${layer}`);
    expect(ids).toContain("overview");
    for (const step of steps) expect(step.status.trim().length).toBeGreaterThan(0);
  });
});
