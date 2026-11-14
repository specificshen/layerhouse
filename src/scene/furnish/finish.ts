import * as THREE from "three";
import { type FinishId, finishSpec } from "./finish-spec";

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

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
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Faint vertical grain. Light enough that the material color stays the albedo. */
function grainMap(): THREE.CanvasTexture {
  const rand = mulberry(0x51a7);
  return canvas(256, 512, (ctx, w, h) => {
    ctx.fillStyle = "#f3f1ec";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      const x = rand() * w;
      ctx.strokeStyle = `rgba(70, 52, 36, ${0.035 + rand() * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 12) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 1.5, y);
      ctx.stroke();
    }
  });
}

/** Plain weave, as a light modulation so cloth color stays on the material. */
function weaveMap(): THREE.CanvasTexture {
  const tex = canvas(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#f4f2ee";
    ctx.fillRect(0, 0, w, h);
    const step = 4;
    for (let y = 0; y < h; y += step) {
      ctx.fillStyle = y % (step * 2) === 0 ? "rgba(70,60,48,0.09)" : "rgba(255,255,255,0.06)";
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += step) {
      ctx.fillStyle = "rgba(40,36,30,0.05)";
      ctx.fillRect(x, 0, 1, h);
    }
  });
  tex.repeat.set(5, 5);
  return tex;
}

function stoneMap(): THREE.CanvasTexture {
  const rand = mulberry(0xc0de);
  return canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#eeebe6";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 28 + rand() * 50;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.04 + rand() * 0.06;
      g.addColorStop(0, `rgba(60,54,48,${a})`);
      g.addColorStop(1, "rgba(60,54,48,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

function material(
  id: FinishId,
  map: THREE.CanvasTexture | null,
  env: number,
): THREE.MeshStandardMaterial {
  const spec = finishSpec(id);
  const mat = new THREE.MeshStandardMaterial({
    color: spec.color,
    map,
    roughness: spec.roughness,
    metalness: spec.metalness,
    envMapIntensity: env,
  });
  mat.name = id;
  mat.clippingPlanes = [];
  mat.clipShadows = true;
  return mat;
}

export interface CaseFinish {
  oak: THREE.MeshStandardMaterial;
  oakDark: THREE.MeshStandardMaterial;
  walnut: THREE.MeshStandardMaterial;
  upholstery: THREE.MeshStandardMaterial;
  seat: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  charcoal: THREE.MeshStandardMaterial;
  brushed: THREE.MeshStandardMaterial;
  cooktop: THREE.MeshStandardMaterial;
}

/** Furniture maps. Kept off the floor oak so a door does not wear plank seams. */
export function createCaseFinish(): CaseFinish {
  const grain = grainMap();
  const weave = weaveMap();
  return {
    oak: material("oak", grain, 0.32),
    oakDark: material("oakDark", grain, 0.3),
    walnut: material("walnut", grain, 0.3),
    upholstery: material("upholstery", weave, 0.22),
    seat: material("seat", weave, 0.22),
    stone: material("stone", stoneMap(), 0.28),
    charcoal: material("charcoal", null, 0.28),
    brushed: material("brushed", null, 0.55),
    cooktop: material("cooktop", null, 0.45),
  };
}
