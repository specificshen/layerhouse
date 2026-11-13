import { mustEl } from "./dom";

export interface HelpDialog {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
}

/** Help visibility lives on the object the caller keeps. */
export function createHelpDialog(): HelpDialog {
  let open = false;
  const setOpen = (next: boolean) => {
    open = next;
    mustEl<HTMLElement>("help").classList.toggle("show", next);
    mustEl<HTMLElement>("help-bg").classList.toggle("show", next);
  };
  mustEl<HTMLElement>("btn-help").addEventListener("click", () => setOpen(true));
  mustEl<HTMLElement>("help-close").addEventListener("click", () => setOpen(false));
  mustEl<HTMLElement>("help-bg").addEventListener("click", () => setOpen(false));
  return {
    isOpen: () => open,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}
