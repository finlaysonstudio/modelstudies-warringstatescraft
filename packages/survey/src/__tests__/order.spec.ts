import { describe, expect, it } from "vitest";

import { balancedOrders, seededShuffle, turnSeed } from "../order";

const LABELS = [
  "strongly agree",
  "agree",
  "neutral",
  "disagree",
  "strongly disagree",
];

describe("seededShuffle", () => {
  it("returns a permutation of the input without mutating it", () => {
    const input = [...LABELS];
    const shuffled = seededShuffle(input, { seed: "any-seed" });
    expect(input).toEqual(LABELS);
    expect([...shuffled].sort()).toEqual([...LABELS].sort());
  });
  it("is deterministic: the same seed always yields the same order", () => {
    const first = seededShuffle(LABELS, { seed: "gss:happy:3" });
    const second = seededShuffle(LABELS, { seed: "gss:happy:3" });
    expect(first).toEqual(second);
  });
  it("varies across seeds", () => {
    const orders = new Set(
      Array.from({ length: 12 }, (_, turn) =>
        seededShuffle(LABELS, { seed: `gss:happy:${turn + 1}` }).join("|"),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
  it("handles empty and single-item arrays", () => {
    expect(seededShuffle([], { seed: "s" })).toEqual([]);
    expect(seededShuffle(["only"], { seed: "s" })).toEqual(["only"]);
  });
});

describe("turnSeed", () => {
  it("composes plan, item, and turn", () => {
    expect(turnSeed({ plan: "gss", item: "happy", turn: 3 })).toBe(
      "gss:happy:3",
    );
  });
});

describe("balancedOrders", () => {
  it("balances a two-option item exactly 6/6 over 12 turns", () => {
    const orders = balancedOrders(["A", "B"], {
      seed: "model-values:w1",
      turns: 12,
    });
    expect(orders).toHaveLength(12);
    const aFirst = orders.filter((order) => order[0] === "A").length;
    expect(aFirst).toBe(6);
    // Sequence is shuffled, not strictly alternating from bank order.
    expect(new Set(orders.map((order) => order.join("|"))).size).toBe(2);
  });
  it("is deterministic in seed and turns", () => {
    const first = balancedOrders(["A", "B"], { seed: "s", turns: 12 });
    const second = balancedOrders(["A", "B"], { seed: "s", turns: 12 });
    expect(first).toEqual(second);
    expect(
      balancedOrders(["A", "B"], { seed: "other", turns: 12 }),
    ).not.toEqual(first);
  });
  it("keeps counts within one of each other when turns is odd", () => {
    const orders = balancedOrders(["A", "B"], { seed: "s", turns: 7 });
    const aFirst = orders.filter((order) => order[0] === "A").length;
    expect([3, 4]).toContain(aFirst);
  });
  it("balances larger option sets across the permutation cycle", () => {
    const orders = balancedOrders(["A", "B", "C"], { seed: "s", turns: 12 });
    const counts = new Map<string, number>();
    for (const order of orders) {
      const key = order.join("|");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6); // all 3! orders appear
    for (const count of counts.values()) expect(count).toBe(2);
  });
  it("falls back to per-turn shuffles above five options", () => {
    const items = ["1", "2", "3", "4", "5", "6", "7"];
    const orders = balancedOrders(items, { seed: "s", turns: 3 });
    expect(orders).toHaveLength(3);
    for (const order of orders) {
      expect([...order].sort()).toEqual([...items].sort());
    }
    expect(balancedOrders(items, { seed: "s", turns: 3 })).toEqual(orders);
  });
  it("handles degenerate inputs", () => {
    expect(balancedOrders(["A", "B"], { seed: "s", turns: 0 })).toEqual([]);
    expect(balancedOrders(["only"], { seed: "s", turns: 2 })).toEqual([
      ["only"],
      ["only"],
    ]);
  });
});
