import * as THREE from "three";
import type { HouseGroups, HouseRecord, RoofMeta, Wall } from "../../types";

function named(name: string) {
  const group = new THREE.Group();
  group.name = name;
  return group;
}

/** Arrays, groups, and the stair well. `buildRoofs` replaces `roofMeta` before it is read. */
export function createHouseRecord(wallsData: Wall[]): HouseRecord {
  const framing = named("framing");
  const masonry = named("masonry");
  const roof = named("roof");
  const walls = named("walls");
  const insulation = named("insulation");
  const fenestration = named("fenestration");
  const hvac = named("hvac");
  const electrical = named("electrical");
  const plumbing = named("plumbing");
  const furniture = named("furniture");
  const site = named("site");
  const landscape = named("landscape");
  const groups: HouseGroups = {
    framing,
    masonry,
    roof,
    walls,
    insulation,
    fenestration,
    hvac,
    electrical,
    plumbing,
    furniture,
    site,
    landscape,
  };
  const roofMeta: RoofMeta = {
    ridgeY: 0,
    ridgeZ: 0,
    half: 0,
    pitch: 0,
    length: 0,
    cx: 0,
    yS: 0,
    yN: 0,
    wx0: 0,
    wx1: 0,
    wz0: 0,
    wz1: 0,
    wingPitch: 0,
  };
  return {
    clipBoxes: [],
    roofClipBoxes: [],
    orientedClips: [],
    collisions: [],
    floors: [],
    stairs: [],
    lamps: [],
    hotspots: [],
    doors: [],
    groups,
    roofGroup: roof,
    wallsData,
    well: { x0: 0.5, x1: 2.54, z0: -1.72, z1: 2.72 },
    roofMeta,
  };
}
