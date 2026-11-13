import type { HouseGroups, HouseRecord } from "../../types";
import type { Materials } from "../materials";
import { electrical } from "./electrical";
import { framing } from "./framing";
import { hvac } from "./hvac";
import { insulation } from "./insulation";
import { masonry } from "./masonry";
import { plumbing } from "./plumbing";

export function buildSystems(groups: HouseGroups, mats: Materials, rec: HouseRecord) {
  masonry(groups.masonry, rec.wallsData, mats, rec);
  framing(groups.framing, rec, mats);
  insulation(groups.insulation, rec, mats);
  hvac(groups.hvac, mats, rec);
  electrical(groups.electrical, rec, mats);
  plumbing(groups.plumbing, mats, rec);
}
