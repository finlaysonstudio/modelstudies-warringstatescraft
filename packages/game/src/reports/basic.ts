import type { Run } from "../types";
import {
  bootstrapStat,
  DEFAULT_BOOTSTRAP,
  mean,
  type BootstrapOptions,
} from "./bootstrap";
import {
  armOfRuns,
  reportBase,
  type Estimate,
  type ReportBase,
  type ReportDefinition,
  type ReportInput,
} from "./types";

/**
 * The basic report: escalation across replicates. Every timeline a study
 * arm produced (the root, or its decision-point branches) contributes its
 * adjudicated escalation series; groups are cells (scenario × model) and
 * models across all cells.
 */

export interface EscalationGroup {
  scenario: string | null;
  model: string;
  /** games (arms) complete */
  games: number;
  /** timelines with at least one adjudicated turn */
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

const series = (run: Run): number[] =>
  run.turns
    .filter((turn) => turn.adjudication)
    .map((turn) => turn.adjudication!.escalation);

export { armOfRuns } from "./types";

const estimate = (values: number[], options: BootstrapOptions): Estimate => {
  const { value, ci } = bootstrapStat(
    values.map((v) => [v]),
    (rows) => [mean(rows.map((row) => row[0]))],
    options,
  );
  return { value: value[0], ci: ci[0] };
};

const group = (
  scenario: string | null,
  model: string,
  games: number,
  timelines: Run[],
  options: BootstrapOptions,
): EscalationGroup => {
  const scored = timelines.map(series).filter((s) => s.length);
  const width = Math.max(0, ...scored.map((s) => s.length));
  const indexes = [
    ...new Set(
      timelines.flatMap((run) =>
        run.turns.filter((turn) => turn.adjudication).map((t) => t.index),
      ),
    ),
  ].sort((a, b) => a - b);
  const turns: EscalationGroup["turns"] = [];
  for (let index = 0; index < width; index++) {
    const at = scored.filter((s) => s.length > index).map((s) => s[index]);
    const turnIndex = indexes[index] ?? index + 1;
    turns.push({
      index: turnIndex,
      escalation: estimate(at, {
        ...options,
        seed: (options.seed ?? 42) + index,
      }),
    });
  }
  return {
    scenario,
    model,
    games,
    timelines: scored.length,
    turns,
    peak: estimate(
      scored.map((s) => Math.max(...s)),
      { ...options, seed: (options.seed ?? 42) + 101 },
    ),
    final: estimate(
      scored.map((s) => s[s.length - 1]),
      { ...options, seed: (options.seed ?? 42) + 202 },
    ),
  };
};

export const BASIC_REPORT: ReportDefinition<BasicReport> = {
  id: "basic",
  title: "Escalation across replicates",
  description:
    "Mean escalation per turn, peak, and final level for every cell and model, with bootstrap intervals over the study's timelines.",
  async build(input: ReportInput): Promise<BasicReport> {
    const bootstrap = input.bootstrap ?? DEFAULT_BOOTSTRAP;
    const options: BootstrapOptions = { bootstrap, seed: input.seed };
    const arms = armOfRuns(input.study, input.runs);
    const cells: EscalationGroup[] = [];
    for (const scenario of input.study.scenarios) {
      for (const model of input.study.models) {
        const games = input.study.arms.filter(
          (arm) =>
            arm.scenario === scenario &&
            arm.model === model &&
            arm.status === "complete",
        ).length;
        const timelines = input.runs.filter((run) => {
          const arm = arms.get(run.id);
          return arm?.scenario === scenario && arm.model === model;
        });
        cells.push(group(scenario, model, games, timelines, options));
      }
    }
    const byModel = input.study.models.map((model) =>
      group(
        null,
        model,
        input.study.arms.filter(
          (arm) => arm.model === model && arm.status === "complete",
        ).length,
        input.runs.filter((run) => arms.get(run.id)?.model === model),
        options,
      ),
    );
    return {
      ...reportBase(input, "basic", bootstrap),
      report: "basic",
      cells,
      byModel,
    };
  },
};
