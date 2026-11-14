/** Horizontal reach used by the E key and the on-screen prompt. */
export const DOOR_REACH = 2.2;

export interface DoorReach {
  x: number;
  z: number;
  y0: number;
  y1: number;
}

export function nearestDoorIndex(
  doors: readonly DoorReach[],
  camera: { x: number; y: number; z: number },
  reach = DOOR_REACH,
): number {
  let best = -1;
  let bestDist = reach;
  for (let i = 0; i < doors.length; i++) {
    const door = doors[i];
    if (!door) continue;
    const dist = Math.hypot(door.x - camera.x, door.z - camera.z);
    const inHeight = camera.y > door.y0 - 0.5 && camera.y < door.y1 + 0.8;
    if (dist < bestDist && inHeight) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}

export function doorPromptVisible(walking: boolean, doorIndex: number): boolean {
  return walking && doorIndex >= 0;
}
