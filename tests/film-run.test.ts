import { describe, expect, test } from "bun:test";
import {
  advanceFilm,
  beginFilm,
  cancelFilm,
  createFilmRun,
  seekFilm,
  FILM_STEP_CAP_S,
} from "@/features/film/run";
import type { ViewStamp } from "@/features/film/run";
import { FILM_DURATION, sampleFilm } from "@/features/film/timeline";
import { filmAutostart } from "@/features/film/query";

function stamp(mode: ViewStamp["mode"] = "exploded"): ViewStamp {
  return {
    mode,
    timeId: "dusk",
    cutDir: "top",
    cutValue: 4.3,
    xrayLayer: "framing",
    prevMode: "exploded",
    position: [9.6, 15.4, -16.2],
    target: [0.8, 2.5, -2.6],
    walkOn: mode === "walk",
    yaw: 0.2,
    pitch: -0.1,
    entryDoor: 0,
  };
}

describe("film playback", () => {
  test("starting remembers the view and a second start does not replace it", () => {
    const first = stamp("walk");
    let run = beginFilm(createFilmRun(), first);
    expect(run.phase).toBe("playing");
    expect(run.time).toBe(0);
    expect(run.stamp).toBe(first);
    run = beginFilm(run, stamp("exterior"));
    expect(run.stamp).toBe(first);
    expect(run.time).toBe(0);
  });

  test("a hidden tab does not advance the film clock", () => {
    let run = beginFilm(createFilmRun(), stamp());
    const moved = advanceFilm(run, 0.016, false);
    run = moved.run;
    const hidden = advanceFilm(run, 2, true);
    expect(hidden.run.time).toBe(moved.run.time);
    expect(hidden.completed).toBe(false);
    expect(hidden.run.phase).toBe("playing");
    expect(hidden.run.stamp).toBe(run.stamp);
  });

  test("one late frame cannot skip more than the render step", () => {
    const run = beginFilm(createFilmRun(), stamp());
    const stepped = advanceFilm(run, 1.5, false);
    expect(stepped.run.time).toBe(FILM_STEP_CAP_S);
    expect(stepped.sample?.elapsed).toBe(FILM_STEP_CAP_S);
  });

  test("stopping early returns the captured view", () => {
    const saved = stamp("cut");
    let run = beginFilm(createFilmRun(), saved);
    run = advanceFilm(run, 0.05, false).run;
    run = advanceFilm(run, 0.05, false).run;
    const stopped = cancelFilm(run);
    expect(stopped.restore).toBe(saved);
    expect(stopped.restore?.mode).toBe("cut");
    expect(stopped.restore?.walkOn).toBe(false);
    expect(stopped.run.phase).toBe("idle");
    expect(stopped.run.stamp).toBeNull();
    expect(cancelFilm(stopped.run).restore).toBeNull();
  });

  test("playing to the end finishes on the hero without a restore stamp in the run", () => {
    let run = beginFilm(createFilmRun(), stamp("walk"));
    let completed = false;
    let ended = sampleFilm(0);
    for (let i = 0; i < 4000 && run.phase === "playing"; i++) {
      const step = advanceFilm(run, FILM_STEP_CAP_S, false);
      run = step.run;
      if (step.sample) ended = step.sample;
      if (step.completed) {
        completed = true;
        expect(step.stamp?.mode).toBe("walk");
        expect(step.stamp?.walkOn).toBe(true);
      }
    }
    expect(completed).toBe(true);
    expect(run.phase).toBe("idle");
    expect(run.time).toBe(FILM_DURATION);
    expect(run.stamp).toBeNull();
    expect(ended.beat).toBe("hero");
    expect(ended.mode).toBe("exterior");
    expect(ended.timeId).toBe("dusk");
  });

  test("seeking while idle does nothing, and seeking to the end completes", () => {
    const idle = seekFilm(createFilmRun(), 10);
    expect(idle.sample).toBeNull();
    const playing = beginFilm(createFilmRun(), stamp());
    const mid = seekFilm(playing, 12);
    expect(mid.run.phase).toBe("playing");
    expect(mid.run.time).toBe(12);
    expect(mid.sample?.elapsed).toBe(12);
    const done = seekFilm(mid.run, FILM_DURATION + 4);
    expect(done.completed).toBe(true);
    expect(done.run.phase).toBe("idle");
    expect(done.sample?.beat).toBe("hero");
    expect(done.stamp?.timeId).toBe("dusk");
  });
});

describe("film query", () => {
  test("only an explicit flag autostarts", () => {
    expect(filmAutostart(new URLSearchParams("film=1"))).toBe(true);
    expect(filmAutostart(new URLSearchParams("film=true"))).toBe(true);
    expect(filmAutostart(new URLSearchParams("film=0"))).toBe(false);
    expect(filmAutostart(new URLSearchParams(""))).toBe(false);
  });
});
