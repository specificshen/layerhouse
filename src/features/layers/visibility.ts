import type { Session } from "@/world/session";
import type { LayerId, Mode } from "@/types";
import { LAYER_IDS } from "@/types";

/** `selected` shows the layer only when it is the x-ray pick. Landscape stays on in x-ray. */
type Cell = boolean | "selected";

const SHOWN: Record<LayerId, Cell> = {
  framing: false,
  masonry: false,
  roof: true,
  walls: true,
  insulation: false,
  fenestration: true,
  hvac: false,
  electrical: false,
  plumbing: false,
  furniture: true,
  site: true,
  landscape: true,
};

const XRAY: Record<LayerId, Cell> = {
  framing: "selected",
  masonry: "selected",
  roof: "selected",
  walls: "selected",
  insulation: "selected",
  fenestration: "selected",
  hvac: "selected",
  electrical: "selected",
  plumbing: "selected",
  furniture: "selected",
  site: "selected",
  landscape: true,
};

const VISIBILITY: Record<Mode, Record<LayerId, Cell>> = {
  boot: SHOWN,
  exterior: SHOWN,
  exploded: SHOWN,
  cut: SHOWN,
  walk: SHOWN,
  xray: XRAY,
};

function cellVisible(cell: Cell, id: LayerId, selected: LayerId): boolean {
  switch (cell) {
    case true:
      return true;
    case false:
      return false;
    case "selected":
      return id === selected;
    default: {
      const unexpected: never = cell;
      return unexpected;
    }
  }
}

export function setHouseVisibility(s: Session) {
  const row = VISIBILITY[s.mode];
  for (const id of LAYER_IDS) {
    s.rec.groups[id].visible = cellVisible(row[id], id, s.xrayLayer);
  }
  s.neighbors.visible = true;
  s.waterGrp.visible = true;
  s.capGroup.visible = s.mode === "cut";
  s.sectionBox.visible = s.mode === "cut";
}
