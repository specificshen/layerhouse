import { describe, expect, test } from "bun:test";
import {
  CAMERA_PRESET_IDS,
  CUT_DIRS,
  LAYER_IDS,
  TIME_IDS,
  VIEW_MODE_IDS,
  isCameraPresetId,
  isCutDir,
  isLayerId,
  isTimeId,
  isViewMode,
} from "../src/types";

describe("id type guards", () => {
  test("isViewMode accepts only the dial modes", () => {
    for (const id of VIEW_MODE_IDS) expect(isViewMode(id)).toBe(true);
    expect(isViewMode("boot")).toBe(false);
    expect(isViewMode(undefined)).toBe(false);
    expect(isViewMode("")).toBe(false);
  });

  test("isTimeId accepts the four times of day", () => {
    for (const id of TIME_IDS) expect(isTimeId(id)).toBe(true);
    expect(isTimeId("noon")).toBe(false);
    expect(isTimeId(undefined)).toBe(false);
  });

  test("isLayerId accepts the construction layers", () => {
    for (const id of LAYER_IDS) expect(isLayerId(id)).toBe(true);
    expect(isLayerId("boot")).toBe(false);
    expect(isLayerId(undefined)).toBe(false);
  });

  test("isCutDir accepts top, side, and front", () => {
    for (const id of CUT_DIRS) expect(isCutDir(id)).toBe(true);
    expect(isCutDir("back")).toBe(false);
    expect(isCutDir(undefined)).toBe(false);
  });

  test("isCameraPresetId accepts the named orbit presets", () => {
    for (const id of CAMERA_PRESET_IDS) expect(isCameraPresetId(id)).toBe(true);
    expect(isCameraPresetId("explodedStreet")).toBe(false);
    expect(isCameraPresetId("walkStart")).toBe(false);
    expect(isCameraPresetId(undefined)).toBe(false);
  });
});
