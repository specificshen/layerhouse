import { COURT, MAIN, POOL, Y_GF_TOP, Y_L2_TOP } from "@/config";
import type { TimeRecipe } from "@/types";

/**
 * One-bounce indirect light for 浅庭.
 *
 * Each panel is a real surface (oak floor, plaster return, court deck, pool,
 * north stucco, south lawn). Its luminance is albedo times the light that
 * actually reaches it: sun through the apertures that face the sun, sky through
 * the same openings, and warm lamps when they are on. A rect area light then
 * emits that luminance along the surface normal, and a soft room box keeps it
 * from shining through the rest of the house.
 *
 * Screen-space GI is intentionally not used. It sparkles and misses anything
 * outside the frame. These panels update only when the time of day or the roof
 * changes.
 */

/** Scene-unit scale. Rect-area intensity is luminance, so this is not a tint. */
export const BOUNCE_GAIN = 7.2;

/**
 * Illuminance a fully lit lamp recipe (lamps = 1, lampAccess = 1) puts on a
 * nearby surface, in the same arbitrary units as `sunInt` and `hemi`.
 */
const LAMP_ILLUMINANCE = 1.05;

const LAMP_COLOR = 0xffd8a0;

export interface BounceAperture {
  /** Horizontal direction from the room toward the opening. */
  x: number;
  z: number;
  /** Relative size of that opening. */
  weight: number;
}

export interface BounceBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export type BounceSun = "floor" | "face";

export interface BouncePanel {
  id: string;
  x: number;
  y: number;
  z: number;
  /** Extent along the panel's width axis. */
  width: number;
  /** Extent along the panel's height axis. */
  height: number;
  nx: number;
  ny: number;
  nz: number;
  /** World direction of the rectangle's width. */
  axisX: number;
  axisY: number;
  axisZ: number;
  /** sRGB hex, or the time-of-day lawn color. */
  albedo: number | "grass";
  sun: BounceSun;
  /** Fraction of direct sun that survives windows, overhangs, and furniture. */
  sunAccess: number;
  /** Fraction of the sky hemisphere this surface can see. */
  skyAccess: number;
  /** Fraction of interior lamp light this surface catches. */
  lampAccess: number;
  /** Extra energy scale. Water and grass reflect less than their albedo suggests. */
  reflectance: number;
  /** Open ground. The lifted roof does not uncover these. */
  outdoor: boolean;
  apertures: readonly BounceAperture[];
  box: BounceBox;
  /** Horizontal fade so a doorway leaks a little and a solid wall does not. */
  feather: number;
  /** Vertical fade. Tight, so one floor does not light the floor above. */
  featherY: number;
}

export interface BounceDrive {
  sunDir: readonly [number, number, number];
  sunColor: number;
  sunInt: number;
  hemiSky: number;
  hemi: number;
  lamps: number;
  lampColor: number;
  grass: number;
}

export interface BounceLuminance {
  r: number;
  g: number;
  b: number;
  peak: number;
}

export interface EmissionBasis {
  x: { x: number; y: number; z: number };
  y: { x: number; y: number; z: number };
  z: { x: number; y: number; z: number };
  emission: { x: number; y: number; z: number };
}

interface PanelInit extends Omit<
  BouncePanel,
  "reflectance" | "outdoor" | "apertures" | "feather" | "featherY"
> {
  reflectance?: number;
  outdoor?: boolean;
  apertures?: readonly BounceAperture[];
  feather?: number;
  featherY?: number;
}

function define(panel: PanelInit): BouncePanel {
  return {
    reflectance: 1,
    outdoor: false,
    apertures: [],
    feather: 0.32,
    featherY: 0.16,
    ...panel,
  };
}

const floorY = Y_GF_TOP + 0.08;
const upperY = Y_L2_TOP + 0.08;

export const BOUNCE_PANELS: readonly BouncePanel[] = [
  define({
    id: "livingFloor",
    x: -4.35,
    y: floorY,
    z: 2.05,
    width: 5.2,
    height: 7.6,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.74,
    skyAccess: 0.38,
    lampAccess: 0.4,
    apertures: [
      { x: -1, z: 0, weight: 0.92 },
      { x: 0, z: 1, weight: 0.56 },
    ],
    box: { minX: -7.3, minY: 0.02, minZ: -2.45, maxX: -1.32, maxY: 3.12, maxZ: 6.35 },
  }),
  define({
    id: "livingReturn",
    x: -2.05,
    y: 1.5,
    z: 1.85,
    width: 6.6,
    height: 2.2,
    nx: -1,
    ny: 0,
    nz: 0,
    axisX: 0,
    axisY: 0,
    axisZ: 1,
    albedo: 0xefe8dc,
    sun: "face",
    sunAccess: 0.52,
    skyAccess: 0.4,
    lampAccess: 0.22,
    box: { minX: -7.3, minY: 0.02, minZ: -2.45, maxX: -1.32, maxY: 3.12, maxZ: 6.35 },
  }),
  define({
    id: "diningFloor",
    x: 4.55,
    y: floorY,
    z: 1.9,
    width: 3.9,
    height: 7.7,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.62,
    skyAccess: 0.58,
    lampAccess: 0.34,
    apertures: [
      { x: 0, z: 1, weight: 0.52 },
      { x: 1, z: 0, weight: 0.4 },
      { x: 0, z: -1, weight: 0.24 },
    ],
    box: { minX: 2.32, minY: 0.02, minZ: -2.5, maxX: 6.95, maxY: 3.12, maxZ: 6.35 },
  }),
  define({
    id: "hallFloor",
    x: -0.15,
    y: floorY,
    z: 4.35,
    width: 2.7,
    height: 3.3,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.48,
    skyAccess: 0.24,
    lampAccess: 0.58,
    apertures: [{ x: 0, z: 1, weight: 0.78 }],
    box: { minX: -1.75, minY: 0.02, minZ: 2.15, maxX: 2.7, maxY: 3.12, maxZ: 6.4 },
  }),
  define({
    id: "stair",
    x: 1.52,
    y: floorY + 0.2,
    z: 0.45,
    width: 1.7,
    height: 4.1,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0xd2b48c,
    sun: "floor",
    sunAccess: 0.32,
    skyAccess: 0.16,
    lampAccess: 0.66,
    apertures: [{ x: 0, z: 1, weight: 0.62 }],
    feather: 0.28,
    featherY: 0.2,
    box: { minX: 0.38, minY: 0.04, minZ: -2.1, maxX: 2.68, maxY: 6.02, maxZ: 3.2 },
  }),
  define({
    id: "wingFloor",
    x: -4.4,
    y: floorY,
    z: -6.35,
    width: 5.3,
    height: 7.5,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.58,
    skyAccess: 0.4,
    lampAccess: 0.4,
    apertures: [
      { x: -1, z: 0, weight: 0.62 },
      { x: 0, z: -1, weight: 0.5 },
      { x: 1, z: 0, weight: 0.38 },
    ],
    box: { minX: -7.35, minY: 0.02, minZ: -10.65, maxX: -1.35, maxY: 3.08, maxZ: -1.95 },
  }),
  define({
    id: "upWestFloor",
    x: -3.65,
    y: upperY,
    z: 1.55,
    width: 6.5,
    height: 7.5,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.64,
    skyAccess: 0.42,
    lampAccess: 0.4,
    apertures: [
      { x: -1, z: 0, weight: 0.78 },
      { x: 0, z: 1, weight: 0.48 },
    ],
    box: { minX: -7.3, minY: 3.36, minZ: -2.45, maxX: 0.02, maxY: 6.28, maxZ: 6.35 },
  }),
  define({
    id: "upEastFloor",
    x: 4.65,
    y: upperY,
    z: 1.45,
    width: 3.9,
    height: 7.4,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x9a6a42,
    sun: "floor",
    sunAccess: 0.58,
    skyAccess: 0.52,
    lampAccess: 0.36,
    apertures: [
      { x: 0, z: -1, weight: 0.32 },
      { x: 0, z: 1, weight: 0.46 },
      { x: 1, z: 0, weight: 0.4 },
    ],
    box: { minX: 2.35, minY: 3.36, minZ: -2.45, maxX: 6.95, maxY: 6.28, maxZ: 6.35 },
  }),
  define({
    id: "courtDeck",
    x: (COURT.x0 + COURT.x1) / 2,
    y: 0.1,
    z: (COURT.z0 + COURT.z1) / 2,
    width: COURT.x1 - COURT.x0 - 0.2,
    height: COURT.z1 - COURT.z0 - 0.2,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x6b5340,
    sun: "floor",
    sunAccess: 0.86,
    skyAccess: 1,
    lampAccess: 0.06,
    reflectance: 0.72,
    outdoor: true,
    feather: 0.4,
    featherY: 0.28,
    box: {
      minX: COURT.x0 - 0.9,
      minY: 0,
      minZ: COURT.z0 - 1.4,
      maxX: COURT.x1 + 0.7,
      maxY: 6.55,
      maxZ: -0.35,
    },
  }),
  define({
    id: "pool",
    x: (POOL.x0 + POOL.x1) / 2,
    y: 0.22,
    z: (POOL.z0 + POOL.z1) / 2,
    width: POOL.x1 - POOL.x0 - 0.2,
    height: POOL.z1 - POOL.z0 - 0.15,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0x5aa8a0,
    sun: "floor",
    sunAccess: 0.8,
    skyAccess: 0.92,
    lampAccess: 0.04,
    reflectance: 0.32,
    outdoor: true,
    feather: 0.45,
    featherY: 0.28,
    box: {
      minX: COURT.x0 - 0.6,
      minY: 0,
      minZ: COURT.z0 - 0.8,
      maxX: COURT.x1 + 0.5,
      maxY: 5.4,
      maxZ: -0.55,
    },
  }),
  define({
    id: "courtWall",
    x: (MAIN.x0 + MAIN.x1) / 2 + 0.4,
    y: 2.15,
    z: MAIN.z0 - 0.55,
    width: 8.4,
    height: 3.5,
    nx: 0,
    ny: 0,
    nz: -1,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: 0xd8cfc2,
    sun: "face",
    sunAccess: 0.35,
    skyAccess: 0.72,
    lampAccess: 0.04,
    reflectance: 0.8,
    outdoor: true,
    feather: 0.4,
    featherY: 0.3,
    box: {
      minX: COURT.x0 - 0.8,
      minY: 0,
      minZ: COURT.z0 - 1.2,
      maxX: COURT.x1 + 0.6,
      maxY: 6.4,
      maxZ: -1.7,
    },
  }),
  define({
    id: "southLawn",
    x: (MAIN.x0 + MAIN.x1) / 2,
    y: 0.05,
    z: MAIN.z1 + 4.6,
    width: 16,
    height: 8.5,
    nx: 0,
    ny: 1,
    nz: 0,
    axisX: 1,
    axisY: 0,
    axisZ: 0,
    albedo: "grass",
    sun: "floor",
    sunAccess: 0.88,
    skyAccess: 0.95,
    lampAccess: 0.1,
    reflectance: 0.36,
    outdoor: true,
    feather: 0.36,
    featherY: 0.24,
    box: { minX: -10, minY: 0, minZ: 5.95, maxX: 10, maxY: 7.1, maxZ: 20 },
  }),
];

export function driveFromRecipe(recipe: TimeRecipe): BounceDrive {
  return {
    sunDir: recipe.sunDir,
    sunColor: recipe.sunColorDir,
    sunInt: recipe.sunInt,
    hemiSky: recipe.hemiSky,
    hemi: recipe.hemi,
    lamps: recipe.lamps,
    lampColor: LAMP_COLOR,
    grass: recipe.grass,
  };
}

export function srgbHexToLinear(hex: number): [number, number, number] {
  const channel = (byte: number) => {
    const c = byte / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [channel((hex >> 16) & 255), channel((hex >> 8) & 255), channel(hex & 255)];
}

function normalize3(v: readonly [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-8) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** How squarely the sun's horizontal direction faces an opening. High sun still needs a window. */
export function apertureGate(
  sunDir: readonly [number, number, number],
  apertures: readonly BounceAperture[],
): number {
  if (apertures.length === 0) return 1;
  const horizontal = Math.hypot(sunDir[0], sunDir[2]);
  if (horizontal < 1e-4) {
    return apertures.reduce((max, aperture) => Math.max(max, aperture.weight), 0);
  }
  let gate = 0;
  for (const aperture of apertures) {
    const len = Math.hypot(aperture.x, aperture.z);
    if (len < 1e-4 || aperture.weight <= 0) continue;
    const facing = Math.max(
      0,
      (sunDir[0] * aperture.x + sunDir[2] * aperture.z) / (horizontal * len),
    );
    gate = Math.max(gate, facing * facing * aperture.weight);
  }
  return gate;
}

function sunFactor(panel: BouncePanel, sunDir: readonly [number, number, number]): number {
  switch (panel.sun) {
    case "floor":
      return Math.max(0, sunDir[1]) * panel.sunAccess * apertureGate(sunDir, panel.apertures);
    case "face":
      return (
        Math.max(0, panel.nx * sunDir[0] + panel.ny * sunDir[1] + panel.nz * sunDir[2]) *
        panel.sunAccess
      );
    default: {
      const unexpected: never = panel.sun;
      return unexpected;
    }
  }
}

function albedoLinear(panel: BouncePanel, drive: BounceDrive): [number, number, number] {
  if (panel.albedo === "grass") return srgbHexToLinear(drive.grass);
  return srgbHexToLinear(panel.albedo);
}

/** Premultiplied linear luminance for one panel at one time of day. */
export function evaluateBounce(panel: BouncePanel, drive: BounceDrive): BounceLuminance {
  const sunDir = normalize3(drive.sunDir);
  const sun = srgbHexToLinear(drive.sunColor);
  const sky = srgbHexToLinear(drive.hemiSky);
  const lamp = srgbHexToLinear(drive.lampColor);
  const albedo = albedoLinear(panel, drive);
  const sunScale = Math.max(0, drive.sunInt) * sunFactor(panel, sunDir);
  const skyScale = Math.max(0, drive.hemi) * Math.max(0, panel.skyAccess);
  const lampScale = Math.max(0, drive.lamps) * Math.max(0, panel.lampAccess) * LAMP_ILLUMINANCE;
  const reflect = (Math.max(0, panel.reflectance) * BOUNCE_GAIN) / Math.PI;
  const r = albedo[0] * (sun[0] * sunScale + sky[0] * skyScale + lamp[0] * lampScale) * reflect;
  const g = albedo[1] * (sun[1] * sunScale + sky[1] * skyScale + lamp[1] * lampScale) * reflect;
  const b = albedo[2] * (sun[2] * sunScale + sky[2] * skyScale + lamp[2] * lampScale) * reflect;
  return { r, g, b, peak: Math.max(r, g, b) };
}

/**
 * Rect area lights emit along local −Z. The returned basis points local −Z
 * along `normal`, and local +X along `widthAxis`.
 */
export function emissionBasis(
  normal: readonly [number, number, number],
  widthAxis: readonly [number, number, number],
): EmissionBasis {
  const n = normalize3(normal);
  const z = { x: -n[0], y: -n[1], z: -n[2] };
  const raw = normalize3(widthAxis);
  const along = raw[0] * z.x + raw[1] * z.y + raw[2] * z.z;
  const x = normalize3([raw[0] - along * z.x, raw[1] - along * z.y, raw[2] - along * z.z]);
  const y = {
    x: z.y * x[2] - z.z * x[1],
    y: z.z * x[0] - z.x * x[2],
    z: z.x * x[1] - z.y * x[0],
  };
  return {
    x: { x: x[0], y: x[1], z: x[2] },
    y,
    z,
    emission: { x: -z.x, y: -z.y, z: -z.z },
  };
}

export function bouncePanel(id: string): BouncePanel {
  const panel = BOUNCE_PANELS.find((item) => item.id === id);
  if (!panel) throw new Error(`unknown bounce panel ${id}`);
  return panel;
}
