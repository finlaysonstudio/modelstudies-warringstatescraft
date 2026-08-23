import { JUDGE_SYSTEM, NARRATOR_SYSTEM } from "./adjudicate";
import {
  consensusFormat,
  consensusPrompt,
  memoFormat,
  seatSystem,
  turnPrompt,
} from "./briefs";
import type { RenderOptions } from "./scenario/render";
import { DEFAULT_LANGUAGE, DEFAULT_NAMING } from "./scenario/render";
import {
  getScenario,
  getScenarioText,
  listScenarios,
  renderingsOf,
} from "./scenarios";
import { stringsFor } from "./strings";
import type {
  DecisionBrief,
  Language,
  Naming,
  Run,
  Scenario,
  ScenarioSeat,
  ScenarioTurn,
} from "./types";
import { castMember } from "./world/states";

/**
 * Scenario materials: every card and instruction the engine hands to a
 * model, rendered exactly as the model sees it, with no run history. The
 * reading-room counterpart to a run replay. Persisted as
 * `var/scenarios/<id>.json` so the app can render it without engine code.
 */

export interface SeatMaterials extends ScenarioSeat {
  /** the system prompt the cell playing this seat receives every turn */
  systemPrompt: string;
}

export interface TurnMaterials extends ScenarioTurn {
  /** the opening-state user prompt for this turn (no prior record) */
  prompt: string;
  /** true when the scenario forks on this turn */
  decisionPoint: boolean;
  /** the seat whose decision seeds the branches, when decisionPoint */
  focalSeat: string | null;
}

/** one rendering of a scenario, as the materials index lists it */
export interface MaterialsRendering {
  /** the materials id (`<scenario>`, `<scenario>.zh`, `<scenario>.masked.zh`) */
  id: string;
  naming: Naming;
  language: Language;
}

/** a cast member a seat plays, for the reading room */
export interface SeatCast {
  seat: string;
  state: string;
  nature: string;
}

export interface ScenarioMaterials {
  /** the materials id: the scenario id with a rendering suffix when not the default */
  id: string;
  model: "scenarios";
  createdAt: string;
  /** the scenario id every rendering shares */
  base: string;
  /** position in the scenario registry (display order) */
  order: number;
  naming: Naming;
  language: Language;
  /** every rendering this scenario has, the default first */
  renderings: MaterialsRendering[];
  /** the cast behind the seats, when the scenario is a chapter */
  cast: SeatCast[];
  /** the pivots the chapter declares, when it does */
  pivots: { id: string; note: string }[];
  scenario: Omit<Scenario, "seats" | "turns">;
  seats: SeatMaterials[];
  turns: TurnMaterials[];
  /** the consensus lane's addendum, shown with two placeholder advisor memos */
  consensusPrompt: string;
  judgeSystem: string;
  narratorSystem: string;
  memoSchema: ReturnType<typeof memoFormat>["schema"];
  consensusSchema: ReturnType<typeof consensusFormat>["schema"];
}

/** the materials id of a rendering */
export const materialsId = (
  scenarioId: string,
  { naming = DEFAULT_NAMING, language = DEFAULT_LANGUAGE }: RenderOptions = {},
): string =>
  [
    scenarioId,
    ...(naming !== DEFAULT_NAMING ? [naming] : []),
    ...(language !== DEFAULT_LANGUAGE ? [language] : []),
  ].join(".");

const emptyRun = (scenario: Scenario): Run => ({
  id: "preview",
  model: "runs",
  scenario: scenario.id,
  scenarioTitle: scenario.title,
  createdAt: "",
  status: "active",
  roster: {},
  escalationLadder: scenario.escalationLadder,
  branch: {
    parent: null,
    lane: "root",
    decidedBy: null,
    point: null,
    seed: null,
  },
  children: [],
  turns: [],
  debriefs: [],
});

const placeholderAdvisors: DecisionBrief[] = [1, 2].map((n) => ({
  seat: "focal",
  model: `advisor-${n}`,
  memo: {
    situation: "",
    options: [],
    decision: `<advisor ${n} decision>`,
    rationale: `<advisor ${n} rationale>`,
    redLines: [`<advisor ${n} red line>`],
  },
})) as DecisionBrief[];

export const buildMaterials = (
  scenario: Scenario,
  { createdAt = new Date().toISOString() }: { createdAt?: string } = {},
): ScenarioMaterials => {
  const run = emptyRun(scenario);
  const { seats, turns, ...rest } = scenario;
  const naming = scenario.naming ?? DEFAULT_NAMING;
  const language = scenario.language ?? DEFAULT_LANGUAGE;
  const strings = stringsFor(scenario);
  const text = getScenarioText(scenario.id);
  const focalTurn = turns.find((turn) =>
    scenario.decisionPoints.some((point) => point.turn === turn.index),
  );
  const focalPoint = focalTurn
    ? scenario.decisionPoints.find((point) => point.turn === focalTurn.index)
    : undefined;
  const focalSeat =
    (focalPoint && seats.find((seat) => seat.id === focalPoint.seat)) ??
    seats[0];
  return {
    id: materialsId(scenario.id, { naming, language }),
    model: "scenarios",
    createdAt,
    base: scenario.id,
    order: listScenarios().findIndex((entry) => entry.id === scenario.id),
    naming,
    language,
    renderings: renderingsOf(scenario.id).map((options) => ({
      id: materialsId(scenario.id, options),
      naming: options.naming ?? DEFAULT_NAMING,
      language: options.language ?? DEFAULT_LANGUAGE,
    })),
    cast: seats.flatMap((seat) => {
      const member = seat.state ? castMember(seat.state) : undefined;
      return member
        ? [
            {
              seat: seat.id,
              state: member.key,
              nature: member.nature[language],
            },
          ]
        : [];
    }),
    pivots: (text?.pivots ?? []).map(({ id, note }) => ({ id, note })),
    scenario: rest,
    seats: seats.map((seat) => ({
      ...seat,
      systemPrompt: seatSystem(scenario, seat),
    })),
    turns: turns.map((turn) => {
      const point = scenario.decisionPoints.find((p) => p.turn === turn.index);
      return {
        ...turn,
        prompt: turnPrompt(run, scenario, seats[0], turn),
        decisionPoint: Boolean(point),
        focalSeat: point?.seat ?? null,
      };
    }),
    consensusPrompt: consensusPrompt(
      focalTurn
        ? turnPrompt(run, scenario, focalSeat, focalTurn)
        : "<turn prompt>",
      placeholderAdvisors,
      scenario,
    ),
    judgeSystem: JUDGE_SYSTEM(scenario),
    narratorSystem: NARRATOR_SYSTEM(scenario),
    memoSchema: memoFormat(strings).schema,
    consensusSchema: consensusFormat(strings).schema,
  };
};

/** every scenario in every rendering it has, default renderings first per scenario */
export const buildAllMaterials = (
  options: { createdAt?: string } = {},
): ScenarioMaterials[] =>
  listScenarios().flatMap((scenario) =>
    renderingsOf(scenario.id).map((rendering) =>
      buildMaterials(getScenario(scenario.id, rendering), options),
    ),
  );
