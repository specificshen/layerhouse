import type { OrbitPreset, WalkPreset } from "../types";
import { EYE, Y_GF_TOP } from "./house";

export const CAM = {
  exterior: { pos: [16.6, 8.8, 15.4], target: [0.6, 2.5, -1.4] },
  exploded: { pos: [9.6, 15.4, -16.2], target: [0.8, 2.5, -2.6] },
  /** Street 3/4 dollhouse frame. Not a dial mode; orbit or `snapCam` lands here. */
  explodedStreet: { pos: [4.2, 13.2, 9.4], target: [-2.8, 2.4, -2.2] },
  cut: { pos: [6.5, 18.5, 10.5], target: [0.0, 1.6, -2.0] },
  cutSide: { pos: [1.2, 8.6, 19.5], target: [0.4, 3.1, 0.2] },
  cutFront: { pos: [0.8, 9.8, 22.5], target: [0.0, 3.0, -1.5] },
  xray: { pos: [18.5, 14.8, 15.5], target: [0.0, 2.6, -1.8] },
  walkStart: { pos: [-0.95, Y_GF_TOP + EYE, 9.45], yaw: 0, pitch: 0.04 },
} as const satisfies {
  exterior: OrbitPreset;
  exploded: OrbitPreset;
  explodedStreet: OrbitPreset;
  cut: OrbitPreset;
  cutSide: OrbitPreset;
  cutFront: OrbitPreset;
  xray: OrbitPreset;
  walkStart: WalkPreset;
};
