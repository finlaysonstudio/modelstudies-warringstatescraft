// TODO: swap these local copies for
//   import type { Run, TurnRecord, DecisionBrief } from "@modelstudies/game";
// once @modelstudies/game exposes src/index.ts (the package is being built in
// parallel). These mirror packages/game/src/types.ts exactly.

export interface DecisionPoint {
  turn: number;
  seat: string;
}

/** one model call's tokens and the list-price dollars at call time */
export interface UsageItem {
  input: number;
  output: number;
  reasoning: number;
  total: number;
  cacheRead?: number;
  cacheWrite?: number;
  provider?: string;
  model?: string;
  usd?: number;
}

export type Usage = UsageItem[];

export interface DecisionBrief {
  seat: string;
  model: string;
  memo: {
    situation: string;
    options: string[];
    decision: string;
    rationale: string;
    redLines: string[];
    /** choice elicitation: answers to the turn's questions, in order */
    answers?: string[];
    /** choice elicitation: selected choice ids */
    choices?: string[];
  };
  /** simulated team dialog that preceded the decision, one entry per round */
  dialog?: string[];
  /** choice elicitation: decision calls repeated on an invalid selection */
  retries?: number;
  /** choice elicitation: why the final selection failed validation (reports exclude the game) */
  unusable?: string;
  /** consensus-lane only */
  consensus?: {
    deferredOn: string[];
    brokeOn: string[];
  };
  /** the dialog rounds then the decision call */
  usage?: Usage;
  error?: string;
}

export interface PanelVerdict {
  judge: string;
  model: string;
  verdict: Record<string, unknown>;
  usage?: Usage;
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
  narratorUsage?: Usage;
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
  usage?: Usage;
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
  /** rounds of simulated team dialog before each model decision */
  dialog?: number;
  /** target words per dialog round, when the rounds were length-instructed */
  dialogWords?: number;
  /** false when the scenario's priorities block was withheld */
  priorities?: boolean;
  /** study this run belongs to, when it was played as a study arm */
  study?: string;
  /** 1-based replicate index within the study arm's cell */
  replicate?: number;
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
  /** start-fork roots only: seat id -> candidate models */
  matrix?: Record<string, string[]>;
  /** judge panel that scored the run's turns */
  panel?: PanelConfig;
  /** model that wrote the run's resolution narratives */
  narrator?: string;
  /** study this run belongs to */
  study?: string;
  replicate?: number;
}

// ---- studies and reports (mirror packages/game/src/types.ts and reports/)

export type ReportId = "basic" | "lamparth";

export interface StudyArm {
  scenario: string;
  model: string;
  replicate: number;
  runId?: string;
  status: "pending" | RunStatus;
  statusDetail?: string;
}

/** Shape of var/studies/<id>.json. */
export interface Study {
  id: string;
  model: "studies";
  title: string;
  createdAt: string;
  status: RunStatus;
  statusDetail?: string;
  report: ReportId;
  scenarios: string[];
  models: string[];
  replicates: number;
  seats?: Record<string, string>;
  panel?: PanelConfig;
  narrator?: string;
  dialog?: number;
  dialogWords?: number;
  priorities?: boolean;
  arms: StudyArm[];
}

/** Shape of one entry in the generated /data/studies.json index. */
export interface StudyIndexEntry {
  id: string;
  title: string;
  createdAt: string;
  status: RunStatus;
  statusDetail?: string;
  report: ReportId;
  scenarios: string[];
  models: string[];
  replicates: number;
  armCount: number;
  completeCount: number;
  errorCount: number;
}

export interface Estimate {
  value: number;
  ci: [number, number];
}

export interface CellCoverage {
  scenario: string;
  model: string;
  expected: number;
  complete: number;
  error: number;
  pending: number;
}

// mirror of packages/game/src/cost.ts
export type UsageRole = "seat" | "judge" | "narrator" | "debrief";

export interface UsageTotals {
  calls: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
  usd: number;
  /** calls with no price at call time */
  unpriced: number;
}

export interface UsageRow extends UsageTotals {
  role: UsageRole;
  seat: string | null;
  model: string;
}

export interface RunUsage {
  total: UsageTotals;
  rows: UsageRow[];
}

export interface CellUsage {
  scenario: string;
  model: string;
  games: number;
  totals: UsageTotals;
  usdPerGame: number;
}

export interface StudyUsage {
  total: UsageTotals;
  rows: UsageRow[];
  byModel: { model: string; totals: UsageTotals }[];
  cells: CellUsage[];
}

export interface ReportBase {
  id: string;
  model: "reports";
  report: ReportId;
  study: string;
  title: string;
  createdAt: string;
  scenarios: string[];
  models: string[];
  replicates: number;
  coverage: CellCoverage[];
  bootstrap: number;
  /** absent on reports built before usage capture */
  usage?: StudyUsage;
}

export interface EscalationGroup {
  scenario: string | null;
  model: string;
  games: number;
  timelines: number;
  turns: { index: number; escalation: Estimate }[];
  peak: Estimate;
  final: Estimate;
}

export interface BasicReport extends ReportBase {
  report: "basic";
  cells: EscalationGroup[];
  byModel: EscalationGroup[];
}

export interface LamparthColumn {
  turn: number;
  id: string;
  label: string;
  stance?: "agg" | "des";
}

export interface LamparthEffect {
  factor: "accuracy" | "training" | "posture";
  levels: [string, string];
  n: [number, number];
  rows: (LamparthColumn & Estimate)[];
}

export interface LamparthConsistency {
  table2: { aggAgg: Estimate; desAgg: Estimate };
  conditional: { aggGivenAgg: Estimate; aggGivenDes: Estimate };
  nAgg: number;
  nDes: number;
}

export interface LamparthGroup {
  id: string;
  label: string;
  kind: "study" | "reference";
  model?: string;
  n: number;
  /** complete games dropped for a missing or unusable selection */
  excluded: number;
  cells: { scenario: string; n: number }[];
  /** study groups: mean words of simulated dialog per move */
  dialogWords?: { turn: number; mean: number }[];
  frequencies: (LamparthColumn & Estimate)[];
  effects: LamparthEffect[];
  aggressiveness: Estimate;
  actions: Estimate;
  consistency: LamparthConsistency;
}

export interface LamparthComparison {
  group: string;
  reference: string;
  rows: (LamparthColumn & Estimate)[];
}

export interface LamparthReport extends ReportBase {
  report: "lamparth";
  columns: LamparthColumn[];
  groups: LamparthGroup[];
  comparisons: LamparthComparison[];
  table2?: Record<string, { aggGivenAgg: number; aggGivenDes: number }>;
}

export type Report = BasicReport | LamparthReport;

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
  /** played by the scenario's script, never by a model */
  scripted?: boolean;
  brief: string;
  objectives: string[];
  systemPrompt: string;
}

export interface ScenarioChoice {
  id: string;
  label: string;
  stance?: "agg" | "des";
}

export interface TurnMaterials {
  index: number;
  title: string;
  inject: string;
  moveMenu?: string[];
  questions?: string[];
  choices?: ScenarioChoice[];
  /** scripted seats' moves this turn, seat id -> text */
  script?: Record<string, string>;
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
    /** `bare` seat prompts carry the brief and priorities only */
    seatPrompt?: "framed" | "bare";
    elicitation?: "memo" | "choice";
    /** reporting definition a study of this scenario builds */
    report?: ReportId;
    record?: "narrated" | "scripted";
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

export const SCRIPTED_MODEL = "scripted";

export interface ScenarioTurnCard {
  index: number;
  title: string;
  inject: string;
  moveMenu?: string[];
  questions?: string[];
  choices?: ScenarioChoice[];
  script?: Record<string, string>;
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
