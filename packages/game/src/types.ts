/**
 * Run data schema. A run is one timeline of one scenario; branches are
 * separate runs linked by `branch.parent`. Files land at
 * var/runs/<runId>.json via the workflows FileStore (model: "runs", rooted
 * at var/ by the CLI and play server).
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
  /**
   * what a seat's system prompt carries: `framed` (default) wraps the
   * seat's brief with the summary, priorities, objectives, ladder, and a
   * closing instruction; `bare` is the brief and the priorities block only,
   * for a replication whose cards must reach the seat unadorned (the
   * summary and title stay reader-facing and never reach a seat)
   */
  seatPrompt?: SeatPrompt;
  /**
   * how seats answer a turn: `memo` (default) is the free decision memo;
   * `choice` answers the turn's `questions` and selects from its `choices`
   */
  elicitation?: Elicitation;
  /**
   * what the public record carries between turns: `narrated` (default) is
   * the narrator's account of each settled turn; `scripted` is the injects
   * and scripted moves only, so no generated text reaches a later prompt
   */
  record?: "narrated" | "scripted";
  /**
   * which reporting definition a study of this scenario builds (default
   * `basic`); see `REPORTS`
   */
  report?: ReportId;
  /**
   * the language of the played text (default `en`); the engine's own
   * scaffolding (headers, closing lines, schema descriptions, judge and
   * narrator prompts) follows it
   */
  language?: Language;
  /**
   * how the world's proper nouns are rendered in the played text (default
   * `chronicle`: the period's real names)
   */
  naming?: Naming;
  /** the pivot applied to the played text, when one was (see `Pivot`) */
  pivot?: string;
  /** chapter position in the chronicle, for saga chapters */
  chapter?: ScenarioChapter;
  seats: ScenarioSeat[];
  turns: ScenarioTurn[];
  /** which turns fork, and which seat's decision is focal */
  decisionPoints: DecisionPoint[];
  /** escalation ladder labels, index = severity 0..n */
  escalationLadder: string[];
}

/** the language a scenario's played text is rendered in */
export type Language = "en" | "zh";

export const LANGUAGES: Language[] = ["en", "zh"];

/**
 * how the world's proper nouns are rendered: `chronicle` is the period's
 * real names (秦, Zhao, Shangdang), `masked` the invented toponyms of the
 * same world (Upland, Northmarch, Tallgate), `modern` the present-day
 * names a scenario declares (the strait only)
 */
export type Naming = "chronicle" | "masked" | "modern";

export const NAMINGS: Naming[] = ["chronicle", "masked", "modern"];

/** where a scenario sits in the chronicle */
export interface ScenarioChapter {
  /** 0 = prologue, then 1..n in chronicle order */
  order: number;
  /** the chronicle's anchor for the opening situation, e.g. "262–260 BCE" */
  date: string;
}

export type Elicitation = "memo" | "choice";

/**
 * how a run asks its models for a decision: `auto` follows the capability
 * table (`elicitationFor` in @modelstudies/workflows), the others force one
 * path for every seat. See `ElicitationMode`.
 */
export type ElicitOption = "auto" | "schema" | "text";

export const ELICIT_OPTIONS: ElicitOption[] = ["auto", "schema", "text"];

export type SeatPrompt = "framed" | "bare";

export const SEAT_PROMPTS: SeatPrompt[] = ["framed", "bare"];

/** reporting definitions a scenario or study can name */
export type ReportId = "basic" | "lamparth";

export const REPORT_IDS: ReportId[] = ["basic", "lamparth"];

export const ELICITATIONS: Elicitation[] = ["memo", "choice"];

export interface ScenarioSeat {
  id: string;
  name: string;
  /**
   * played by the scenario's script (each turn's `script[seat]`), never by a
   * model; the roster records `SCRIPTED_MODEL` for it
   */
  scripted?: boolean;
  /**
   * the cast member this seat plays (a gazetteer key); the renderer prefixes
   * the brief with the state's character and what it remembers so far
   */
  state?: string;
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
  /** choice elicitation: free-text questions answered in order */
  questions?: string[];
  /** choice elicitation: the forced-choice action set (select all that apply) */
  choices?: ScenarioChoice[];
  /** scripted seats' moves this turn, seat id -> text */
  script?: Record<string, string>;
}

/** One selectable action in a forced-choice turn. */
export interface ScenarioChoice {
  id: string;
  label: string;
  /** aggressiveness class for the Lamparth-style measure */
  stance?: "agg" | "des";
}

export interface DecisionPoint {
  turn: number;
  seat: string;
}

/**
 * One model call's token accounting as the provider reported it, with the
 * list-price dollars in force when the call was made (`usd` absent when the
 * model is unpriced). Mirrors `LlmUsageItem` in `@modelstudies/workflows`.
 */
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

/** the calls behind one artifact, in the order they were made */
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
  /**
   * choice elicitation: decision calls repeated because the selection was
   * empty, the whole menu, or duplicated (see `validateChoices`)
   */
  retries?: number;
  /**
   * choice elicitation: why the final selection still failed validation;
   * the memo keeps what the model returned, and reports exclude the game
   * instead of coding it as zeros
   */
  unusable?: string;
  /** consensus-lane only */
  consensus?: {
    deferredOn: string[];
    brokeOn: string[];
  };
  /** the dialog rounds then the decision call; absent for human and scripted seats */
  usage?: Usage;
  error?: string;
}

/** The memo body a human or model produces for one turn. */
export type DecisionMemo = DecisionBrief["memo"] & {
  consensus?: DecisionBrief["consensus"];
};

/** Model id recorded for a seat or decision played by a human. */
export const HUMAN_MODEL = "human";

/** Model id recorded for a seat played by the scenario's script. */
export const SCRIPTED_MODEL = "scripted";

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
  /** the judge's call; absent for a human judge */
  usage?: Usage;
  error?: string;
}

export interface TurnAdjudication {
  panel: PanelVerdict[];
  mode: PanelMode;
  /** 0..ladder.length-1 consensus escalation for the turn */
  escalation: number;
  /**
   * no judge returned a finite escalation, so the turn has no score.
   * `escalation` stays 0 for type stability and this is what readers and
   * folds test: rung 0 is "routine posture", not "unknown", and counting it
   * would put a level the panel never gave into the record, the prompts,
   * and the reports
   */
  unscored?: true;
  narrative: string;
  /** the narrator's call; absent for a human narrator */
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
  /** the debrief call; absent for human and scripted seats */
  usage?: Usage;
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
  /** rounds of simulated team dialog before each model decision (0 = direct) */
  dialog?: number;
  /** target words per dialog round, when the rounds were length-instructed */
  dialogWords?: number;
  /** false when the scenario's priorities block was withheld (instruction ablation) */
  priorities?: boolean;
  /**
   * recorded when any seat's decisions were elicited as plain text rather
   * than a schema (see `elicitationFor`); absent when every seat held the
   * schema, so a run says how it was elicited without recomputing a table
   * that may move
   */
  elicit?: "text";
  /** language the played text was rendered in, when not `en` */
  language?: Language;
  /** naming the played text was rendered with, when not `chronicle` */
  naming?: Naming;
  /** pivot applied to the played text, when one was */
  pivot?: string;
  /** study this run belongs to, when it was played as a study arm */
  study?: string;
  /** 1-based replicate index within the study arm's cell */
  replicate?: number;
  /** copied from the scenario so replays render without scenario code */
  escalationLadder: string[];
  branch: RunBranch;
  /** child run ids created at this run's decision point */
  children: string[];
  turns: TurnRecord[];
  debriefs: Debrief[];
}

/**
 * A study is a planned set of games: every listed scenario (cell) crossed
 * with every subject roster, each played `replicates` times. Each arm is
 * one game (a root run); the study records which run plays it. Files land
 * at var/studies/<studyId>.json.
 */
export interface Study {
  id: string;
  model: "studies";
  title: string;
  createdAt: string;
  status: RunStatus;
  statusDetail?: string;
  /** reporting definition the study's report builds */
  report: ReportId;
  /** scenario ids (cells), in display order */
  scenarios: string[];
  /** subject model ids; each plays every non-scripted seat in its arms */
  models: string[];
  /** games per cell per model */
  replicates: number;
  /** seat id -> model id overrides applied to every arm (e.g. a fixed opponent) */
  seats?: Record<string, string>;
  panel?: PanelConfig;
  narrator?: string;
  dialog?: number;
  /** target words per dialog round */
  dialogWords?: number;
  priorities?: boolean;
  /** elicitation every arm plays under; absent is `auto` */
  elicit?: ElicitOption;
  language?: Language;
  naming?: Naming;
  pivot?: string;
  arms: StudyArm[];
}

export interface StudyArm {
  scenario: string;
  model: string;
  /** 1-based */
  replicate: number;
  /** the root run playing this arm, once started */
  runId?: string;
  status: "pending" | RunStatus;
  statusDetail?: string;
}
