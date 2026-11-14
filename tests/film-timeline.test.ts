import { describe, expect, test } from "bun:test";
import { CAM } from "@/config";
import { distance3 } from "@/features/film/ease";
import {
  entryDoorOpen,
  FILM_BEATS,
  FILM_DURATION,
  roofSeat,
  ROOF_SETTLE_S,
  sampleFilm,
} from "@/features/film/timeline";
import type { FilmSample } from "@/features/film/timeline";
import type { Vec3 } from "@/types";

const STORY = [
  "establish",
  "court",
  "entry",
  "interior",
  "withdraw",
  "section",
  "rise",
  "lift",
  "exploded",
  "depart",
  "to-hero",
  "hero",
] as const;

function beat(id: string) {
  const found = FILM_BEATS.find((item) => item.id === id);
  if (!found) throw new Error(`missing beat ${id}`);
  return found;
}

function inMain(p: Vec3): boolean {
  return p[0] >= -7.35 && p[0] <= 6.95 && p[2] >= -2.35 && p[2] <= 6.35 && p[1] <= 8.6;
}

function inWing(p: Vec3): boolean {
  return p[0] >= -7.35 && p[0] <= -1.45 && p[2] >= -10.7 && p[2] <= -2.05 && p[1] <= 4.2;
}

function inCarport(p: Vec3): boolean {
  return p[0] >= 6.75 && p[0] <= 11.45 && p[2] >= 1.25 && p[2] <= 6.45 && p[1] <= 3.2;
}

/** Living, the entry east of the partial wall, or the south door opening. */
function inOpenInterior(p: Vec3): boolean {
  if (p[1] < 1.45 || p[1] > 2.3) return false;
  const westOfWall = p[0] <= -1.7 && p[0] >= -7.1 && p[2] >= -2.1 && p[2] <= 6.05;
  const entry = p[0] >= -1.4 && p[0] <= 0.45 && p[2] >= 3.55 && p[2] <= 6.15;
  // The partial wall starts at z 4.35, so the crossing just north of it is open floor.
  const pastWallEnd = p[0] >= -1.85 && p[0] <= -1.1 && p[2] >= 3.45 && p[2] <= 4.3;
  const door = p[0] >= -2.2 && p[0] <= 0.25 && p[2] >= 6.05 && p[2] <= 6.55 && p[1] < 2.5;
  return westOfWall || entry || pastWallEnd || door;
}

function describeSample(sample: FilmSample): string {
  const p = sample.position.map((n) => n.toFixed(2)).join(",");
  return `${sample.beat} @ ${sample.elapsed.toFixed(2)}s (${p})`;
}

describe("film timeline", () => {
  test("runs between one and one and a half minutes and tells the house in order", () => {
    expect(FILM_DURATION).toBeGreaterThanOrEqual(60);
    expect(FILM_DURATION).toBeLessThanOrEqual(90);
    expect(FILM_BEATS.map((item) => item.id)).toEqual([...STORY]);
    let cursor = 0;
    for (const item of FILM_BEATS) {
      expect(item.start).toBe(cursor);
      expect(item.end).toBeGreaterThan(item.start);
      cursor = item.end;
    }
    expect(cursor).toBe(FILM_DURATION);
  });

  test("opens on a dawn title and ends on a held dusk exterior", () => {
    const opening = sampleFilm(0);
    expect(opening.beat).toBe("establish");
    expect(opening.timeId).toBe("dawn");
    expect(opening.title).toBe("establishing");
    expect(opening.mode).toBe("exterior");
    const hero = sampleFilm(FILM_DURATION);
    expect(hero.beat).toBe("hero");
    expect(hero.mode).toBe("exterior");
    expect(hero.timeId).toBe("dusk");
    expect(hero.title).toBe("return");
    expect(hero.position).toEqual([...CAM.exterior.pos]);
    expect(hero.target).toEqual([...CAM.exterior.target]);
    expect(beat("court").title).toBe("off");
  });

  test("reads the section, then the lifted roof, then waits out the roof ease", () => {
    expect(beat("section").mode).toBe("cut");
    expect(beat("section").cutDir).toBe("side");
    expect(beat("section").timeId).toBe("day");
    expect(beat("rise").mode).toBe("exterior");
    const lift = beat("lift");
    expect(lift.mode).toBe("exploded");
    expect(lift.motion).not.toBe("hold");
    expect(roofSeat(lift.id)).toBe("moving");
    const exploded = beat("exploded");
    expect(exploded.mode).toBe("exploded");
    expect(exploded.motion).toBe("hold");
    const mid = sampleFilm((exploded.start + exploded.end) / 2);
    expect(mid.position).toEqual([...CAM.explodedStreet.pos]);
    expect(mid.target).toEqual([...CAM.explodedStreet.target]);
    expect(beat("depart").mode).toBe("exploded");
    expect(roofSeat("depart")).toBe("up");
    const travel = beat("to-hero");
    const hero = beat("hero");
    expect(travel.mode).toBe("exterior");
    expect(travel.timeId).toBe("dusk");
    expect(travel.motion).not.toBe("hold");
    expect(roofSeat(travel.id)).toBe("moving");
    expect(hero.motion).toBe("hold");
    expect(roofSeat(hero.id)).toBe("down");
    expect(travel.end - travel.start).toBeGreaterThanOrEqual(ROOF_SETTLE_S);
    expect(hero.start - travel.start).toBeGreaterThanOrEqual(ROOF_SETTLE_S);
  });

  test("the entry door is open only while the camera passes through it", () => {
    expect(entryDoorOpen("entry", 10)).toBe(true);
    expect(entryDoorOpen("interior", 4)).toBe(true);
    expect(entryDoorOpen("withdraw", 5)).toBe(true);
    expect(entryDoorOpen("withdraw", 9)).toBe(false);
    expect(entryDoorOpen("hero", 15)).toBe(false);
    expect(entryDoorOpen("establish", 20)).toBe(false);
  });

  test("the camera eases out, stays finite, and does not jump", () => {
    const start = sampleFilm(0);
    const early = sampleFilm(0.2);
    const court = beat("court");
    const mid = (court.start + court.end) / 2;
    expect(distance3(start.position, early.position)).toBeLessThan(
      distance3(sampleFilm(mid).position, sampleFilm(mid + 0.2).position),
    );
    let prev = start;
    for (let t = 0.05; t <= FILM_DURATION + 1e-6; t += 0.05) {
      const sample = sampleFilm(Math.min(t, FILM_DURATION));
      expect(sample.position.every((n) => Number.isFinite(n))).toBe(true);
      expect(sample.target.every((n) => Number.isFinite(n))).toBe(true);
      expect(sample.position[1]).toBeGreaterThan(1.05);
      expect(sample.position[1]).toBeLessThan(24);
      expect(distance3(prev.position, sample.position)).toBeLessThan(1.2);
      expect(distance3(prev.target, sample.target)).toBeLessThan(1.6);
      prev = sample;
    }
  });

  test("the path stays outside the house except the entry glimpse", () => {
    const outsideHits: string[] = [];
    const insideHits: string[] = [];
    for (let t = 0; t <= FILM_DURATION + 1e-6; t += 0.05) {
      const sample = sampleFilm(Math.min(t, FILM_DURATION));
      const p = sample.position;
      const inside = inMain(p) || inWing(p) || inCarport(p);
      if (sample.beat === "interior" || sample.beat === "withdraw") {
        const outside = p[2] > 6.4 || p[1] > 3.2 || (!inMain(p) && !inWing(p) && !inCarport(p));
        if (!outside && !inOpenInterior(p)) insideHits.push(describeSample(sample));
        if (inWing(p) || inCarport(p)) insideHits.push(describeSample(sample));
        const besideEntryWall = p[2] > 4.45 && p[2] < 6.1 && p[0] > -1.4;
        if (besideEntryWall && sample.target[0] < -1.4) insideHits.push(describeSample(sample));
      } else if (inside) {
        outsideHits.push(describeSample(sample));
      }
      const overRoof =
        p[0] >= -8 && p[0] <= 8 && p[2] >= -3.2 && p[2] <= 7.2 && p[1] < 11 && p[1] > 2.4;
      if (sample.beat !== "interior" && sample.beat !== "withdraw" && overRoof) {
        outsideHits.push(describeSample(sample));
      }
    }
    expect(outsideHits.slice(0, 6)).toEqual([]);
    expect(insideHits.slice(0, 6)).toEqual([]);
  });
});
