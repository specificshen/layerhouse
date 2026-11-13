import type { LayerId, TimeId, ViewMode } from "@/types";

export const TITLE = "层宅";
export const SUBTITLE = "Layer House";

export const STATS = {
  beds: 3,
  area: 186,
  year: 2024,
  tags: "庭院水池 · 临水栈道 · 书房",
};

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
