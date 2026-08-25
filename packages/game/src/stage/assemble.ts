/**
 * The assembler: the beat skeleton every staging shares (an inject beat,
 * one brief beat per seat, a verdict beat, a narrative beat per turn, and
 * the debrief), filled by a chooser that says what each seat's figures do.
 * The fallback, the random staging, and the coder are choosers.
 */
import { BadRequestError } from "@jaypie/errors";

import type { Run, Scenario, TurnRecord, Usage } from "../types";

import { homeOf } from "./homes";
import { focusOf, mentionsOf } from "./mentions";
import { worldPlaces, type Places } from "./places";
import type {
  StageBeat,
  StageDirection,
  StageScript,
  StageSeat,
  StageSource,
} from "./types";
import { validateScript } from "./validate";
import { bandOf } from "./vocabulary";
import { weaveTurn } from "./weave";

export interface TurnContext {
  run: Run;
  scenario: Scenario;
  turn: TurnRecord;
  /** 1-based */
  index: number;
  seats: Record<string, StageSeat>;
  places: Places;
  /** the panel's rung, when the turn was scored */
  rung?: number;
  /** the rung's band, when scored */
  band?: number;
  /** the most-mentioned place of the turn */
  focus: string;
  /** place weights over the turn's text */
  mentions: Map<string, number>;
  /** the place the narrative points to */
  consequenceFocus: string;
}

export interface SeatChoice {
  directions: StageDirection[];
  cues?: string[];
}

export interface TurnChoice {
  /** overrides the turn's focus */
  focus?: string;
  seats: Record<string, SeatChoice>;
  /** replaces the weave when given */
  consequence?: StageDirection[];
  /** the coder fell back for this turn */
  fallback?: true;
  usage?: Usage;
}

export type TurnChooser = (
  context: TurnContext,
) => Promise<TurnChoice> | TurnChoice;

export interface AssembleOptions {
  run: Run;
  scenario: Scenario;
  places?: Places;
  source: StageSource;
  seed?: number;
  coder?: string;
  /** the staging id; defaults to the run id */
  id?: string;
  now?: string;
  choose: TurnChooser;
}

/** the first usable brief a seat produced this turn */
export const briefOf = (turn: TurnRecord, seat: string) =>
  turn.briefs.find((brief) => brief.seat === seat && !brief.error) ??
  turn.briefs.find((brief) => brief.seat === seat);

export const stageSeats = (
  run: Run,
  scenario: Scenario,
): Record<string, StageSeat> =>
  Object.fromEntries(
    scenario.seats.map((seat) => [
      seat.id,
      {
        ...(seat.state ? { state: seat.state } : {}),
        home: homeOf(seat.id, seat.state),
        model: run.roster[seat.id] ?? "",
      },
    ]),
  );

/** the id a staging variant is stored under */
export const stagingId = (runId: string, variant?: string): string =>
  variant ? `${runId}.${variant}` : runId;

export const turnContext = (
  run: Run,
  scenario: Scenario,
  turn: TurnRecord,
  seats: Record<string, StageSeat>,
  places: Places,
): TurnContext => {
  const naming = run.naming ?? "chronicle";
  const language = run.language ?? "en";
  const homes = Object.values(seats).map((seat) => seat.home);
  const decisions = turn.briefs.flatMap((brief) =>
    brief.error ? [] : [brief.memo.decision, brief.memo.rationale],
  );
  const mentions = mentionsOf({
    texts: [turn.inject, ...decisions, turn.adjudication?.narrative ?? ""],
    naming,
    language,
  });
  const onMap = (key: string | undefined) =>
    key && places.has(key) ? key : undefined;
  const focus = onMap(focusOf(mentions)) ?? homes[0];
  const narrativeMentions = turn.adjudication
    ? mentionsOf({ texts: [turn.adjudication.narrative], naming, language })
    : new Map<string, number>();
  const consequenceFocus = onMap(focusOf(narrativeMentions)) ?? focus;
  const scored = turn.adjudication && !turn.adjudication.unscored;
  const rung = scored ? turn.adjudication!.escalation : undefined;
  return {
    run,
    scenario,
    turn,
    index: turn.index,
    seats,
    places,
    ...(rung !== undefined
      ? { rung, band: bandOf(rung, run.escalationLadder.length) }
      : {}),
    focus,
    mentions,
    consequenceFocus,
  };
};

/**
 * Build the script: one call of the chooser per turn, the weave for the
 * narrative beat unless the chooser gave a consequence, the debrief when
 * the run is complete. The result is validated against the places; an
 * invalid script is a defect in the chooser and is refused.
 */
export const assembleStage = async ({
  run,
  scenario,
  places = worldPlaces(),
  source,
  seed,
  coder,
  id,
  now = new Date().toISOString(),
  choose,
}: AssembleOptions): Promise<StageScript> => {
  const seats = stageSeats(run, scenario);
  const beats: StageBeat[] = [];
  const usage: Usage = [];
  const fallbackTurns: number[] = [];
  for (const turn of run.turns) {
    const context = turnContext(run, scenario, turn, seats, places);
    const choice = await choose(context);
    if (choice.usage) usage.push(...choice.usage);
    if (choice.fallback) fallbackTurns.push(turn.index);
    const focus = choice.focus ?? context.focus;
    const fallback = choice.fallback ? { fallback: true as const } : {};
    beats.push({
      id: `t${turn.index}.inject`,
      kind: "inject",
      turn: turn.index,
      title: turn.title,
      focus,
      directions: [],
    });
    const seatDirections: StageDirection[] = [];
    for (const seat of Object.keys(seats)) {
      const entry = choice.seats[seat] ?? { directions: [] };
      const directions = entry.directions.length
        ? entry.directions
        : [
            {
              kind: "idle" as const,
              actor: { seat, archetype: "court" as const },
              at: seats[seat].home,
            },
          ];
      seatDirections.push(...directions);
      beats.push({
        id: `t${turn.index}.brief.${seat}`,
        kind: "brief",
        turn: turn.index,
        seat,
        focus: seats[seat].home,
        directions,
        ...fallback,
        ...(entry.cues?.length ? { cues: entry.cues } : {}),
      });
    }
    if (turn.adjudication) {
      beats.push({
        id: `t${turn.index}.verdict`,
        kind: "verdict",
        turn: turn.index,
        focus,
        ...(context.rung !== undefined ? { rung: context.rung } : {}),
        ...(turn.adjudication.unscored ? { unscored: true as const } : {}),
        directions: [],
      });
      const consequence =
        choice.consequence ??
        weaveTurn({
          directions: seatDirections,
          ...(context.band !== undefined ? { band: context.band } : {}),
          focus: context.consequenceFocus,
          seats,
        });
      beats.push({
        id: `t${turn.index}.narrative`,
        kind: "narrative",
        turn: turn.index,
        focus:
          consequence[0]?.at ?? consequence[0]?.to ?? context.consequenceFocus,
        ...(context.rung !== undefined ? { rung: context.rung } : {}),
        directions: consequence,
        ...fallback,
      });
    }
  }
  if (run.status === "complete") {
    beats.push({
      id: "debrief",
      kind: "debrief",
      turn: 0,
      focus: Object.values(seats)[0]?.home,
      directions: Object.entries(seats).map(([seat, entry]) => ({
        kind: "idle" as const,
        actor: { seat, archetype: "court" as const },
        at: entry.home,
      })),
    });
  }
  const placeKeys: string[] = [];
  const seen = new Set<string>();
  const note = (key?: string) => {
    if (key && !seen.has(key)) {
      seen.add(key);
      placeKeys.push(key);
    }
  };
  for (const entry of Object.values(seats)) note(entry.home);
  for (const beat of beats) {
    note(beat.focus);
    for (const direction of beat.directions) {
      note(direction.from);
      note(direction.to);
      note(direction.at);
    }
  }
  const script: StageScript = {
    id: id ?? stagingId(run.id),
    model: "stagings",
    run: run.id,
    scenario: run.scenario,
    language: run.language ?? "en",
    naming: run.naming ?? "chronicle",
    createdAt: now,
    source,
    ...(seed !== undefined ? { seed } : {}),
    ...(coder ? { coder } : {}),
    seats,
    places: placeKeys,
    beats,
    ...(fallbackTurns.length ? { fallbackTurns } : {}),
    ...(usage.length ? { usage } : {}),
  };
  const errors = validateScript(script, places);
  if (errors.length) {
    throw new BadRequestError(
      `Staging for ${run.id} is invalid:\n${errors.map((error) => `  ${error}`).join("\n")}`,
    );
  }
  return script;
};
