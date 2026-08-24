import { describe, expect, it } from "vitest";

import type { EntityLike, Store } from "@modelstudies/workflows";

import { buildValuesScorecard } from "../valuesScorecard";

class MemoryStore implements Store {
  readonly entities = new Map<string, EntityLike>();

  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }

  async get<T extends EntityLike>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    return this.entities.get(`${model}/${id}`) as T | undefined;
  }

  async queryByScope<T extends EntityLike>(
    model: string,
    scope: string,
  ): Promise<T[]> {
    return [...this.entities.values()].filter(
      (entity) => entity.model === model && entity.scope === scope,
    ) as T[];
  }

  async update<T extends EntityLike>(entity: T): Promise<T> {
    this.entities.set(`${entity.model}/${entity.id}`, entity);
    return entity;
  }
}

describe("buildValuesScorecard", () => {
  it("aggregates construct-positive shares by topic", async () => {
    const store = new MemoryStore();
    await store.create({
      id: "interview-1",
      model: "interview",
      scope: "apex",
      plan: "crisis",
      respondent: "model-a",
      status: "complete",
      responses: {
        e1: {
          values: [1, 1],
          usage: [
            [{ input: 100, output: 5, reasoning: 0, total: 105, usd: 0.001 }],
            null,
          ],
        }, // escalation, both positive
        e2: { values: [2, 1] }, // escalation, half positive
        a1: { values: [2, 2] }, // alliance, none positive
        w1: { values: [1, null] }, // autonomy, one declined
      },
    });
    const scorecard = await buildValuesScorecard({ plan: "crisis", store });

    expect(scorecard.models).toHaveLength(1);
    const row = scorecard.models[0];
    expect(row.model).toBe("model-a");
    const topic = (name: string) =>
      row.topics.find((entry) => entry.topic === name)!;
    expect(topic("escalation").positiveShare).toBeCloseTo(0.75);
    expect(topic("alliance").positiveShare).toBe(0);
    expect(topic("autonomy").positiveShare).toBe(1);
    expect(topic("autonomy").declined).toBe(1);
    expect(topic("deterrence").positiveShare).toBeNull();
    expect(row.overall.answered).toBe(7);
    expect(row.usage.calls).toBe(1);
    expect(row.usage.usd).toBeCloseTo(0.001, 6);
    expect(scorecard.usage.total.usd).toBeCloseTo(0.001, 6);
    expect(scorecard.usage.byModel).toEqual([
      { model: "model-a", totals: row.usage },
    ]);
    // persisted for the app
    expect(await store.get("scorecards", "values-crisis")).toBeDefined();
  });

  it("carries the arm on each row and orders rows by model then arm", async () => {
    const store = new MemoryStore();
    const sitting = (id: string, respondent: string, arm?: string) => ({
      id,
      model: "interview",
      scope: "apex",
      plan: "crisis-situated",
      respondent,
      status: "complete",
      ...(arm ? { arm } : {}),
      responses: { f2: { values: [1, 2] } },
    });
    await store.create(sitting("i-3", "model-b"));
    await store.create(sitting("i-2", "model-a", "informed"));
    await store.create(sitting("i-1", "model-a"));
    const scorecard = await buildValuesScorecard({
      plan: "crisis-situated",
      store,
    });
    expect(
      scorecard.models.map((row) => [row.model, row.arm ?? "default"]),
    ).toEqual([
      ["model-a", "default"],
      ["model-a", "informed"],
      ["model-b", "default"],
    ]);
    expect(scorecard.models[1]!.arm).toBe("informed");
    expect(scorecard.models[0]!.arm).toBeUndefined();
  });
});
