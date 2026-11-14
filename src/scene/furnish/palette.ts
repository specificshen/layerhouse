import type { MeshStandardMaterial } from "three";
import type { Materials } from "@/materials";
import { createCaseFinish } from "./finish";
import { PAGE_TONE } from "./finish-spec";

export interface FurnishPalette {
  oak: MeshStandardMaterial;
  oakDark: MeshStandardMaterial;
  walnut: MeshStandardMaterial;
  fabric: MeshStandardMaterial;
  moss: MeshStandardMaterial;
  upholstery: MeshStandardMaterial;
  seat: MeshStandardMaterial;
  /** Seat cloth without the weave, for tops small enough that the weave grids. */
  pad: MeshStandardMaterial;
  paper: MeshStandardMaterial;
  rust: MeshStandardMaterial;
  linen: MeshStandardMaterial;
  sheet: MeshStandardMaterial;
  sham: MeshStandardMaterial;
  sage: MeshStandardMaterial;
  sand: MeshStandardMaterial;
  stone: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  brushed: MeshStandardMaterial;
  charcoal: MeshStandardMaterial;
  cooktop: MeshStandardMaterial;
  appliance: MeshStandardMaterial;
  ink: MeshStandardMaterial;
  screen: MeshStandardMaterial;
  tile: MeshStandardMaterial;
  clay: MeshStandardMaterial;
  leaf: MeshStandardMaterial;
  trim: MeshStandardMaterial;
}

function cloneStd(src: MeshStandardMaterial, color?: number): MeshStandardMaterial {
  const mat = src.clone();
  if (mat.map) {
    mat.map = mat.map.clone();
    mat.map.needsUpdate = true;
  }
  if (mat.roughnessMap) {
    mat.roughnessMap = mat.roughnessMap.clone();
    mat.roughnessMap.needsUpdate = true;
  }
  if (color !== undefined) mat.color.setHex(color);
  mat.clippingPlanes = [];
  mat.clipShadows = true;
  return mat;
}

/** Furniture finishes. Clones stay here so the shared scene materials are unchanged. */
export function createFurnishPalette(mats: Materials): FurnishPalette {
  const casework = createCaseFinish();

  const sheet = cloneStd(mats.linen, 0xf4efe6);
  sheet.roughness = 0.9;

  const sham = cloneStd(mats.linen, 0xfffaf3);
  sham.roughness = 0.86;

  const sage = cloneStd(mats.linen, 0xb7c4b4);
  sage.roughness = 0.88;

  const sand = cloneStd(mats.linen, 0xc9b09a);
  sand.roughness = 0.88;

  const ink = cloneStd(mats.steel, 0x1a1c1e);
  ink.metalness = 0.35;
  ink.roughness = 0.42;

  const screen = cloneStd(mats.steel, 0x12161a);
  screen.metalness = 0.48;
  screen.roughness = 0.26;
  screen.emissive.setHex(0x1a3038);
  screen.emissiveIntensity = 0.18;

  const tile = cloneStd(mats.concrete, 0xddd6cc);
  tile.roughness = 0.7;

  const clay = cloneStd(mats.fixture, 0xd2b49a);
  clay.roughness = 0.72;

  const leaf = cloneStd(mats.canopy, 0x3c6834);
  leaf.flatShading = true;

  const trim = cloneStd(mats.interior, 0xe4d6c6);
  trim.roughness = 0.84;

  const appliance = cloneStd(mats.fixture, 0xf3f0ea);
  appliance.roughness = 0.42;
  appliance.metalness = 0.04;

  const moss = cloneStd(mats.cushionB);

  const pad = casework.seat.clone();
  pad.map = null;
  pad.name = "seat-plain";
  pad.clippingPlanes = [];
  pad.clipShadows = true;

  const paper = cloneStd(mats.linen, PAGE_TONE);
  paper.map = null;
  paper.roughness = 0.92;
  paper.metalness = 0;
  paper.name = "paper";

  return {
    oak: casework.oak,
    oakDark: casework.oakDark,
    walnut: casework.walnut,
    fabric: mats.fabric,
    moss,
    upholstery: casework.upholstery,
    seat: casework.seat,
    pad,
    paper,
    rust: mats.cushionC,
    linen: mats.linen,
    sheet,
    sham,
    sage,
    sand,
    stone: casework.stone,
    metal: mats.steel,
    brushed: casework.brushed,
    charcoal: casework.charcoal,
    cooktop: casework.cooktop,
    appliance,
    ink,
    screen,
    tile,
    clay,
    leaf,
    trim,
  };
}
