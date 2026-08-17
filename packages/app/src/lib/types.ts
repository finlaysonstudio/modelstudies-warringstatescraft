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

export type RunLane = "consensus" | "independent" | "root";

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
  scenarioTitle: string;
  createdAt: string;
  status: RunStatus;
  branch: {
    parent: string | null;
    lane: RunLane;
    decidedBy: string | null;
  };
  childrenCount: number;
  turnCount: number;
}
