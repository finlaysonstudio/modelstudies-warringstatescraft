/**
 * Turning an authored episode into a stage sequence: beat ids, the place
 * list, the venue list, and the seats, with the shorthand the episode files
 * are written in.
 */
import { ConfigurationError } from "@jaypie/errors";

import { DIRECTIONS } from "../stage/vocabulary";
import type {
  StageArchetype,
  StageBeat,
  StageDirection,
  StageDirectionKind,
  StageEffect,
  VenueId,
} from "../stage/types";

import { AUTHORED_ACTOR, type Episode, type EpisodeSpec } from "./types";

/**
 * One direction, with the archetype the vocabulary names for the kind unless
 * the episode wants another. Written as one config object so an episode file
 * reads as a list of moves rather than a list of literals.
 */
export const act = ({
  kind,
  seat,
  from,
  to,
  at,
  against,
  count,
  effect,
  archetype,
}: {
  kind: StageDirectionKind;
  seat: string;
  from?: string;
  to?: string;
  at?: string;
  against?: string;
  count?: number;
  effect?: StageEffect;
  archetype?: StageArchetype;
}): StageDirection => ({
  kind,
  actor: { seat, archetype: archetype ?? DIRECTIONS[kind].actor },
  ...(from !== undefined ? { from } : {}),
  ...(to !== undefined ? { to } : {}),
  ...(at !== undefined ? { at } : {}),
  ...(against !== undefined ? { against } : {}),
  ...(count !== undefined ? { count } : {}),
  ...(effect !== undefined ? { effect } : {}),
});

/** every place key a direction addresses, in slot order */
const placesOf = (direction: StageDirection): string[] =>
  [direction.from, direction.to, direction.at].filter(
    (key): key is string => key !== undefined,
  );

/**
 * The episode as it is stored. Beats are numbered from 1 in scene order and
 * every one of them is a `scene`; the place list is every key the beats
 * address plus every seat's home, in first-seen order.
 */
export const buildEpisode = (
  spec: EpisodeSpec,
  { now = new Date().toISOString() }: { now?: string } = {},
): Episode => {
  if (spec.scenes.length === 0) {
    throw new ConfigurationError(`${spec.id}: an episode needs a scene`);
  }
  const seats = Object.fromEntries(
    Object.entries(spec.seats).map(([id, seat]) => [
      id,
      {
        ...(seat.state !== undefined ? { state: seat.state } : {}),
        home: seat.home,
        model: AUTHORED_ACTOR,
      },
    ]),
  );
  const places: string[] = [];
  const venues: VenueId[] = [];
  const see = (key: string): void => {
    if (!places.includes(key)) places.push(key);
  };
  for (const seat of Object.values(seats)) see(seat.home);
  const beats: StageBeat[] = spec.scenes.map((scene, index) => {
    const venue = scene.venue ?? "overworld";
    if (!venues.includes(venue)) venues.push(venue);
    if (scene.focus) see(scene.focus);
    for (const direction of scene.play)
      for (const key of placesOf(direction)) see(key);
    return {
      id: scene.id ?? `s${index + 1}`,
      kind: "scene" as const,
      turn: index + 1,
      ...(scene.focus !== undefined ? { focus: scene.focus } : {}),
      ...(venue !== "overworld" ? { venue } : {}),
      ...(scene.dressing !== undefined ? { dressing: scene.dressing } : {}),
      ...(scene.card !== undefined
        ? {
            card: {
              title: scene.card,
              ...(scene.date !== undefined ? { date: scene.date } : {}),
            },
          }
        : {}),
      ...(scene.lines !== undefined ? { lines: scene.lines } : {}),
      ...(scene.cite !== undefined ? { cite: scene.cite } : {}),
      directions: scene.play,
    };
  });
  return {
    id: spec.id,
    model: "episodes",
    // an episode carries both languages in its own fields; these name the
    // rendering the place labels default to, and the Annals never mask
    language: "en",
    naming: "chronicle",
    createdAt: now,
    act: spec.act,
    order: 0,
    date: spec.date,
    year: spec.year,
    title: spec.title,
    blurb: spec.blurb,
    ...(spec.chapter !== undefined ? { chapter: spec.chapter } : {}),
    sources: spec.sources ?? [],
    venues,
    ...(spec.effects !== undefined ? { effects: spec.effects } : {}),
    seats,
    places,
    beats,
  };
};
