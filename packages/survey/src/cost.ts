/**
 * Usage, cost, and latency folds over sittings. Every answer and probe call
 * stamps its usage on the artifact it produced (`InterviewItemResponse.usage`,
 * `ProbeEntity.usage`, one entry per repetition) and the wall-clock
 * milliseconds the sitting timed around the call (`InterviewItemResponse.ms`,
 * `ProbeEntity.ms`, index-aligned with `values`; retries and backoff the
 * client absorbed are inside the figure, since that is the time the call
 * took to land). These folds sum them by role and model. Dollars are the
 * `usd` each item carried at call time, so a fold never needs a price table
 * and never re-rates history. Records older than usage stamping fold as
 * calls with no usage at all: they are not counted, so a total over them
 * understates and says so in `unpriced` only where a call reported tokens
 * without a price. Records older than latency stamping carry no `ms` and
 * count in no latency figure; `interview-verify --rebuild` fills `ms` from
 * the journal, which has always carried it.
 */
import type { LlmUsage, Store, UsageTotals } from "@modelstudies/workflows";
import { addItem, addTotals, emptyTotals } from "@modelstudies/workflows";

import type { InterviewEntity, ProbeEntity } from "./interview";
import { PROBE_MODEL } from "./interview";

export type InterviewUsageRole = "answer" | "probe";

/** Wall-clock milliseconds over timed calls; mergeable (mean = ms / calls). */
export interface LatencyTotals {
  /** calls that carried a wall-clock time */
  calls: number;
  /** milliseconds summed over them */
  ms: number;
  maxMs: number;
}

export const emptyLatency = (): LatencyTotals => ({
  calls: 0,
  ms: 0,
  maxMs: 0,
});

export const addMs = (
  into: LatencyTotals,
  ms: number | null | undefined,
): LatencyTotals => {
  if (typeof ms !== "number") return into;
  into.calls += 1;
  into.ms += ms;
  if (ms > into.maxMs) into.maxMs = ms;
  return into;
};

export const addLatency = (
  into: LatencyTotals,
  from: LatencyTotals,
): LatencyTotals => {
  into.calls += from.calls;
  into.ms += from.ms;
  if (from.maxMs > into.maxMs) into.maxMs = from.maxMs;
  return into;
};

/** mean milliseconds per timed call; null when nothing was timed */
export const meanMs = (latency: LatencyTotals): number | null =>
  latency.calls ? Math.round(latency.ms / latency.calls) : null;

export interface InterviewUsageRow extends UsageTotals {
  role: InterviewUsageRole;
  model: string;
  latency: LatencyTotals;
}

export interface InterviewUsage {
  total: UsageTotals;
  /** one row per (role, model), answer before probe */
  rows: InterviewUsageRow[];
  /** wall clock over every timed call in `rows` */
  latency: LatencyTotals;
}

class RowFold {
  private readonly rows = new Map<string, InterviewUsageRow>();

  add(
    role: InterviewUsageRole,
    model: string,
    usage: LlmUsage | null | undefined,
    ms?: number | null,
  ): void {
    if (!usage?.length && typeof ms !== "number") return;
    const key = `${role} ${model}`;
    let row = this.rows.get(key);
    if (!row) {
      row = { role, model, ...emptyTotals(), latency: emptyLatency() };
      this.rows.set(key, row);
    }
    for (const item of usage ?? []) addItem(row, item);
    addMs(row.latency, ms);
  }

  addRow(row: InterviewUsageRow): void {
    const key = `${row.role} ${row.model}`;
    const existing = this.rows.get(key);
    if (existing) {
      addTotals(existing, row);
      addLatency(existing.latency, row.latency);
    } else {
      this.rows.set(key, { ...row, latency: { ...row.latency } });
    }
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
    const latency = emptyLatency();
    for (const row of rows) {
      addTotals(total, row);
      addLatency(latency, row.latency);
    }
    return { total, rows, latency };
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
    const usage = response.usage ?? [];
    const ms = response.ms ?? [];
    for (let rep = 0; rep < Math.max(usage.length, ms.length); rep += 1) {
      fold.add("answer", model, usage[rep], ms[rep]);
    }
  }
  for (const probe of probes) {
    const usage = probe.usage ?? [];
    const ms = probe.ms ?? [];
    for (let rep = 0; rep < Math.max(usage.length, ms.length); rep += 1) {
      fold.add("probe", model, usage[rep], ms[rep]);
    }
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
): { key: K; totals: UsageTotals; latency: LatencyTotals }[] => {
  const groups = new Map<K, { totals: UsageTotals; latency: LatencyTotals }>();
  for (const row of rows) {
    const key = keyOf(row);
    const group = groups.get(key) ?? {
      totals: emptyTotals(),
      latency: emptyLatency(),
    };
    addTotals(group.totals, row);
    addLatency(group.latency, row.latency);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, group]) => ({ key, ...group }));
};

/** Latency of one role's calls from the raw samples: nearest-rank quantiles. */
export interface LatencyQuantiles {
  calls: number;
  meanMs: number;
  medianMs: number;
  p90Ms: number;
  maxMs: number;
}

export const latencyQuantiles = (
  samples: (number | null | undefined)[],
): LatencyQuantiles | undefined => {
  const sorted = samples
    .filter((ms): ms is number => typeof ms === "number")
    .sort((a, b) => a - b);
  if (!sorted.length) return undefined;
  const rank = (p: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]!;
  return {
    calls: sorted.length,
    meanMs: Math.round(sorted.reduce((sum, ms) => sum + ms, 0) / sorted.length),
    medianMs: rank(0.5),
    p90Ms: rank(0.9),
    maxMs: sorted[sorted.length - 1]!,
  };
};

export interface InterviewLatencyRow extends LatencyQuantiles {
  role: InterviewUsageRole;
  model: string;
}

/** One sitting's latency by role, from every timed call it holds. */
export const latencyOfInterview = (options: {
  entity: InterviewEntity;
  probes?: ProbeEntity[];
}): InterviewLatencyRow[] => {
  const { entity, probes = [] } = options;
  const model = respondentOf(entity);
  const rows: InterviewLatencyRow[] = [];
  const answer = latencyQuantiles(
    Object.values(entity.responses ?? {}).flatMap(
      (response) => response.ms ?? [],
    ),
  );
  if (answer) rows.push({ role: "answer", model, ...answer });
  const probe = latencyQuantiles(probes.flatMap((entry) => entry.ms ?? []));
  if (probe) rows.push({ role: "probe", model, ...probe });
  return rows;
};
