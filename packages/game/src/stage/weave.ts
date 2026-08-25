/**
 * The weave: how the seats' directions in one turn combine into the
 * consequence the narrative beat shows. The seats move at once and the
 * record scores what came of it; this derives what the map shows meeting.
 */
import type { StageDirection, StageSeat } from "./types";
import { CONSEQUENCES, DIRECTIONS } from "./vocabulary";

export interface WeaveOptions {
  /** every seat's brief directions this turn */
  directions: StageDirection[];
  /** the verdict's band (0..7); undefined when the turn was not scored */
  band?: number;
  /** the turn's focus place */
  focus: string;
  seats: Record<string, StageSeat>;
}

const homeSeat = (
  place: string,
  seats: Record<string, StageSeat>,
): string | undefined =>
  Object.entries(seats).find(([, seat]) => seat.home === place)?.[0];

/** the seat whose directions climb highest this turn */
export const escalatorOf = (
  directions: StageDirection[],
): string | undefined => {
  let best: string | undefined;
  let bestBand = -1;
  for (const direction of directions) {
    const band = DIRECTIONS[direction.kind]?.band ?? -1;
    if (band > bestBand) {
      best = direction.actor.seat;
      bestBand = band;
    }
  }
  return best;
};

const destination = (direction: StageDirection): string | undefined =>
  DIRECTIONS[direction.kind]?.places === "route" ? direction.to : direction.at;

/**
 * Derived consequences, in order: martial movements converging on one
 * place from different seats meet (a battle from band 6, a raid at band
 * 5, a standoff of garrisons at band 4, nothing below; the place's holder
 * is the defender when it is a court); a martial movement on another
 * seat's court invests it by band
 * from band 4 (garrison at its gate, the gates taken, a siege, a sack);
 * and when nothing converges, the band's own consequence plays at the
 * focus, acted by the seat that climbed highest.
 */
export const weaveTurn = ({
  directions,
  band,
  focus,
  seats,
}: WeaveOptions): StageDirection[] => {
  const derived: StageDirection[] = [];
  const level = band ?? 0;
  const martial = directions.filter(
    (direction) =>
      DIRECTIONS[direction.kind]?.martial && destination(direction),
  );
  const byPlace = new Map<string, StageDirection[]>();
  for (const direction of martial) {
    const place = destination(direction)!;
    const list = byPlace.get(place) ?? [];
    if (!list.some((entry) => entry.actor.seat === direction.actor.seat)) {
      list.push(direction);
    }
    byPlace.set(place, list);
  }
  const invested = new Set<string>();
  for (const [place, list] of byPlace) {
    if (list.length >= 2) {
      const [first, second] = list;
      const holder = homeSeat(place, seats);
      const defender =
        holder && holder !== first.actor.seat ? holder : second.actor.seat;
      if (level >= 6) {
        derived.push({
          kind: "battle",
          actor: { seat: first.actor.seat, archetype: "infantry" },
          at: place,
          against: defender,
          count: 8,
          effect: "arrows",
        });
      } else if (level === 5) {
        derived.push({
          kind: "raid",
          actor: { seat: first.actor.seat, archetype: "cavalry" },
          from: seats[first.actor.seat]?.home ?? place,
          to: place,
          against: defender,
          count: 4,
          effect: "fire",
        });
      } else if (level === 4) {
        for (const entry of list) {
          derived.push({
            kind: "garrison",
            actor: { seat: entry.actor.seat, archetype: "infantry" },
            at: place,
            count: 4,
            effect: "banner",
          });
        }
      }
      invested.add(place);
      continue;
    }
    const [only] = list;
    const holder = homeSeat(place, seats);
    if (!holder || holder === only.actor.seat || level < 4) continue;
    if (
      only.kind === "sack" ||
      only.kind === "siege" ||
      only.kind === "battle"
    ) {
      continue;
    }
    const kind =
      level >= 7
        ? "sack"
        : level >= 6
          ? "siege"
          : level >= 5
            ? "gates-taken"
            : "garrison";
    const rule = DIRECTIONS[kind];
    derived.push({
      kind,
      actor: { seat: only.actor.seat, archetype: rule.actor },
      at: place,
      against: holder,
      ...(rule.count ? { count: rule.count } : {}),
      ...(rule.effect ? { effect: rule.effect } : {}),
    });
    invested.add(place);
  }
  if (derived.length === 0) {
    const escalator = escalatorOf(directions) ?? Object.keys(seats)[0];
    const home = escalator ? seats[escalator]?.home : undefined;
    const routable = home !== undefined && home !== focus;
    // a route consequence (a raid) needs a road from the escalator's home
    // to the focus; at the escalator's own court the band below stands in
    let kind = CONSEQUENCES[level];
    for (
      let band = level;
      kind && DIRECTIONS[kind].places === "route" && !routable && band > 0;
      band -= 1
    ) {
      kind = CONSEQUENCES[band - 1];
    }
    if (kind && escalator) {
      const rule = DIRECTIONS[kind];
      const holder = homeSeat(focus, seats);
      const route = rule.places === "route";
      derived.push({
        kind,
        actor: { seat: escalator, archetype: rule.actor },
        ...(route ? { from: home, to: focus } : { at: focus }),
        ...(holder && holder !== escalator ? { against: holder } : {}),
        ...(rule.count ? { count: rule.count } : {}),
        ...(rule.effect ? { effect: rule.effect } : {}),
      });
    }
  }
  return derived;
};
