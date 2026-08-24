import { describe, expect, it } from "vitest";

import {
  discardReps,
  foldJournal,
  meanOf,
  rawOf,
  type SittingEvent,
} from "../journal";

const at = "2026-08-23T00:00:00Z";
const turn = (
  item: string,
  rep: number,
  code: number | null,
  extra: Record<string, unknown> = {},
): SittingEvent =>
  ({
    t: "turn",
    at,
    item,
    rep,
    order: ["A", "B"],
    content: { response: code === 1 ? "A" : code === 2 ? "B" : "meh" },
    code,
    ms: 10,
    promptSha1: "x",
    ...extra,
  }) as SittingEvent;
const probe = (
  item: string,
  rep: number,
  text: string | null,
): SittingEvent => ({
  t: "probe",
  at,
  item,
  rep,
  query: "Why?",
  text,
  ms: 5,
  replay: false,
});

describe("foldJournal", () => {
  it("folds turns and probes by (item, rep) and sums priced usage", () => {
    const fold = foldJournal([
      { t: "start", at, plan: "p", model: "m", repetitions: 2, items: 1 },
      turn("f1", 0, 1, {
        usage: [{ input: 10, output: 2, reasoning: 0, total: 12, usd: 0.001 }],
      }),
      probe("f1", 0, "Because."),
      turn("f1", 1, null, {
        usage: [{ input: 10, output: 2, reasoning: 0, total: 12 }],
      }),
      { t: "checkpoint", at, answered: 1, declined: 0, usd: 0.001 },
      { t: "stop", at, reason: "complete" },
    ]);
    expect(fold.items.f1).toEqual({
      values: [1, null],
      orders: [
        ["A", "B"],
        ["A", "B"],
      ],
      majority: [null, null],
      contents: [{ response: "A" }, { response: "meh" }],
      usage: [
        [{ input: 10, output: 2, reasoning: 0, total: 12, usd: 0.001 }],
        [{ input: 10, output: 2, reasoning: 0, total: 12 }],
      ],
      ms: [10, 10],
      explanations: ["Because.", undefined],
      probeUsage: [null, null],
      probeMs: [5, null],
      query: "Why?",
    });
    expect(fold.calls).toBe(3);
    expect(fold.usd).toBeCloseTo(0.001, 9);
    expect(fold.unpriced).toBe(2);
    expect(fold.start?.model).toBe("m");
    expect(fold.stop?.reason).toBe("complete");
  });

  it("keeps the first write of a duplicated rep and refuses a hole", () => {
    const fold = foldJournal([turn("f1", 0, 1), turn("f1", 0, 2)]);
    expect(fold.items.f1!.values).toEqual([1]);
    expect(() => foldJournal([turn("f1", 0, 1), turn("f1", 2, 1)])).toThrow(
      /has 1 turns and the journal records rep 2/,
    );
    expect(() => foldJournal([probe("f1", 0, "x")])).toThrow(
      /probed before it is answered/,
    );
  });

  it("lets a backfill fill a null probe but not overwrite text", () => {
    const fold = foldJournal([
      turn("f1", 0, 1),
      probe("f1", 0, null),
      probe("f1", 0, "Later."),
      probe("f1", 0, "Even later."),
    ]);
    expect(fold.items.f1!.explanations).toEqual(["Later."]);
  });

  it("discards named reps and closes the rest up, then accepts the next rep", () => {
    const fold = foldJournal([
      turn("f1", 0, 1),
      turn("f1", 1, null),
      turn("f1", 2, 2),
      { t: "discard", at, item: "f1", reps: [1] },
      turn("f1", 2, 1),
    ]);
    expect(fold.items.f1!.values).toEqual([1, 2, 1]);
    const item = fold.items.f1!;
    discardReps(item, [0, 2]);
    expect(item.values).toEqual([2]);
    expect(item.contents).toEqual([{ response: "B" }]);
  });

  it("a resume or start clears a prior stop", () => {
    const fold = foldJournal([
      turn("f1", 0, 1),
      { t: "stop", at, reason: "interrupt", message: "f1 rep 1" },
      { t: "resume", at, repetitions: 2, asked: 1, backfill: 0 },
      turn("f1", 1, 1),
    ]);
    expect(fold.stop).toBeUndefined();
  });
});

describe("helpers", () => {
  it("mean rounds to two places and raw keeps the response string", () => {
    expect(meanOf([1, 2, 2])).toBe(1.67);
    expect(meanOf([null])).toBeNull();
    expect(rawOf({ response: "I decline" })).toBe("I decline");
    expect(rawOf({ choice: "x" })).toBe('{"choice":"x"}');
  });
});
