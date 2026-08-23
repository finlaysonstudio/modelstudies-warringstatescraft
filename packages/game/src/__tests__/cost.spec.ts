import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import { groupUsage, usageOf, usageOfRuns } from "../cost";
import { GameEngine } from "../engine";
import { maskTurn } from "../mask";
import type { Run, UsageItem } from "../types";

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
    this.entities.set(`${entity.model}/${entity.id}`, structuredClone(entity));
    return entity;
  }
}

const memo = (decision: string) => ({
  situation: "test situation",
  options: ["a", "b"],
  decision,
  rationale: "test rationale",
  redLines: ["no first strike"],
});

/** every call reports one usage item; `unpriced` models carry no usd */
const countingLlm = (unpriced: string[] = []) => {
  let calls = 0;
  const client: LlmClient = {
    async operate(prompt: string, options?: LlmOperateOptions) {
      calls += 1;
      const model = options?.model ?? "default";
      const item: UsageItem = {
        input: 1000,
        output: 100,
        reasoning: 10,
        total: 1100,
        provider: "test",
        model,
        ...(unpriced.includes(model) ? {} : { usd: 0.01 }),
      };
      const usage = [item];
      if (options?.system?.includes("escalation adjudicator")) {
        return {
          content: { escalation: 2, reasoning: "test", flags: [] },
          usage,
        };
      }
      if (options?.system?.includes("game master narrator")) {
        return { content: "The turn resolves quietly.", usage };
      }
      if (prompt.includes("Write a candid")) {
        return { content: "Debrief text.", usage };
      }
      if (prompt.includes("CONSENSUS decision")) {
        return {
          content: {
            ...memo(`consensus by ${model}`),
            deferredOn: ["convoy pace"],
            brokeOn: [],
          },
          usage,
        };
      }
      return { content: memo(`decision by ${model}`), usage };
    },
  };
  return { client, calls: () => calls };
};

const tree = async (store: MemoryStore, root: Run): Promise<Run[]> => [
  root,
  ...(
    await Promise.all(root.children.map((id) => store.get<Run>("runs", id)))
  ).filter((run): run is Run => run !== undefined),
];

describe("usage capture", () => {
  it("stamps every artifact and counts each call once across a decision-point tree", async () => {
    const store = new MemoryStore();
    const llm = countingLlm();
    const root = await new GameEngine({
      llm: llm.client,
      maxTurns: 4,
      roster: ["model-a", "model-b", "model-c"],
      scenario: "strait-states",
      store,
    }).play();
    const runs = await tree(store, root);

    for (const run of runs) {
      for (const turn of run.turns) {
        for (const brief of turn.briefs) {
          expect(brief.usage).toHaveLength(1);
          expect(brief.usage?.[0].model).toBe(brief.model);
        }
        if (turn.adjudication) {
          for (const verdict of turn.adjudication.panel) {
            expect(verdict.usage).toHaveLength(1);
          }
          expect(turn.adjudication.narratorUsage).toHaveLength(1);
        }
      }
      for (const debrief of run.debriefs) {
        expect(debrief.usage).toHaveLength(1);
      }
    }

    const all = usageOfRuns(runs);
    expect(all.total.calls).toBe(llm.calls());
    expect(all.total.usd).toBeCloseTo(llm.calls() * 0.01, 6);
    expect(all.total.input).toBe(llm.calls() * 1000);
    expect(all.total.unpriced).toBe(0);

    // the root's own calls: turns 1-2 (3 seats + 3 judges + narrator each) and
    // the fork turn's 2 other seats + 3 independent + 3 consensus
    const own = usageOf(root);
    expect(own.total.calls).toBe(2 * (3 + 3 + 1) + 2 + 3 + 3);
    expect(own.rows.map((row) => row.role)).toEqual(
      expect.arrayContaining(["seat", "judge", "narrator"]),
    );
    expect(own.rows.some((row) => row.role === "debrief")).toBe(false);

    // a child owns its seeded turn's adjudication, turn 4, and its debriefs
    const child = runs[1];
    const childOwn = usageOf(child);
    expect(childOwn.total.calls).toBe(3 + 1 + (3 + 3 + 1) + 3);
    const seatRows = childOwn.rows.filter((row) => row.role === "seat");
    expect(seatRows.map((row) => row.seat).sort()).toEqual(
      Object.keys(child.roster).sort(),
    );
    for (const row of seatRows) {
      expect(row.model).toBe(child.roster[row.seat!]);
    }
  });

  it("counts matrix branches once each and groups by model", async () => {
    const store = new MemoryStore();
    const llm = countingLlm(["model-b"]);
    const root = await new GameEngine({
      llm: llm.client,
      matrix: {
        broadland: ["model-a", "model-b"],
        shoalholm: ["model-a"],
        farwater: ["model-a"],
      },
      maxTurns: 2,
      scenario: "strait-states",
      store,
    }).play();
    const runs = await tree(store, root);
    expect(usageOf(root).total.calls).toBe(0);
    const all = usageOfRuns(runs);
    expect(all.total.calls).toBe(llm.calls());
    expect(all.total.unpriced).toBeGreaterThan(0);
    const byModel = groupUsage(all.rows, (row) => row.model);
    expect(byModel.map((group) => group.key).sort()).toEqual([
      "model-a",
      "model-b",
    ]);
    const b = byModel.find((group) => group.key === "model-b")!.totals;
    expect(b.usd).toBe(0);
    expect(b.unpriced).toBe(b.calls);
  });

  it("keeps every dialog round on the brief", async () => {
    const store = new MemoryStore();
    const llm = countingLlm();
    const root = await new GameEngine({
      dialog: 2,
      llm: llm.client,
      matrix: {
        broadland: ["model-a"],
        shoalholm: ["model-a"],
        farwater: ["model-a"],
      },
      maxTurns: 1,
      scenario: "strait-states",
      store,
    }).play();
    const [, child] = await tree(store, root);
    for (const brief of child.turns[0].briefs) {
      expect(brief.dialog).toHaveLength(2);
      expect(brief.usage).toHaveLength(3);
    }
    expect(usageOf(child).rows.find((row) => row.role === "seat")?.calls).toBe(
      3,
    );
  });

  it("masks usage out of human-facing turns", async () => {
    const store = new MemoryStore();
    const root = await new GameEngine({
      llm: countingLlm().client,
      matrix: {
        broadland: ["model-a"],
        shoalholm: ["model-a"],
        farwater: ["model-a"],
      },
      maxTurns: 1,
      scenario: "strait-states",
      store,
    }).play();
    const [, child] = await tree(store, root);
    const masked = maskTurn(child.turns[0]);
    for (const brief of masked.briefs) expect(brief.usage).toBeUndefined();
    for (const verdict of masked.adjudication!.panel) {
      expect(verdict.usage).toBeUndefined();
    }
    expect(masked.adjudication!.narratorUsage).toBeUndefined();
    expect(JSON.stringify(masked)).not.toContain('"usd"');
    expect(JSON.stringify(masked)).not.toContain('"provider"');
  });
});
