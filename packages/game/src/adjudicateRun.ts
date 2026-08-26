/**
 * Re-scoring: a stored run read again by a panel other than the one that
 * played it.
 *
 * A study whose seats, judge, and narrator are all the same model cannot
 * separate a difference in play from a difference in scoring. Re-scoring
 * every run with one fixed panel separates them, and it does so without
 * playing anything again: the games on disk are the evidence and only the
 * scoring is in question.
 *
 * Three rules hold the exercise honest.
 *
 * 1. The judge reads the record as played, truncated. `publicRecord` folds
 *    every adjudicated turn of the run it is handed into prior-turn
 *    headers, and during play that is prior turns only, because the engine
 *    scores a turn before pushing it. Turn *i* is therefore scored against
 *    `{ ...run, turns: run.turns.slice(0, i) }`, and those headers keep the
 *    *original* rungs and narratives: the seats played against that public
 *    record, so the new panel scores the game that was actually played.
 * 2. Inherited turns are scored once. A decision-point child carries its
 *    parent's pre-fork turns verbatim; the child copies the parent's scores
 *    for them and makes no call.
 * 3. The run is never mutated. The scores land in an `Adjudication` beside
 *    it, as a staging does, and the re-scoring's own spend lives there.
 */
import { createHash } from "node:crypto";

import { BadRequestError } from "@jaypie/errors";
import type { LlmClient, Store } from "@modelstudies/workflows";

import { scoreTurn } from "./adjudicate";
import type { GameLog } from "./engine";
import { getScenario } from "./scenarios";
import type {
  Adjudication,
  HumanPlayer,
  PanelConfig,
  Run,
  Scenario,
  TurnScore,
  Usage,
} from "./types";
import { HUMAN_MODEL } from "./types";

/**
 * A short stable name for a panel: the judges sorted (order does not move a
 * median, and the id must not move either) and the combining mode.
 */
export const panelIdOf = (panel: PanelConfig): string =>
  `p${createHash("sha1")
    .update(`${[...panel.judges].sort().join(",")}|${panel.mode}`)
    .digest("hex")
    .slice(0, 8)}`;

/** the id a run's scoring by one panel is stored under */
export const adjudicationId = (runId: string, panelId: string): string =>
  `${runId}.${panelId}`;

/**
 * A concurrency gate shared across runs. §3.1 makes every (run, turn) pair
 * independent, so a study's pool is over pairs rather than over runs: one
 * gate is handed to every `adjudicateRun` and caps the calls in flight.
 */
export interface Gate {
  run<T>(task: () => Promise<T>): Promise<T>;
}

export const createGate = (limit: number): Gate => {
  const width = Math.max(1, Math.floor(limit));
  let active = 0;
  const waiting: (() => void)[] = [];
  const release = () => {
    active -= 1;
    waiting.shift()?.();
  };
  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      if (active >= width) {
        await new Promise<void>((resolve) => waiting.push(resolve));
      }
      active += 1;
      try {
        return await task();
      } finally {
        release();
      }
    },
  };
};

/** one turn of a run as a re-scoring will treat it */
export interface TurnPlan {
  /** position in `run.turns`, which is what the truncation slices on */
  position: number;
  /** the turn's own index, as `TurnRecord.index` carries it */
  index: number;
  /** copied from the parent's scoring rather than called for */
  inherited: boolean;
}

/**
 * What a child inherits from: the parent run and the turn indexes a scoring
 * of it covers. `planAdjudication` needs the indexes only, so a plan can be
 * drawn before a single call is made (`--dry-run`).
 */
export interface AdjudicationParent {
  runId: string;
  indexes: number[];
}

/** the parent a scoring on record supplies */
export const parentOfAdjudication = (
  set: Adjudication,
): AdjudicationParent => ({
  runId: set.runId,
  indexes: set.turns.map((score) => score.index),
});

/** the parent a run would supply once scored: the turns it was scored on */
export const parentOfRun = (run: Run): AdjudicationParent => ({
  runId: run.id,
  indexes: run.turns
    .filter((turn) => turn.adjudication)
    .map((turn) => turn.index),
});

/**
 * The turns a re-scoring covers. Only turns the run itself scored are in
 * play: a decision-point root's last turn carries the whole candidate
 * matrix and was never adjudicated, and scoring it now would score a turn
 * no panel ever saw.
 */
export const planAdjudication = (
  run: Run,
  parent?: AdjudicationParent,
): TurnPlan[] => {
  const forkTurn = run.branch.point?.turn;
  const fromParent =
    parent && run.branch.parent === parent.runId
      ? new Set(parent.indexes)
      : new Set<number>();
  const plans: TurnPlan[] = [];
  run.turns.forEach((turn, position) => {
    if (!turn.adjudication) return;
    plans.push({
      position,
      index: turn.index,
      inherited:
        forkTurn !== undefined &&
        turn.index < forkTurn &&
        fromParent.has(turn.index),
    });
  });
  return plans;
};

/** the calls a plan makes: one per judge per turn it does not inherit */
export const callsOf = (plans: TurnPlan[], judges: number): number =>
  plans.filter((plan) => !plan.inherited).length * judges;

/** the scenario a run was played under, in its own rendering */
export const scenarioOfRun = (run: Run): Scenario =>
  getScenario(run.scenario, {
    ...(run.naming ? { naming: run.naming } : {}),
    ...(run.language ? { language: run.language } : {}),
    ...(run.pivot ? { pivot: run.pivot } : {}),
  });

export interface AdjudicateRunOptions {
  /** answers for HUMAN_MODEL on the panel */
  human?: HumanPlayer;
  run: Run;
  /**
   * the parent run's scoring *by this same panel*; its pre-fork turns are
   * copied rather than called for. A `Run` cannot stand in: the parent's
   * own turns carry the panel that played them, not this one.
   */
  parent?: Adjudication;
  panel: PanelConfig;
  /** default `panelIdOf(panel)`; `--as` overrides it for a readable name */
  panelId?: string;
  llm: LlmClient;
  store: Store;
  /** rebuild a scoring already on record */
  force?: boolean;
  /** turns scored at once; ignored when `gate` is given */
  concurrency?: number;
  /** a gate shared with other runs, so the pool is over (run, turn) pairs */
  gate?: Gate;
  log?: GameLog;
  now?: string;
}

export interface AdjudicateRunResult {
  adjudication: Adjudication;
  /** false when the scoring was already on record and `force` was not set */
  built: boolean;
  /** judge calls made (zero when the scoring was kept) */
  calls: number;
}

/** the calls a scoring made itself; an inherited turn's belong to the parent */
export const usageOfAdjudication = (set: Adjudication): Usage =>
  set.turns.flatMap((score) =>
    score.inherited
      ? []
      : score.panel.flatMap((verdict) => verdict.usage ?? []),
  );

export const adjudicateRun = async ({
  human,
  run,
  parent,
  panel,
  panelId = panelIdOf(panel),
  llm,
  store,
  force = false,
  concurrency = 4,
  gate,
  log,
  now = new Date().toISOString(),
}: AdjudicateRunOptions): Promise<AdjudicateRunResult> => {
  if (run.status !== "complete") {
    throw new BadRequestError(
      `Run ${run.id} is ${run.status}; only a complete run is re-scored`,
    );
  }
  if (run.turns.length === 0) {
    throw new BadRequestError(`Run ${run.id} has no turns`);
  }
  if (panel.judges.includes(HUMAN_MODEL) && !human?.judge) {
    throw new BadRequestError("No human judge provided");
  }
  const id = adjudicationId(run.id, panelId);
  const existing = await store.get<Adjudication>("adjudications", id);
  if (existing && !force) {
    log?.trace(`${id}: exists; --force rebuilds`);
    return { adjudication: existing, built: false, calls: 0 };
  }
  const scenario = scenarioOfRun(run);
  const plans = planAdjudication(
    run,
    parent ? parentOfAdjudication(parent) : undefined,
  );
  const byIndex = new Map(
    (parent?.turns ?? []).map((score) => [score.index, score]),
  );
  const limit = gate ?? createGate(concurrency);
  const turns: TurnScore[] = await Promise.all(
    plans.map(async (plan): Promise<TurnScore> => {
      if (plan.inherited) {
        const score = structuredClone(byIndex.get(plan.index)!);
        return { ...score, index: plan.index, inherited: true as const };
      }
      // the judge reads the record the seats played against, and no further
      const truncated: Run = {
        ...run,
        turns: run.turns.slice(0, plan.position),
      };
      const result = await limit.run(() =>
        scoreTurn({
          ...(human ? { human } : {}),
          llm,
          panel,
          run: truncated,
          scenario,
          turn: run.turns[plan.position],
        }),
      );
      return {
        index: plan.index,
        panel: result.panel,
        mode: result.mode,
        escalation: result.escalation,
        ...(result.unscored ? { unscored: true as const } : {}),
      };
    }),
  );
  const adjudication: Adjudication = {
    id,
    model: "adjudications",
    scope: run.id,
    runId: run.id,
    ...(run.study ? { study: run.study } : {}),
    scenario: run.scenario,
    panelId,
    panel: { judges: [...panel.judges], mode: panel.mode },
    createdAt: now,
    turns,
  };
  const usage = usageOfAdjudication(adjudication);
  if (usage.length) adjudication.usage = usage;
  if (existing) await store.update(adjudication);
  else await store.create(adjudication);
  return {
    adjudication,
    built: true,
    calls: callsOf(plans, panel.judges.length),
  };
};

/**
 * The runs as a re-scoring reads them: each turn's panel, mode, escalation,
 * and unscored flag replaced by the `Adjudication`'s. The narrative and the
 * narrator's usage stay as played — the seats saw those — and the swapped
 * verdicts carry no usage, so `usageOf(run)` still reports what the run
 * cost and the re-scoring's own spend stays on the `Adjudication`.
 *
 * A run with no matching scoring is returned unchanged; the caller counts
 * them (see `adjudicationCoverage`) rather than dropping them silently.
 */
export const applyAdjudications = (
  runs: Run[],
  sets: Adjudication[],
): Run[] => {
  const byRun = new Map(sets.map((set) => [set.runId, set]));
  return runs.map((run) => {
    const set = byRun.get(run.id);
    if (!set) return run;
    const byIndex = new Map(set.turns.map((score) => [score.index, score]));
    return {
      ...run,
      // the overlaid copy says who scored it, so a reader holding one run
      // is never guessing; the stored run keeps the panel that played it
      panel: { judges: [...set.panel.judges], mode: set.panel.mode },
      turns: run.turns.map((turn) => {
        const score = byIndex.get(turn.index);
        if (!score || !turn.adjudication) return turn;
        const { unscored: _was, ...played } = turn.adjudication;
        return {
          ...turn,
          adjudication: {
            ...played,
            panel: score.panel.map(({ usage: _usage, ...verdict }) => verdict),
            mode: score.mode,
            escalation: score.escalation,
            ...(score.unscored ? { unscored: true as const } : {}),
          },
        };
      }),
    };
  });
};

/** how many of the runs a scoring covers */
export const adjudicationCoverage = (
  runs: Run[],
  sets: Adjudication[],
): { runs: number; of: number } => {
  const byRun = new Set(sets.map((set) => set.runId));
  return {
    runs: runs.filter((run) => byRun.has(run.id)).length,
    of: runs.length,
  };
};

/** every scoring of the given runs by one panel that is already on record */
export const loadAdjudications = async (
  store: Store,
  runs: Run[],
  panelId: string,
): Promise<Adjudication[]> => {
  const sets: Adjudication[] = [];
  for (const run of runs) {
    const set = await store.get<Adjudication>(
      "adjudications",
      adjudicationId(run.id, panelId),
    );
    if (set) sets.push(set);
  }
  return sets;
};
