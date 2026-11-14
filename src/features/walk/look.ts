/** Radians of look per pixel of mouse travel. */
export const WALK_LOOK_SENS = 0.0022;

/**
 * Mouse-right is positive `dx` and increases yaw.
 * At yaw 0 the view looks down −Z, and +X is the player's right, so a larger yaw turns right.
 */
export function yawDelta(dx: number): number {
  return dx * WALK_LOOK_SENS;
}

/**
 * Mouse-down is positive `dy` and decreases pitch, so the view looks down.
 * Left/right is handled by `yawDelta`; this sign is the existing vertical mapping.
 */
export function pitchDelta(dy: number): number {
  return -dy * WALK_LOOK_SENS;
}

export function lookDirection(yaw: number, pitch: number): { x: number; y: number; z: number } {
  const cy = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * cy,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cy,
  };
}

/** Ground-plane right. At yaw 0 this is +X. */
export function lookRight(yaw: number): { x: number; z: number } {
  return { x: Math.cos(yaw), z: Math.sin(yaw) };
}
