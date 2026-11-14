import { describe, expect, test } from "bun:test";
import { MAX_BACKING_PIXELS, MAX_PIXEL_RATIO, resolvePixelRatio } from "@/engine";

describe("resolvePixelRatio", () => {
  test("a 16-inch 2x window stays under 1.5 and near 2.5 megapixels", () => {
    const cssW = 3456 / 2;
    const cssH = 2234 / 2;
    const ratio = resolvePixelRatio(cssW, cssH, 2);
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThanOrEqual(MAX_PIXEL_RATIO);
    const pixels = cssW * ratio * (cssH * ratio);
    expect(pixels).toBeLessThanOrEqual(MAX_BACKING_PIXELS * 1.001);
    expect(pixels).toBeGreaterThan(MAX_BACKING_PIXELS * 0.95);
  });

  test("a 1x 1080p screen stays at one pixel per CSS pixel", () => {
    expect(resolvePixelRatio(1920, 1080, 1)).toBe(1);
  });

  test("a modest 2x screen uses the 1.5 cap and stays sharper than 1x", () => {
    const ratio = resolvePixelRatio(1280, 800, 2);
    expect(ratio).toBe(MAX_PIXEL_RATIO);
    expect(1280 * ratio * 800 * ratio).toBeLessThan(MAX_BACKING_PIXELS);
  });

  test("does not exceed the device pixel ratio", () => {
    expect(resolvePixelRatio(800, 600, 1.25)).toBe(1.25);
  });
});
