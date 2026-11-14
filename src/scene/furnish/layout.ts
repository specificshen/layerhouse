/** How far a stool sits off the island's near long side. */
export const STOOL_GAP = 0.34;

/** Stool centers along the island, in the island's local Z. */
export const STOOL_Z = [-0.16, 0.18] as const;

export const LIVING = {
  sofa: { x: -4.4, z: 0.55, len: 2.6 },
  chairWest: { x: -6.05, z: 2.6, yaw: Math.PI / 4 },
  chairEast: { x: -2.55, z: 2.4, yaw: -Math.PI / 3 },
  coffee: { x: -4.3, z: 2.15, w: 1.2, d: 0.7 },
  tv: { x: -5.8, z: 3.15, yaw: Math.PI / 2 },
  benchWindow: { x: -6.84, z: 1.25, len: 1.5, yaw: Math.PI / 2 },
  benchEntry: { x: -1.84, z: 5.45, len: 0.84, yaw: Math.PI / 2 },
} as const;

export const DINING = {
  table: { x: 4.3, z: 3.6, w: 1.8, d: 0.9 },
  island: { x: 4.4, z: 0.4, w: 1.7, d: 0.82 },
} as const;

export interface Footprint {
  id: string;
  room: "living" | "dining";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function span(
  id: string,
  room: Footprint["room"],
  x: number,
  z: number,
  hx: number,
  hz: number,
): Footprint {
  return { id, room, minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}

const stoolX = DINING.island.x - DINING.island.w / 2 - STOOL_GAP;

/**
 * Plan boxes for the pieces in the living and dining views.
 * Half-extents cover the mesh. A bench's length runs on Z because it is turned.
 * The dining table box includes the chairs.
 */
export const SEEN_FOOTPRINTS: readonly Footprint[] = [
  span("sofa", "living", LIVING.sofa.x, LIVING.sofa.z, LIVING.sofa.len / 2, 0.4),
  span(
    "coffee",
    "living",
    LIVING.coffee.x,
    LIVING.coffee.z,
    LIVING.coffee.w / 2,
    LIVING.coffee.d / 2,
  ),
  span("tv", "living", LIVING.tv.x, LIVING.tv.z, 0.22, 0.68),
  span(
    "bench-window",
    "living",
    LIVING.benchWindow.x,
    LIVING.benchWindow.z,
    0.18,
    LIVING.benchWindow.len / 2,
  ),
  span(
    "bench-entry",
    "living",
    LIVING.benchEntry.x,
    LIVING.benchEntry.z,
    0.18,
    LIVING.benchEntry.len / 2,
  ),
  span(
    "dining-table",
    "dining",
    DINING.table.x,
    DINING.table.z,
    DINING.table.w / 2 + 0.42,
    DINING.table.d / 2 + 0.42,
  ),
  span(
    "island",
    "dining",
    DINING.island.x,
    DINING.island.z,
    DINING.island.w / 2 + 0.04,
    DINING.island.d / 2 + 0.04,
  ),
  span("stool-south", "dining", stoolX, DINING.island.z + STOOL_Z[0], 0.16, 0.16),
  span("stool-north", "dining", stoolX, DINING.island.z + STOOL_Z[1], 0.16, 0.16),
];

export const ROOM_SHELL = {
  living: { minX: -7.06, maxX: -1.45, minZ: -1.9, maxZ: 6.05 },
  dining: { minX: 2.2, maxX: 6.72, minZ: -1.85, maxZ: 6.05 },
} as const;

/** Inner face of the west living glazing. Furniture stays east of this. */
export const WEST_GLASS = { z0: 0.15, z1: 5.7, innerX: -7.1 } as const;

export function footprintsOverlap(a: Footprint, b: Footprint): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ;
}
