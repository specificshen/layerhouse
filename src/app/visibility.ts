import type { LayerId } from "../types";
import type { Session } from "./session";

const SYSTEMS_HIDDEN: LayerId[] = [
  "framing",
  "masonry",
  "insulation",
  "hvac",
  "electrical",
  "plumbing",
];

export function setHouseVisibility(s: Session) {
  const showAll = s.mode !== "xray";
  const groupIds = Object.keys(s.rec.groups) as LayerId[];
  for (const id of groupIds) {
    if (showAll) {
      s.rec.groups[id].visible = !SYSTEMS_HIDDEN.includes(id);
    } else {
      s.rec.groups[id].visible = id === s.xrayLayer;
    }
  }
  s.rec.groups.landscape.visible = true;
  if (s.mode === "xray" && s.xrayLayer === "landscape") {
    s.rec.groups.site.visible = false;
  } else if (s.mode === "xray" && s.xrayLayer === "site") {
    s.rec.groups.landscape.visible = true;
  } else if (s.mode !== "xray") {
    s.rec.groups.site.visible = true;
  } else {
    s.rec.groups.site.visible = s.xrayLayer === "site";
  }
  s.neighbors.visible = true;
  s.waterGrp.visible = true;
  s.capGroup.visible = s.mode === "cut";
  s.sectionBox.visible = s.mode === "cut";
}
