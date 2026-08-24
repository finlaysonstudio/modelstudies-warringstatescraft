/**
 * Usage totals: the sum of usage items over any set of model calls. Every
 * package that folds cost (the game over runs, the survey over sittings)
 * adds the same items into the same totals, so the type and its adders live
 * here beside the seam that produces the items. Dollars are the `usd` each
 * item carried at call time; a fold never re-rates history.
 */
import type { LlmUsageItem } from "./client";

export interface UsageTotals {
  /** model calls (a retried call that landed counts once per landed item) */
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

/** dollars to the micro-dollar, the resolution `priceOf` stamps */
export const roundUsd = (usd: number): number => Math.round(usd * 1e6) / 1e6;

export const addItem = (
  totals: UsageTotals,
  item: LlmUsageItem,
): UsageTotals => {
  totals.calls += 1;
  totals.input += item.input;
  totals.output += item.output;
  totals.reasoning += item.reasoning;
  totals.cacheRead += item.cacheRead ?? 0;
  totals.cacheWrite += item.cacheWrite ?? 0;
  totals.total += item.total;
  if (item.usd === undefined) totals.unpriced += 1;
  else totals.usd = roundUsd(totals.usd + item.usd);
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
  into.usd = roundUsd(into.usd + from.usd);
  into.unpriced += from.unpriced;
  return into;
};
