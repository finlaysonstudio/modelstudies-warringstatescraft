import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import type { BasicReport, LamparthReport } from "../reports";
import { buildStudyReport, planStudy, runStudy } from "../study";
import { lamparthId, LAMPARTH_2024 } from "../scenario/lamparth2024";
import type { Run, Study } from "../types";

class MemoryStore implements Store {
  readonly entities = new Map<string, EntityLike>();
  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }
  async get<T extends EntityLike>(model: string, id: string) {
    return this.entities.get(`${model}/${id}`) as T | undefined;
  }
  async queryByScope<T extends EntityLike>(model: string, scope: string) {
    return [...this.entities.values()].filter(
      (entity) => entity.model === model && entity.scope === scope,
    ) as T[];
  }
  async update<T extends EntityLike>(entity: T): Promise<T> {
    this.entities.set(`${entity.model}/${entity.id}`, structuredClone(entity));
    return entity;
  }
  runs(): Run[] {
    return [...this.entities.values()].filter(
      (entity) => entity.model === "runs",
    ) as Run[];
  }
}

type Picker = (model: string, turn: number) => string[];

/** a stub that answers choice turns per model; `failFirst` throws once for a model */
const makeStub = (pick: Picker, failFirst?: string) => {
  let failed = false;
  const llm: LlmClient = {
    async operate(prompt: string, options?: LlmOperateOptions) {
      if (options?.system?.includes("escalation adjudicator")) {
        return { content: { escalation: 2, reasoning: "test", flags: [] } };
      }
      if (options?.system?.includes("game master narrator")) {
        return { content: "Narrated." };
      }
      if (prompt.includes("Write a candid")) return { content: "Debrief." };
      if (!options?.format) return { content: "Dialog." };
      if (failFirst && options.model === failFirst && !failed) {
        failed = true;
        throw new Error("provider down");
      }
      const turn = Number(/TURN (\d+)/.exec(prompt)?.[1] ?? 1);
      return {
        content: {
          answers: ["end state"],
          choices: pick(options.model ?? "", turn),
          rationale: "because",
        },
      };
    },
  };
  return llm;
};

const CELLS = [
  lamparthId({
    accuracy: "70-85%",
    training: "basic",
    posture: "revisionist",
  }),
  lamparthId({
    accuracy: "95-99%",
    training: "significant",
    posture: "status_quo",
  }),
];

const hawk: Picker = (model, turn) =>
  model === "hawk"
    ? turn === 1
      ? ["a", "d"]
      : ["a", "a2", "e", "k"]
    : turn === 1
      ? ["b", "g"]
      : ["d", "f"];

const loadReference = async (store: MemoryStore) => {
  const raw = await readFile(
    resolve(__dirname, "../../../../data/reference/lamparth-2024.json"),
    "utf8",
  );
  await store.create(JSON.parse(raw) as EntityLike);
};

describe("studies", () => {
  it("plans arms from cells × models × replicates and infers the report", async () => {
    const store = new MemoryStore();
    const study = await planStudy({
      models: ["hawk", "dove"],
      replicates: 2,
      scenarios: CELLS,
      store,
    });
    expect(study.report).toBe("lamparth");
    expect(study.arms).toHaveLength(8);
    expect(study.arms[0]).toEqual({
      scenario: CELLS[0],
      model: "hawk",
      replicate: 1,
      status: "pending",
    });
    expect(study.status).toBe("active");
    expect(await store.get("studies", study.id)).toBeDefined();
  });

  it("refuses mixed reports without an explicit one", async () => {
    const store = new MemoryStore();
    await expect(
      planStudy({
        models: ["hawk"],
        replicates: 1,
        scenarios: ["corridor-states", LAMPARTH_2024.id],
        store,
      }),
    ).rejects.toThrow(/different reports/);
    const study = await planStudy({
      models: ["hawk"],
      replicates: 1,
      report: "basic",
      scenarios: ["corridor-states", LAMPARTH_2024.id],
      store,
    });
    expect(study.report).toBe("basic");
  });

  it("plays every arm, stamps runs, resumes after a failure, and reports", async () => {
    const store = new MemoryStore();
    await loadReference(store);
    const planned = await planStudy({
      dialog: 1,
      models: ["hawk", "dove"],
      replicates: 2,
      scenarios: CELLS,
      store,
      title: "test study",
    });

    const first = await runStudy({
      id: planned.id,
      llm: makeStub(hawk, "dove"),
      store,
    });
    expect(first.status).toBe("error");
    expect(first.arms.filter((arm) => arm.status === "complete")).toHaveLength(
      7,
    );
    const failedArm = first.arms.find((arm) => arm.status === "error")!;
    expect(failedArm.model).toBe("dove");

    const resumed = await runStudy({
      id: planned.id,
      llm: makeStub(hawk),
      store,
    });
    expect(resumed.status).toBe("complete");
    expect(resumed.arms.every((arm) => arm.runId)).toBe(true);
    // the arm whose brief failed was played again as a fresh run
    const replayed = resumed.arms.find(
      (arm) =>
        arm.scenario === failedArm.scenario &&
        arm.replicate === failedArm.replicate &&
        arm.model === "dove",
    )!;
    expect(replayed.runId).not.toBe(failedArm.runId);
    expect(failedArm.statusDetail).toBe("1 brief failed");

    const runs = store
      .runs()
      .filter((run) => resumed.arms.some((arm) => arm.runId === run.id));
    expect(runs).toHaveLength(8);
    for (const run of runs) {
      expect(run.study).toBe(planned.id);
      expect(run.replicate).toBeGreaterThanOrEqual(1);
      expect(run.dialog).toBe(1);
      expect(run.status).toBe("complete");
    }
    const stored = (await store.get<Study>("studies", planned.id))!;
    expect(stored.arms.map((arm) => arm.status)).toEqual(
      new Array(8).fill("complete"),
    );

    const report = (await buildStudyReport({
      bootstrap: 50,
      id: planned.id,
      save: true,
      store,
    })) as LamparthReport;
    expect(report.report).toBe("lamparth");
    expect(report.columns).toHaveLength(21);
    expect(report.coverage).toHaveLength(4);
    expect(report.coverage.every((cell) => cell.complete === 2)).toBe(true);
    expect(report.groups.map((group) => group.id)).toEqual([
      "hawk",
      "dove",
      "human-feb24",
      "gpt-4-1106-preview-dialog3",
      "gpt-3.5-turbo-16k-dialog3",
    ]);
    const hawkGroup = report.groups[0];
    expect(hawkGroup.n).toBe(4);
    expect(hawkGroup.cells).toEqual([
      { scenario: CELLS[0], n: 2 },
      { scenario: CELLS[1], n: 2 },
    ]);
    const fire = hawkGroup.frequencies.find(
      (row) => row.turn === 1 && row.id === "a",
    )!;
    expect(fire.value).toBe(1);
    // hawk: 6 agg, 0 des of 21; dove: 0 agg, 4 des
    expect(hawkGroup.aggressiveness.value).toBeCloseTo(6 / 21);
    expect(report.groups[1].aggressiveness.value).toBeCloseTo(-4 / 21);
    expect(hawkGroup.actions.value).toBe(6);
    expect(hawkGroup.consistency).toMatchObject({
      table2: { aggAgg: { value: 1 }, desAgg: { value: 0 } },
      conditional: { aggGivenAgg: { value: 1 }, aggGivenDes: { value: 0 } },
      nAgg: 4,
      nDes: 0,
    });
    expect(report.groups[1].consistency).toMatchObject({
      table2: { aggAgg: { value: 0 }, desAgg: { value: 0 } },
      nAgg: 0,
      nDes: 4,
    });
    // treatment effects: the hawk plays the same in both cells, so zero
    expect(hawkGroup.effects.map((effect) => effect.factor)).toEqual([
      "accuracy",
      "training",
      "posture",
    ]);
    expect(hawkGroup.effects[0].n).toEqual([2, 2]);
    expect(hawkGroup.effects[0].rows.every((row) => row.value === 0)).toBe(
      true,
    );

    // reference groups carry the repo's games and land near Table 2
    const human = report.groups.find((group) => group.id === "human-feb24")!;
    expect(human.kind).toBe("reference");
    expect(human.n).toBe(21);
    expect(human.consistency.table2.desAgg.value).toBeLessThan(
      human.consistency.table2.aggAgg.value,
    );
    // the repo's GPT files reproduce the paper's Table 2 (0.99 / 0.73, 0.98 / 0.85)
    const gpt4 = report.groups.find(
      (group) => group.id === "gpt-4-1106-preview-dialog3",
    )!;
    expect(gpt4.n).toBe(79);
    expect(gpt4.consistency.table2.aggAgg.value).toBeCloseTo(0.99, 1);
    expect(gpt4.consistency.table2.desAgg.value).toBeCloseTo(0.73, 1);
    const gpt35 = report.groups.find(
      (group) => group.id === "gpt-3.5-turbo-16k-dialog3",
    )!;
    expect(gpt35.consistency.table2.aggAgg.value).toBeCloseTo(0.98, 1);
    expect(gpt35.consistency.table2.desAgg.value).toBeCloseTo(0.85, 1);
    expect(gpt4.aggressiveness.value).toBeGreaterThan(0.25);
    expect(gpt4.aggressiveness.value).toBeLessThan(0.35);
    expect(
      gpt4.effects.every((effect) => effect.n[0] + effect.n[1] === 79),
    ).toBe(true);
    expect(report.comparisons).toHaveLength(6);
    const hawkVsHuman = report.comparisons.find(
      (comparison) =>
        comparison.group === "hawk" && comparison.reference === "human-feb24",
    )!;
    const fireDiff = hawkVsHuman.rows.find(
      (row) => row.turn === 1 && row.id === "a",
    )!;
    expect(fireDiff.value).toBeCloseTo(
      1 -
        human.frequencies.find((row) => row.turn === 1 && row.id === "a")!
          .value,
    );
    expect(fireDiff.ci[0]).toBeLessThanOrEqual(fireDiff.value);
    expect(fireDiff.ci[1]).toBeGreaterThanOrEqual(fireDiff.value);
    expect(report.table2?.human).toEqual({
      aggGivenAgg: 0.94,
      aggGivenDes: 0.65,
    });
    expect(await store.get("reports", planned.id)).toBeDefined();
  });

  it("builds the basic report over adjudicated turns", async () => {
    const store = new MemoryStore();
    const planned = await planStudy({
      models: ["hawk"],
      replicates: 3,
      report: "basic",
      scenarios: [CELLS[0]],
      store,
    });
    await runStudy({ id: planned.id, llm: makeStub(hawk), store });
    const report = (await buildStudyReport({
      bootstrap: 20,
      id: planned.id,
      store,
    })) as BasicReport;
    expect(report.report).toBe("basic");
    expect(report.cells).toHaveLength(1);
    expect(report.cells[0]).toMatchObject({
      scenario: CELLS[0],
      model: "hawk",
      games: 3,
      timelines: 3,
      peak: { value: 2, ci: [2, 2] },
      final: { value: 2, ci: [2, 2] },
    });
    expect(report.cells[0].turns.map((turn) => turn.index)).toEqual([1, 2]);
    expect(report.byModel[0]).toMatchObject({ scenario: null, games: 3 });
  });
});
