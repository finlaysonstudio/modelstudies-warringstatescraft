/**
 * The fallback staging: deterministic, no model call. Each seat's rung
 * band names the candidate directions and the seat's decision text picks
 * among them by cue words; places come from the seat's home and the
 * turn's most-mentioned keys.
 */
import type { Run, Scenario } from "../types";

import {
  assembleStage,
  briefOf,
  type SeatChoice,
  type TurnChoice,
  type TurnContext,
} from "./assemble";
import { focusOf, mentionsOf, mergeMentions } from "./mentions";
import type { Places } from "./places";
import type { StageDirection, StageDirectionKind, StageSeat } from "./types";
import { DIRECTIONS, GAME_KINDS, directionsInBand } from "./vocabulary";

export interface FallbackOptions {
  run: Run;
  scenario: Scenario;
  places?: Places;
  now?: string;
}

interface Hit {
  kind: StageDirectionKind;
  hits: number;
  cues: string[];
}

/** cue hits per kind over a lowercased text */
export const cueHits = (text: string): Hit[] => {
  const lower = text.toLowerCase();
  return GAME_KINDS.map((kind) => {
    const cues = (DIRECTIONS[kind].cues ?? []).filter((cue) =>
      lower.includes(cue),
    );
    return { kind, hits: cues.length, cues };
  });
};

/** the other seat whose home the text names most, else the next seat */
const counterpart = (
  seat: string,
  seats: Record<string, StageSeat>,
  mentions: Map<string, number>,
): string => {
  const others = Object.entries(seats).filter(([id]) => id !== seat);
  if (!others.length) return seats[seat].home;
  const homes = others.map(([, entry]) => entry.home);
  const named = focusOf(mentions, [seats[seat].home], homes);
  if (named) return named;
  const order = Object.keys(seats);
  const next = order[(order.indexOf(seat) + 1) % order.length];
  return seats[next].home;
};

/**
 * One direction for a seat: places by the kind's rule, the actor by the
 * kind's default archetype, `against` when the place is another seat's
 * court, and the default count and effect stated so the page needs no
 * table.
 */
export const placeDirection = (
  kind: StageDirectionKind,
  seat: string,
  context: Pick<TurnContext, "seats" | "mentions" | "focus" | "places">,
): StageDirection => {
  const rule = DIRECTIONS[kind];
  const { seats, mentions, places } = context;
  const home = seats[seat].home;
  const homes = new Set(Object.values(seats).map((entry) => entry.home));
  const onMap = (key: string | undefined) =>
    key && places.has(key) ? key : undefined;
  const court = counterpart(seat, seats, mentions);
  const elsewhere =
    onMap(focusOf(mentions, [home])) ??
    (context.focus !== home ? context.focus : court);
  const holder = (place: string) =>
    Object.entries(seats).find(
      ([id, entry]) => entry.home === place && id !== seat,
    )?.[0];
  const base: StageDirection = {
    kind,
    actor: { seat, archetype: rule.actor },
  };
  const trim = (direction: StageDirection): StageDirection => ({
    ...direction,
    ...(rule.count ? { count: rule.count } : {}),
    ...(rule.effect ? { effect: rule.effect } : {}),
  });
  switch (rule.places) {
    case "route": {
      if (kind === "tripods") {
        const from = onMap("zhou") ?? court;
        return trim({ ...base, from: from === home ? court : from, to: home });
      }
      const courtBound =
        kind === "envoy" || kind === "hostage" || kind === "gold";
      let to = courtBound ? court : elsewhere;
      if (to === home) to = court;
      if (to === home) {
        // a single-seat scenario: walk to the focus or stay put
        to = context.focus !== home ? context.focus : [...homes][0];
      }
      const against = holder(to);
      return trim({ ...base, from: home, to, ...(against ? { against } : {}) });
    }
    case "at": {
      const at =
        elsewhere === home && context.focus !== home
          ? context.focus
          : elsewhere;
      const against = rule.martial ? holder(at) : undefined;
      return trim({ ...base, at, ...(against ? { against } : {}) });
    }
    case "home":
    default:
      return trim({ ...base, at: home });
  }
};

/** how far above the rung's band a seat's own words may reach */
const BAND_REACH = 3;

/**
 * A seat's choice from its decision: the kind whose cue words the
 * decision hits most, among the kinds no more than three bands above the
 * rung's (a seat that wrote "march a column" marches even when the panel
 * scored the turn low; a seat that wrote "raze" at rung 1 does not); ties
 * go to the kind nearest the band, then to vocabulary order; with no hit
 * at all, the band's first kind. One more kind from another band is added
 * when its cues hit at least twice, so a decision that sends an envoy and
 * raises levies shows both (the second kind must hit twice in the
 * decision itself, not the rationale). Places come from the seat's own
 * words first, then the turn's.
 */
export const fallbackSeat = (
  seat: string,
  context: TurnContext,
): SeatChoice => {
  const brief = briefOf(context.turn, seat);
  const text =
    brief && !brief.error
      ? `${brief.memo.decision}\n${brief.memo.rationale}\n${(brief.memo.options ?? []).join("\n")}`
      : "";
  const band = context.band ?? 0;
  const own = mentionsOf({
    texts: [text],
    naming: context.run.naming ?? "chronicle",
    language: context.run.language ?? "en",
  });
  const seatContext = {
    ...context,
    mentions: mergeMentions(context.mentions, own),
  };
  const reach = cueHits(text)
    .filter((hit) => DIRECTIONS[hit.kind].band <= band + BAND_REACH)
    .map((hit, order) => ({
      ...hit,
      order,
      distance: Math.abs(DIRECTIONS[hit.kind].band - band),
    }))
    .sort(
      (a, b) => b.hits - a.hits || a.distance - b.distance || a.order - b.order,
    );
  const primary = reach.find((hit) => hit.hits > 0) ?? {
    kind: directionsInBand(band)[0] ?? ("idle" as const),
    hits: 0,
    cues: [],
  };
  const directions: StageDirection[] = [
    placeDirection(primary.kind, seat, seatContext),
  ];
  const cues = [...primary.cues];
  const decided = new Set(
    cueHits(brief && !brief.error ? brief.memo.decision : "")
      .filter((hit) => hit.hits >= 2)
      .map((hit) => hit.kind),
  );
  const secondary = reach.find(
    (hit) =>
      hit.kind !== primary.kind &&
      decided.has(hit.kind) &&
      DIRECTIONS[hit.kind].band !== DIRECTIONS[primary.kind].band &&
      DIRECTIONS[hit.kind].band > 0,
  );
  if (secondary) {
    directions.push(placeDirection(secondary.kind, seat, seatContext));
    cues.push(...secondary.cues);
  }
  return { directions, ...(cues.length ? { cues } : {}) };
};

export const fallbackTurn = (context: TurnContext): TurnChoice => ({
  seats: Object.fromEntries(
    Object.keys(context.seats).map((seat) => [
      seat,
      fallbackSeat(seat, context),
    ]),
  ),
});

export const fallbackStage = ({
  run,
  scenario,
  places,
  now,
}: FallbackOptions) =>
  assembleStage({
    run,
    scenario,
    ...(places ? { places } : {}),
    ...(now ? { now } : {}),
    source: "fallback",
    choose: fallbackTurn,
  });
