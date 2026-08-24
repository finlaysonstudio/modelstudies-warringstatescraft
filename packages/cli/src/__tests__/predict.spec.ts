import { describe, expect, it } from "vitest";

import { getScenario, LAMPARTH_2024 } from "@modelstudies/game";
import { CRISIS_SITUATED_PREDICTIONS } from "@modelstudies/survey";
import type { EntityLike, Store } from "@modelstudies/workflows";

import { buildPredictionReport } from "../predict";

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

describe("crisis-situated prediction map binding", () => {
  it("names only options the Lamparth menus carry, on their turns", () => {
    const menus = new Map(
      LAMPARTH_2024.turns
        .filter((turn) => turn.choices?.length)
        .map((turn) => [
          turn.index,
          new Set(turn.choices!.map((choice) => choice.id)),
        ]),
    );
    for (const row of CRISIS_SITUATED_PREDICTIONS) {
      if (row.scenario !== "lamparth-2024") continue;
      const menu = menus.get(row.turn as number);
      expect(menu, `turn ${row.turn}`).toBeDefined();
      expect(
        menu!.has(row.option),
        `turn ${row.turn} option ${row.option}`,
      ).toBe(true);
    }
  });

  it("names only registered chapter scenarios", () => {
    for (const row of CRISIS_SITUATED_PREDICTIONS) {
      if (row.scenario === "lamparth-2024" || row.scenario === "*") continue;
      expect(() => getScenario(row.scenario), row.scenario).not.toThrow();
    }
  });
});

describe("buildPredictionReport", () => {
  const scenario = "lamparth-2024-acc95-basic-revisionist";

  const run = (id: string, moveOne: string[], moveTwo: string[]) => ({
    id,
    model: "runs",
    scope: "apex",
    scenario,
    status: "complete",
    branch: {},
    children: [],
    escalationLadder: ["calm", "tense", "war"],
    turns: [
      {
        index: 1,
        briefs: [{ seat: "us", model: "model-a", memo: { choices: moveOne } }],
        adjudication: { escalation: 1 },
      },
      {
        index: 2,
        briefs: [{ seat: "us", model: "model-a", memo: { choices: moveTwo } }],
        adjudication: { escalation: 2 },
      },
    ],
  });

  const fixture = async () => {
    const store = new MemoryStore();
    await store.create(run("run-1", ["b"], ["d", "e"]));
    await store.create(run("run-2", ["b", "e"], ["e"]));
    await store.create({
      id: "study-1",
      model: "studies",
      scope: "apex",
      title: "fixture",
      status: "complete",
      report: "lamparth",
      scenarios: [scenario],
      models: ["model-a", "model-b"],
      replicates: 2,
      arms: [
        {
          scenario,
          model: "model-a",
          replicate: 1,
          runId: "run-1",
          status: "complete",
        },
        {
          scenario,
          model: "model-a",
          replicate: 2,
          runId: "run-2",
          status: "complete",
        },
      ],
    });
    return store;
  };

  it("joins declared readings to played choices", async () => {
    const store = await fixture();
    const report = await buildPredictionReport({
      store,
      studyId: "study-1",
      scorecard: {
        id: "ladder-crisis-situated",
        plan: "crisis-situated",
        models: [
          {
            model: "model-a",
            // f2 low + f1 high reads "hold fire unless fired upon" (1b);
            // e1 high reads economic punishment (2e)
            items: [
              { item: "f2", share: 0.1 },
              { item: "f1", share: 0.9 },
              { item: "e1", share: 0.9 },
            ],
            composites: {
              gameRung: "coercion",
              forceCeiling: null,
            },
          },
        ],
      },
      save: false,
    });

    const rowA = report.models.find((row) => row.model === "model-a")!;
    const moveOne = rowA.turns.find((turn) => turn.turn === 1)!;
    expect(moveOne.modal).toBe("b");
    expect(moveOne.predictedOptions).toContain("b");
    expect(moveOne.hit).toBe(true);
    expect(moveOne.chance).toBeCloseTo(1 / 7);
    const moveTwo = rowA.turns.find((turn) => turn.turn === 2)!;
    expect(moveTwo.modal).toBe("e");
    expect(moveTwo.predictedOptions).toContain("e");
    expect(moveTwo.hit).toBe(true);
    expect(rowA.hitRate).toBe(1);
    expect(rowA.gameRung).toBe("coercion");
    expect(rowA.judgePeak).toEqual({ max: 2, mean: 1.5 });

    const rowB = report.models.find((row) => row.model === "model-b")!;
    expect(rowB.noSurvey).toBe(true);
    expect(rowB.games).toBe(0);
    expect(rowB.hitRate).toBeNull();

    // every chapter row stays unbound on a Lamparth study
    expect(report.unbound).toBeGreaterThan(0);
    expect(report.notes.length).toBeGreaterThan(0);
  });

  it("refuses an unknown study", async () => {
    const store = new MemoryStore();
    await expect(
      buildPredictionReport({
        store,
        studyId: "study-x",
        scorecard: { id: "s", plan: "crisis-situated", models: [] },
        save: false,
      }),
    ).rejects.toThrow("Unknown study: study-x");
  });
});
