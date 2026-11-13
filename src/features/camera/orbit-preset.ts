import { CAM } from "@/config";
import type { CutDir, Mode } from "@/types";

export function orbitPreset(mode: Mode, cutDir: CutDir) {
  if (mode === "cut") {
    return CAM[cutDir === "side" ? "cutSide" : cutDir === "front" ? "cutFront" : "cut"];
  }
  if (mode === "exterior" || mode === "exploded" || mode === "xray") return CAM[mode];
  return CAM.exploded;
}
