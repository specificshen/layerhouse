/** Steady drawing rate while the viewer is using the page. */
export const ACTIVE_HZ = 60;

/** Drawing rate after a short stretch with no camera, pointer, or key input. */
export const IDLE_HZ = 30;

/** How long the picture must sit still before the idle rate applies. */
export const IDLE_AFTER_MS = 2000;

/**
 * A display callback can land a fraction early. This keeps a 60Hz target from
 * accidentally drawing on both ticks of a 120Hz screen.
 */
const SLACK_MS = 0.75;

export interface FrameGate {
  /** `performance.now()` of the last drawn frame, or −1 before the first draw. */
  lastDrawn: number;
  /** `performance.now()` of the last pointer, key, or camera motion. */
  lastInput: number;
}

export type FrameAction = "stop" | "wait" | "draw";

export function createFrameGate(now: number): FrameGate {
  return { lastDrawn: -1, lastInput: now };
}

export function noteInput(gate: FrameGate, now: number) {
  gate.lastInput = now;
}

export function markDrawn(gate: FrameGate, now: number) {
  gate.lastDrawn = now;
}

export function isInteractionIdle(gate: FrameGate, now: number): boolean {
  return now - gate.lastInput >= IDLE_AFTER_MS;
}

export function targetHz(idle: boolean): number {
  return idle ? IDLE_HZ : ACTIVE_HZ;
}

export function minFrameDeltaMs(idle: boolean): number {
  return 1000 / targetHz(idle);
}

/**
 * Hidden tabs do not draw and do not keep the loop armed.
 * Otherwise draw only once the active (60) or idle (30) interval has elapsed.
 */
export function frameAction(gate: FrameGate, now: number, hidden: boolean): FrameAction {
  if (hidden) return "stop";
  if (gate.lastDrawn < 0) return "draw";
  const due = now - gate.lastDrawn >= minFrameDeltaMs(isInteractionIdle(gate, now)) - SLACK_MS;
  return due ? "draw" : "wait";
}

/** Milliseconds to wait before asking for the next frame. Zero means the frame is due. */
export function scheduleDelayMs(gate: FrameGate, now: number): number {
  if (gate.lastDrawn < 0) return 0;
  const wait = minFrameDeltaMs(isInteractionIdle(gate, now)) - (now - gate.lastDrawn);
  return wait > 0 ? wait : 0;
}
