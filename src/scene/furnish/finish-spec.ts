export type FinishRole = "broad" | "metal" | "glass";

export interface FinishSpec {
  id: string;
  /** Representative sRGB albedo before the light grain or weave map. */
  color: number;
  roughness: number;
  metalness: number;
  role: FinishRole;
}

/**
 * Finishes for the pieces a visitor sees. Broad surfaces stay in a range that
 * can take the one-bounce fill: dark enough to read as wood, cloth, or stone,
 * light enough not to turn into a hole.
 */
export const FINISH_SPEC = [
  { id: "oak", color: 0x9a6438, roughness: 0.55, metalness: 0.02, role: "broad" },
  { id: "oakDark", color: 0x6b4a34, roughness: 0.58, metalness: 0.02, role: "broad" },
  { id: "walnut", color: 0x6a4b38, roughness: 0.5, metalness: 0.04, role: "broad" },
  { id: "upholstery", color: 0x46564c, roughness: 0.9, metalness: 0, role: "broad" },
  { id: "seat", color: 0x9a8874, roughness: 0.88, metalness: 0, role: "broad" },
  { id: "stone", color: 0x5e5a55, roughness: 0.44, metalness: 0.04, role: "broad" },
  { id: "charcoal", color: 0x3e4348, roughness: 0.58, metalness: 0.08, role: "broad" },
  { id: "brushed", color: 0x6a6e72, roughness: 0.36, metalness: 0.62, role: "metal" },
  { id: "cooktop", color: 0x2c3034, roughness: 0.22, metalness: 0.4, role: "glass" },
] as const satisfies readonly FinishSpec[];

export type FinishId = (typeof FINISH_SPEC)[number]["id"];

/**
 * Page block on a closed book. Warm, and dim enough that the cover stays
 * the face a visitor sees. A near-white page plane turns a stack into a slab.
 */
export const PAGE_TONE = 0xb3a48e;

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Rec. 709 relative luminance of an sRGB hex. */
export function relativeLuminance(hex: number): number {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function finishSpec(id: FinishId): FinishSpec {
  const found = FINISH_SPEC.find((spec) => spec.id === id);
  if (!found) throw new Error(`missing finish ${id}`);
  return found;
}
