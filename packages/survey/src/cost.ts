/**
 * Usage and cost folds over sittings. Every answer and probe call stamps its
 * usage on the artifact it produced (`InterviewItemResponse.usage`,
 * `ProbeEntity.usage`, one entry per repetition); these folds sum them by
 * role and model. Dollars are the `usd` each item carried at call time, so a
 * fold never needs a price table and never re-rates history. Records older
 * than usage stamping fold as calls with no usage at all: they are not
 * counted, so a total over them understates and says so in `unpriced` only
 * where a call reported tokens without a price.
 */
import type { LlmUsage, Store, UsageTotals } from "@modelstudies/workflows";
import { addItem, addTotals, emptyTotals } from "@modelstudies/workflows";

import type { InterviewEntity, ProbeEntity } from "./interview";
import { PROBE_MODEL } from "./interview";

export type InterviewUsageRole = "answer" | "probe";

export interface InterviewUsageRow extends UsageTotals {
  role: InterviewUsageRole;
  model: string;
}

export interface InterviewUsage {
  total: UsageTotals;
  /** one row per (role, model), answer before probe */
  rows: InterviewUsageRow[];
}

class RowFold {
  private readonly rows = new Map<string, InterviewUsageRow>();

  add(
    role: InterviewUsageRole,
    model: string,
    usage: LlmUsage | null | undefined,
  ): void {
    if (!usage?.length) return;
    const key = `${role} ${model}`;
    let row = this.rows.get(key);
    if (!row) {
      row = { role, model, ...emptyTotals() };
      this.rows.set(key, row);
    }
    for (const item of usage) addItem(row, item);
  }

  addRow(row: InterviewUsageRow): void {
    const key = `${row.role} ${row.model}`;
    const existing = this.rows.get(key);
    if (existing) addTotals(existing, row);
    else this.rows.set(key, { ...row });
  }

  result(): InterviewUsage {
    const rows = [...this.rows.values()].sort((a, b) =>
      a.role === b.role
        ? a.model.localeCompare(b.model)
        : a.role === "answer"
          ? -1
          : 1,
    );
    const total = emptyTotals();
    for (const row of rows) addTotals(total, row);
    return { total, rows };
  }
}

export const respondentOf = (entity: InterviewEntity): string =>
  entity.respondentModel ?? entity.respondent ?? "unknown";

/** The calls one sitting made: its answers and, when given, its probes. */
export const usageOfInterview = (options: {
  entity: InterviewEntity;
  probes?: ProbeEntity[];
}): InterviewUsage => {
  const { entity, probes = [] } = options;
  const model = respondentOf(entity);
  const fold = new RowFold();
  for (const response of Object.values(entity.responses ?? {})) {
    for (const usage of response.usage ?? []) fold.add("answer", model, usage);
  }
  for (const probe of probes) {
    for (const usage of probe.usage ?? []) fold.add("probe", model, usage);
  }
  return fold.result();
};

/** A sitting's usage with its probes loaded from the store. */
export const interviewUsage = async (options: {
  store: Store;
  entity: InterviewEntity;
}): Promise<InterviewUsage> => {
  const { store, entity } = options;
  const probes = await store.queryByScope<ProbeEntity>(PROBE_MODEL, entity.id);
  return usageOfInterview({ entity, probes });
};

/** Several sittings' usage summed, rows merged by (role, model). */
export const usageOfInterviews = (list: InterviewUsage[]): InterviewUsage => {
  const fold = new RowFold();
  for (const usage of list) {
    for (const row of usage.rows) fold.addRow(row);
  }
  return fold.result();
};

/** Rows regrouped by any key (model, role). */
export const groupInterviewUsage = <K extends string>(
  rows: InterviewUsageRow[],
  keyOf: (row: InterviewUsageRow) => K,
): { key: K; totals: UsageTotals }[] => {
  const groups = new Map<K, UsageTotals>();
  for (const row of rows) {
    const key = keyOf(row);
    const totals = groups.get(key) ?? emptyTotals();
    groups.set(key, addTotals(totals, row));
  }
  return [...groups.entries()].map(([key, totals]) => ({ key, totals }));
};
