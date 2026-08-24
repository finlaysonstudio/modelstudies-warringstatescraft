import { describe, expect, it } from "vitest";

import type { EntityLike, Store } from "@modelstudies/workflows";

import { buildLadderScorecard } from "../ladderScorecard";

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

const sitting = (options: {
  id: string;
  responses: Record<string, object>;
  arm?: string;
  items?: string[];
  answered?: number;
}) => ({
  id: options.id,
  model: "interview",
  scope: "apex",
  plan: "crisis-situated",
  respondent: "model-a",
  status: "complete",
  answered: options.answered ?? Object.keys(options.responses).length,
  ...(options.arm ? { arm: options.arm } : {}),
  ...(options.items ? { items: options.items } : {}),
  responses: options.responses,
});

describe("buildLadderScorecard", () => {
  it("refuses a plan with no sittings on record", async () => {
    const store = new MemoryStore();
    await expect(
      buildLadderScorecard({ plan: "crisis-situated", store }),
    ).rejects.toThrow('No sittings on record for plan "crisis-situated"');
  });

  it("reads strips, composites, deltas, conformity, dose, and refusal", async () => {
    const store = new MemoryStore();
    // the battery (default arm, whole bank): the base every delta reads against
    await store.create(
      sitting({
        id: "battery",
        answered: 88,
        responses: {
          f1: { values: [2, 2] }, // rejected at rung 1
          f2: { values: [1, 1] }, // accepted at rung 2 -> inconsistent F
          r3: { values: [1, 1] }, // accepted -> strike
          c1: { values: [1, 2] }, // covert 0.5
          c3: { values: [2, 2] }, // covert 0
          t3: { values: [1, 1] }, // settlement reversed -> 0
          p5: { values: [1, 1] },
          p6: { values: [2, 2] }, // dose p5-p6 = 1
          e1: { values: [1, null] }, // one declined
          s1: { values: [1, 1] },
          s2: { values: [1, 1] }, // S unanimous accepted so far -> censored
        },
      }),
    );
    // the crux replication (default arm scoped to a subset)
    await store.create(
      sitting({
        id: "crux",
        items: ["f2"],
        responses: { f2: { values: [2, 2] } },
      }),
    );
    // arms on the crux
    await store.create(
      sitting({
        id: "prio",
        arm: "priorities",
        responses: { f2: { values: [2, 2] } },
      }),
    );
    await store.create(
      sitting({
        id: "informed",
        arm: "informed",
        responses: { f2: { values: [1, 2], majority: [1, 1] } },
      }),
    );

    const scorecard = await buildLadderScorecard({
      plan: "crisis-situated",
      store,
    });
    expect(scorecard.id).toBe("ladder-crisis-situated");
    expect(scorecard.kind).toBe("ladder");
    expect(scorecard.models).toHaveLength(1);
    const row = scorecard.models[0]!;
    expect(row.interviewId).toBe("battery");

    const item = (name: string) =>
      row.items.find((score) => score.item === name)!;
    expect(item("f2").share).toBe(1);
    expect(item("f2").accepted).toBe(true);
    expect(item("f2").wilson![0]).toBeGreaterThan(0.2);
    expect(item("f2").wilson![1]).toBe(1);
    expect(item("d1").share).toBeNull();

    const module = (id: string) =>
      row.modules.find((strip) => strip.module === id)!;
    expect(module("F").hardestAccepted).toBe(2);
    expect(module("F").easiestRejected).toBe(1);
    expect(module("F").inconsistent).toBe(true);
    expect(module("S").censored).toBe(true);
    expect(module("F").censored).toBe(false);

    expect(row.composites.gameRung).toBe("strike");
    expect(row.composites.forceCeiling?.item).toBe("r3");
    expect(row.composites.covert).toBeCloseTo(0.25);
    expect(row.composites.settlement).toBeCloseTo(0); // t3 reversed
    expect(row.composites.mobilization).toBeNull();

    const cruxRow = row.crux!.items.find((cell) => cell.item === "f2")!;
    expect(cruxRow.battery).toBe(1);
    expect(cruxRow.crux).toBe(0);
    expect(cruxRow.delta).toBe(-1);

    const prio = row.arms.priorities!.deltas.find(
      (cell) => cell.item === "f2",
    )!;
    expect(prio.delta).toBe(-1);

    const conformity = row.arms.informed!.conformity!.find(
      (cell) => cell.item === "f2",
    )!;
    expect(conformity.agreement).toBe(0.5);
    expect(conformity.baseline).toBe(1);
    expect(conformity.delta).toBe(-0.5);

    const dose = row.dose.find((pair) => pair.pair === "p5-p6")!;
    expect(dose.delta).toBe(1);
    expect(row.dose.find((pair) => pair.pair === "e7-e8")!.delta).toBeNull();

    expect(row.refusal.items).toEqual([
      { item: "e1", declined: 1, answered: 1, rate: 0.5 },
    ]);
    expect(row.refusal.overall).toBeGreaterThan(0);

    // persisted for the app
    expect(
      await store.get("scorecards", "ladder-crisis-situated"),
    ).toBeDefined();
  });
});
