import * as THREE from "three";
import { COLORS } from "./config";
import type {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  LineBasicMaterial,
  CanvasTexture,
} from "three";

function canvas(
  w: number,
  h: number,
  fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  fn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, a: number, scale = 1) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n =
        Math.sin(x * 0.11 * scale + y * 0.07 * scale) * 0.5 +
        Math.sin(x * 0.03 * scale + y * 0.19 * scale) * 0.3 +
        (Math.random() - 0.5);
      const i = (y * w + x) * 4;
      const k = n * a;
      d[i] = Math.max(0, Math.min(255, (d[i] ?? 0) + k));
      d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] ?? 0) + k));
      d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] ?? 0) + k));
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function createTextures() {
  const stucco = canvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#d8cfc2";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const v = 190 + Math.random() * 40;
      ctx.fillStyle = `rgba(${v},${v - 8},${v - 18},${0.08 + Math.random() * 0.12})`;
      ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }
    noise(ctx, w, h, 10, 1);
  });
  stucco.repeat.set(2, 2);

  const stuccoRough = canvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 28, 2);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  stuccoRough.colorSpace = THREE.NoColorSpace;
  stuccoRough.repeat.set(2, 2);

  const cedar = canvas(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#3a322c";
    ctx.fillRect(0, 0, w, h);
    const plank = 42;
    for (let x = 0; x < w; x += plank) {
      const shade = 48 + Math.random() * 22;
      ctx.fillStyle = `rgb(${shade + 8},${shade},${shade - 6})`;
      ctx.fillRect(x + 1, 0, plank - 2, h);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(x + 2, 0);
      ctx.lineTo(x + 2, h);
      ctx.stroke();
      for (let k = 0; k < 8; k++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
        ctx.beginPath();
        const ox = x + 6 + Math.random() * (plank - 12);
        ctx.moveTo(ox, 0);
        for (let y = 0; y < h; y += 16) ctx.lineTo(ox + Math.sin(y * 0.04) * 1.2, y);
        ctx.stroke();
      }
    }
  });
  cedar.repeat.set(1, 2);

  const oak = canvas(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = "#9a6a42";
    ctx.fillRect(0, 0, w, h);
    const plankH = 64;
    for (let y = 0; y < h; y += plankH) {
      const r = 140 + Math.random() * 30;
      const g = 90 + Math.random() * 20;
      const b = 50 + Math.random() * 12;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y + 1, w, plankH - 2);
      ctx.strokeStyle = "rgba(40,20,8,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      for (let k = 0; k < 14; k++) {
        ctx.strokeStyle = `rgba(60,30,10,${0.06 + Math.random() * 0.1})`;
        ctx.beginPath();
        const oy = y + 8 + Math.random() * (plankH - 16);
        ctx.moveTo(0, oy);
        for (let x = 0; x < w; x += 20) ctx.lineTo(x, oy + Math.sin(x * 0.03 + k) * 1.5);
        ctx.stroke();
      }
    }
  });
  oak.repeat.set(4, 4);

  const oakRough = canvas(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#6a6a6a";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      ctx.fillStyle = "#555";
      ctx.fillRect(0, y, w, 2);
    }
    noise(ctx, w, h, 18, 1);
  });
  oakRough.colorSpace = THREE.NoColorSpace;
  oakRough.repeat.set(4, 4);

  const roof = canvas(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#2a3038";
    ctx.fillRect(0, 0, w, h);
    const seam = 32;
    for (let x = 0; x < w; x += seam) {
      const v = 38 + Math.random() * 10;
      ctx.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
      ctx.fillRect(x, 0, seam - 3, h);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(x + seam - 3, 0, 3, h);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(x, 0, 2, h);
    }
    noise(ctx, w, h, 6, 0.5);
  });
  roof.repeat.set(18, 8);

  const paver = canvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#2e2c2a";
    ctx.fillRect(0, 0, w, h);
    const bw = 64,
      bh = 32;
    for (let y = 0, row = 0; y < h; y += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = -bw; x < w; x += bw) {
        const v = 70 + Math.random() * 22;
        ctx.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
        ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
      }
    }
  });
  paver.repeat.set(8, 10);

  const grass = canvas(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#4a6c3c";
    ctx.fillRect(0, 0, w, h);
    // Soft, large-scale mottling only — no 1px dots or tight tiling grid.
    for (let i = 0; i < 48; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 80 + Math.random() * 220;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const lift = (Math.random() - 0.5) * 18;
      const a = 0.07 + Math.random() * 0.08;
      const cr = 68 + lift,
        cg = 108 + lift,
        cb = 56 + lift;
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    noise(ctx, w, h, 5, 0.3);
  });
  grass.repeat.set(5, 5);

  const fabric = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#6a4a36";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 16, 2);
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  });

  const concrete = canvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#8a8c8e";
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 14, 1);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
  });
  concrete.repeat.set(2, 2);

  const batt = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#e8c84a";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 5) {
      ctx.strokeStyle = `rgba(180,140,20,${0.25})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.4 + y) * 2);
      ctx.stroke();
    }
  });
  batt.repeat.set(2, 4);

  return { stucco, stuccoRough, cedar, oak, oakRough, roof, paver, grass, fabric, concrete, batt };
}

export interface SceneTextures {
  stucco: CanvasTexture;
  stuccoRough: CanvasTexture;
  cedar: CanvasTexture;
  oak: CanvasTexture;
  oakRough: CanvasTexture;
  roof: CanvasTexture;
  paver: CanvasTexture;
  grass: CanvasTexture;
  fabric: CanvasTexture;
  concrete: CanvasTexture;
  batt: CanvasTexture;
}

export interface Materials {
  stucco: MeshStandardMaterial;
  cedar: MeshStandardMaterial;
  plinth: MeshStandardMaterial;
  interior: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  roof: MeshStandardMaterial;
  fascia: MeshStandardMaterial;
  frame: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  glassSimple: MeshPhysicalMaterial;
  glassWarm: MeshPhysicalMaterial;
  woodDark: MeshStandardMaterial;
  woodMid: MeshStandardMaterial;
  steel: MeshStandardMaterial;
  paver: MeshStandardMaterial;
  fence: MeshStandardMaterial;
  deck: MeshStandardMaterial;
  concrete: MeshStandardMaterial;
  cmu: MeshStandardMaterial;
  framing: MeshStandardMaterial;
  insulation: MeshStandardMaterial;
  duct: MeshStandardMaterial;
  wire: MeshStandardMaterial;
  wireRed: MeshStandardMaterial;
  outlet: MeshStandardMaterial;
  pipe: MeshStandardMaterial;
  pipeCold: MeshStandardMaterial;
  fixture: MeshStandardMaterial;
  lampShade: MeshStandardMaterial;
  lampBulb: MeshStandardMaterial;
  grass: MeshStandardMaterial;
  canopy: MeshStandardMaterial;
  pine: MeshStandardMaterial;
  trunk: MeshStandardMaterial;
  soil: MeshStandardMaterial;
  fabric: MeshStandardMaterial;
  linen: MeshStandardMaterial;
  cushionB: MeshStandardMaterial;
  cushionC: MeshStandardMaterial;
  neighborA: MeshStandardMaterial;
  neighborB: MeshStandardMaterial;
  neighborC: MeshStandardMaterial;
  neighborRoof: MeshStandardMaterial;
  neighborRoofB: MeshStandardMaterial;
  waterTint: MeshPhysicalMaterial;
  sectionCap: THREE.MeshBasicMaterial;
  sectionLine: LineBasicMaterial;
  warmFill: MeshStandardMaterial;
}

export function createMaterials(textures: SceneTextures): Materials {
  const t = textures;
  const phys = (params: THREE.MeshPhysicalMaterialParameters) =>
    new THREE.MeshPhysicalMaterial(params);
  const std = (params: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(params);

  const stucco = std({
    color: COLORS.stucco,
    map: t.stucco,
    roughnessMap: t.stuccoRough,
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.35,
  });

  const cedar = std({
    color: 0xffffff,
    map: t.cedar,
    roughness: 0.72,
    metalness: 0.0,
    envMapIntensity: 0.3,
  });

  const plinth = std({
    color: COLORS.plinth,
    map: t.concrete,
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });

  const interior = std({
    color: COLORS.interior,
    roughness: 0.82,
    metalness: 0.0,
    envMapIntensity: 0.25,
  });

  const floor = std({
    color: 0xffffff,
    map: t.oak,
    roughnessMap: t.oakRough,
    roughness: 0.48,
    metalness: 0.0,
    envMapIntensity: 0.4,
  });

  const roof = std({
    color: 0xffffff,
    map: t.roof,
    roughness: 0.55,
    metalness: 0.18,
    envMapIntensity: 0.55,
  });

  const fascia = std({
    color: COLORS.fascia,
    roughness: 0.5,
    metalness: 0.15,
  });

  const frame = std({
    color: COLORS.frame,
    roughness: 0.35,
    metalness: 0.4,
    envMapIntensity: 0.7,
  });

  const glass = phys({
    color: 0xb8c8d4,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.72,
    thickness: 0.04,
    ior: 1.5,
    transparent: true,
    opacity: 1,
    envMapIntensity: 1.2,
    attenuationColor: 0xcfe0ea,
    attenuationDistance: 2,
    depthWrite: true,
  });

  // Cheaper window pane used when we need interior glow to read clearly
  const glassSimple = phys({
    color: 0x9aafbe,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.38,
    envMapIntensity: 1.4,
    transmission: 0,
    side: THREE.DoubleSide,
  });

  const glassWarm = phys({
    color: 0xffd8a0,
    emissive: 0xffc078,
    emissiveIntensity: 0,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.42,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
  });

  const woodDark = std({ color: COLORS.woodDark, roughness: 0.48, metalness: 0.05 });
  const woodMid = std({ color: COLORS.woodMid, roughness: 0.52, metalness: 0.04, map: t.oak });
  const woodMidMap = t.oak.clone();
  woodMidMap.repeat.set(1, 1);
  woodMid.map = woodMidMap;
  const steel = std({ color: COLORS.steel, roughness: 0.32, metalness: 0.7, envMapIntensity: 0.9 });
  const paver = std({ color: 0xffffff, map: t.paver, roughness: 0.86, metalness: 0.02 });
  const fence = std({
    color: COLORS.fence,
    roughness: 0.82,
    metalness: 0.02,
    envMapIntensity: 0.15,
  });
  const deck = std({ color: COLORS.deck, map: t.oak, roughness: 0.62, metalness: 0.0 });
  const deckMap = t.oak.clone();
  deckMap.repeat.set(2, 2);
  deck.map = deckMap;
  const concrete = std({
    color: COLORS.concrete,
    map: t.concrete,
    roughness: 0.88,
    metalness: 0.02,
  });
  const cmu = std({ color: COLORS.cmu, map: t.concrete, roughness: 0.9, metalness: 0.02 });
  const framing = std({ color: COLORS.framing, roughness: 0.7, metalness: 0.0 });
  const insulation = std({
    color: COLORS.insulation,
    map: t.batt,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.88,
    depthWrite: true,
  });
  const duct = std({ color: COLORS.duct, roughness: 0.45, metalness: 0.35, envMapIntensity: 0.5 });
  const wire = std({
    color: COLORS.wire,
    roughness: 0.4,
    metalness: 0.2,
    emissive: COLORS.wire,
    emissiveIntensity: 0.15,
  });
  const wireRed = std({
    color: COLORS.wireRed,
    roughness: 0.4,
    metalness: 0.2,
    emissive: COLORS.wireRed,
    emissiveIntensity: 0.12,
  });
  const outlet = std({
    color: COLORS.outlet,
    roughness: 0.4,
    metalness: 0.3,
    emissive: COLORS.outlet,
    emissiveIntensity: 0.45,
  });
  const pipe = std({
    color: COLORS.pipe,
    roughness: 0.35,
    metalness: 0.25,
    emissive: COLORS.pipe,
    emissiveIntensity: 0.08,
  });
  const pipeCold = std({ color: COLORS.pipeCold, roughness: 0.35, metalness: 0.25 });
  const fixture = std({ color: COLORS.fixture, roughness: 0.55, metalness: 0.05 });
  const lampShade = std({
    color: 0xffe8c0,
    emissive: COLORS.lamp,
    emissiveIntensity: 0,
    roughness: 0.6,
    metalness: 0,
  });
  const lampBulb = std({
    color: 0xfff2d0,
    emissive: 0xffe0a0,
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0,
  });
  const grass = std({ color: 0xffffff, map: t.grass, roughness: 0.95, metalness: 0 });
  const canopy = std({ color: COLORS.canopy, roughness: 0.88, metalness: 0, flatShading: true });
  const pine = std({ color: COLORS.pine, roughness: 0.9, metalness: 0, flatShading: true });
  const trunk = std({ color: COLORS.trunk, roughness: 0.85, metalness: 0 });
  const soil = std({ color: COLORS.soil, roughness: 1, metalness: 0 });
  const fabric = std({ color: 0xffffff, map: t.fabric, roughness: 0.8, metalness: 0 });
  const linen = std({ color: 0xe8e0d4, roughness: 0.85, metalness: 0 });
  const cushionB = std({ color: 0x3d4a42, roughness: 0.8, metalness: 0 });
  const cushionC = std({ color: 0x8a5a3a, roughness: 0.8, metalness: 0 });
  const neighborA = std({ color: COLORS.neighborA, roughness: 0.86, metalness: 0 });
  const neighborB = std({ color: COLORS.neighborB, roughness: 0.86, metalness: 0 });
  const neighborC = std({ color: COLORS.neighborC, roughness: 0.86, metalness: 0 });
  const neighborRoof = std({ color: COLORS.neighborRoof, roughness: 0.7, metalness: 0.08 });
  const neighborRoofB = std({ color: COLORS.neighborRoofB, roughness: 0.7, metalness: 0.08 });
  const waterTint = new THREE.MeshPhysicalMaterial({
    color: 0x3a5a62,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
    transmission: 0.3,
    envMapIntensity: 1.2,
  });
  const sectionCap = new THREE.MeshBasicMaterial({
    color: 0xe8d2b0,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const sectionLine = new THREE.LineBasicMaterial({
    color: 0xd8dce0,
    transparent: true,
    opacity: 0.65,
  });

  // Interior warm fill used behind windows at dusk/night
  const warmFill = std({
    color: 0xffe0b0,
    emissive: 0xffc078,
    emissiveIntensity: 0,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const mats = {
    stucco,
    cedar,
    plinth,
    interior,
    floor,
    roof,
    fascia,
    frame,
    glass,
    glassSimple,
    glassWarm,
    woodDark,
    woodMid,
    steel,
    paver,
    fence,
    deck,
    concrete,
    cmu,
    framing,
    insulation,
    duct,
    wire,
    wireRed,
    outlet,
    pipe,
    pipeCold,
    fixture,
    lampShade,
    lampBulb,
    grass,
    canopy,
    pine,
    trunk,
    soil,
    fabric,
    linen,
    cushionB,
    cushionC,
    neighborA,
    neighborB,
    neighborC,
    neighborRoof,
    neighborRoofB,
    waterTint,
    sectionCap,
    sectionLine,
    warmFill,
  };

  // All house materials need clipping in cut view
  for (const m of Object.values(mats)) {
    if (m && m.clippingPlanes !== undefined) {
      m.clippingPlanes = [];
      m.clipShadows = true;
    }
  }
  return mats;
}

export function setLampIntensity(mats: Materials, amount: number) {
  mats.lampShade.emissiveIntensity = amount * 1.4;
  mats.lampBulb.emissiveIntensity = amount * 2.4;
  mats.glassWarm.emissiveIntensity = amount * 0.55;
  mats.warmFill.emissiveIntensity = amount * 0.35;
}

export function setGrassColor(mats: Materials, hex: number) {
  // Texture is already mid-green; a mild multiply keeps day lawn even, not neon or dotted.
  const c = new THREE.Color(hex);
  mats.grass.color.copy(c);
  mats.grass.color.multiplyScalar(1.12);
}
