/**
 * Usage and cost folds over run records. Every model call the engine makes
 * stamps its usage on the artifact it produced (brief, verdict, narrative,
 * debrief); these folds sum them by role, seat, and model. Dollars are the
 * `usd` each item carried at call time (list price in force then), so a fold
 * never needs a price table and never re-rates history.
 *
 * A branch inherits turns from its parent; `usageOf` counts only the calls a
 * run made itself, so folding a tree (root and every descendant) counts each
 * call once.
 */
import { NotFoundError } from "@jaypie/errors";
import type { Store } from "@modelstudies/workflows";

import type { Run, Usage, UsageItem } from "./types";
import { HUMAN_MODEL, SCRIPTED_MODEL } from "./types";

export type UsageRole = "seat" | "judge" | "narrator" | "debrief";

export const USAGE_ROLES: UsageRole[] = [
  "seat",
  "judge",
  "narrator",
  "debrief",
];

export interface UsageTotals {
  /** model calls (dialog rounds count one each) */
  calls: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
  /** dollars across priced calls */
  usd: number;
  /** calls with no price at call time (their tokens still count above) */
  unpriced: number;
}

export interface UsageRow extends UsageTotals {
  role: UsageRole;
  /** seat id for `seat` and `debrief` rows, null for the panel and narrator */
  seat: string | null;
  model: string;
}

export interface RunUsage {
  total: UsageTotals;
  /** one row per (role, seat, model), in first-seen order */
  rows: UsageRow[];
}

export const emptyTotals = (): UsageTotals => ({
  calls: 0,
  input: 0,
  output: 0,
  reasoning: 0,
  cacheRead: 0,
  cacheWrite: 0,
  total: 0,
  usd: 0,
  unpriced: 0,
});

const round = (usd: number): number => Math.round(usd * 1e6) / 1e6;

export const addItem = (totals: UsageTotals, item: UsageItem): UsageTotals => {
  totals.calls += 1;
  totals.input += item.input;
  totals.output += item.output;
  totals.reasoning += item.reasoning;
  totals.cacheRead += item.cacheRead ?? 0;
  totals.cacheWrite += item.cacheWrite ?? 0;
  totals.total += item.total;
  if (item.usd === undefined) totals.unpriced += 1;
  else totals.usd = round(totals.usd + item.usd);
  return totals;
};

export const addTotals = (
  into: UsageTotals,
  from: UsageTotals,
): UsageTotals => {
  into.calls += from.calls;
  into.input += from.input;
  into.output += from.output;
  into.reasoning += from.reasoning;
  into.cacheRead += from.cacheRead;
  into.cacheWrite += from.cacheWrite;
  into.total += from.total;
  into.usd = round(into.usd + from.usd);
  into.unpriced += from.unpriced;
  return into;
};

const rowKey = (role: UsageRole, seat: string | null, model: string) =>
  `${role} ${seat ?? ""} ${model}`;

/** Accumulates rows keyed by (role, seat, model). */
class RowFold {
  private readonly rows = new Map<string, UsageRow>();

  add(
    role: UsageRole,
    seat: string | null,
    model: string,
    usage: Usage | undefined,
  ): void {
    if (!usage?.length) return;
    const key = rowKey(role, seat, model);
    let row = this.rows.get(key);
    if (!row) {
      row = { role, seat, model, ...emptyTotals() };
      this.rows.set(key, row);
    }
    for (const item of usage) addItem(row, item);
  }

  addRow(row: UsageRow): void {
    const key = rowKey(row.role, row.seat, row.model);
    const existing = this.rows.get(key);
    if (existing) addTotals(existing, row);
    else this.rows.set(key, { ...row });
  }

  result(): RunUsage {
    const rows = [...this.rows.values()];
    const total = emptyTotals();
    for (const row of rows) addTotals(total, row);
    return { total, rows };
  }
}

/**
 * The calls one run made itself. A decision-point branch inherits every turn
 * up to its fork from the parent (briefs included), and its seeded turn's
 * briefs were made in the parent too; only that turn's adjudication and the
 * turns after it are the branch's own.
 */
export const usageOf = (run: Run): RunUsage => {
  const fold = new RowFold();
  const forkTurn = run.branch.point?.turn;
  for (const turn of run.turns) {
    const inherited = forkTurn !== undefined && turn.index <= forkTurn;
    if (!inherited) {
      for (const brief of turn.briefs) {
        if (brief.model === HUMAN_MODEL || brief.model === SCRIPTED_MODEL) {
          continue;
        }
        fold.add("seat", brief.seat, brief.model, brief.usage);
      }
    }
    const adjudication = turn.adjudication;
    if (!adjudication) continue;
    if (forkTurn !== undefined && turn.index < forkTurn) continue;
    for (const verdict of adjudication.panel) {
      fold.add("judge", null, verdict.model, verdict.usage);
    }
    if (adjudication.narratorUsage?.length) {
      const model =
        run.narrator ?? adjudication.narratorUsage[0].model ?? "unknown";
      fold.add("narrator", null, model, adjudication.narratorUsage);
    }
  }
  for (const debrief of run.debriefs) {
    fold.add("debrief", debrief.seat, debrief.model, debrief.usage);
  }
  return fold.result();
};

/** The calls across several runs (a tree, a study), each counted once. */
export const usageOfRuns = (runs: Run[]): RunUsage => {
  const fold = new RowFold();
  for (const run of runs) {
    for (const row of usageOf(run).rows) fold.addRow(row);
  }
  return fold.result();
};

/** Rows regrouped by a key (model, seat, role, or any combination). */
export const groupUsage = <K extends string>(
  rows: UsageRow[],
  keyOf: (row: UsageRow) => K,
): { key: K; totals: UsageTotals }[] => {
  const groups = new Map<K, UsageTotals>();
  for (const row of rows) {
    const key = keyOf(row);
    const totals = groups.get(key) ?? emptyTotals();
    groups.set(key, addTotals(totals, row));
  }
  return [...groups.entries()].map(([key, totals]) => ({ key, totals }));
};

/** A run and every descendant, depth first, in stored child order. */
export const loadTree = async (
  store: Store,
  rootId: string,
): Promise<Run[]> => {
  const root = await store.get<Run>("runs", rootId);
  if (!root) throw new NotFoundError(`Unknown run: ${rootId}`);
  const runs: Run[] = [root];
  for (const childId of root.children) {
    runs.push(...(await loadTree(store, childId)));
  }
  return runs;
};

export interface UsageOfTreeOptions {
  rootId: string;
  store: Store;
}

/** The calls across a run and every descendant, each counted once. */
export const usageOfTree = async ({
  rootId,
  store,
}: UsageOfTreeOptions): Promise<RunUsage & { runs: number }> => {
  const runs = await loadTree(store, rootId);
  return { ...usageOfRuns(runs), runs: runs.length };
};
