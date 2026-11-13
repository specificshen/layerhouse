import { CylBatch } from "@/geom";

export function wirePath(
  batch: CylBatch,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  r = 0.012,
) {
  const pts: Array<[number, number, number]> = [
    [x0, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b, c] = pts[i]!;
    const [d, e, f] = pts[i + 1]!;
    const dx = d - a,
      dy = e - b,
      dz = f - c;
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.03) continue;
    const x = (a + d) / 2,
      y = (b + e) / 2,
      z = (c + f) / 2;
    let rotX = 0,
      rotZ = 0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) rotZ = Math.PI / 2;
    else if (Math.abs(dz) > Math.abs(dy)) rotX = Math.PI / 2;
    batch.add(r, len, x, y, z, rotX, rotZ, 0);
  }
}
