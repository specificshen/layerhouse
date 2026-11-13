import type { CutDir } from "@/types";
import { isCutDir } from "@/types";
import { mustEl, setActive } from "./dom";

export type CutSliderFrom = "slider" | "meters";

/** Map the 0–100 slider and a cut position in meters onto each other. */
export function cutPanel(
  range: { readonly min: number; readonly max: number },
  amount: number,
  from: CutSliderFrom,
): number {
  const span = range.max - range.min;
  switch (from) {
    case "slider":
      return range.min + (amount / 100) * span;
    case "meters":
      return ((amount - range.min) / span) * 100;
    default: {
      const unexpected: never = from;
      return unexpected;
    }
  }
}

export function bindCutPanel(actions: {
  setCutDir: (dir: CutDir) => void;
  onCutInput: (meters: number) => void;
  getCutRange: () => { min: number; max: number };
}) {
  document.querySelectorAll<HTMLElement>("#cut-panel [data-cut]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isCutDir(button.dataset.cut)) return;
      setActive("#cut-panel [data-cut]", (item) => item === button);
      actions.setCutDir(button.dataset.cut);
    });
  });
  mustEl<HTMLInputElement>("cut-slider").addEventListener("input", (event) => {
    const range = actions.getCutRange();
    const value = Number((event.target as HTMLInputElement).value);
    actions.onCutInput(cutPanel(range, value, "slider"));
  });
}
