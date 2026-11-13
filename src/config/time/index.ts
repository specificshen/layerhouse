import type { TimeId, TimeRecipe } from "@/types";
import { dawn } from "./dawn";
import { day } from "./day";
import { dusk } from "./dusk";
import { night } from "./night";

/** Lighting / sky recipes for each discrete time of day. */
export const TOD = { day, dawn, dusk, night } as const satisfies Record<TimeId, TimeRecipe>;
