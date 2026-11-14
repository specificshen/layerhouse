import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { QUALITY, TOD } from "@/config";

/** Upper bound for the drawing-buffer ratio. 1x screens stay at 1. */
export const MAX_PIXEL_RATIO = 1.5;

/**
 * Cap the color buffer near 2.5 megapixels so a large 2x panel does not render
 * at the full retina grid plus MSAA. The ratio never drops below 1 when the
 * display itself is at least 1x, so an ordinary screen stays sharp.
 */
export const MAX_BACKING_PIXELS = 2_500_000;

export function resolvePixelRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const width = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1;
  const height = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 1;
  const fit = Math.sqrt(MAX_BACKING_PIXELS / (width * height));
  let ratio = Math.min(dpr, MAX_PIXEL_RATIO, fit);
  if (dpr >= 1) ratio = Math.max(ratio, 1);
  return Math.min(ratio, dpr);
}

export function applyRendererSize(
  renderer: { setPixelRatio(value: number): void; setSize(width: number, height: number): void },
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
) {
  renderer.setPixelRatio(resolvePixelRatio(cssWidth, cssHeight, devicePixelRatio));
  renderer.setSize(cssWidth, cssHeight);
}

export function wantsWebGLBackend(params: URLSearchParams): boolean {
  return params.get("backend") === "webgl";
}

/** `?fx=low` turns off GTAO, SSR, and the pool mirror. */
export function applyQualityQuery(params: URLSearchParams) {
  if (params.get("fx") === "low") {
    QUALITY.ao = false;
    QUALITY.ssr = false;
    QUALITY.poolReflection = false;
  }
}

/** Label shown before `renderer.init()` resolves the real backend. */
export function previewBackendName(forceWebGL: boolean): "WebGPU" | "WebGL2" {
  return forceWebGL ? "WebGL2" : "WebGPU";
}

export function readBackendName(backend: { isWebGPUBackend?: boolean }): "WebGPU" | "WebGL2" {
  return backend.isWebGPUBackend === true ? "WebGPU" : "WebGL2";
}

export function createRenderer(canvas: HTMLCanvasElement, forceWebGL: boolean) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    forceWebGL,
  });
  applyRendererSize(renderer, window.innerWidth, window.innerHeight, window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TOD.dusk.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x1a2030, 1);
  return renderer;
}
