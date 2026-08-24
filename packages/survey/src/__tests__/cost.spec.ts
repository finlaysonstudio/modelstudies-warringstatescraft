import { describe, expect, it } from "vitest";

import {
  groupInterviewUsage,
  latencyOfInterview,
  latencyQuantiles,
  meanMs,
  usageOfInterview,
  usageOfInterviews,
} from "../cost";
import type { InterviewEntity, ProbeEntity } from "../interview";

const call = (usd?: number) => [
  {
    input: 100,
    output: 10,
    reasoning: 0,
    total: 110,
    ...(usd !== undefined ? { usd } : {}),
  },
];

const sitting = (id: string, model: string): InterviewEntity => ({
  id,
  model: "interview",
  scope: "apex",
  plan: "crisis",
  respondent: model,
  respondentModel: model,
  responses: {
    e1: {
      name: "e1",
      value: 1,
      values: [1, 1],
      usage: [call(0.001), call(0.002)],
      ms: [1000, 3000],
    },
    // an older item with no usage or latency stamped
    e2: { name: "e2", value: 2, values: [2] },
    // a call that reported tokens without a price; the second turn timed but
    // reported no usage
    e3: {
      name: "e3",
      value: 1,
      values: [1, null],
      usage: [call(), null],
      ms: [2000, 6000],
    },
  },
  answered: 3,
  declined: 0,
  remaining: 0,
  status: "complete",
  startedAt: "2026-08-23T00:00:00.000Z",
});

const probe = (id: string): ProbeEntity => ({
  id: `${id}#e1`,
  model: "probe",
  scope: id,
  category: "explanation",
  name: "e1",
  query: "Why?",
  responses: ["because", "because"],
  usage: [call(0.01), null],
  ms: [5000, null],
});

describe("usageOfInterview", () => {
  it("folds answers and probes by role, pricing only what carried a price", () => {
    const usage = usageOfInterview({
      entity: sitting("a", "model-a"),
      probes: [probe("a")],
    });
    expect(usage.total.calls).toBe(4);
    expect(usage.total.usd).toBeCloseTo(0.013, 6);
    expect(usage.total.unpriced).toBe(1);
    expect(usage.total.input).toBe(400);
    expect(usage.rows.map((row) => row.role)).toEqual(["answer", "probe"]);
    expect(usage.rows[0]!.calls).toBe(3);
    expect(usage.rows[0]!.usd).toBeCloseTo(0.003, 6);
    expect(usage.rows[1]!.usd).toBeCloseTo(0.01, 6);
    expect(usage.rows[1]!.model).toBe("model-a");
  });

  it("folds wall clock beside usage, counting every timed call", () => {
    const usage = usageOfInterview({
      entity: sitting("a", "model-a"),
      probes: [probe("a")],
    });
    // e1 twice, e3 twice (one of them reported no usage), the probe once
    expect(usage.latency).toEqual({ calls: 5, ms: 17000, maxMs: 6000 });
    expect(usage.rows[0]!.latency).toEqual({
      calls: 4,
      ms: 12000,
      maxMs: 6000,
    });
    expect(meanMs(usage.rows[0]!.latency)).toBe(3000);
    expect(usage.rows[1]!.latency).toEqual({
      calls: 1,
      ms: 5000,
      maxMs: 5000,
    });
    // the timed-but-unreported call counts once in latency and not in usage
    expect(usage.rows[0]!.calls).toBe(3);
  });

  it("sums sittings and regroups by model", () => {
    const a = usageOfInterview({ entity: sitting("a", "model-a") });
    const b = usageOfInterview({ entity: sitting("b", "model-b") });
    const both = usageOfInterviews([a, b, a]);
    expect(both.total.calls).toBe(9);
    expect(both.total.usd).toBeCloseTo(0.009, 6);
    expect(both.latency).toEqual({ calls: 12, ms: 36000, maxMs: 6000 });
    const byModel = groupInterviewUsage(both.rows, (row) => row.model);
    expect(byModel.map((g) => g.key).sort()).toEqual(["model-a", "model-b"]);
    const modelA = byModel.find((g) => g.key === "model-a")!;
    expect(modelA.totals.calls).toBe(6);
    expect(modelA.latency).toEqual({ calls: 8, ms: 24000, maxMs: 6000 });
    expect(meanMs({ calls: 0, ms: 0, maxMs: 0 })).toBeNull();
  });
});

describe("latencyQuantiles", () => {
  it("reads nearest-rank quantiles from the timed calls only", () => {
    expect(latencyQuantiles([null, undefined])).toBeUndefined();
    expect(
      latencyQuantiles([
        5000,
        1000,
        null,
        3000,
        2000,
        4000,
        6000,
        7000,
        8000,
        9000,
        10000,
      ]),
    ).toEqual({
      calls: 10,
      meanMs: 5500,
      medianMs: 5000,
      p90Ms: 9000,
      maxMs: 10000,
    });
  });

  it("reads one sitting by role", () => {
    const rows = latencyOfInterview({
      entity: sitting("a", "model-a"),
      probes: [probe("a")],
    });
    expect(rows.map((row) => [row.role, row.calls, row.medianMs])).toEqual([
      ["answer", 4, 2000],
      ["probe", 1, 5000],
    ]);
    expect(rows[0]!.model).toBe("model-a");
    expect(latencyOfInterview({ entity: sitting("b", "m") })).toHaveLength(1);
  });
});
