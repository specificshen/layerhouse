import { STATS, SUBTITLE, TIMES, TITLE, VIEW_MODES } from "@/config";

function text(id: string, value: string) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  el.textContent = value;
}

/** Fill the document title, loader, and brand from config. */
export function applyLabels() {
  document.title = `${TITLE} / ${SUBTITLE}`;
  text("loader-title", TITLE);
  text("loader-sub", SUBTITLE);
  text("brand-title", TITLE);
  text("brand-sub", SUBTITLE);
  text("stat-beds", String(STATS.beds));
  text("stat-area", String(STATS.area));
  text("stat-year", String(STATS.year));
  text("brand-tags", STATS.tags);

  for (const mode of VIEW_MODES) {
    const tip = document.querySelector(`[data-view="${mode.id}"] .tip`);
    const zh = tip?.querySelector("b");
    const en = tip?.querySelector("span");
    if (zh) zh.textContent = mode.zh;
    if (en) en.textContent = mode.en;
  }
  for (const time of TIMES) {
    const tip = document.querySelector(`[data-time="${time.id}"] .tip`);
    const zh = tip?.querySelector("b");
    const en = tip?.querySelector("span");
    if (zh) zh.textContent = time.zh;
    if (en) en.textContent = time.en;
  }
}

applyLabels();
