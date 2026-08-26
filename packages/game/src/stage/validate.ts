/**
 * Validation of directions, beats, and scripts against the vocabulary,
 * the seat list, and a place list. Errors are strings the coder is shown
 * on its retry and the CLI prints.
 */
import type { Places } from "./places";
import type { StageBeat, StageDirection, StageSequence } from "./types";
import { ARCHETYPES, DIRECTIONS, EFFECTS } from "./vocabulary";

export interface ValidationContext {
  places: Places;
  seats: string[];
}

const MAX_COUNT = 16;

export const validateDirection = (
  direction: StageDirection,
  context: ValidationContext,
  label = "",
): string[] => {
  const errors: string[] = [];
  const where = label ? `${label}: ` : "";
  const rule = DIRECTIONS[direction.kind];
  if (!rule) {
    errors.push(`${where}unknown direction kind "${direction.kind}"`);
    return errors;
  }
  if (!direction.actor || !context.seats.includes(direction.actor.seat)) {
    errors.push(
      `${where}${direction.kind}: actor seat "${direction.actor?.seat}" is not a seat (${context.seats.join(", ")})`,
    );
  }
  if (!direction.actor || !ARCHETYPES.includes(direction.actor.archetype)) {
    errors.push(
      `${where}${direction.kind}: unknown archetype "${direction.actor?.archetype}"`,
    );
  }
  const place = (slot: "from" | "to" | "at", required: boolean) => {
    const key = direction[slot];
    if (key === undefined) {
      if (required)
        errors.push(`${where}${direction.kind}: "${slot}" is required`);
      return;
    }
    if (!context.places.has(key)) {
      errors.push(
        `${where}${direction.kind}: "${slot}" names "${key}", which is not on the map`,
      );
    }
  };
  switch (rule.places) {
    case "route":
      place("from", true);
      place("to", true);
      if (
        direction.from !== undefined &&
        direction.to !== undefined &&
        direction.from === direction.to
      ) {
        errors.push(
          `${where}${direction.kind}: "from" and "to" are both "${direction.from}"`,
        );
      }
      if (direction.at !== undefined) {
        errors.push(
          `${where}${direction.kind}: takes "from" and "to", not "at"`,
        );
      }
      break;
    case "at":
      place("at", true);
      if (direction.from !== undefined || direction.to !== undefined) {
        errors.push(
          `${where}${direction.kind}: takes "at", not "from" or "to"`,
        );
      }
      break;
    case "home":
      place("at", false);
      if (direction.from !== undefined || direction.to !== undefined) {
        errors.push(
          `${where}${direction.kind}: takes "at" (optional), not "from" or "to"`,
        );
      }
      break;
  }
  if (direction.against !== undefined) {
    if (!context.seats.includes(direction.against)) {
      errors.push(
        `${where}${direction.kind}: "against" names "${direction.against}", which is not a seat`,
      );
    } else if (direction.against === direction.actor?.seat) {
      errors.push(
        `${where}${direction.kind}: "against" is the actor's own seat`,
      );
    }
  }
  if (direction.count !== undefined) {
    if (
      !Number.isInteger(direction.count) ||
      direction.count < 1 ||
      direction.count > MAX_COUNT
    ) {
      errors.push(
        `${where}${direction.kind}: "count" must be an integer from 1 to ${MAX_COUNT}`,
      );
    }
  }
  if (direction.effect !== undefined && !EFFECTS.includes(direction.effect)) {
    errors.push(
      `${where}${direction.kind}: unknown effect "${direction.effect}"`,
    );
  }
  return errors;
};

export const validateDirections = (
  directions: StageDirection[],
  context: ValidationContext,
  label = "",
): string[] =>
  directions.flatMap((direction, index) =>
    validateDirection(
      direction,
      context,
      label ? `${label}[${index}]` : `[${index}]`,
    ),
  );

export const validateBeat = (
  beat: StageBeat,
  context: ValidationContext,
): string[] => {
  const errors: string[] = [];
  if (beat.focus !== undefined && !context.places.has(beat.focus)) {
    errors.push(`${beat.id}: focus "${beat.focus}" is not on the map`);
  }
  if (
    beat.kind === "brief" &&
    (!beat.seat || !context.seats.includes(beat.seat))
  ) {
    errors.push(`${beat.id}: brief beat names no seat`);
  }
  errors.push(...validateDirections(beat.directions, context, beat.id));
  return errors;
};

/** every error in the sequence; an empty list is a valid one */
export const validateScript = (
  script: StageSequence,
  places: Places,
): string[] => {
  const context: ValidationContext = {
    places,
    seats: Object.keys(script.seats),
  };
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const beat of script.beats) {
    if (ids.has(beat.id)) errors.push(`${beat.id}: duplicate beat id`);
    ids.add(beat.id);
    errors.push(...validateBeat(beat, context));
  }
  for (const [seat, entry] of Object.entries(script.seats)) {
    if (!places.has(entry.home)) {
      errors.push(`seat ${seat}: home "${entry.home}" is not on the map`);
    }
  }
  return errors;
};
