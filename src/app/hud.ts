import { LAYERS } from "../config";
import type { CutDir, LayerId, TimeId, ViewMode } from "../types";
import { isCutDir, isTimeId, isViewMode } from "../types";
import { mustEl } from "./dom";

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

let helpOpen = false;

export function isHelpOpen() {
  return helpOpen;
}

export function closeHelp() {
  helpOpen = false;
  mustEl<HTMLElement>("help").classList.remove("show");
  mustEl<HTMLElement>("help-bg").classList.remove("show");
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
      list.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("active", item.dataset.layer === layer.id);
      });
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
  mustEl<HTMLElement>("btn-help").addEventListener("click", () => {
    helpOpen = true;
    mustEl<HTMLElement>("help").classList.add("show");
    mustEl<HTMLElement>("help-bg").classList.add("show");
  });
  mustEl<HTMLElement>("help-close").addEventListener("click", closeHelp);
  mustEl<HTMLElement>("help-bg").addEventListener("click", closeHelp);

  document.querySelectorAll<HTMLElement>("#cut-panel [data-cut]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isCutDir(button.dataset.cut)) return;
      document
        .querySelectorAll("#cut-panel [data-cut]")
        .forEach((item) => item.classList.toggle("active", item === button));
      actions.setCutDir(button.dataset.cut);
    });
  });
  mustEl<HTMLInputElement>("cut-slider").addEventListener("input", (event) => {
    const range = actions.getCutRange();
    const value = Number((event.target as HTMLInputElement).value);
    actions.onCutInput(range.min + (value / 100) * (range.max - range.min));
  });
  mustEl<HTMLElement>("btn-return").addEventListener("click", actions.onReturn);
}

export function syncModeChrome(mode: ViewMode) {
  document
    .querySelectorAll<HTMLElement>("[data-view]")
    .forEach((button) => button.classList.toggle("active", button.dataset.view === mode));
  mustEl<HTMLElement>("cut-panel").classList.toggle("show", mode === "cut");
  mustEl<HTMLElement>("layer-list").classList.toggle("show", mode === "xray");
  mustEl<HTMLElement>("walk-bar").classList.toggle("show", mode === "walk");
  mustEl<HTMLElement>("walk-hints").classList.toggle("show", mode === "walk");
}
