/**
 * Run data schema. A run is one timeline of one scenario; branches are
 * separate runs linked by `branch.parent`. Files land at
 * data/runs/<runId>.json via the workflows FileStore (model: "runs").
 */

export interface Scenario {
  id: string;
  title: string;
  summary: string;
  /**
   * the modern situation the scenario simulates, for readers; never handed
   * to a model (the seats play the invented setting only)
   */
  simulates: string;
  /** toggleable priorities block (instruction-ablation lever) */
  priorities?: string[];
  seats: ScenarioSeat[];
  turns: ScenarioTurn[];
  /** which turns fork, and which seat's decision is focal */
  decisionPoints: DecisionPoint[];
  /** escalation ladder labels, index = severity 0..n */
  escalationLadder: string[];
}

export interface ScenarioSeat {
  id: string;
  name: string;
  /** system-prompt brief for the cell playing this seat */
  brief: string;
  objectives: string[];
}

export interface ScenarioTurn {
  index: number;
  title: string;
  /** the inject: what the world presents this turn */
  inject: string;
  /** optional move menu; cells may also free-move */
  moveMenu?: string[];
}

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

/** The memo body a human or model produces for one turn. */
export type DecisionMemo = DecisionBrief["memo"] & {
  consensus?: DecisionBrief["consensus"];
};

/** Model id recorded for a seat or decision played by a human. */
export const HUMAN_MODEL = "human";

/**
 * Model id shown to a human player in place of a real one. Human prompts
 * never reveal which model holds another seat, wrote a candidate memo, or sat
 * on the panel; the run record keeps the truth for the replay.
 */
export const MASKED_MODEL = "model";

/**
 * What the engine hands a human player when it needs a memo. `blind` and
 * `informed` are the two focal-seat memos at the fork (informed carries the
 * anonymized independent memos); `turn` is an ordinary seat turn.
 */
export interface HumanPrompt {
  id: string;
  runId: string;
  lane: RunBranch["lane"];
  kind: "blind" | "informed" | "turn";
  seat: string;
  seatName: string;
  turn: ScenarioTurn;
  /** this run's seats, each HUMAN_MODEL or MASKED_MODEL */
  roster: Record<string, string>;
  /** this run's own prior turns (the player's timeline, not any sibling's), models masked */
  history: TurnRecord[];
  /** the seat's system prompt, verbatim */
  system: string;
  /** the turn prompt, verbatim */
  prompt: string;
  /** informed only: anonymized, shuffled independent memos */
  candidates?: DecisionBrief["memo"][];
  /** turn only: the other seats' briefs for this turn, shuffled and masked */
  table?: DecisionBrief[];
}

/** What the engine hands a human judge: one turn to score on the ladder. */
export interface JudgePrompt {
  id: string;
  runId: string;
  /** the turn's briefs, models masked */
  turn: TurnRecord;
  /** this run's own prior turns, models masked */
  history: TurnRecord[];
  escalationLadder: string[];
  /** the judge system prompt, verbatim */
  system: string;
  /** the judge prompt, verbatim */
  prompt: string;
}

export interface JudgeVerdict {
  escalation: number;
  reasoning: string;
  flags: string[];
}

/** What the engine hands a human narrator: the scored turn to resolve. */
export interface NarratePrompt {
  id: string;
  runId: string;
  /** the turn's briefs, models masked */
  turn: TurnRecord;
  /** this run's own prior turns, models masked */
  history: TurnRecord[];
  escalationLadder: string[];
  /** the panel's verdicts, judges masked */
  panel: PanelVerdict[];
  /** the panel's combined level */
  escalation: number;
  /** the narrator system prompt, verbatim */
  system: string;
  /** the narrator prompt, verbatim */
  prompt: string;
}

export interface HumanPlayer {
  decide: (prompt: HumanPrompt) => Promise<DecisionMemo>;
  /** required when HUMAN_MODEL sits on the panel */
  judge?: (prompt: JudgePrompt) => Promise<JudgeVerdict>;
  /** required when HUMAN_MODEL is the narrator */
  narrate?: (prompt: NarratePrompt) => Promise<string>;
}

/** how the judge panel's verdicts combine into one escalation level */
export type PanelMode = "median";

export const PANEL_MODES: PanelMode[] = ["median"];

export interface PanelConfig {
  /** judge model ids (HUMAN_MODEL allowed) */
  judges: string[];
  mode: PanelMode;
}

export interface PanelVerdict {
  judge: string;
  model: string;
  verdict: Record<string, unknown>;
  error?: string;
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

export interface RunBranch {
  parent: string | null;
  /**
   * which lane forked this run; `matrix` runs fork at turn 1, one per seat
   * assignment in the parent's matrix
   */
  lane: "consensus" | "independent" | "root" | "matrix";
  /** model whose decision seeds this branch */
  decidedBy: string | null;
  /** decision point that forked this run */
  point: DecisionPoint | null;
  /** the seeded focal decision brief */
  seed: DecisionBrief | null;
}

export interface Run {
  id: string;
  model: "runs";
  scope?: string;
  scenario: string;
  scenarioTitle: string;
  createdAt: string;
  status: RunStatus;
  statusDetail?: string;
  /** seat id -> model id */
  roster: Record<string, string>;
  /** judge panel that scored this run's turns */
  panel?: PanelConfig;
  /** model that wrote this run's resolution narratives */
  narrator?: string;
  /** start-fork roots only: seat id -> candidate models, one child per combination */
  matrix?: Record<string, string[]>;
  /** copied from the scenario so replays render without scenario code */
  escalationLadder: string[];
  branch: RunBranch;
  /** child run ids created at this run's decision point */
  children: string[];
  turns: TurnRecord[];
  debriefs: Debrief[];
}
