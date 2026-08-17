/**
 * Run data schema. A run is one timeline of one scenario; branches are
 * separate runs linked by `branch.parent`. Files land at
 * data/runs/<runId>.json via the workflows FileStore (model: "runs").
 */

export interface Scenario {
  id: string;
  title: string;
  summary: string;
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

export interface PanelVerdict {
  judge: string;
  model: string;
  verdict: Record<string, unknown>;
  error?: string;
}

export interface TurnAdjudication {
  panel: PanelVerdict[];
  /** 0..ladder.length-1 consensus escalation for the turn */
  escalation: number;
  narrative: string;
  gate: {
    approved: boolean;
    mode: "auto" | "human";
    notes?: string;
  };
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
  /** which lane forked this run */
  lane: "consensus" | "independent" | "root";
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
  /** copied from the scenario so replays render without scenario code */
  escalationLadder: string[];
  branch: RunBranch;
  /** child run ids created at this run's decision point */
  children: string[];
  turns: TurnRecord[];
  debriefs: Debrief[];
}
