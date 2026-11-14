import { describe, expect, test } from "bun:test";
import { TOD } from "@/config";
import {
  BOUNCE_GAIN,
  BOUNCE_PANELS,
  apertureGate,
  bouncePanel,
  driveFromRecipe,
  emissionBasis,
  evaluateBounce,
  type BounceDrive,
} from "@/world/bounce";

function withDrive(base: BounceDrive, patch: Partial<BounceDrive>): BounceDrive {
  return { ...base, ...patch };
}

describe("bounce panels", () => {
  test("stays a small fixed set of surfaces", () => {
    expect(BOUNCE_PANELS.length).toBe(12);
    expect(BOUNCE_GAIN).toBeGreaterThan(0);
    expect(new Set(BOUNCE_PANELS.map((panel) => panel.id)).size).toBe(BOUNCE_PANELS.length);
  });

  test("every panel is a finite rectangle inside an ordered room box", () => {
    for (const panel of BOUNCE_PANELS) {
      expect(panel.width).toBeGreaterThan(0.4);
      expect(panel.height).toBeGreaterThan(0.4);
      expect(panel.box.minX).toBeLessThan(panel.box.maxX);
      expect(panel.box.minY).toBeLessThan(panel.box.maxY);
      expect(panel.box.minZ).toBeLessThan(panel.box.maxZ);
      expect(panel.feather).toBeGreaterThan(0);
      expect(panel.featherY).toBeGreaterThan(0);
      const normal = Math.hypot(panel.nx, panel.ny, panel.nz);
      expect(normal).toBeCloseTo(1, 5);
      expect(panel.x).toBeGreaterThan(panel.box.minX - 1);
      expect(panel.x).toBeLessThan(panel.box.maxX + 1);
    }
  });

  test("upper floors do not share a vertical band with the ground floor", () => {
    const ground = bouncePanel("livingFloor");
    const upper = bouncePanel("upWestFloor");
    expect(ground.box.maxY + ground.featherY).toBeLessThan(3.34);
    expect(upper.box.minY - upper.featherY).toBeGreaterThan(3.05);
  });

  test("court and lawn stay outside; rooms stay inside", () => {
    for (const id of ["courtDeck", "pool", "courtWall", "southLawn"]) {
      expect(bouncePanel(id).outdoor).toBe(true);
    }
    for (const id of ["livingFloor", "livingReturn", "diningFloor", "hallFloor", "stair"]) {
      expect(bouncePanel(id).outdoor).toBe(false);
    }
  });
});

describe("emission basis", () => {
  test("a floor panel emits up and keeps its width axis", () => {
    const basis = emissionBasis([0, 1, 0], [1, 0, 0]);
    expect(basis.emission.y).toBeCloseTo(1, 5);
    expect(basis.x.x).toBeCloseTo(1, 5);
    expect(basis.y.z).toBeCloseTo(1, 5);
    const dot = basis.x.x * basis.y.x + basis.x.y * basis.y.y + basis.x.z * basis.y.z;
    expect(dot).toBeCloseTo(0, 5);
  });

  test("the living return emits back toward the west glass", () => {
    const panel = bouncePanel("livingReturn");
    const basis = emissionBasis(
      [panel.nx, panel.ny, panel.nz],
      [panel.axisX, panel.axisY, panel.axisZ],
    );
    expect(basis.emission.x).toBeCloseTo(-1, 5);
    expect(Math.hypot(basis.x.x, basis.x.y, basis.x.z)).toBeCloseTo(1, 5);
    expect(Math.hypot(basis.y.x, basis.y.y, basis.y.z)).toBeCloseTo(1, 5);
  });
});

describe("bounce luminance", () => {
  test("every time of day is finite and positive on every panel", () => {
    for (const id of ["dawn", "day", "dusk", "night"] as const) {
      const drive = driveFromRecipe(TOD[id]);
      for (const panel of BOUNCE_PANELS) {
        const lit = evaluateBounce(panel, drive);
        expect(Number.isFinite(lit.r)).toBe(true);
        expect(Number.isFinite(lit.g)).toBe(true);
        expect(Number.isFinite(lit.b)).toBe(true);
        expect(lit.peak).toBeGreaterThan(0);
      }
    }
  });

  test("a west-facing wall catches the dusk sun and misses an east sun", () => {
    const wall = bouncePanel("livingReturn");
    const dusk = withDrive(driveFromRecipe(TOD.dusk), { lamps: 0, hemi: 0 });
    const east = withDrive(dusk, { sunDir: [1, 0.05, 0] });
    const west = withDrive(dusk, { sunDir: [-1, 0.05, 0] });
    expect(evaluateBounce(wall, west).peak).toBeGreaterThan(0.2);
    expect(evaluateBounce(wall, east).peak).toBeLessThan(0.02);
    expect(evaluateBounce(wall, dusk).peak).toBeGreaterThan(
      evaluateBounce(wall, driveFromRecipe(TOD.day)).peak,
    );
  });

  test("horizontal floors take more sun at noon than at dusk", () => {
    const floor = bouncePanel("livingFloor");
    const deck = bouncePanel("courtDeck");
    const day = withDrive(driveFromRecipe(TOD.day), { lamps: 0 });
    const dusk = withDrive(driveFromRecipe(TOD.dusk), { lamps: 0 });
    expect(evaluateBounce(floor, day).peak).toBeGreaterThan(evaluateBounce(floor, dusk).peak);
    expect(evaluateBounce(deck, day).peak).toBeGreaterThan(evaluateBounce(deck, dusk).peak * 1.5);
  });

  test("the living floor prefers the west glass at dusk and the south glass at noon", () => {
    const floor = bouncePanel("livingFloor");
    const base = withDrive(driveFromRecipe(TOD.day), { lamps: 0, hemi: 0, sunInt: 1 });
    const fromWest = evaluateBounce(floor, withDrive(base, { sunDir: [-0.9, 0.2, 0.05] }));
    const fromEast = evaluateBounce(floor, withDrive(base, { sunDir: [0.9, 0.2, 0.05] }));
    const fromSouth = evaluateBounce(floor, withDrive(base, { sunDir: [0.1, 0.45, 0.9] }));
    expect(fromWest.peak).toBeGreaterThan(fromEast.peak * 3);
    expect(fromSouth.peak).toBeGreaterThan(fromEast.peak * 2);
  });

  test("night lamp bounce is warm, and it disappears when the lamps are off", () => {
    const floor = bouncePanel("livingFloor");
    const night = withDrive(driveFromRecipe(TOD.night), { sunInt: 0, hemi: 0 });
    const dark = withDrive(night, { lamps: 0 });
    const lit = evaluateBounce(floor, night);
    expect(lit.r).toBeGreaterThan(lit.b);
    expect(evaluateBounce(floor, dark).peak).toBe(0);
  });

  test("dusk court light is warmer than night court light", () => {
    const deck = bouncePanel("courtDeck");
    const dusk = evaluateBounce(deck, withDrive(driveFromRecipe(TOD.dusk), { lamps: 0 }));
    const night = evaluateBounce(deck, withDrive(driveFromRecipe(TOD.night), { lamps: 0 }));
    expect(dusk.r / dusk.b).toBeGreaterThan(night.r / night.b);
  });

  test("the south lawn follows the recipe grass color", () => {
    const lawn = bouncePanel("southLawn");
    const dawn = evaluateBounce(
      lawn,
      withDrive(driveFromRecipe(TOD.dawn), { sunInt: 0, lamps: 0 }),
    );
    const day = evaluateBounce(lawn, withDrive(driveFromRecipe(TOD.day), { sunInt: 0, lamps: 0 }));
    expect(dawn.g).not.toBeCloseTo(day.g, 3);
  });

  test("the hall only takes sun that can come in the south door", () => {
    const hall = bouncePanel("hallFloor");
    const base = withDrive(driveFromRecipe(TOD.day), { lamps: 0, hemi: 0, sunInt: 1 });
    const south = evaluateBounce(hall, withDrive(base, { sunDir: [0, 0.4, 1] }));
    const north = evaluateBounce(hall, withDrive(base, { sunDir: [0, 0.4, -1] }));
    expect(south.peak).toBeGreaterThan(north.peak * 4);
    expect(apertureGate([0, 0.4, -1], hall.apertures)).toBe(0);
  });
});
