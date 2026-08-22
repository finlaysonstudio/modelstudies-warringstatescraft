import { JUDGE_SYSTEM, NARRATOR_SYSTEM } from "./adjudicate";
import {
  CONSENSUS_FORMAT,
  MEMO_FORMAT,
  consensusPrompt,
  seatSystem,
  turnPrompt,
} from "./briefs";
import { listScenarios } from "./scenarios";
import type {
  DecisionBrief,
  Run,
  Scenario,
  ScenarioSeat,
  ScenarioTurn,
} from "./types";

/**
 * Scenario materials: every card and instruction the engine hands to a
 * model, rendered exactly as the model sees it, with no run history. The
 * reading-room counterpart to a run replay. Persisted as
 * `data/scenarios/<id>.json` so the app can render it without engine code.
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

export interface ScenarioMaterials {
  id: string;
  model: "scenarios";
  createdAt: string;
  /** position in the scenario registry (display order) */
  order: number;
  scenario: Omit<Scenario, "seats" | "turns">;
  seats: SeatMaterials[];
  turns: TurnMaterials[];
  /** the consensus lane's addendum, shown with two placeholder advisor memos */
  consensusPrompt: string;
  judgeSystem: string;
  narratorSystem: string;
  memoSchema: typeof MEMO_FORMAT.schema;
  consensusSchema: typeof CONSENSUS_FORMAT.schema;
}

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
    id: scenario.id,
    model: "scenarios",
    createdAt,
    order: listScenarios().findIndex((entry) => entry.id === scenario.id),
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
    ),
    judgeSystem: JUDGE_SYSTEM(scenario),
    narratorSystem: NARRATOR_SYSTEM(scenario),
    memoSchema: MEMO_FORMAT.schema,
    consensusSchema: CONSENSUS_FORMAT.schema,
  };
};

export const buildAllMaterials = (
  options: { createdAt?: string } = {},
): ScenarioMaterials[] =>
  listScenarios().map((scenario) => buildMaterials(scenario, options));
