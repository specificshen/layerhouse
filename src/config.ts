/** 层宅 / Layer House — original courtyard house dimensions (meters). */

import type { LayerId, OrbitPreset, TimeId, TimeRecipe, ViewMode, WalkPreset } from "./types";

export const TITLE = "层宅";
export const SUBTITLE = "Layer House";

export const STATS = {
  beds: 3,
  area: 186,
  year: 2024,
  tags: "庭院水池 · 临水栈道 · 书房",
};

export const EYE = 1.62;
export const SLAB = 0.26;
export const WALL_T = 0.2;
export const INT_WALL_T = 0.14;
export const FLOOR_H = 3.2;
export const Y_GROUT = 0.0;
export const Y_GF_TOP = 0.14;
export const Y_GF_CEIL = 3.05;
export const Y_L2_TOP = 3.34;
export const Y_L2_CEIL = 6.15;
export const Y_L2_WALL_TOP = 6.28;

/** Main two-story bar, long axis east–west. Street to the south (+Z). Water to the north (−Z). */
export const MAIN = { x0: -7.2, x1: 6.8, z0: -2.2, z1: 6.2 };

/** Single-story west wing extending toward the water. */
export const WING = { x0: -7.2, x1: -1.55, z0: -10.5, z1: -2.2 };

export const COURT = { x0: -1.55, x1: 6.8, z0: -10.2, z1: -2.2 };
export const POOL = { x0: 0.15, x1: 5.55, z0: -8.7, z1: -4.15 };

export const CARPORT = { x0: 6.9, x1: 11.3, z0: 1.4, z1: 6.2 };

export const LOT = { x0: -13.2, x1: 14.6, z0: -13.4, z1: 13.2 };

/** Canal / lake starts north of the lot. */
export const WATER_EDGE = -12.55;

export const ROOF = {
  pitch: (26 * Math.PI) / 180,
  overhang: 0.55,
  thickness: 0.12,
  ridgeZ: (MAIN.z0 + MAIN.z1) / 2,
  wingEaveSouth: 4.15,
  wingEaveNorth: 3.35,
};

export const ROOF_LIFT = 3.6;

export const LAYERS: ReadonlyArray<{ id: LayerId; en: string; zh: string }> = [
  { id: "framing", en: "Framing & supports", zh: "结构骨架" },
  { id: "masonry", en: "Masonry & concrete", zh: "砌体混凝土" },
  { id: "roof", en: "Roof", zh: "屋面" },
  { id: "walls", en: "Walls & finishes", zh: "墙体饰面" },
  { id: "insulation", en: "Insulation", zh: "保温" },
  { id: "fenestration", en: "Doors & windows", zh: "门窗" },
  { id: "hvac", en: "Heating & cooling", zh: "暖通" },
  { id: "electrical", en: "Electrical", zh: "电气" },
  { id: "plumbing", en: "Plumbing", zh: "给排水" },
  { id: "furniture", en: "Fixtures & furniture", zh: "家具陈设" },
  { id: "site", en: "Site & outdoors", zh: "场地室外" },
  { id: "landscape", en: "Landscape", zh: "景观" },
];

export const VIEW_MODES: ReadonlyArray<{ id: ViewMode; en: string; zh: string }> = [
  { id: "exterior", en: "Exterior", zh: "外观" },
  { id: "exploded", en: "Exploded", zh: "剖开" },
  { id: "cut", en: "Cut view", zh: "剖切" },
  { id: "xray", en: "X-ray", zh: "透视" },
  { id: "walk", en: "Walkthrough", zh: "漫游" },
];

export const TIMES: ReadonlyArray<{ id: TimeId; en: string; zh: string }> = [
  { id: "night", en: "Night", zh: "夜晚" },
  { id: "dawn", en: "Dawn", zh: "黎明" },
  { id: "day", en: "Day", zh: "白昼" },
  { id: "dusk", en: "Dusk", zh: "黄昏" },
];

/** Lighting / sky recipes for each discrete time of day. */
export const TOD = {
  day: {
    top: 0xc9d8e8,
    horizon: 0xd7e2ec,
    bottom: 0xb8c6b0,
    sunColor: 0xfff4de,
    sunDir: [0.35, 0.82, 0.42],
    sunSize: 0.999,
    glow: 0.35,
    hemiSky: 0xdce6f0,
    hemiGround: 0x8a9078,
    hemi: 1.15,
    amb: 0x9aa4a0,
    ambInt: 0.45,
    sunInt: 2.35,
    sunColorDir: 0xfff3e0,
    fillInt: 0.28,
    fillColor: 0xc9d6e4,
    exposure: 1.05,
    fog: 0xc5d2ce,
    fogDen: 0.006,
    lamps: 0,
    windowWarm: 0.05,
    poolGlow: 0.04,
    waterTint: 0x4a6a72,
    grass: 0x4d7a3e,
    shadow: 0.62,
  },
  dawn: {
    top: 0x7fa0c4,
    horizon: 0xffc5a0,
    bottom: 0xf0a878,
    sunColor: 0xffc08a,
    sunDir: [0.82, 0.18, 0.22],
    sunSize: 0.997,
    glow: 1.15,
    hemiSky: 0xffd0b0,
    hemiGround: 0x6a5a48,
    hemi: 0.7,
    amb: 0x6a5e68,
    ambInt: 0.28,
    sunInt: 1.45,
    sunColorDir: 0xffb07a,
    fillInt: 0.22,
    fillColor: 0x8890c0,
    exposure: 0.95,
    fog: 0xd8b09a,
    fogDen: 0.009,
    lamps: 0.85,
    windowWarm: 0.7,
    poolGlow: 0.35,
    waterTint: 0x6a5a68,
    grass: 0x3a5a32,
    shadow: 0.78,
  },
  dusk: {
    top: 0x5a6a9a,
    horizon: 0xf0a888,
    bottom: 0xe09078,
    sunColor: 0xff9a6a,
    sunDir: [-0.78, 0.14, 0.28],
    sunSize: 0.997,
    glow: 1.35,
    hemiSky: 0xe8a888,
    hemiGround: 0x3a3a48,
    hemi: 0.48,
    amb: 0x4a4058,
    ambInt: 0.22,
    sunInt: 0.95,
    sunColorDir: 0xff8a62,
    fillInt: 0.18,
    fillColor: 0x6a70a8,
    exposure: 0.88,
    fog: 0x8a6a72,
    fogDen: 0.01,
    lamps: 1,
    windowWarm: 1,
    poolGlow: 1,
    waterTint: 0x5a4a62,
    grass: 0x2a4a28,
    shadow: 0.88,
  },
  night: {
    top: 0x0c1430,
    horizon: 0x243056,
    bottom: 0x161c32,
    sunColor: 0xd0dcff,
    sunDir: [0.2, 0.65, -0.5],
    sunSize: 0.9994,
    glow: 0.28,
    hemiSky: 0x2a3860,
    hemiGround: 0x16241c,
    hemi: 0.42,
    amb: 0x1c2438,
    ambInt: 0.22,
    sunInt: 0.42,
    sunColorDir: 0xc0ccee,
    fillInt: 0.22,
    fillColor: 0x4a5a88,
    exposure: 0.86,
    fog: 0x14182e,
    fogDen: 0.008,
    lamps: 1,
    windowWarm: 1,
    poolGlow: 1,
    waterTint: 0x1a2438,
    grass: 0x1c2c20,
    shadow: 0.48,
  },
} as const satisfies Record<TimeId, TimeRecipe>;

export const CAM = {
  exterior: { pos: [18.8, 11.6, 16.2], target: [0.2, 2.2, -1.6] },
  exploded: { pos: [12.8, 17.2, -12.4], target: [0.5, 2.8, -1.8] },
  cut: { pos: [6.5, 18.5, 10.5], target: [0.0, 1.6, -2.0] },
  cutSide: { pos: [1.2, 8.6, 19.5], target: [0.4, 3.1, 0.2] },
  cutFront: { pos: [0.8, 9.8, 22.5], target: [0.0, 3.0, -1.5] },
  xray: { pos: [18.5, 14.8, 15.5], target: [0.0, 2.6, -1.8] },
  walkStart: { pos: [-0.95, Y_GF_TOP + 1.62, 9.45], yaw: 0, pitch: 0.04 },
} as const satisfies {
  exterior: OrbitPreset;
  exploded: OrbitPreset;
  cut: OrbitPreset;
  cutSide: OrbitPreset;
  cutFront: OrbitPreset;
  xray: OrbitPreset;
  walkStart: WalkPreset;
};

export const COLORS = {
  stucco: 0xd8cfc2,
  stuccoShadow: 0xc9c0b3,
  cedar: 0x3a322c,
  cedarGrain: 0x2a2420,
  plinth: 0xb8b0a4,
  interior: 0xefe8dc,
  interiorWarm: 0xf2e6d0,
  floorOak: 0x9a6a42,
  floorOakDark: 0x7a5234,
  roof: 0x2a3038,
  roofSpec: 0x3a424c,
  fascia: 0x24282e,
  frame: 0x1a1c1e,
  glass: 0x9ab0c0,
  woodDark: 0x2c2118,
  woodMid: 0x6a4a32,
  steel: 0x2a2e32,
  paver: 0x4a4540,
  paverLight: 0x5a5550,
  fence: 0x5a4a3a,
  deck: 0x6b5340,
  concrete: 0x8a8c8e,
  cmu: 0x7a7c7e,
  framing: 0xd8c49a,
  insulation: 0xe8c84a,
  duct: 0x9aa0a6,
  wire: 0xe0c22a,
  wireRed: 0xc04030,
  outlet: 0x3a6ac8,
  pipe: 0x3cb0b8,
  pipeCold: 0x5a8ad0,
  fixture: 0xe8e4dc,
  lamp: 0xffd8a0,
  grass: 0x3e6a34,
  canopy: 0x2f5a28,
  pine: 0x1e4a28,
  trunk: 0x4a3428,
  soil: 0x3a3028,
  neighborA: 0xc8b8a4,
  neighborB: 0xb0a498,
  neighborC: 0x9a8e84,
  neighborRoof: 0x6a4038,
  neighborRoofB: 0x5a5550,
};
