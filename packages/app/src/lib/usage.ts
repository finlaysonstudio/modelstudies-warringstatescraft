// Browser mirror of packages/game/src/cost.ts: the same folds over the same
// run shape, so a page can sum a run's calls without a node import. Keep the
// two in step.
import {
  HUMAN_MODEL,
  SCRIPTED_MODEL,
  type Run,
  type RunUsage,
  type Usage,
  type UsageItem,
  type UsageRole,
  type UsageRow,
  type UsageTotals,
} from "./types";

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

const addItem = (totals: UsageTotals, item: UsageItem): UsageTotals => {
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

/** the calls one run made itself (inherited turns excluded) */
export const usageOf = (run: Run): RunUsage => {
  const fold = new RowFold();
  const forkTurn = run.branch?.point?.turn;
  for (const turn of run.turns ?? []) {
    const inherited = forkTurn !== undefined && turn.index <= forkTurn;
    if (!inherited) {
      for (const brief of turn.briefs ?? []) {
        if (brief.model === HUMAN_MODEL || brief.model === SCRIPTED_MODEL) {
          continue;
        }
        fold.add("seat", brief.seat, brief.model, brief.usage);
      }
    }
    const adjudication = turn.adjudication;
    if (!adjudication) continue;
    if (forkTurn !== undefined && turn.index < forkTurn) continue;
    for (const verdict of adjudication.panel ?? []) {
      fold.add("judge", null, verdict.model, verdict.usage);
    }
    if (adjudication.narratorUsage?.length) {
      const model =
        run.narrator ?? adjudication.narratorUsage[0].model ?? "unknown";
      fold.add("narrator", null, model, adjudication.narratorUsage);
    }
  }
  for (const debrief of run.debriefs ?? []) {
    fold.add("debrief", debrief.seat, debrief.model, debrief.usage);
  }
  return fold.result();
};

/** the calls across several runs, each counted once */
export const usageOfRuns = (runs: Run[]): RunUsage => {
  const fold = new RowFold();
  for (const run of runs) {
    for (const row of usageOf(run).rows) fold.addRow(row);
  }
  return fold.result();
};

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

export const formatUsd = (value: number): string =>
  value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`;

export const formatTokens = (value: number): string =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(2)}M`
    : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}k`
      : String(value);
