import type { Store } from "@modelstudies/workflows";

import {
  groupUsage,
  usageOfAdjudications,
  usageOfRuns,
  type UsageRow,
  type UsageTotals,
} from "../cost";
import type { Adjudication, ReportId, Run, Scenario, Study } from "../types";

/** a point estimate with its bootstrap 95% interval */
export interface Estimate {
  value: number;
  ci: [number, number];
}

/** how many arms of one cell (scenario × model) are in each state */
export interface CellCoverage {
  scenario: string;
  model: string;
  expected: number;
  complete: number;
  error: number;
  pending: number;
}

/** what one cell's games cost: every call in the arm's runs, whoever made it */
export interface CellUsage {
  scenario: string;
  model: string;
  /** arms with a run */
  games: number;
  totals: UsageTotals;
  /** dollars per game with a run */
  usdPerGame: number;
}

/** the study's spend, by who was called and by what each cell's games cost */
export interface StudyUsage {
  total: UsageTotals;
  /** (role, seat, model) rows across every run the study produced */
  rows: UsageRow[];
  /** every model called, in any role */
  byModel: { model: string; totals: UsageTotals }[];
  cells: CellUsage[];
}

/**
 * A re-scoring the report was built over: the runs in `ReportInput`
 * already carry it (see `applyAdjudications`), so a definition never
 * applies it a second time.
 */
export interface ReportAdjudication {
  /** the panel id the scores are stored under */
  id: string;
  /** the scorings applied */
  sets: Adjudication[];
  /** runs covered */
  runs: number;
  /** runs the study produced */
  of: number;
}

/** fields every report carries, whichever definition built it */
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
  /** bootstrap resamples behind every interval */
  bootstrap: number;
  /**
   * panel id when this report was built over a re-adjudication rather than
   * the panels that played the runs
   */
  adjudication?: string;
  /**
   * the re-adjudication's own reach and spend: runs covered, of the runs
   * the study produced, and what its judges cost. `usage` below stays the
   * study's play cost, which a re-scoring never changes
   */
  adjudicated?: { runs: number; of: number; usage: UsageTotals };
  usage: StudyUsage;
}

export interface ReportInput {
  study: Study;
  scenarios: Scenario[];
  /**
   * every run recorded against the study (roots and branches), already
   * carrying `adjudication`'s scores when one was given
   */
  runs: Run[];
  /**
   * the runs as played, before the overlay. The cost fold reads these, so a
   * re-scoring never re-rates what the games cost; absent means `runs` are
   * the runs as played
   */
  played?: Run[];
  /** the re-scoring the runs were read through, when they were */
  adjudication?: ReportAdjudication;
  store: Store;
  bootstrap?: number;
  seed?: number;
}

export interface ReportDefinition<T extends ReportBase = ReportBase> {
  id: ReportId;
  title: string;
  description: string;
  build: (input: ReportInput) => Promise<T>;
}

export const coverageOf = (study: Study): CellCoverage[] => {
  const cells: CellCoverage[] = [];
  for (const scenario of study.scenarios) {
    for (const model of study.models) {
      const arms = study.arms.filter(
        (arm) => arm.scenario === scenario && arm.model === model,
      );
      cells.push({
        scenario,
        model,
        expected: arms.length,
        complete: arms.filter((arm) => arm.status === "complete").length,
        error: arms.filter((arm) => arm.status === "error").length,
        pending: arms.filter(
          (arm) => arm.status === "pending" || arm.status === "active",
        ).length,
      });
    }
  }
  return cells;
};

/** arm (scenario, model) for each run the study produced, roots and branches */
export const armOfRuns = (
  study: Study,
  runs: Run[],
): Map<string, { scenario: string; model: string; replicate: number }> => {
  const byRoot = new Map(
    study.arms
      .filter((arm) => arm.runId)
      .map((arm) => [arm.runId!, arm] as const),
  );
  const result = new Map<
    string,
    { scenario: string; model: string; replicate: number }
  >();
  for (const run of runs) {
    const arm =
      byRoot.get(run.id) ??
      (run.branch.parent ? byRoot.get(run.branch.parent) : undefined);
    if (arm) result.set(run.id, arm);
  }
  return result;
};

export const studyUsage = (study: Study, runs: Run[]): StudyUsage => {
  const arms = armOfRuns(study, runs);
  const all = usageOfRuns(runs);
  const cells: CellUsage[] = [];
  for (const scenario of study.scenarios) {
    for (const model of study.models) {
      const cellRuns = runs.filter((run) => {
        const arm = arms.get(run.id);
        return arm?.scenario === scenario && arm.model === model;
      });
      const games = study.arms.filter(
        (arm) => arm.scenario === scenario && arm.model === model && arm.runId,
      ).length;
      const totals = usageOfRuns(cellRuns).total;
      cells.push({
        scenario,
        model,
        games,
        totals,
        usdPerGame: games ? Math.round((totals.usd / games) * 1e6) / 1e6 : 0,
      });
    }
  }
  return {
    total: all.total,
    rows: all.rows,
    byModel: groupUsage(all.rows, (row) => row.model).map(
      ({ key, totals }) => ({ model: key, totals }),
    ),
    cells,
  };
};

export const reportBase = (
  input: ReportInput,
  report: ReportId,
  bootstrap: number,
): ReportBase => ({
  // a re-scored report is its own artifact: the study id alone would
  // overwrite var/reports/<studyId>.json with numbers a different panel gave
  id: input.adjudication
    ? `${input.study.id}.${input.adjudication.id}`
    : input.study.id,
  model: "reports",
  report,
  study: input.study.id,
  title: input.study.title,
  createdAt: new Date().toISOString(),
  scenarios: [...input.study.scenarios],
  models: [...input.study.models],
  replicates: input.study.replicates,
  coverage: coverageOf(input.study),
  bootstrap,
  ...(input.adjudication
    ? {
        adjudication: input.adjudication.id,
        adjudicated: {
          runs: input.adjudication.runs,
          of: input.adjudication.of,
          usage: usageOfAdjudications(input.adjudication.sets).total,
        },
      }
    : {}),
  usage: studyUsage(input.study, input.played ?? input.runs),
});
