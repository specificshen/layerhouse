import type { ViewMode } from "@/types";
import type { Session } from "@/world/session";
import { setFilmChrome, setFilmVeil } from "./chrome";
import {
  applyFilmSample,
  captureView,
  releaseOrbit,
  restoreIdleCut,
  restoreView,
  seatRoof,
  suspendForFilm,
} from "./present";
import { advanceFilm, beginFilm, cancelFilm, createFilmRun, seekFilm, type FilmRun } from "./run";
import { roofSeat, sampleFilm, type FilmSample, type FilmTitle } from "./timeline";

export interface FilmHooks {
  session: Session;
  syncMode: (mode: ViewMode) => void;
  closeHelp: () => void;
  dismissHover: () => void;
  noteActivity: () => void;
}

export interface FilmController {
  isPlaying: () => boolean;
  start: (veil?: boolean) => void;
  stop: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  tick: (dt: number, hidden: boolean) => void;
  state: () => { playing: boolean; time: number };
}

function paint(playing: boolean, title: FilmTitle) {
  setFilmChrome(playing, title);
}

function settleRoof(session: Session, sample: FilmSample) {
  const seat = roofSeat(sample.beat);
  if (seat === "moving") return;
  seatRoof(session, seat === "up");
}

function finish(session: Session, hooks: FilmHooks, run: FilmRun, stamp: FilmRun["stamp"]) {
  if (stamp) restoreIdleCut(session, stamp);
  releaseOrbit(session);
  setFilmVeil(false);
  paint(false, "off");
  const mode = session.mode === "boot" ? "exploded" : session.mode;
  hooks.syncMode(mode);
  return run;
}

export function createFilm(hooks: FilmHooks): FilmController {
  let run = createFilmRun();
  const { session } = hooks;

  function show(sampleTitle: FilmTitle, veil: boolean) {
    if (veil) setFilmVeil(true);
    paint(true, sampleTitle);
    hooks.noteActivity();
  }

  const controller: FilmController = {
    isPlaying: () => run.phase === "playing",
    start(veil = true) {
      if (run.phase === "playing") return;
      hooks.closeHelp();
      hooks.dismissHover();
      const stamp = captureView(session);
      suspendForFilm(session);
      run = beginFilm(run, stamp);
      const sample = sampleFilm(0);
      applyFilmSample(session, sample);
      settleRoof(session, sample);
      if (!veil) setFilmVeil(false);
      show(sample.title, veil);
    },
    stop() {
      const canceled = cancelFilm(run);
      run = canceled.run;
      if (!canceled.restore) return;
      restoreView(session, canceled.restore);
      setFilmVeil(false);
      paint(false, "off");
      hooks.syncMode(canceled.restore.mode);
    },
    toggle() {
      if (run.phase === "playing") controller.stop();
      else controller.start();
    },
    seek(seconds) {
      const result = seekFilm(run, seconds);
      run = result.run;
      if (!result.sample) return;
      applyFilmSample(session, result.sample, true);
      settleRoof(session, result.sample);
      if (result.completed) {
        run = finish(session, hooks, result.run, result.stamp);
        return;
      }
      paint(true, result.sample.title);
    },
    tick(dt, hidden) {
      const before = run.time;
      const result = advanceFilm(run, dt, hidden);
      run = result.run;
      if (result.sample && (result.run.time !== before || result.completed)) {
        applyFilmSample(session, result.sample);
      }
      if (result.completed) {
        run = finish(session, hooks, result.run, result.stamp);
        return;
      }
      if (result.sample && result.run.phase === "playing") paint(true, result.sample.title);
      if (result.run.time !== before) hooks.noteActivity();
    },
    state: () => ({ playing: run.phase === "playing", time: run.time }),
  };
  return controller;
}
