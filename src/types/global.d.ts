import type { CutDir, LayerId, TimeId, ViewMode } from "./ids";
import type { DemoState, Vec3 } from "./world";

export interface DemoApi {
  setMode: (next: ViewMode) => void;
  applyTime: (id: TimeId) => void;
  setLayer: (id: LayerId) => void;
  setCut: (dir: CutDir, value: number) => void;
  snapCam: (pos: Vec3 | number[], target: Vec3 | number[]) => void;
  walkTo: (x: number, z: number, yaw: number, pitch?: number) => void;
  openDoor: () => void;
  setRoof: (y: number) => void;
  /** Proof hook. Normal modes keep masonry hidden; a section shot can turn it on. */
  showLayer: (id: LayerId, visible: boolean) => void;
  showNeighbors: (visible: boolean) => void;
  /** Tint floor assembly caps so the finish reads against the structural slab. */
  colorCaps: (on: boolean) => void;
  /** World Y extents of meshes whose names start with `prefix`. */
  measure: (prefix: string) => Record<string, { y0: number; y1: number }>;
  readonly state: DemoState;
  startFilm: () => void;
  stopFilm: () => void;
  /** Jump the film clock while it is playing. Reaching the end finishes on the hero. */
  seekFilm: (seconds: number) => void;
  readonly filmState: { playing: boolean; time: number };
}

declare global {
  interface Window {
    __demo?: DemoApi;
  }
}
