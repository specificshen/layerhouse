/** 层宅 / Layer House — original courtyard house dimensions (meters). */

export const EYE = 1.62;
/** Full floor assembly in section (structure + 30 mm finish). */
export const SLAB = 0.26;
export const FINISH_T = 0.03;
/** Concrete stops 30 mm under FFL so the finish is not buried in the slab. */
export const STRUCT_T = SLAB - FINISH_T;
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

export const ROOF = {
  pitch: (26 * Math.PI) / 180,
  overhang: 0.55,
  thickness: 0.12,
  ridgeZ: (MAIN.z0 + MAIN.z1) / 2,
  wingEaveSouth: 4.15,
  wingEaveNorth: 3.35,
};
