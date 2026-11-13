import {
  INT_WALL_T,
  MAIN,
  WALL_T,
  WING,
  Y_GF_CEIL,
  Y_GF_TOP,
  Y_L2_TOP,
  Y_L2_WALL_TOP,
} from "@/config";
import type { Wall } from "@/types";

export function defineWalls(): Wall[] {
  const T = WALL_T;
  const TI = INT_WALL_T;
  const y0 = Y_GF_TOP;
  const y1 = Y_L2_WALL_TOP;
  const yWing = 3.12;
  const walls: Wall[] = [];

  // —— Exterior, main south facade (street) ——
  walls.push({
    id: "ext-south",
    axis: "z",
    pos: MAIN.z1,
    a0: MAIN.x0,
    a1: MAIN.x1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: -6.45, a1: -4.05, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: -3.9, a1: -2.45, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      // D01 pivot, hinge west, swings north into the foyer.
      {
        a0: -2.15,
        a1: 0.2,
        y0: y0,
        y1: 2.58,
        type: "door",
        style: "pivot",
        hinge: "a0",
        openSign: 1,
      },
      { a0: 0.2, a1: 0.72, y0: y0, y1: 2.58, type: "window", style: "sidelight" },
      { a0: 2.15, a1: 4.25, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: 4.4, a1: 6.45, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: -6.45, a1: -3.55, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: -3.35, a1: -1.15, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.45, a1: 6.45, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main north (courtyard), only east of the wing joint ——
  walls.push({
    id: "ext-north-main",
    axis: "z",
    pos: MAIN.z0,
    a0: WING.x1,
    a1: MAIN.x1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: 0.15, a1: 5.25, y0: y0, y1: 2.98, type: "window", style: "slider" },
      { a0: 5.45, a1: 6.5, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      // D02 balcony slider. No swing arc on A-03.
      { a0: 0.55, a1: 3.55, y0: Y_L2_TOP, y1: 5.78, type: "door", style: "slider" },
      { a0: 3.85, a1: 6.5, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main east ——
  walls.push({
    id: "ext-east",
    axis: "x",
    pos: MAIN.x1,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: -1.5, a1: 1.4, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      // D03 side door, hinge north, swings west into the room.
      {
        a0: 3.2,
        a1: 4.3,
        y0: y0,
        y1: 2.35,
        type: "door",
        style: "side",
        hinge: "a0",
        openSign: -1,
      },
      { a0: 4.55, a1: 5.9, y0: 1.1, y1: 2.45, type: "window", style: "fixed" },
      { a0: -1.7, a1: 1.6, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.2, a1: 5.9, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— Exterior, main west (two stories) ——
  walls.push({
    id: "ext-west-main",
    axis: "x",
    pos: MAIN.x0,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0,
    y1,
    t: T,
    kind: "ext",
    finish: "stucco",
    openings: [
      { a0: 0.15, a1: 2.45, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: 2.7, a1: 5.7, y0: 0.95, y1: 2.58, type: "window", style: "fixed" },
      { a0: -1.55, a1: 1.7, y0: 3.98, y1: 5.78, type: "window", style: "band" },
      { a0: 2.0, a1: 5.7, y0: 3.98, y1: 5.78, type: "window", style: "band" },
    ],
  });

  // —— West wing exteriors (cedar, one story) ——
  walls.push({
    id: "ext-west-wing",
    axis: "x",
    pos: WING.x0,
    a0: WING.z0,
    a1: WING.z1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      { a0: -9.9, a1: -7.15, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
      { a0: -5.85, a1: -3.15, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
    ],
  });
  walls.push({
    id: "ext-north-wing",
    axis: "z",
    pos: WING.z0,
    a0: WING.x0,
    a1: WING.x1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      // D04 garden door, hinge west, swings south into the wing.
      {
        a0: -6.0,
        a1: -3.2,
        y0: y0,
        y1: 2.5,
        type: "door",
        style: "garden",
        hinge: "a0",
        openSign: -1,
      },
      { a0: -7.0, a1: -6.15, y0: 1.05, y1: 2.35, type: "window", style: "fixed" },
      { a0: -3.0, a1: -1.85, y0: 1.05, y1: 2.35, type: "window", style: "fixed" },
    ],
  });
  walls.push({
    id: "ext-east-wing",
    axis: "x",
    pos: WING.x1,
    a0: WING.z0,
    a1: WING.z1,
    y0,
    y1: yWing,
    t: T,
    kind: "ext",
    finish: "cedar",
    openings: [
      { a0: -10.15, a1: -6.35, y0: y0, y1: 2.7, type: "window", style: "slider" },
      { a0: -5.85, a1: -2.55, y0: 0.95, y1: 2.45, type: "window", style: "fixed" },
    ],
  });

  // Opening between living (main west) and the wing — cased opening in the shared wall line at z = MAIN.z0, x = WING
  // There is no exterior wall there; add short structural returns only (handled as interior lintel later).

  // —— Interior GF ——
  // Partial wall living / entry
  walls.push({
    id: "int-living-entry",
    axis: "x",
    pos: -1.5,
    a0: 4.35,
    a1: MAIN.z1,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Stair west
  walls.push({
    id: "int-stair-w",
    axis: "x",
    pos: 0.52,
    a0: -2.05,
    a1: 2.85,
    y0,
    y1: Y_L2_WALL_TOP,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D05 into the guest bath, hinge south, swings west clear of the stair.
      {
        a0: 2.05,
        a1: 2.85,
        y0,
        y1: 2.2,
        type: "door",
        style: "interior",
        hinge: "a1",
        openSign: 1,
      },
    ],
  });
  // Stair east
  walls.push({
    id: "int-stair-e",
    axis: "x",
    pos: 2.52,
    a0: -2.05,
    a1: 4.5,
    y0,
    y1: Y_L2_WALL_TOP,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D06 L2 bath, hinge north, swings west into the bath.
      {
        a0: 3.55,
        a1: 4.4,
        y0: Y_L2_TOP,
        y1: 5.5,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: -1,
      },
      // D07 kitchen, hinge north, swings east clear of the stair.
      {
        a0: 2.9,
        a1: 3.7,
        y0,
        y1: 2.2,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: 1,
      },
    ],
  });
  // Powder enclosure
  walls.push({
    id: "int-powder-s",
    axis: "z",
    pos: 3.35,
    a0: -1.5,
    a1: 0.52,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D08 foyer to guest bath, hinge west, swings north into the bath.
      {
        a0: -0.95,
        a1: -0.25,
        y0,
        y1: 2.15,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: 1,
      },
    ],
  });
  walls.push({
    id: "int-powder-n",
    axis: "z",
    pos: 1.35,
    a0: -1.5,
    a1: 0.52,
    y0,
    y1: Y_GF_CEIL,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Wing: guest bath (south of bedroom)
  walls.push({
    id: "int-guest-bath-n",
    axis: "z",
    pos: -5.45,
    a0: WING.x0,
    a1: WING.x1,
    y0,
    y1: yWing - 0.02,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D09 guest bedroom, hinge east, swings north into the bedroom.
      {
        a0: -3.55,
        a1: -2.75,
        y0,
        y1: 2.15,
        type: "door",
        style: "interior",
        hinge: "a1",
        openSign: -1,
      },
    ],
  });
  walls.push({
    id: "int-guest-bath-e",
    axis: "x",
    pos: -4.15,
    a0: -5.45,
    a1: -2.2,
    y0,
    y1: yWing - 0.02,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D10 guest bath, hinge south, swings west into the bath.
      {
        a0: -3.7,
        a1: -2.95,
        y0,
        y1: 2.15,
        type: "door",
        style: "interior",
        hinge: "a1",
        openSign: 1,
      },
    ],
  });

  // —— Interior L2 ——
  // Master / hall at x = -0.15
  walls.push({
    id: "int-master",
    axis: "x",
    pos: -0.15,
    a0: MAIN.z0,
    a1: MAIN.z1,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D11 master, hinge north, swings west into the bedroom.
      {
        a0: -0.3,
        a1: 0.55,
        y0: Y_L2_TOP,
        y1: 5.5,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: -1,
      },
    ],
  });
  // Master bath south-west
  walls.push({
    id: "int-mbath-n",
    axis: "z",
    pos: 3.25,
    a0: MAIN.x0,
    a1: -2.35,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D12 master bath, hinge west, swings south into the bath.
      {
        a0: -6.3,
        a1: -5.5,
        y0: Y_L2_TOP,
        y1: 5.5,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: -1,
      },
    ],
  });
  walls.push({
    // Partition of the master bath (basin, toilet, tub), not a closet.
    // The closet is the open niche to the east, about x −2.35 to −0.15.
    id: "int-mbath-part",
    axis: "x",
    pos: -4.35,
    a0: 3.25,
    a1: MAIN.z1,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [
      // D13 into the master bath, hinge north, swings west.
      {
        a0: 3.35,
        a1: 4.15,
        y0: Y_L2_TOP,
        y1: 5.5,
        type: "door",
        style: "interior",
        hinge: "a0",
        openSign: -1,
      },
    ],
  });
  // L2 hall bath south of stair (x 0.52–2.52 already have walls; close south & a door is on stair-e)
  walls.push({
    id: "int-lbath-n",
    axis: "z",
    pos: 2.95,
    a0: 0.52,
    a1: 2.52,
    y0: Y_L2_TOP,
    y1,
    t: TI,
    kind: "int",
    finish: "interior",
    openings: [],
  });
  // Study west wall is stair-e at 2.52, already 2-story

  return walls;
}
