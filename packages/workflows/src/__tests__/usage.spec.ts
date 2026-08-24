import { describe, expect, it } from "vitest";

import { addItem, addTotals, emptyTotals, roundUsd } from "../llm/usage";

describe("usage totals", () => {
  it("adds items, counting unpriced ones without dollars", () => {
    const totals = emptyTotals();
    addItem(totals, {
      input: 10,
      output: 5,
      reasoning: 1,
      total: 16,
      usd: 0.0000015,
    });
    addItem(totals, {
      input: 10,
      output: 5,
      reasoning: 0,
      total: 15,
      cacheRead: 4,
    });
    expect(totals.calls).toBe(2);
    expect(totals.input).toBe(20);
    expect(totals.cacheRead).toBe(4);
    expect(totals.usd).toBe(0.000002);
    expect(totals.unpriced).toBe(1);
    const sum = addTotals(emptyTotals(), totals);
    addTotals(sum, totals);
    expect(sum.calls).toBe(4);
    expect(sum.usd).toBe(0.000004);
    expect(roundUsd(1.23456789)).toBe(1.234568);
  });
});
