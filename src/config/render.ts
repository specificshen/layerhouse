/** Clearance so a street 3/4 still sees under the gable into furnished rooms. */
export const ROOF_LIFT = 5.6;

/**
 * Effects on the WebGPU path and its WebGL2 fallback.
 * `?fx=low` turns the expensive ones off when a machine can't hold frame time.
 */
export const QUALITY = {
  ao: true,
  ssr: true,
  bloom: true,
  poolReflection: true,
  poolReflectScale: 0.5,
  aoResolution: 0.5,
  ssrResolution: 0.5,
};
