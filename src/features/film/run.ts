import type { CutDir, LayerId, TimeId, Vec3, ViewMode } from "@/types";
import { FILM_DURATION, sampleFilm, type FilmSample } from "./timeline";

/** Matches the render loop's frame step so one late frame cannot skip a beat. */
export const FILM_STEP_CAP_S = 0.05;

export interface ViewStamp {
  mode: ViewMode;
  timeId: TimeId;
  cutDir: CutDir;
  cutValue: number;
  xrayLayer: LayerId;
  prevMode: ViewMode;
  position: Vec3;
  target: Vec3;
  walkOn: boolean;
  yaw: number;
  pitch: number;
  entryDoor: number;
}

export interface FilmRun {
  phase: "idle" | "playing";
  time: number;
  stamp: ViewStamp | null;
}

export interface FilmTick {
  run: FilmRun;
  sample: FilmSample | null;
  completed: boolean;
  /** Set when the film reaches its last frame. Early cancel uses `cancelFilm` instead. */
  stamp: ViewStamp | null;
}

export function createFilmRun(): FilmRun {
  return { phase: "idle", time: 0, stamp: null };
}

export function beginFilm(run: FilmRun, stamp: ViewStamp): FilmRun {
  if (run.phase === "playing") return run;
  return { phase: "playing", time: 0, stamp };
}

function cappedStep(dt: number): number {
  if (!(dt > 0)) return 0;
  return Math.min(dt, FILM_STEP_CAP_S);
}

export function advanceFilm(run: FilmRun, dt: number, hidden: boolean): FilmTick {
  if (run.phase !== "playing") return { run, sample: null, completed: false, stamp: null };
  const step = hidden ? 0 : cappedStep(dt);
  if (!(step > 0)) {
    return { run, sample: sampleFilm(run.time), completed: false, stamp: null };
  }
  const time = Math.min(FILM_DURATION, run.time + step);
  const completed = time >= FILM_DURATION && run.time < FILM_DURATION;
  const stamp = completed ? run.stamp : null;
  const next: FilmRun = completed
    ? { phase: "idle", time: FILM_DURATION, stamp: null }
    : { phase: "playing", time, stamp: run.stamp };
  return { run: next, sample: sampleFilm(time), completed, stamp };
}

export function cancelFilm(run: FilmRun): { run: FilmRun; restore: ViewStamp | null } {
  if (run.phase !== "playing" || !run.stamp) {
    return { run: { phase: "idle", time: 0, stamp: null }, restore: null };
  }
  return { run: { phase: "idle", time: 0, stamp: null }, restore: run.stamp };
}

export function seekFilm(run: FilmRun, time: number): FilmTick {
  if (run.phase !== "playing") return { run, sample: null, completed: false, stamp: null };
  const nextTime = Math.min(FILM_DURATION, Math.max(0, Number.isFinite(time) ? time : run.time));
  const completed = nextTime >= FILM_DURATION;
  const next: FilmRun = completed
    ? { phase: "idle", time: FILM_DURATION, stamp: null }
    : { phase: "playing", time: nextTime, stamp: run.stamp };
  return {
    run: next,
    sample: sampleFilm(nextTime),
    completed,
    stamp: completed ? run.stamp : null,
  };
}
