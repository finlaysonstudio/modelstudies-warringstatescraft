/**
 * A random staging: every seat picks a direction at random each turn,
 * seeded, so the animations are exercised together in every combination
 * the vocabulary allows. The verdict stays the record's; the narrative
 * beat is the weave of what the seats chose. Several seeds give several
 * sequences of one game.
 */
import type { Run, Scenario } from "../types";

import {
  assembleStage,
  stagingId,
  type TurnChoice,
  type TurnContext,
} from "./assemble";
import { placeDirection } from "./fallback";
import { chapterPlaceKeys, type Places } from "./places";
import type { StageDirection, StageDirectionKind } from "./types";
import { DIRECTIONS, DIRECTION_KINDS } from "./vocabulary";

export interface RandomOptions {
  run: Run;
  scenario: Scenario;
  seed: number;
  places?: Places;
  now?: string;
}

/** mulberry32: small, seeded, and the same on every platform */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomVariant = (seed: number): string => `random${seed}`;

const pick = <T>(random: () => number, list: T[]): T =>
  list[Math.floor(random() * list.length)];

/**
 * The chooser: one or two kinds per seat, uniform over the vocabulary
 * (idle a little less often, so the map keeps moving), with places drawn
 * from the chapter's own keys that are on the map.
 */
export const randomTurn =
  (random: () => number, chapterKeys: string[]) =>
  (context: TurnContext): TurnChoice => {
    const kinds = DIRECTION_KINDS.filter((kind) => kind !== "idle");
    const keys = chapterKeys.filter((key) => context.places.has(key));
    const seats: TurnChoice["seats"] = {};
    for (const seat of Object.keys(context.seats)) {
      const count = random() < 0.35 ? 2 : 1;
      const directions: StageDirection[] = [];
      for (let i = 0; i < count; i += 1) {
        const kind: StageDirectionKind =
          random() < 0.06 ? "idle" : pick(random, kinds);
        const direction = placeDirection(kind, seat, context);
        const rule = DIRECTIONS[kind];
        const home = context.seats[seat].home;
        const others = keys.filter((key) => key !== home);
        if (rule.places === "route" && others.length && random() < 0.7) {
          direction.to = pick(random, others);
          if (direction.to === direction.from)
            direction.to =
              home === others[0] ? (others[1] ?? others[0]) : others[0];
          const holder = Object.entries(context.seats).find(
            ([id, entry]) => entry.home === direction.to && id !== seat,
          )?.[0];
          if (holder) direction.against = holder;
          else delete direction.against;
        } else if (rule.places === "at" && others.length && random() < 0.7) {
          direction.at = pick(random, others);
          const holder = Object.entries(context.seats).find(
            ([id, entry]) => entry.home === direction.at && id !== seat,
          )?.[0];
          if (holder && rule.martial) direction.against = holder;
          else delete direction.against;
        }
        if (rule.count) {
          direction.count = Math.max(
            1,
            Math.round(rule.count * (0.6 + random() * 0.8)),
          );
        }
        directions.push(direction);
      }
      seats[seat] = { directions };
    }
    return { seats };
  };

export const randomStage = ({
  run,
  scenario,
  seed,
  places,
  now,
}: RandomOptions) =>
  assembleStage({
    run,
    scenario,
    ...(places ? { places } : {}),
    ...(now ? { now } : {}),
    source: "random",
    seed,
    id: stagingId(run.id, randomVariant(seed)),
    choose: randomTurn(seededRandom(seed), chapterPlaceKeys(scenario.id)),
  });
