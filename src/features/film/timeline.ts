import { CAM } from "@/config";
import type { CutDir, TimeId, Vec3, ViewMode } from "@/types";
import { sampleGlide, sampleTrackSegment, trackFrame } from "./ease";

export type FilmTitle = "establishing" | "return" | "off";

export interface FilmPose {
  readonly position: Vec3;
  readonly target: Vec3;
}

export interface FilmBeatInfo {
  readonly id: string;
  readonly start: number;
  readonly end: number;
  readonly mode: ViewMode;
  readonly timeId: TimeId;
  readonly title: FilmTitle;
  readonly cutDir: CutDir;
  readonly cutValue: number;
  readonly motion: "hold" | "track" | "glide";
  readonly knots: readonly FilmPose[];
}

export interface FilmSample {
  readonly elapsed: number;
  readonly beat: string;
  readonly mode: ViewMode;
  readonly timeId: TimeId;
  readonly title: FilmTitle;
  readonly cutDir: CutDir;
  readonly cutValue: number;
  readonly position: Vec3;
  readonly target: Vec3;
}

/** Roof ease is about a second. The hero hold starts after the roof has settled. */
export const ROOF_SETTLE_S = 1.2;

type BeatDraft = {
  id: string;
  seconds: number;
  mode: ViewMode;
  timeId: TimeId;
  title: FilmTitle;
  cutDir?: CutDir;
  cutValue?: number;
} & (
  | { motion: "hold" }
  | { motion: "track"; pose: FilmPose; via?: readonly FilmPose[] }
  | { motion: "glide"; pose: FilmPose; via: readonly FilmPose[] }
);

function pose(x: number, y: number, z: number, tx: number, ty: number, tz: number): FilmPose {
  return { position: [x, y, z], target: [tx, ty, tz] };
}

const HERO: FilmPose = { position: CAM.exterior.pos, target: CAM.exterior.target };
const SECTION: FilmPose = { position: CAM.cutSide.pos, target: CAM.cutSide.target };

const OPENING: FilmPose = pose(24.2, 10.4, 22.4, -1.1, 3.5, -2.6);
const COURT_END: FilmPose = pose(17.2, 7.15, 15.5, 0.15, 2.55, -1.7);
const ENTRY: FilmPose = pose(-1.0, 1.62, 9.7, -1.0, 1.38, 6.15);
const LIVING: FilmPose = pose(-2.8, 1.62, 4.9, -6.4, 1.38, 1.6);
const SECTION_NEAR: FilmPose = pose(0.85, 7.15, 15.6, 0.2, 3.05, 0.35);
/** High south view. The roof is still on, and the camera is well clear of it. */
const WIDE: FilmPose = pose(12.5, 16.5, 24, -0.4, 3.2, -1.2);
/** Whole house from the south. Both floors and the floating roof stay in frame. */
const OPEN_HOUSE: FilmPose = pose(18, 14.2, 22.2, 0.2, 3.8, -1.2);
const DEPART_WIDE: FilmPose = pose(20.4, 15.6, 24.8, 0.35, 4.1, -0.9);

/**
 * Whole-house introduction. Times are seconds. Poses chain: each beat leaves
 * where the next one begins.
 */
const DRAFTS: readonly BeatDraft[] = [
  {
    id: "establish",
    seconds: 8,
    mode: "exterior",
    timeId: "dawn",
    title: "establishing",
    motion: "track",
    pose: COURT_END,
  },
  {
    id: "court",
    seconds: 20,
    mode: "exterior",
    timeId: "dawn",
    title: "off",
    motion: "glide",
    via: [
      pose(36.5, 8.4, 5.2, 1.2, 2.6, -2.2),
      pose(15.2, 3.6, -6.4, 2.2, 1.15, -6.4),
      pose(3.4, 3.8, -17.2, 1.6, 1.35, -4.2),
      pose(-14.2, 5.6, -16.4, -3.2, 1.7, -5.4),
      pose(-18.8, 6.9, -1.6, -3.2, 2.7, 0.6),
      pose(-16.8, 6.0, 8.2, -2.2, 2.5, 2.4),
    ],
    pose: pose(-0.85, 2.25, 14.05, -1.0, 1.5, 6.1),
  },
  {
    id: "entry",
    seconds: 5,
    mode: "exterior",
    timeId: "dawn",
    title: "off",
    motion: "track",
    pose: ENTRY,
  },
  {
    id: "interior",
    seconds: 8,
    mode: "exterior",
    timeId: "dawn",
    title: "off",
    motion: "track",
    via: [
      pose(-1.0, 1.64, 6.9, 1.7, 1.55, 1.6),
      pose(-1.0, 1.66, 5.05, 1.8, 1.48, 0.4),
      pose(-1.15, 1.66, 3.7, -4.2, 1.4, 0.6),
    ],
    pose: LIVING,
  },
  {
    id: "withdraw",
    seconds: 4.5,
    mode: "exterior",
    timeId: "dawn",
    title: "off",
    motion: "track",
    via: [pose(-1.1, 1.66, 3.7, -1.0, 1.5, 6.4), pose(-1.0, 1.64, 8.6, -1.0, 1.55, 5.8)],
    pose: SECTION,
  },
  {
    id: "section",
    seconds: 7,
    mode: "cut",
    timeId: "day",
    title: "off",
    cutDir: "side",
    cutValue: 1,
    motion: "track",
    pose: SECTION_NEAR,
  },
  {
    id: "rise",
    seconds: 4,
    mode: "exterior",
    timeId: "day",
    title: "off",
    motion: "track",
    pose: WIDE,
  },
  {
    id: "lift",
    seconds: 4.5,
    mode: "exploded",
    timeId: "day",
    title: "off",
    motion: "track",
    pose: OPEN_HOUSE,
  },
  {
    id: "exploded",
    seconds: 6,
    mode: "exploded",
    timeId: "day",
    title: "off",
    motion: "hold",
  },
  {
    id: "depart",
    seconds: 3.5,
    mode: "exploded",
    timeId: "day",
    title: "off",
    motion: "track",
    pose: DEPART_WIDE,
  },
  {
    id: "to-hero",
    seconds: 5.5,
    mode: "exterior",
    timeId: "dusk",
    title: "off",
    motion: "track",
    pose: HERO,
  },
  {
    id: "hero",
    seconds: 7,
    mode: "exterior",
    timeId: "dusk",
    title: "return",
    motion: "hold",
  },
];

function compile(opening: FilmPose, drafts: readonly BeatDraft[]): FilmBeatInfo[] {
  const beats: FilmBeatInfo[] = [];
  let cursor = opening;
  let start = 0;
  for (const draft of drafts) {
    const end = start + draft.seconds;
    let knots: FilmPose[];
    switch (draft.motion) {
      case "hold":
        knots = [cursor];
        break;
      case "track":
        knots = [cursor, ...(draft.via ?? []), draft.pose];
        cursor = draft.pose;
        break;
      case "glide":
        knots = [cursor, ...draft.via, draft.pose];
        cursor = draft.pose;
        break;
      default: {
        const unexpected: never = draft;
        throw new Error(`Unhandled film beat ${String(unexpected)}`);
      }
    }
    beats.push({
      id: draft.id,
      start,
      end,
      mode: draft.mode,
      timeId: draft.timeId,
      title: draft.title,
      cutDir: draft.cutDir ?? "top",
      cutValue: draft.cutValue ?? 4.3,
      motion: draft.motion,
      knots,
    });
    start = end;
  }
  return beats;
}

export const FILM_BEATS: readonly FilmBeatInfo[] = compile(OPENING, DRAFTS);

export const FILM_DURATION = FILM_BEATS[FILM_BEATS.length - 1]?.end ?? 0;

/** South pivot. Open while the camera passes the entry; shut again once it is outside. */
export function entryDoorOpen(beat: string, z: number): boolean {
  if (beat === "entry" || beat === "interior") return true;
  if (beat === "withdraw") return z < 7.6;
  return false;
}

/** Where the roof should be when a beat is jumped to. Lift and the dusk move ease instead. */
export function roofSeat(beat: string): "down" | "up" | "moving" {
  if (beat === "lift" || beat === "to-hero") return "moving";
  if (beat === "exploded" || beat === "depart") return "up";
  return "down";
}

function samplePose(beat: FilmBeatInfo, u: number): FilmPose {
  const positions = beat.knots.map((knot) => knot.position);
  const targets = beat.knots.map((knot) => knot.target);
  switch (beat.motion) {
    case "hold":
      return beat.knots[0] ?? { position: [0, 0, 0], target: [0, 0, 0] };
    case "track": {
      const frame = trackFrame(positions, u);
      return {
        position: sampleTrackSegment(positions, frame),
        target: sampleTrackSegment(targets, frame),
      };
    }
    case "glide":
      return { position: sampleGlide(positions, u), target: sampleGlide(targets, u) };
    default: {
      const unexpected: never = beat.motion;
      throw new Error(`Unhandled film motion ${String(unexpected)}`);
    }
  }
}

export function sampleFilm(time: number): FilmSample {
  const elapsed = Number.isFinite(time) ? Math.min(FILM_DURATION, Math.max(0, time)) : 0;
  const beat = FILM_BEATS.find((item) => elapsed < item.end) ?? FILM_BEATS[FILM_BEATS.length - 1];
  if (!beat) throw new Error("film timeline is empty");
  const span = beat.end - beat.start;
  const u = span > 0 ? (elapsed - beat.start) / span : 1;
  const poseAt = samplePose(beat, beat.motion === "hold" ? 0 : u);
  return {
    elapsed,
    beat: beat.id,
    mode: beat.mode,
    timeId: beat.timeId,
    title: beat.title,
    cutDir: beat.cutDir,
    cutValue: beat.cutValue,
    position: poseAt.position,
    target: poseAt.target,
  };
}
