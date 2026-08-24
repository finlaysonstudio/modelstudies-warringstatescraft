import { describe, expect, it } from "vitest";

import {
  groupInterviewUsage,
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
    },
    // an older item with no usage stamped
    e2: { name: "e2", value: 2, values: [2] },
    // a call that reported tokens without a price
    e3: { name: "e3", value: 1, values: [1, null], usage: [call(), null] },
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

  it("sums sittings and regroups by model", () => {
    const a = usageOfInterview({ entity: sitting("a", "model-a") });
    const b = usageOfInterview({ entity: sitting("b", "model-b") });
    const both = usageOfInterviews([a, b, a]);
    expect(both.total.calls).toBe(9);
    expect(both.total.usd).toBeCloseTo(0.009, 6);
    const byModel = groupInterviewUsage(both.rows, (row) => row.model);
    expect(byModel.map((g) => g.key).sort()).toEqual(["model-a", "model-b"]);
    expect(byModel.find((g) => g.key === "model-a")!.totals.calls).toBe(6);
  });
});
