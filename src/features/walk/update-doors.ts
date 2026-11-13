import type { Session } from "@/world/session";

export function updateDoors(s: Session, dt: number) {
  const swing = Math.PI * 0.72;
  for (const d of s.rec.doors) {
    d.open += (d.target - d.open) * Math.min(1, dt * 6);
    if (d.style === "slider") {
      d.leaf.rotation.y = 0;
      d.leaf.position.x = d.closedX + d.open * d.w * 0.46;
      continue;
    }
    d.leaf.rotation.y = d.open * swing * d.openSign;
  }
}
