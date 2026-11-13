import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { QUALITY, TOD } from "@/config";

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TOD.dusk.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x1a2030, 1);
  return renderer;
}
