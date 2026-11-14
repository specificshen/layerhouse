export const LOAD_KINDS = [
  "scene",
  "site",
  "trees",
  "systems",
  "gpu",
  "light",
  "compile",
  "ready",
] as const;

export type LoadKind = (typeof LOAD_KINDS)[number];

/** Fraction of the determinate bar. Zero completed steps is already past empty. */
export function loadFraction(done: number, total: number): number {
  if (!(total > 0)) return 1;
  const clamped = Math.min(total, Math.max(0, done));
  if (clamped >= total) return 1;
  return 0.05 + (clamped / total) * 0.95;
}

export function loadStatus(kind: LoadKind): string {
  switch (kind) {
    case "scene":
      return "正在搭场景 · Building the scene";
    case "site":
      return "庭院与场地 · Site";
    case "trees":
      return "树木 · Trees";
    case "systems":
      return "构造层 · Assemblies";
    case "gpu":
      return "启动渲染 · Starting the renderer";
    case "light":
      return "准备光线 · Preparing light";
    case "compile":
      return "编译画面 · Compiling";
    case "ready":
      return "马上好 · Almost ready";
    default: {
      const unexpected: never = kind;
      return unexpected;
    }
  }
}

export function paintLoader(done: number, total: number, status: string) {
  const bar = document.getElementById("loadbar");
  const el = document.getElementById("loader-status");
  if (bar) bar.style.width = `${(loadFraction(done, total) * 100).toFixed(2)}%`;
  if (el) el.textContent = status;
}

export function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/** Push a status and bar width, then let the browser paint before the next block of work. */
export async function showLoadStep(done: number, total: number, status: string) {
  paintLoader(done, total, status);
  await nextPaint();
  await nextPaint();
}

export function hideLoader() {
  const el = document.getElementById("loader");
  if (!el) return;
  el.classList.add("gone");
  window.setTimeout(() => {
    el.remove();
  }, 700);
}
