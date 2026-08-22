// TODO: swap these local copies for
//   import type { Run, TurnRecord, DecisionBrief } from "@modelstudies/game";
// once @modelstudies/game exposes src/index.ts (the package is being built in
// parallel). These mirror packages/game/src/types.ts exactly.

export interface DecisionPoint {
  turn: number;
  seat: string;
}

export interface DecisionBrief {
  seat: string;
  model: string;
  memo: {
    situation: string;
    options: string[];
    decision: string;
    rationale: string;
    redLines: string[];
  };
  /** consensus-lane only */
  consensus?: {
    deferredOn: string[];
    brokeOn: string[];
  };
  error?: string;
}

export interface PanelVerdict {
  judge: string;
  model: string;
  verdict: Record<string, unknown>;
  error?: string;
}

export type PanelMode = "median";

export interface PanelConfig {
  judges: string[];
  mode: PanelMode;
}

export interface TurnAdjudication {
  panel: PanelVerdict[];
  mode: PanelMode;
  /** 0..ladder.length-1 consensus escalation for the turn */
  escalation: number;
  narrative: string;
}

export interface TurnRecord {
  index: number;
  title: string;
  inject: string;
  briefs: DecisionBrief[];
  adjudication?: TurnAdjudication;
}

export interface Debrief {
  seat: string;
  model: string;
  text: string;
}

export type RunStatus = "active" | "complete" | "error";

export type RunLane = "consensus" | "independent" | "root" | "matrix";

export interface RunBranch {
  parent: string | null;
  /** which lane forked this run */
  lane: RunLane;
  /** model whose decision seeds this branch */
  decidedBy: string | null;
  /** decision point that forked this run */
  point: DecisionPoint | null;
  /** the seeded focal decision brief */
  seed: DecisionBrief | null;
}

export interface Run {
  id: string;
  model: "run";
  scope?: string;
  scenario: string;
  scenarioTitle: string;
  createdAt: string;
  status: RunStatus;
  statusDetail?: string;
  /** seat id -> model id */
  roster: Record<string, string>;
  panel?: PanelConfig;
  narrator?: string;
  /** start-fork roots only: seat id -> candidate models */
  matrix?: Record<string, string[]>;
  branch: RunBranch;
  /** child run ids created at this run's decision point */
  children: string[];
  turns: TurnRecord[];
  debriefs: Debrief[];
  /** escalation ladder labels carried from the scenario, index = severity */
  escalationLadder?: string[];
}

/** Shape of one entry in the generated /data/runs.json index. */
export interface RunIndexEntry {
  id: string;
  scenario: string;
  scenarioTitle: string;
  createdAt: string;
  status: RunStatus;
  /** seat id -> model id */
  roster: Record<string, string>;
  branch: {
    parent: string | null;
    lane: RunLane;
    decidedBy: string | null;
  };
  childrenCount: number;
  turnCount: number;
}

/** Shape of data/scorecards/<rootId>.json (built by the game CLI). */
export interface ScorecardBranch {
  decidedBy: string | null;
  escalation: number[];
  final: number | null;
  id: string;
  lane: string;
  peak: number | null;
  status: string;
  statusDetail?: string;
}

export interface ScorecardConformity {
  brokeOn: string[];
  changed: boolean;
  consensusDecision: string;
  deferredOn: string[];
  independentDecision: string;
  model: string;
}

export interface Scorecard {
  branches: ScorecardBranch[];
  conformity: ScorecardConformity[];
  createdAt: string;
  divergence: {
    turnIndexes: number[];
    independentSpread: (number | null)[];
    consensusSpread: (number | null)[];
  };
  escalationLadder: string[];
  id: string;
  rootId: string;
  scenario: string;
  scenarioTitle: string;
}

// Scenario materials (mirror of packages/game/src/materials.ts): the cards
// and prompts the engine hands to models, rendered with no run history.
export interface SchemaField {
  type: string;
  description?: string;
  items?: { type: string };
}

export interface MemoSchema {
  type: "object";
  properties: Record<string, SchemaField>;
  required: readonly string[];
}

export interface SeatMaterials {
  id: string;
  name: string;
  brief: string;
  objectives: string[];
  systemPrompt: string;
}

export interface TurnMaterials {
  index: number;
  title: string;
  inject: string;
  moveMenu?: string[];
  prompt: string;
  decisionPoint: boolean;
  focalSeat: string | null;
}

export interface ScenarioMaterials {
  id: string;
  model: "scenarios";
  createdAt: string;
  scenario: {
    id: string;
    title: string;
    summary: string;
    /** the modern situation the scenario simulates */
    simulates: string;
    priorities?: string[];
    decisionPoints: { turn: number; seat: string }[];
    escalationLadder: string[];
  };
  seats: SeatMaterials[];
  turns: TurnMaterials[];
  consensusPrompt: string;
  judgeSystem: string;
  narratorSystem: string;
  memoSchema: MemoSchema;
  consensusSchema: MemoSchema;
}

// ---- play: mirrors packages/game/src/types.ts and packages/app/server/play.ts

export type DecisionMemo = DecisionBrief["memo"] & {
  consensus?: DecisionBrief["consensus"];
};

export const HUMAN_MODEL = "human";

export interface ScenarioTurnCard {
  index: number;
  title: string;
  inject: string;
  moveMenu?: string[];
}

export interface HumanPrompt {
  id: string;
  runId: string;
  lane: RunLane;
  kind: "blind" | "informed" | "turn";
  seat: string;
  seatName: string;
  turn: ScenarioTurnCard;
  /** this run's seats, each "human" or the masked "model" */
  roster: Record<string, string>;
  /** this run's own prior turns, models masked */
  history: TurnRecord[];
  system: string;
  prompt: string;
  candidates?: DecisionBrief["memo"][];
  /** the other seats' briefs for this turn, shuffled and masked */
  table?: DecisionBrief[];
}

/** A turn awaiting the human judge's verdict (models masked). */
export interface JudgePrompt {
  id: string;
  runId: string;
  turn: TurnRecord;
  history: TurnRecord[];
  escalationLadder: string[];
  system: string;
  prompt: string;
}

export interface JudgeVerdict {
  escalation: number;
  reasoning: string;
  flags: string[];
}

/** A scored turn awaiting the human narrator (models masked). */
export interface NarratePrompt {
  id: string;
  runId: string;
  turn: TurnRecord;
  history: TurnRecord[];
  escalationLadder: string[];
  panel: PanelVerdict[];
  escalation: number;
  system: string;
  prompt: string;
}

export interface PlayCatalog {
  human: string;
  models: string[];
  /** dealt across the seats at random; also the default judges */
  starting: string[];
  /** default narrator */
  narrator: string;
  panelModes: PanelMode[];
  scenarios: {
    id: string;
    title: string;
    summary: string;
    /** the modern situation the scenario simulates */
    simulates: string;
    seats: { id: string; name: string }[];
    decisionPoints: DecisionPoint[];
    turnCount: number;
  }[];
}

export interface PlayRequest {
  scenario: string;
  /** seat id -> candidate models; one branch per combination */
  matrix: Record<string, string[]>;
  panel?: Partial<PanelConfig>;
  maxTurns?: number;
  /** narrator ("human" allowed); defaults to the first matrix model */
  narrator?: string;
}

export interface PlaySession {
  id: string;
  createdAt: string;
  status: "active" | "complete" | "error";
  statusDetail?: string;
  scenario: string;
  scenarioTitle: string;
  matrix: Record<string, string[]>;
  roster: string[];
  panel: PanelConfig;
  narrator: string;
  /** the human holds a seat, a judge's chair, or the narrator's */
  human: boolean;
  branchCount: number;
  rootId: string | null;
  runIds: string[];
  pending: HumanPrompt[];
  verdicts: JudgePrompt[];
  narrations: NarratePrompt[];
  log: string[];
}
