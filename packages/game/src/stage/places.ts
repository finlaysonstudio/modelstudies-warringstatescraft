/**
 * The place list a script is validated against, and the check that the
 * map carries every key the chronicle can address.
 */
import { ANNALS_PLACES } from "../annals/places";
import { GAZETTEER } from "../world/gazetteer";
import { WONDER_PLACES } from "../world/wonders";
import { listScenarioTexts } from "../scenarios";
import type { ScenarioBody } from "../scenario/render";

import { HOMES } from "./homes";

export interface Places {
  has(key: string): boolean;
  keys(): string[];
}

/** a fixed list, for tests and for the map's object layer */
export class MemoryPlaces implements Places {
  private readonly set: Set<string>;

  constructor(keys: Iterable<string>) {
    this.set = new Set(keys);
  }

  has(key: string): boolean {
    return this.set.has(key);
  }

  keys(): string[] {
    return [...this.set];
  }
}

/** every gazetteer key: the world as the map is meant to carry it */
export const worldPlaces = (): Places =>
  new MemoryPlaces(Object.keys(GAZETTEER));

const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

const keysIn = (body: ScenarioBody): Set<string> => {
  const keys = new Set<string>();
  const texts: string[] = [
    body.title,
    body.summary,
    ...(body.priorities ?? []),
    ...body.escalationLadder,
    ...body.seats.flatMap((seat) => [
      seat.name,
      seat.brief,
      ...seat.objectives,
    ]),
    ...body.turns.flatMap((turn) => [
      turn.title,
      turn.inject,
      ...(turn.moveMenu ?? []),
      ...(turn.questions ?? []),
      ...(turn.choices ?? []).map((choice) => choice.label),
      ...Object.values(turn.script ?? {}),
    ]),
  ];
  for (const text of texts) {
    for (const match of text.matchAll(PLACEHOLDER)) {
      const key = match[1].charAt(0).toLowerCase() + match[1].slice(1);
      if (key in GAZETTEER) keys.add(key);
    }
  }
  return keys;
};

/**
 * The keys of one chapter's text (states, bodies, and places named in
 * either language) plus the homes of its seats.
 */
export const chapterPlaceKeys = (id: string): string[] => {
  const text = listScenarioTexts().find((entry) => entry.id === id);
  if (!text) return [];
  const keys = new Set<string>([...keysIn(text.en), ...keysIn(text.zh)]);
  for (const seat of text.en.seats) {
    const home = HOMES[seat.id];
    if (home) keys.add(home);
  }
  return [...keys].sort();
};

/**
 * Every place key the country has to carry: the gazetteer keys any
 * registered chapter's text names in either language, every seat's home,
 * the places the Annals are set at, and the natural wonders (which no text
 * names, and which the map carries for the reader rather than for a scene).
 * The map is complete when `checkPlaces` reports none missing.
 */
export const requiredPlaceKeys = (): string[] => {
  const keys = new Set<string>(Object.values(HOMES));
  for (const text of listScenarioTexts()) {
    for (const key of chapterPlaceKeys(text.id)) keys.add(key);
  }
  for (const key of ANNALS_PLACES) keys.add(key);
  for (const key of WONDER_PLACES) keys.add(key);
  return [...keys].sort();
};

export interface PlacesCheck {
  required: string[];
  present: string[];
  missing: string[];
  /** keys the map carries that no chapter addresses (harmless) */
  extra: string[];
}

export const checkPlaces = (places: Places): PlacesCheck => {
  const required = requiredPlaceKeys();
  const present = required.filter((key) => places.has(key));
  const missing = required.filter((key) => !places.has(key));
  const known = new Set(required);
  const extra = places.keys().filter((key) => !known.has(key));
  return { required, present, missing, extra };
};
