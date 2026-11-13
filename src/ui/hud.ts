import { LAYERS } from "../config";
import type { CutDir, LayerId, TimeId, ViewMode } from "../types";
import { isTimeId, isViewMode } from "../types";
import { bindCutPanel } from "./cut-panel";
import { mustEl, setActive } from "./dom";

export interface HudActions {
  setMode: (next: ViewMode) => void;
  applyTime: (id: TimeId) => void;
  resetView: () => void;
  setCutDir: (dir: CutDir) => void;
  onCutInput: (unit: number) => void;
  onReturn: () => void;
  getCutRange: () => { min: number; max: number; def: number };
  getLayer: () => LayerId;
  setLayer: (id: LayerId) => void;
}

export function bindHud(actions: HudActions) {
  const list = mustEl<HTMLElement>("layer-list");
  list.innerHTML = "";
  for (const layer of LAYERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.layer = layer.id;
    button.innerHTML = `${layer.en}<span class="zh">${layer.zh}</span>`;
    if (layer.id === actions.getLayer()) button.classList.add("active");
    button.addEventListener("click", () => {
      actions.setLayer(layer.id);
      setActive("#layer-list button", (item) => item.dataset.layer === layer.id);
    });
    list.appendChild(button);
  }

  document.querySelectorAll<HTMLElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isViewMode(button.dataset.view)) actions.setMode(button.dataset.view);
    });
  });
  document.querySelectorAll<HTMLElement>("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isTimeId(button.dataset.time)) actions.applyTime(button.dataset.time);
    });
  });
  mustEl<HTMLElement>("btn-reset").addEventListener("click", actions.resetView);
  mustEl<HTMLElement>("btn-reset-dial").addEventListener("click", actions.resetView);
  bindCutPanel(actions);
  mustEl<HTMLElement>("btn-return").addEventListener("click", actions.onReturn);
}

export function syncModeChrome(mode: ViewMode) {
  setActive("[data-view]", (button) => button.dataset.view === mode);
  mustEl<HTMLElement>("cut-panel").classList.toggle("show", mode === "cut");
  mustEl<HTMLElement>("layer-list").classList.toggle("show", mode === "xray");
  mustEl<HTMLElement>("walk-bar").classList.toggle("show", mode === "walk");
  mustEl<HTMLElement>("walk-hints").classList.toggle("show", mode === "walk");
}
