import { CAM, LAYERS, ROOF_LIFT } from "@/config";
import { enterWalk, exitWalk } from "@/features/walk";
import { setHouseVisibility } from "@/features/layers/visibility";
import { TIME_IDS, type LayerId, type TimeId, type ViewMode } from "@/types";
import { applyTime, syncOpenRoofLighting } from "./lighting";
import { updateCut } from "./section";
import type { Session } from "./session";

export interface WarmStep {
  id: string;
  status: string;
  run: (s: Session) => void;
}

export function timeStatus(id: TimeId): string {
  switch (id) {
    case "night":
      return "准备夜晚光线 · Night light";
    case "dawn":
      return "准备黎明光线 · Dawn light";
    case "day":
      return "准备白昼光线 · Day light";
    case "dusk":
      return "准备黄昏光线 · Dusk light";
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

function snap(s: Session, pos: readonly number[], target: readonly number[]) {
  s.camera.position.set(pos[0]!, pos[1]!, pos[2]!);
  s.orbit.target.set(target[0]!, target[1]!, target[2]!);
  s.camera.lookAt(target[0]!, target[1]!, target[2]!);
  s.orbit.update();
  s.cam.active = false;
}

function releaseWalk(s: Session) {
  if (s.walk.on) exitWalk(s);
}

function clearCut(s: Session) {
  s.clipPlanes.length = 0;
  s.clipGroup.enabled = false;
  s.capGroup.clear();
}

function placeCamera(s: Session, mode: ViewMode) {
  switch (mode) {
    case "exterior":
    case "exploded":
    case "xray":
      snap(s, CAM[mode].pos, CAM[mode].target);
      s.orbit.enabled = true;
      return;
    case "cut":
      snap(s, CAM.cut.pos, CAM.cut.target);
      s.orbit.enabled = true;
      return;
    case "walk":
      enterWalk(s);
      return;
    default: {
      const unexpected: never = mode;
      throw new Error(`Unhandled view ${unexpected}`);
    }
  }
}

function pose(s: Session, mode: ViewMode) {
  releaseWalk(s);
  s.mode = mode;
  s.roofY = mode === "exploded" ? ROOF_LIFT : 0;
  s.rec.roofGroup.position.y = s.roofY;
  if (mode === "cut") {
    s.cutDir = "top";
    s.cutValue = 4.3;
    updateCut(s);
  } else {
    clearCut(s);
  }
  placeCamera(s, mode);
  setHouseVisibility(s);
  syncOpenRoofLighting(s);
  s.pipeline.render();
}

function renderTime(s: Session, id: TimeId) {
  releaseWalk(s);
  clearCut(s);
  s.mode = "exploded";
  s.roofY = ROOF_LIFT;
  s.rec.roofGroup.position.y = ROOF_LIFT;
  snap(s, CAM.exploded.pos, CAM.exploded.target);
  s.orbit.enabled = true;
  setHouseVisibility(s);
  applyTime(s, id);
  s.pipeline.render();
}

/** One compiled frame per time of day and per dial mode, so the click path stays light. */
export function warmupPlan(): WarmStep[] {
  const steps: WarmStep[] = [];
  for (const id of TIME_IDS) {
    steps.push({
      id: `time:${id}`,
      status: timeStatus(id),
      run: (s) => renderTime(s, id),
    });
  }
  const modes: Array<{ id: ViewMode; status: string }> = [
    { id: "exterior", status: "编译外观 · Compiling exterior" },
    { id: "exploded", status: "编译剖开 · Compiling exploded" },
    { id: "cut", status: "编译剖切 · Compiling cut" },
    { id: "walk", status: "编译漫游 · Compiling walkthrough" },
  ];
  for (const mode of modes) {
    steps.push({
      id: `mode:${mode.id}`,
      status: mode.status,
      run: (s) => pose(s, mode.id),
    });
  }
  let xrayPlaced = false;
  for (const layer of LAYERS) {
    steps.push({
      id: `mode:xray:${layer.id}`,
      status: `编译透视 · ${layer.zh}`,
      run(s) {
        s.xrayLayer = layer.id;
        if (!xrayPlaced) {
          xrayPlaced = true;
          pose(s, "xray");
          return;
        }
        releaseWalk(s);
        clearCut(s);
        s.mode = "xray";
        setHouseVisibility(s);
        s.pipeline.render();
      },
    });
  }
  steps.push({
    id: "overview",
    status: "编译远景 · Compiling the grounds",
    run(s) {
      releaseWalk(s);
      clearCut(s);
      s.mode = "exterior";
      s.roofY = 0;
      s.rec.roofGroup.position.y = 0;
      s.camera.position.set(26, 30, 28);
      s.camera.lookAt(0, 2, -4);
      s.orbit.target.set(0, 2, -4);
      s.cam.active = false;
      setHouseVisibility(s);
      syncOpenRoofLighting(s);
      s.pipeline.render();
    },
  });
  return steps;
}

export function presentExplodedDusk(s: Session) {
  releaseWalk(s);
  clearCut(s);
  s.mode = "exploded";
  s.xrayLayer = "framing" satisfies LayerId;
  s.cutDir = "top";
  s.cutValue = 4.3;
  s.roofY = ROOF_LIFT;
  s.rec.roofGroup.position.y = ROOF_LIFT;
  snap(s, CAM.exploded.pos, CAM.exploded.target);
  s.orbit.enabled = true;
  applyTime(s, "dusk");
  setHouseVisibility(s);
  s.pipeline.render();
}
