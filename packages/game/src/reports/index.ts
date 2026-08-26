import { BadRequestError } from "@jaypie/errors";

import type { ReportId, Scenario } from "../types";
import { BASIC_REPORT } from "./basic";
import { LAMPARTH_REPORT } from "./lamparth";
import type { ReportDefinition } from "./types";

/**
 * Reporting definitions. A scenario names the definition its studies build
 * (`Scenario.report`, default `basic`); a study records one and the CLI's
 * `study-report` runs it. Adding a definition: implement `ReportDefinition`,
 * register it here, and add its id to `ReportId` in types.ts.
 */
export const REPORTS: Record<ReportId, ReportDefinition> = {
  basic: BASIC_REPORT as ReportDefinition,
  lamparth: LAMPARTH_REPORT as ReportDefinition,
};

export const getReport = (id: string): ReportDefinition => {
  const report = (REPORTS as Record<string, ReportDefinition>)[id];
  if (!report) throw new BadRequestError(`Unknown report: ${id}`);
  return report;
};

/** the report a scenario's studies build */
export const scenarioReport = (scenario: Scenario): ReportId =>
  scenario.report ?? "basic";

export { BASIC_REPORT } from "./basic";
export type { BasicReport, EscalationGroup } from "./basic";
export {
  LAMPARTH_REPORT,
  LAMPARTH_REFERENCE,
  actionsOf,
  aggressivenessOf,
  comparisonOf,
  consistencyOf,
  dialogWordsOf,
  effectsOf,
  gamesOfRuns,
  groupOf,
  lamparthColumns,
} from "./lamparth";
export type {
  LamparthColumn,
  LamparthComparison,
  LamparthConsistency,
  LamparthEffect,
  LamparthGame,
  LamparthGames,
  LamparthGroup,
  LamparthReference,
  LamparthReport,
} from "./lamparth";
export {
  bootstrapDiff,
  bootstrapStat,
  columnMeans,
  DEFAULT_BOOTSTRAP,
} from "./bootstrap";
export type { BootstrapOptions } from "./bootstrap";
export { armOfRuns, coverageOf, reportBase, studyUsage } from "./types";
export type {
  CellCoverage,
  CellUsage,
  Estimate,
  ReportAdjudication,
  ReportBase,
  ReportDefinition,
  ReportInput,
  StudyUsage,
} from "./types";
