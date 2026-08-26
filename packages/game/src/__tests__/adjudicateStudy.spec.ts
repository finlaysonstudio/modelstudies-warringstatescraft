import { describe, expect, it } from "vitest";
import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import { panelIdOf } from "../adjudicateRun";
import type { BasicReport } from "../reports";
import {
  adjudicateStudy,
  buildStudyReport,
  planStudy,
  planStudyAdjudication,
  runStudy,
} from "../study";
import type { Adjudication, Run, Study } from "../types";

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
  of<T extends EntityLike>(model: string): T[] {
    return [...this.entities.values()].filter(
      (entity) => entity.model === model,
    ) as T[];
  }
}

/** the seats play; every judge scores its own model's number */
const playing = (rung: number): LlmClient => ({
  async operate(prompt: string, options?: LlmOperateOptions) {
    if (options?.system?.includes("escalation adjudicator")) {
      return { content: { escalation: rung, reasoning: "played", flags: [] } };
    }
    if (options?.system?.includes("game master narrator")) {
      return { content: "Narrated." };
    }
    if (prompt.includes("Write a candid")) return { content: "Debrief." };
    if (!options?.format) return { content: "Dialog." };
    return {
      content: {
        situation: "s",
        options: ["a"],
        decision: "Hold.",
        rationale: "r",
        redLines: [],
      },
    };
  },
});

/** a fixed panel: every judge calls it rung 6, and charges for it */
const fixedPanel = (): LlmClient => ({
  async operate(_prompt: string, options?: LlmOperateOptions) {
    if (!options?.format) throw new Error("a re-scoring never narrates");
    return {
      content: { escalation: 6, reasoning: "re-scored", flags: [] },
      usage: [
        {
          input: 100,
          output: 20,
          reasoning: 0,
          total: 120,
          model: options.model ?? "judge",
          usd: 0.01,
        },
      ],
    };
  },
});

const played = async (store: MemoryStore) => {
  const study = await planStudy({
    models: ["alpha"],
    replicates: 1,
    scenarios: ["corridor-states"],
    store,
  });
  await runStudy({ id: study.id, llm: playing(2), store });
  return study.id;
};

describe("adjudicateStudy", () => {
  it("scores every complete run and reports what it cost", async () => {
    const store = new MemoryStore();
    const id = await played(store);
    const panel = { judges: ["judge-x", "judge-y"], mode: "median" as const };
    const plan = await planStudyAdjudication(store, id, panel.judges.length);
    expect(plan.runs).toBeGreaterThan(0);
    expect(plan.calls).toBe((plan.turns - plan.inherited) * 2);

    const result = await adjudicateStudy({
      id,
      panel,
      llm: fixedPanel(),
      store,
    });
    expect(result.panelId).toBe(panelIdOf(panel));
    expect(result.failed).toBe(0);
    expect(result.built).toBe(result.runs);
    expect(result.calls).toBe(plan.calls);
    expect(store.of<Adjudication>("adjudications")).toHaveLength(result.runs);
    // corridor-states forks, so the branches copy their pre-fork turns
    expect(plan.inherited).toBeGreaterThan(0);
    expect(
      result.adjudications
        .flatMap((set) => set.turns)
        .filter((score) => score.inherited).length,
    ).toBe(plan.inherited);
    // the runs on disk still carry the panel that played them
    for (const run of store.of<Run>("runs")) {
      for (const turn of run.turns) {
        if (turn.adjudication) expect(turn.adjudication.escalation).toBe(2);
      }
    }
  });

  it("keeps a scoring on record unless forced", async () => {
    const store = new MemoryStore();
    const id = await played(store);
    const panel = { judges: ["judge-x"], mode: "median" as const };
    await adjudicateStudy({ id, panel, llm: fixedPanel(), store });
    const second = await adjudicateStudy({
      id,
      panel,
      llm: fixedPanel(),
      store,
    });
    expect(second.built).toBe(0);
    expect(second.kept).toBe(second.runs);
    expect(second.calls).toBe(0);
  });
});

describe("a report built over a re-scoring", () => {
  it("is its own artifact and does not overwrite the study's own", async () => {
    const store = new MemoryStore();
    const id = await played(store);
    const panel = { judges: ["judge-x"], mode: "median" as const };
    const original = (await buildStudyReport({
      bootstrap: 20,
      id,
      save: true,
      store,
    })) as BasicReport;
    expect(original.id).toBe(id);
    expect(original.adjudication).toBeUndefined();
    expect(original.byModel[0].peak.value).toBe(2);

    await adjudicateStudy({
      id,
      panel,
      panelId: "fixed",
      llm: fixedPanel(),
      store,
    });
    const rescored = (await buildStudyReport({
      bootstrap: 20,
      id,
      adjudication: "fixed",
      save: true,
      store,
    })) as BasicReport;
    expect(rescored.id).toBe(`${id}.fixed`);
    expect(rescored.adjudication).toBe("fixed");
    expect(rescored.byModel[0].peak.value).toBe(6);
    expect(rescored.adjudicated!.runs).toBe(rescored.adjudicated!.of);
    // the play cost is what the games cost, and the re-scoring is its own line
    expect(rescored.usage.total.usd).toBeCloseTo(original.usage.total.usd, 10);
    expect(rescored.adjudicated!.usage.usd).toBeGreaterThan(0);

    const kept = (await store.get("reports", id)) as BasicReport;
    expect(kept.byModel[0].peak.value).toBe(2);
  });

  it("refuses a partial overlay unless it is asked for", async () => {
    const store = new MemoryStore();
    const id = await played(store);
    const panel = { judges: ["judge-x"], mode: "median" as const };
    await adjudicateStudy({
      id,
      panel,
      panelId: "fixed",
      llm: fixedPanel(),
      store,
    });
    // a run the scoring never covered
    const orphan = store.of<Run>("runs")[0];
    await store.update({ ...orphan, id: `${orphan.id}_x` });
    const study = (await store.get<Study>("studies", id))!;
    study.arms.push({ ...study.arms[0], runId: `${orphan.id}_x` });
    await store.update(study);

    await expect(
      buildStudyReport({ bootstrap: 20, id, adjudication: "fixed", store }),
    ).rejects.toThrow(/adjudicated: 5 of 6/);
    const partial = await buildStudyReport({
      bootstrap: 20,
      id,
      adjudication: "fixed",
      partial: true,
      store,
    });
    expect(partial.adjudicated!.runs).toBe(5);
    expect(partial.adjudicated!.of).toBe(6);
  });

  it("refuses a scoring that is not on record", async () => {
    const store = new MemoryStore();
    const id = await played(store);
    await expect(
      buildStudyReport({ bootstrap: 20, id, adjudication: "absent", store }),
    ).rejects.toThrow(/No scoring "absent"/);
  });
});
