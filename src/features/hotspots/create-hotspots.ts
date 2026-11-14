import * as THREE from "three";
import type { HouseRecord, Mode } from "@/types";
import { mustEl } from "@/ui/dom";

export interface HotspotController {
  onMouseMove: (ev: MouseEvent) => void;
  updateLabel: () => void;
  dismiss: () => void;
}

export function createHotspots(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  rec: HouseRecord,
  getMode: () => Mode,
): HotspotController {
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const hotLabel = mustEl<HTMLElement>("hot-label");
  const outline = new THREE.BoxHelper(new THREE.Object3D());
  outline.material.color.set(0xffffff);
  outline.visible = false;
  scene.add(outline);
  let hover: (typeof rec.hotspots)[number] | null = null;
  const hits: THREE.Mesh[] = [];
  for (const h of rec.hotspots) {
    const probe = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    probe.position.copy(h.position);
    probe.userData.hot = h;
    scene.add(probe);
    hits.push(probe);
  }

  function placeLabel() {
    if (!hover) return;
    const v = hover.position.clone().project(camera);
    hotLabel.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
    hotLabel.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
  }

  return {
    onMouseMove(ev: MouseEvent) {
      const mode = getMode();
      if (mode === "walk" || mode === "xray") {
        outline.visible = false;
        hotLabel.style.display = "none";
        hover = null;
        return;
      }
      const r = canvas.getBoundingClientRect();
      mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      const found = ray.intersectObjects(hits, false);
      if (!found.length) {
        hover = null;
        outline.visible = false;
        hotLabel.style.display = "none";
        return;
      }
      const h = found[0]!.object.userData.hot as (typeof rec.hotspots)[number];
      hover = h;
      if (h.object) {
        outline.setFromObject(h.object);
        outline.visible = true;
      }
      hotLabel.style.display = "block";
      hotLabel.textContent = `${h.labelZh}  ${h.labelEn}`;
      placeLabel();
    },
    updateLabel: placeLabel,
    dismiss() {
      hover = null;
      outline.visible = false;
      hotLabel.style.display = "none";
    },
  };
}
