import type { FilmTitle } from "./timeline";

let chromeKey = "";

export function setFilmChrome(playing: boolean, title: FilmTitle) {
  const next = `${playing ? 1 : 0}:${title}`;
  if (next === chromeKey) return;
  chromeKey = next;
  document.getElementById("hud")?.classList.toggle("film-on", playing);
  const card = document.getElementById("film-card");
  const showTitle = playing && title !== "off";
  card?.classList.toggle("show", showTitle);
  card?.setAttribute("aria-hidden", showTitle ? "false" : "true");
  const button = document.getElementById("btn-film");
  button?.classList.toggle("is-playing", playing);
  button?.setAttribute("aria-pressed", playing ? "true" : "false");
  button?.setAttribute("title", playing ? "结束 End · Esc" : "电影 Film · P");
  const zh = document.getElementById("film-zh");
  const en = document.getElementById("film-en");
  if (zh) zh.textContent = playing ? "结束" : "电影";
  if (en) en.textContent = playing ? "End" : "Film";
}

export function setFilmVeil(on: boolean) {
  document.getElementById("hud")?.classList.toggle("film-veil", on);
}
