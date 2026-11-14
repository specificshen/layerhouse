import type { Session } from "@/world/session";
import { doorPromptVisible, nearestDoorIndex } from "./nearest-door";

export function syncDoorPrompt(s: Session) {
  const el = document.getElementById("door-prompt");
  if (!el) return;
  const index = s.walk.on ? nearestDoorIndex(s.rec.doors, s.camera.position) : -1;
  const show = doorPromptVisible(s.walk.on, index);
  el.classList.toggle("show", show);
  el.setAttribute("aria-hidden", show ? "false" : "true");
}
