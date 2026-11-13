/** Discrete observer modes on the outer dial (plus an internal boot sentinel). */
export const VIEW_MODE_IDS = ["exterior", "exploded", "cut", "xray", "walk"] as const;
export type ViewMode = (typeof VIEW_MODE_IDS)[number];
export type Mode = ViewMode | "boot";

export const TIME_IDS = ["night", "dawn", "day", "dusk"] as const;
export type TimeId = (typeof TIME_IDS)[number];

export const LAYER_IDS = [
  "framing",
  "masonry",
  "roof",
  "walls",
  "insulation",
  "fenestration",
  "hvac",
  "electrical",
  "plumbing",
  "furniture",
  "site",
  "landscape",
] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export const CUT_DIRS = ["top", "side", "front"] as const;
export type CutDir = (typeof CUT_DIRS)[number];

export function isViewMode(v: string | undefined): v is ViewMode {
  return v !== undefined && (VIEW_MODE_IDS as readonly string[]).includes(v);
}

export function isTimeId(v: string | undefined): v is TimeId {
  return v !== undefined && (TIME_IDS as readonly string[]).includes(v);
}

export function isCutDir(v: string | undefined): v is CutDir {
  return v !== undefined && (CUT_DIRS as readonly string[]).includes(v);
}
