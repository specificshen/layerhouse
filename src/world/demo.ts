import * as THREE from "three";
import { CAM, EYE } from "@/config";
import { setHouseVisibility } from "@/features/layers/visibility";
import { applyWalkLook } from "@/features/walk";
import { heightAt } from "@/scene/house";
import type { CutDir, DemoApi, LayerId, Vec3, ViewMode } from "@/types";
import { cutPanel } from "@/ui/cut-panel";
import { mustEl, setActive } from "@/ui/dom";
import { applyTime, syncOpenRoofLighting } from "./lighting";
import { cutRange, updateCut } from "./section";
import type { Session } from "./session";

export function attachDemo(
  session: Session,
  setMode: (next: ViewMode) => void,
  houseRoot: THREE.Object3D,
) {
  const { camera, orbit, rec, context, waterGrp } = session;
  const demo: DemoApi = {
    setMode,
    applyTime: (id) => applyTime(session, id),
    setLayer(id: LayerId) {
      session.xrayLayer = id;
      setActive("#layer-list button", (button) => button.dataset.layer === id);
      setHouseVisibility(session);
    },
    setCut(dir: CutDir, value: number) {
      if (session.mode !== "cut") setMode("cut");
      session.cutDir = dir;
      session.cutValue = value;
      setActive("#cut-panel [data-cut]", (button) => button.dataset.cut === dir);
      const range = cutRange(session);
      mustEl<HTMLInputElement>("cut-slider").value = String(cutPanel(range, value, "meters"));
      updateCut(session);
      const preset = CAM[dir === "side" ? "cutSide" : dir === "front" ? "cutFront" : "cut"];
      camera.position.set(preset.pos[0], preset.pos[1], preset.pos[2]);
      orbit.target.set(preset.target[0], preset.target[1], preset.target[2]);
      orbit.update();
      session.cam.active = false;
    },
    snapCam(pos: Vec3 | number[], target: Vec3 | number[]) {
      camera.position.set(pos[0]!, pos[1]!, pos[2]!);
      orbit.target.set(target[0]!, target[1]!, target[2]!);
      orbit.update();
      session.cam.active = false;
    },
    walkTo(x: number, z: number, yaw: number, pitch = 0.02) {
      if (session.mode !== "walk") setMode("walk");
      session.cam.active = false;
      camera.position.set(x, heightAt(rec, x, z, 0.25) + EYE, z);
      session.walk.yaw = yaw;
      session.walk.pitch = pitch;
      applyWalkLook(session);
    },
    openDoor() {
      rec.doors.forEach((door) => {
        if (door.style === "pivot") door.target = 1;
      });
    },
    setRoof(y: number) {
      session.roofY = y;
      rec.roofGroup.position.y = y;
      syncOpenRoofLighting(session);
    },
    showLayer(id, visible) {
      rec.groups[id].visible = visible;
    },
    showNeighbors(visible: boolean) {
      context.visible = visible;
    },
    colorCaps(on: boolean) {
      session.capColors = on;
      if (session.mode === "cut") updateCut(session);
    },
    measure(prefix: string) {
      const out: Record<string, { y0: number; y1: number }> = {};
      houseRoot.updateWorldMatrix(true, true);
      waterGrp.updateWorldMatrix(true, true);
      const box = new THREE.Box3();
      const visit = (obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh && obj.name.startsWith(prefix)) {
          box.setFromObject(obj);
          const cur = out[obj.name];
          if (!cur) out[obj.name] = { y0: box.min.y, y1: box.max.y };
          else {
            cur.y0 = Math.min(cur.y0, box.min.y);
            cur.y1 = Math.max(cur.y1, box.max.y);
          }
        }
      };
      houseRoot.traverse(visit);
      waterGrp.traverse(visit);
      return out;
    },
    get state() {
      return {
        mode: session.mode,
        timeId: session.timeId,
        xrayLayer: session.xrayLayer,
        cutDir: session.cutDir,
        cutValue: session.cutValue,
        roofY: session.roofY,
      };
    },
  };
  window.__demo = demo;
}
