import type { MeshStandardMaterial } from "three";
import type { Materials } from "@/materials";

export interface FurnishPalette {
  oak: MeshStandardMaterial;
  oakDark: MeshStandardMaterial;
  walnut: MeshStandardMaterial;
  fabric: MeshStandardMaterial;
  moss: MeshStandardMaterial;
  rust: MeshStandardMaterial;
  linen: MeshStandardMaterial;
  sheet: MeshStandardMaterial;
  sham: MeshStandardMaterial;
  sage: MeshStandardMaterial;
  sand: MeshStandardMaterial;
  stone: MeshStandardMaterial;
  metal: MeshStandardMaterial;
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
  const oak = cloneStd(mats.woodMid);
  oak.roughness = 0.52;

  const oakDark = cloneStd(mats.woodMid, 0x6b5344);
  oakDark.roughness = 0.58;

  const walnut = cloneStd(mats.woodDark, 0x2a211c);
  walnut.roughness = 0.5;

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

  return {
    oak,
    oakDark,
    walnut,
    fabric: mats.fabric,
    moss: mats.cushionB,
    rust: mats.cushionC,
    linen: mats.linen,
    sheet,
    sham,
    sage,
    sand,
    stone: mats.concrete,
    metal: mats.steel,
    appliance,
    ink,
    screen,
    tile,
    clay,
    leaf,
    trim,
  };
}
