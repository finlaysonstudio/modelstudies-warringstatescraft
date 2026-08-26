import { randomUUID } from "node:crypto";

import { BadRequestError, NotFoundError } from "@jaypie/errors";
import type { LlmClient, Store } from "@modelstudies/workflows";

import {
  adjudicateRun,
  adjudicationCoverage,
  applyAdjudications,
  createGate,
  loadAdjudications,
  panelIdOf,
  parentOfRun,
  planAdjudication,
} from "./adjudicateRun";
import type { AdjudicateRunResult } from "./adjudicateRun";
import { GameEngine, type GameLog } from "./engine";
import { getReport, scenarioReport } from "./reports";
import type { ReportAdjudication, ReportBase } from "./reports";
import { getScenario } from "./scenarios";
import type {
  Adjudication,
  ElicitOption,
  HumanPlayer,
  Language,
  Naming,
  PanelConfig,
  ReportId,
  Run,
  Study,
  StudyArm,
} from "./types";
import { SCRIPTED_MODEL } from "./types";

/**
 * Studies: replicated games across cells. `planStudy` writes the arm list
 * (scenario × model × replicate), `runStudy` plays every arm that is not
 * complete (so a second call resumes), and `buildStudyReport` runs the
 * study's reporting definition over the runs the arms produced.
 */

export interface PlanStudyOptions {
  id?: string;
  title?: string;
  /** defaults to the scenarios' shared `report`; required when they differ */
  report?: ReportId;
  scenarios: string[];
  models: string[];
  replicates: number;
  seats?: Record<string, string>;
  panel?: Partial<PanelConfig>;
  narrator?: string;
  dialog?: number;
  /** target words per dialog round */
  dialogWords?: number;
  priorities?: boolean;
  /** elicitation every arm plays under (default `auto`) */
  elicit?: ElicitOption;
  /** language every arm is rendered in (default en) */
  language?: Language;
  /** naming every arm is rendered with (default chronicle) */
  naming?: Naming;
  /** pivot applied to every arm's text */
  pivot?: string;
  store: Store;
}

const studyId = () => `study_${randomUUID().slice(0, 8)}`;

/** the default title: `<cell or N cells> × <models> × <replicates>` */
const studyTitle = (
  scenarios: string[],
  models: string[],
  replicates: number,
): string =>
  `${scenarios.length === 1 ? getScenario(scenarios[0]).title : `${scenarios.length} cells`} × ${models.join(", ")} × ${replicates}`;

const armKey = (arm: StudyArm): string =>
  `${arm.scenario} ${arm.model} #${arm.replicate}`;

/** the arms of scenarios × models × replicates, in that order */
const armsOf = (
  scenarios: string[],
  models: string[],
  replicates: number,
): StudyArm[] => {
  const arms: StudyArm[] = [];
  for (const scenario of scenarios) {
    for (const model of models) {
      for (let replicate = 1; replicate <= replicates; replicate++) {
        arms.push({ scenario, model, replicate, status: "pending" });
      }
    }
  }
  return arms;
};

export const planStudy = async (options: PlanStudyOptions): Promise<Study> => {
  if (!options.scenarios.length) {
    throw new BadRequestError("Study needs at least one scenario");
  }
  if (!options.models.length) {
    throw new BadRequestError("Study needs at least one model");
  }
  const replicates = Math.floor(options.replicates);
  if (!(replicates >= 1)) {
    throw new BadRequestError("Study needs at least one replicate");
  }
  // every cell must render under the study's options; render now to fail early
  const scenarios = options.scenarios.map((id) =>
    getScenario(id, {
      language: options.language,
      naming: options.naming,
      pivot: options.pivot,
    }),
  );
  const reports = [...new Set(scenarios.map(scenarioReport))];
  const report = options.report ?? reports[0];
  if (!options.report && reports.length > 1) {
    throw new BadRequestError(
      `Scenarios name different reports (${reports.join(", ")}); pass one explicitly`,
    );
  }
  getReport(report);
  const arms = armsOf(options.scenarios, options.models, replicates);
  const study: Study = {
    id: options.id ?? studyId(),
    model: "studies",
    title:
      options.title ??
      studyTitle(options.scenarios, options.models, replicates),
    createdAt: new Date().toISOString(),
    status: "active",
    report,
    scenarios: [...options.scenarios],
    models: [...options.models],
    replicates,
    ...(options.seats ? { seats: { ...options.seats } } : {}),
    ...(options.panel?.judges?.length || options.panel?.mode
      ? {
          panel: {
            judges: options.panel.judges ?? [],
            mode: options.panel.mode ?? "median",
          },
        }
      : {}),
    ...(options.narrator ? { narrator: options.narrator } : {}),
    ...(options.dialog ? { dialog: options.dialog } : {}),
    ...(options.dialog && options.dialogWords
      ? { dialogWords: options.dialogWords }
      : {}),
    ...(options.priorities === false ? { priorities: false } : {}),
    ...(options.elicit && options.elicit !== "auto"
      ? { elicit: options.elicit }
      : {}),
    ...(options.language && options.language !== "en"
      ? { language: options.language }
      : {}),
    ...(options.naming && options.naming !== "chronicle"
      ? { naming: options.naming }
      : {}),
    ...(options.pivot ? { pivot: options.pivot } : {}),
    arms,
  };
  await options.store.create(study);
  return study;
};

export interface ExtendStudyOptions {
  id: string;
  /** new replicate count; must not be below the study's */
  replicates?: number;
  /** subject models to add; existing ones are kept */
  models?: string[];
  store: Store;
}

/**
 * grow a study in place: raise the replicate count and/or add subject
 * models. Every (scenario, model, replicate) the study lacks is appended as
 * a pending arm, in scenario × model × replicate order after the existing
 * arms; played arms are untouched, so the next `runStudy` plays only the
 * additions. A default title follows the new shape; a custom title stays.
 */
export const extendStudy = async (
  options: ExtendStudyOptions,
): Promise<Study> => {
  const study = await loadStudy(options.store, options.id);
  const replicates =
    options.replicates === undefined
      ? study.replicates
      : Math.floor(options.replicates);
  if (!(replicates >= study.replicates)) {
    throw new BadRequestError(
      `Study ${study.id} has ${study.replicates} replicates; cannot reduce to ${replicates}`,
    );
  }
  const models = [...study.models];
  for (const model of options.models ?? []) {
    if (!models.includes(model)) models.push(model);
  }
  const have = new Set(study.arms.map(armKey));
  const added = armsOf(study.scenarios, models, replicates).filter(
    (arm) => !have.has(armKey(arm)),
  );
  if (!added.length) {
    throw new BadRequestError(
      `Study ${study.id} already has ${replicates} replicates of ${models.join(", ")}`,
    );
  }
  const defaultTitle = studyTitle(
    study.scenarios,
    study.models,
    study.replicates,
  );
  if (study.title === defaultTitle) {
    study.title = studyTitle(study.scenarios, models, replicates);
  }
  study.models = models;
  study.replicates = replicates;
  study.arms.push(...added);
  settle(study);
  await options.store.update(study);
  return study;
};

export interface RunStudyOptions {
  id: string;
  llm: LlmClient;
  store: Store;
  log?: GameLog;
  /** arms played at once (default 2) */
  concurrency?: number;
}

const settle = (study: Study): void => {
  const states = study.arms.map((arm) => arm.status);
  if (states.every((state) => state === "complete")) {
    study.status = "complete";
    delete study.statusDetail;
  } else if (states.some((state) => state === "error")) {
    study.status = "error";
    study.statusDetail = `${states.filter((s) => s === "error").length} arms failed`;
  } else {
    study.status = "active";
    study.statusDetail = `${states.filter((s) => s === "complete").length}/${states.length} arms complete`;
  }
};

export const loadStudy = async (store: Store, id: string): Promise<Study> => {
  const study = await store.get<Study>("studies", id);
  if (!study) throw new NotFoundError(`Unknown study: ${id}`);
  return study;
};

/** briefs a model seat failed to produce, across the run and its branches */
const failedBriefs = (runs: Run[]): number =>
  runs.reduce(
    (count, run) =>
      count +
      run.turns
        .flatMap((turn) => turn.briefs)
        .filter(
          (brief) => brief.error && run.roster[brief.seat] !== SCRIPTED_MODEL,
        ).length,
    0,
  );

/**
 * play every arm that is not complete; returns the settled study. An arm
 * whose run finished with a failed model brief is an error, and the next
 * call plays it again as a fresh run; an arm whose run is still active is
 * resumed.
 */
export const runStudy = async (options: RunStudyOptions): Promise<Study> => {
  const study = await loadStudy(options.store, options.id);
  const pending = study.arms.filter((arm) => arm.status !== "complete");
  const log = options.log;
  log?.debug(
    `[${study.id}] ${pending.length}/${study.arms.length} arms to play`,
  );
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const arm = pending[cursor++];
      const engine = new GameEngine({
        dialog: study.dialog,
        dialogWords: study.dialogWords,
        elicit: study.elicit,
        llm: options.llm,
        log,
        narrator: study.narrator,
        panel: study.panel,
        priorities: study.priorities,
        language: study.language,
        naming: study.naming,
        pivot: study.pivot,
        roster: [arm.model],
        scenario: arm.scenario,
        seats: study.seats,
        store: options.store,
        study: { id: study.id, replicate: arm.replicate },
      });
      arm.status = "active";
      delete arm.statusDetail;
      try {
        const existing = arm.runId
          ? await options.store.get<Run>("runs", arm.runId)
          : undefined;
        const run = await engine.play(
          existing?.status === "active" ? arm.runId : undefined,
        );
        arm.runId = run.id;
        arm.status = run.status;
        if (run.statusDetail) arm.statusDetail = run.statusDetail;
        const failed = failedBriefs(
          await studyRuns(options.store, { ...study, arms: [arm] }),
        );
        if (run.status === "complete" && failed) {
          arm.status = "error";
          arm.statusDetail = `${failed} brief${failed === 1 ? "" : "s"} failed`;
        }
      } catch (error) {
        arm.status = "error";
        arm.statusDetail =
          error instanceof Error ? error.message : String(error);
        log?.error(
          `[${study.id}] ${arm.scenario} ${arm.model} #${arm.replicate}: ${arm.statusDetail}`,
        );
      }
      settle(study);
      await options.store.update(study);
    }
  };
  await Promise.all(
    Array.from(
      {
        length: Math.max(1, Math.min(options.concurrency ?? 2, pending.length)),
      },
      worker,
    ),
  );
  settle(study);
  await options.store.update(study);
  return study;
};

export interface BuildStudyReportOptions {
  id: string;
  store: Store;
  bootstrap?: number;
  seed?: number;
  /** write the report to the store (model "reports") */
  save?: boolean;
  /**
   * build over a re-scoring on record rather than the panels that played
   * the runs (see `adjudicateRun`); the report lands at
   * var/reports/<studyId>.<panelId>.json
   */
  adjudication?: string;
  /** build even when the re-scoring covers only some of the study's runs */
  partial?: boolean;
}

/** every run the study produced: the arms' roots and their branches */
export const studyRuns = async (store: Store, study: Study): Promise<Run[]> => {
  const runs: Run[] = [];
  for (const arm of study.arms) {
    if (!arm.runId) continue;
    const root = await store.get<Run>("runs", arm.runId);
    if (!root) continue;
    runs.push(root);
    for (const childId of root.children) {
      const child = await store.get<Run>("runs", childId);
      if (child) runs.push(child);
    }
  }
  return runs;
};

export const buildStudyReport = async (
  options: BuildStudyReportOptions,
): Promise<ReportBase> => {
  const study = await loadStudy(options.store, options.id);
  const played = await studyRuns(options.store, study);
  let runs = played;
  let adjudication: ReportAdjudication | undefined;
  if (options.adjudication) {
    const sets = await loadAdjudications(
      options.store,
      played,
      options.adjudication,
    );
    const coverage = adjudicationCoverage(played, sets);
    if (coverage.runs === 0) {
      throw new NotFoundError(
        `No scoring "${options.adjudication}" on record for ${study.id}`,
      );
    }
    // a partial overlay reads half one panel and half another, which is the
    // confound the whole exercise removes; it is named, never silent
    if (coverage.runs < coverage.of && !options.partial) {
      throw new BadRequestError(
        `adjudicated: ${coverage.runs} of ${coverage.of} run(s); --partial builds anyway`,
      );
    }
    runs = applyAdjudications(played, sets);
    adjudication = { id: options.adjudication, sets, ...coverage };
  }
  const report = await getReport(study.report).build({
    study,
    scenarios: study.scenarios.map((id) =>
      getScenario(id, {
        language: study.language,
        naming: study.naming,
        pivot: study.pivot,
      }),
    ),
    runs,
    played,
    ...(adjudication ? { adjudication } : {}),
    store: options.store,
    bootstrap: options.bootstrap,
    seed: options.seed,
  });
  if (options.save) await options.store.update(report);
  return report;
};

export interface AdjudicateStudyOptions {
  id: string;
  panel: PanelConfig;
  /** default `panelIdOf(panel)`; `--as` overrides it for a readable name */
  panelId?: string;
  /** answers for HUMAN_MODEL on the panel */
  human?: HumanPlayer;
  llm: LlmClient;
  store: Store;
  force?: boolean;
  /** judge calls in flight, across every (run, turn) pair of the study */
  concurrency?: number;
  log?: GameLog;
}

export interface AdjudicateStudyResult {
  panelId: string;
  adjudications: Adjudication[];
  /** runs the study produced that are complete and have turns */
  runs: number;
  built: number;
  kept: number;
  failed: number;
  calls: number;
}

/** the complete runs of a study, roots before the children that inherit from them */
export const adjudicableRuns = (
  runs: Run[],
): { roots: Run[]; children: Run[] } => {
  const usable = runs.filter(
    (run) => run.status === "complete" && run.turns.length > 0,
  );
  return {
    roots: usable.filter((run) => !run.branch.parent),
    children: usable.filter((run) => Boolean(run.branch.parent)),
  };
};

/**
 * The calls a re-scoring of a study would make, without making any: the
 * turns each run was scored on, less the pre-fork turns a child inherits
 * from its root. Deduping those is not an optimisation — on a study with
 * decision-point branches it is close to half the bill.
 */
export const planStudyAdjudication = async (
  store: Store,
  id: string,
  judges: number,
): Promise<{
  runs: number;
  turns: number;
  inherited: number;
  calls: number;
}> => {
  const study = await loadStudy(store, id);
  const { roots, children } = adjudicableRuns(await studyRuns(store, study));
  let turns = 0;
  let inherited = 0;
  const byRoot = new Map(roots.map((run) => [run.id, run]));
  for (const run of [...roots, ...children]) {
    const parent = run.branch.parent
      ? byRoot.get(run.branch.parent)
      : undefined;
    for (const plan of planAdjudication(
      run,
      parent ? parentOfRun(parent) : undefined,
    )) {
      turns += 1;
      if (plan.inherited) inherited += 1;
    }
  }
  return {
    runs: roots.length + children.length,
    turns,
    inherited,
    calls: (turns - inherited) * judges,
  };
};

/**
 * Re-score every complete run of a study with one panel. Roots first, then
 * the children that copy their pre-fork turns from them; the gate is shared
 * across runs, so the pool is over (run, turn) pairs.
 */
export const adjudicateStudy = async (
  options: AdjudicateStudyOptions,
): Promise<AdjudicateStudyResult> => {
  const study = await loadStudy(options.store, options.id);
  const panelId = options.panelId ?? panelIdOf(options.panel);
  const { roots, children } = adjudicableRuns(
    await studyRuns(options.store, study),
  );
  const gate = createGate(options.concurrency ?? 4);
  const result: AdjudicateStudyResult = {
    panelId,
    adjudications: [],
    runs: roots.length + children.length,
    built: 0,
    kept: 0,
    failed: 0,
    calls: 0,
  };
  const byRun = new Map<string, Adjudication>();
  const score = async (run: Run, parent?: Adjudication) => {
    try {
      const outcome: AdjudicateRunResult = await adjudicateRun({
        ...(options.human ? { human: options.human } : {}),
        run,
        ...(parent ? { parent } : {}),
        panel: options.panel,
        panelId,
        llm: options.llm,
        store: options.store,
        force: options.force ?? false,
        gate,
        ...(options.log ? { log: options.log } : {}),
      });
      byRun.set(run.id, outcome.adjudication);
      result.adjudications.push(outcome.adjudication);
      result.calls += outcome.calls;
      if (outcome.built) result.built += 1;
      else result.kept += 1;
      options.log?.trace(
        `[${study.id}] ${outcome.built ? "→" : "="} ${outcome.adjudication.id}` +
          ` (${outcome.adjudication.turns.length} turn(s), ${outcome.calls} call(s))`,
      );
    } catch (error) {
      result.failed += 1;
      options.log?.error(
        `[${study.id}] ${run.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  await Promise.all(roots.map((run) => score(run)));
  await Promise.all(
    children.map((run) =>
      score(run, run.branch.parent ? byRun.get(run.branch.parent) : undefined),
    ),
  );
  return result;
};
