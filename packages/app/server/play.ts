/**
 * Dev-server play API (Node side; never bundled for the browser). Loaded by
 * the Vite plugin through `ssrLoadModule`, so workspace TypeScript runs with
 * no build step. Holds in-memory play sessions: each wraps one GameEngine
 * whose HumanPlayer parks prompts here until the browser answers them.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BadRequestError, NotFoundError } from "@jaypie/errors";
import {
  GameEngine,
  HUMAN_MODEL,
  listScenarios,
  matrixCombinations,
  PANEL_MODES,
  type DecisionMemo,
  type HumanPrompt,
  type JudgePrompt,
  type JudgeVerdict,
  type NarratePrompt,
  type PanelConfig,
  type Run,
} from "@modelstudies/game";
import { MODELS } from "@modelstudies/survey";
import {
  FileStore,
  defaultLlmClient,
  type EntityLike,
  type Store,
} from "@modelstudies/workflows";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

// Provider keys live in <repo>/.env; the CLI loads the same file.
try {
  process.loadEnvFile(path.join(repoRoot, ".env"));
} catch {
  // no .env: rely on the ambient environment
}

export interface PlayRequest {
  scenario: string;
  /**
   * seat id -> candidate models (HUMAN_MODEL allowed). The game forks at the
   * start into one branch per combination.
   */
  matrix: Record<string, string[]>;
  /**
   * judge panel (HUMAN_MODEL allowed); judges default to every distinct
   * model in the matrix
   */
  panel?: Partial<PanelConfig>;
  maxTurns?: number;
  /** narrator (HUMAN_MODEL allowed); defaults to the first matrix model */
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
  /** distinct models in the matrix (judge and narrator defaults) */
  roster: string[];
  panel: PanelConfig;
  narrator: string;
  /** the human holds a seat, a judge's chair, or the narrator's */
  human: boolean;
  branchCount: number;
  rootId: string | null;
  /** every run this session has written, root first */
  runIds: string[];
  /** seat memos awaiting the human */
  pending: HumanPrompt[];
  /** turns awaiting the human judge's verdict */
  verdicts: JudgePrompt[];
  /** scored turns awaiting the human narrator */
  narrations: NarratePrompt[];
  log: string[];
}

interface Resolver<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

interface LiveSession {
  session: PlaySession;
  resolvers: Map<string, Resolver<DecisionMemo>>;
  judgeResolvers: Map<string, Resolver<JudgeVerdict>>;
  narrateResolvers: Map<string, Resolver<string>>;
}

const sessions = new Map<string, LiveSession>();

const stamp = () => new Date().toISOString().slice(11, 19);

/** Records every run id the engine writes, so the console can link them. */
class RecordingStore implements Store {
  constructor(
    private readonly inner: Store,
    private readonly session: PlaySession,
  ) {}

  private note(entity: EntityLike) {
    if (entity.model !== "runs") return;
    const run = entity as unknown as Run;
    if (!this.session.runIds.includes(run.id)) {
      this.session.runIds.push(run.id);
      if (run.branch.lane === "root") this.session.rootId = run.id;
      else
        this.session.log.push(
          `${stamp()} branch ${run.id} (${Object.entries(run.roster)
            .map(([seat, model]) => `${seat}=${model.split("/").pop()}`)
            .join(" ")})`,
        );
    }
  }

  async create<T extends EntityLike>(entity: T): Promise<T> {
    this.note(entity);
    return this.inner.create(entity);
  }

  get<T extends EntityLike>(model: string, id: string): Promise<T | undefined> {
    return this.inner.get<T>(model, id);
  }

  queryByScope<T extends EntityLike>(
    model: string,
    scope: string,
  ): Promise<T[]> {
    return this.inner.queryByScope<T>(model, scope);
  }

  async update<T extends EntityLike>(entity: T): Promise<T> {
    this.note(entity);
    return this.inner.update(entity);
  }
}

export const catalog = () => ({
  human: HUMAN_MODEL,
  models: Object.values(MODELS),
  /** dealt across the seats at random; also the default judges */
  starting: [
    MODELS.OPUS,
    MODELS.SOL,
    MODELS.GEMINI_FLASH,
    MODELS.GROK,
    MODELS.FIREWORKS_GLM,
    MODELS.FIREWORKS_KIMI,
  ],
  narrator: MODELS.SOL,
  panelModes: PANEL_MODES,
  scenarios: listScenarios().map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    summary: scenario.summary,
    simulates: scenario.simulates,
    seats: scenario.seats.map((seat) => ({ id: seat.id, name: seat.name })),
    decisionPoints: scenario.decisionPoints,
    turnCount: scenario.turns.length,
  })),
});

export const listSessions = (): PlaySession[] =>
  [...sessions.values()]
    .map((live) => live.session)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getSession = (id: string): PlaySession => {
  const live = sessions.get(id);
  if (!live) throw new NotFoundError(`Unknown play session: ${id}`);
  return live.session;
};

export const createSession = (request: PlayRequest): PlaySession => {
  if (!request.scenario) throw new BadRequestError("scenario is required");
  const scenario = listScenarios().find((s) => s.id === request.scenario);
  if (!scenario)
    throw new BadRequestError(`Unknown scenario: ${request.scenario}`);
  const matrix = Object.fromEntries(
    Object.entries(request.matrix ?? {}).map(([seat, models]) => [
      seat,
      Array.isArray(models) ? models.filter(Boolean) : [],
    ]),
  );
  const combinations = matrixCombinations(scenario, matrix);
  const roster = [
    ...new Set(
      Object.values(matrix)
        .flat()
        .filter((model) => model !== HUMAN_MODEL),
    ),
  ];
  if (!roster.length) {
    throw new BadRequestError("matrix must contain at least one model");
  }
  const seated = Object.values(matrix).flat().includes(HUMAN_MODEL);
  const judges = (request.panel?.judges ?? []).filter(Boolean);
  const mode = request.panel?.mode ?? "median";
  if (!PANEL_MODES.includes(mode)) {
    throw new BadRequestError(`Unknown panel mode: ${String(mode)}`);
  }
  const panel: PanelConfig = { judges: judges.length ? judges : roster, mode };
  const narrator = request.narrator || roster[0];
  const human =
    seated || panel.judges.includes(HUMAN_MODEL) || narrator === HUMAN_MODEL;

  const session: PlaySession = {
    id: `play_${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    status: "active",
    scenario: scenario.id,
    scenarioTitle: scenario.title,
    matrix,
    roster,
    panel,
    narrator,
    human,
    branchCount: combinations.length,
    rootId: null,
    runIds: [],
    pending: [],
    verdicts: [],
    narrations: [],
    log: [`${stamp()} session created`],
  };
  const live: LiveSession = {
    session,
    resolvers: new Map(),
    judgeResolvers: new Map(),
    narrateResolvers: new Map(),
  };
  sessions.set(session.id, live);

  const log = {
    trace: () => undefined,
    debug: (...args: unknown[]) =>
      session.log.push(`${stamp()} ${args.map(String).join(" ")}`),
    warn: (...args: unknown[]) =>
      session.log.push(`${stamp()} warn ${args.map(String).join(" ")}`),
    error: (...args: unknown[]) =>
      session.log.push(`${stamp()} error ${args.map(String).join(" ")}`),
  };

  const engine = new GameEngine({
    // every branch plays at once so the human sees all their prompts together
    branchConcurrency: Math.min(combinations.length, 16),
    human: human
      ? {
          decide: (prompt) =>
            new Promise<DecisionMemo>((resolve, reject) => {
              session.pending.push(prompt);
              live.resolvers.set(prompt.id, { resolve, reject });
            }),
          judge: (prompt) =>
            new Promise<JudgeVerdict>((resolve, reject) => {
              session.verdicts.push(prompt);
              live.judgeResolvers.set(prompt.id, { resolve, reject });
            }),
          narrate: (prompt) =>
            new Promise<string>((resolve, reject) => {
              session.narrations.push(prompt);
              live.narrateResolvers.set(prompt.id, { resolve, reject });
            }),
        }
      : undefined,
    llm: defaultLlmClient,
    log,
    matrix,
    maxTurns: request.maxTurns || undefined,
    narrator,
    panel,
    scenario: scenario.id,
    store: new RecordingStore(
      new FileStore(path.join(repoRoot, "var")),
      session,
    ),
  });

  void engine
    .play()
    .then((root) => {
      session.status = "complete";
      session.statusDetail = root.statusDetail;
      session.log.push(`${stamp()} complete`);
    })
    .catch((error: unknown) => {
      session.status = "error";
      session.statusDetail =
        error instanceof Error ? error.message : String(error);
      session.log.push(`${stamp()} error ${session.statusDetail}`);
      for (const map of [
        live.resolvers,
        live.judgeResolvers,
        live.narrateResolvers,
      ]) {
        for (const { reject } of map.values()) {
          reject(new Error(session.statusDetail));
        }
        map.clear();
      }
      session.pending = [];
      session.verdicts = [];
      session.narrations = [];
    });

  return session;
};

export const answerPrompt = (
  sessionId: string,
  promptId: string,
  memo: DecisionMemo,
): PlaySession => {
  const live = sessions.get(sessionId);
  if (!live) throw new NotFoundError(`Unknown play session: ${sessionId}`);
  const resolver = live.resolvers.get(promptId);
  if (!resolver) throw new NotFoundError(`No pending prompt: ${promptId}`);
  if (!memo || typeof memo.decision !== "string" || !memo.decision.trim()) {
    throw new BadRequestError("memo.decision is required");
  }
  live.resolvers.delete(promptId);
  live.session.pending = live.session.pending.filter(
    (prompt) => prompt.id !== promptId,
  );
  live.session.log.push(`${stamp()} human memo received (${promptId})`);
  resolver.resolve(memo);
  return live.session;
};

export const answerJudge = (
  sessionId: string,
  promptId: string,
  verdict: JudgeVerdict,
): PlaySession => {
  const live = sessions.get(sessionId);
  if (!live) throw new NotFoundError(`Unknown play session: ${sessionId}`);
  const resolver = live.judgeResolvers.get(promptId);
  if (!resolver) throw new NotFoundError(`No pending verdict: ${promptId}`);
  if (!verdict || !Number.isInteger(verdict.escalation)) {
    throw new BadRequestError("escalation must be an integer");
  }
  live.judgeResolvers.delete(promptId);
  live.session.verdicts = live.session.verdicts.filter(
    (prompt) => prompt.id !== promptId,
  );
  live.session.log.push(`${stamp()} human verdict received (${promptId})`);
  resolver.resolve({
    escalation: verdict.escalation,
    reasoning: typeof verdict.reasoning === "string" ? verdict.reasoning : "",
    flags: Array.isArray(verdict.flags) ? verdict.flags.map(String) : [],
  });
  return live.session;
};

export const answerNarrate = (
  sessionId: string,
  promptId: string,
  narrative: string,
): PlaySession => {
  const live = sessions.get(sessionId);
  if (!live) throw new NotFoundError(`Unknown play session: ${sessionId}`);
  const resolver = live.narrateResolvers.get(promptId);
  if (!resolver) throw new NotFoundError(`No pending narration: ${promptId}`);
  if (typeof narrative !== "string" || !narrative.trim()) {
    throw new BadRequestError("narrative is required");
  }
  live.narrateResolvers.delete(promptId);
  live.session.narrations = live.session.narrations.filter(
    (prompt) => prompt.id !== promptId,
  );
  live.session.log.push(`${stamp()} human narration received (${promptId})`);
  resolver.resolve(narrative.trim());
  return live.session;
};
