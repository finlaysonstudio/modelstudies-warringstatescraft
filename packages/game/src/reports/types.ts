import type { Store } from "@modelstudies/workflows";

import type { ReportId, Run, Scenario, Study } from "../types";

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
}

export interface ReportInput {
  study: Study;
  scenarios: Scenario[];
  /** every run recorded against the study (roots and branches) */
  runs: Run[];
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

export const reportBase = (
  input: ReportInput,
  report: ReportId,
  bootstrap: number,
): ReportBase => ({
  id: input.study.id,
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
});
