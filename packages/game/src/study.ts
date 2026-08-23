import { randomUUID } from "node:crypto";

import { BadRequestError, NotFoundError } from "@jaypie/errors";
import type { LlmClient, Store } from "@modelstudies/workflows";

import { GameEngine, type GameLog } from "./engine";
import { getReport, scenarioReport } from "./reports";
import type { ReportBase } from "./reports";
import { getScenario } from "./scenarios";
import type { PanelConfig, ReportId, Run, Study, StudyArm } from "./types";
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
  priorities?: boolean;
  store: Store;
}

const studyId = () => `study_${randomUUID().slice(0, 8)}`;

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
  const scenarios = options.scenarios.map(getScenario);
  const reports = [...new Set(scenarios.map(scenarioReport))];
  const report = options.report ?? reports[0];
  if (!options.report && reports.length > 1) {
    throw new BadRequestError(
      `Scenarios name different reports (${reports.join(", ")}); pass one explicitly`,
    );
  }
  getReport(report);
  const arms: StudyArm[] = [];
  for (const scenario of options.scenarios) {
    for (const model of options.models) {
      for (let replicate = 1; replicate <= replicates; replicate++) {
        arms.push({ scenario, model, replicate, status: "pending" });
      }
    }
  }
  const study: Study = {
    id: options.id ?? studyId(),
    model: "studies",
    title:
      options.title ??
      `${scenarios.length === 1 ? scenarios[0].title : `${scenarios.length} cells`} × ${options.models.join(", ")} × ${replicates}`,
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
    ...(options.priorities === false ? { priorities: false } : {}),
    arms,
  };
  await options.store.create(study);
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
        llm: options.llm,
        log,
        narrator: study.narrator,
        panel: study.panel,
        priorities: study.priorities,
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
  const report = await getReport(study.report).build({
    study,
    scenarios: study.scenarios.map(getScenario),
    runs: await studyRuns(options.store, study),
    store: options.store,
    bootstrap: options.bootstrap,
    seed: options.seed,
  });
  if (options.save) await options.store.update(report);
  return report;
};
