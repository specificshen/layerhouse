import type { Vec3 } from "@/types";

/** Zero slope at 0 and 1. Matches a slow departure and arrival. */
export function easeInOut(u: number): number {
  const t = Math.min(1, Math.max(0, u));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp3(a: Vec3, b: Vec3, u: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

export function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function catmull(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  );
}

export interface TrackFrame {
  index: number;
  local: number;
}

/** Segment along `driver`, eased once across its arc length. */
export function trackFrame(driver: readonly Vec3[], u: number): TrackFrame {
  const eased = easeInOut(u);
  const lengths: number[] = [0];
  for (let i = 1; i < driver.length; i++) {
    const prev = driver[i - 1];
    const next = driver[i];
    if (!prev || !next) break;
    lengths.push((lengths[i - 1] ?? 0) + distance3(prev, next));
  }
  const total = lengths[lengths.length - 1] ?? 0;
  if (!(total > 0)) return { index: 1, local: 0 };
  const along = eased * total;
  let index = 1;
  while (index < lengths.length - 1 && (lengths[index] ?? 0) < along) index += 1;
  const end = lengths[index] ?? total;
  const start = lengths[index - 1] ?? 0;
  const span = end - start;
  return { index, local: span > 0 ? (along - start) / span : 0 };
}

export function sampleTrackSegment(knots: readonly Vec3[], frame: TrackFrame): Vec3 {
  const first = knots[0];
  if (!first) throw new Error("empty track");
  const a = knots[frame.index - 1] ?? first;
  const b = knots[frame.index] ?? a;
  return lerp3(a, b, frame.local);
}

/**
 * Uniform Catmull-Rom through every knot. `u` is eased once across the whole curve
 * so intermediate knots are not stops.
 */
export function sampleGlide(knots: readonly Vec3[], u: number): Vec3 {
  const first = knots[0];
  if (!first) throw new Error("empty glide");
  if (knots.length === 1) return first;
  const eased = easeInOut(u);
  if (knots.length === 2) return lerp3(first, knots[1] ?? first, eased);
  const segments = knots.length - 1;
  const span = segments * eased;
  const index = Math.min(segments - 1, Math.floor(span));
  const local = span - index;
  const at = (i: number) => knots[Math.min(knots.length - 1, Math.max(0, i))] ?? first;
  const p0 = at(index - 1);
  const p1 = at(index);
  const p2 = at(index + 1);
  const p3 = at(index + 2);
  return [
    catmull(p0[0], p1[0], p2[0], p3[0], local),
    catmull(p0[1], p1[1], p2[1], p3[1], local),
    catmull(p0[2], p1[2], p2[2], p3[2], local),
  ];
}
