export {
  ACTIVE_HZ,
  IDLE_AFTER_MS,
  IDLE_HZ,
  createFrameGate,
  frameAction,
  isInteractionIdle,
  markDrawn,
  minFrameDeltaMs,
  noteInput,
  scheduleDelayMs,
  targetHz,
} from "./frame-pace";
export type { FrameAction, FrameGate } from "./frame-pace";
export { createPipeline } from "./post";
export {
  MAX_BACKING_PIXELS,
  MAX_PIXEL_RATIO,
  applyQualityQuery,
  applyRendererSize,
  createRenderer,
  previewBackendName,
  readBackendName,
  resolvePixelRatio,
  wantsWebGLBackend,
} from "./renderer";
