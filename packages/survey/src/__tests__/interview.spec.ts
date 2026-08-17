import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";
import { describe, expect, it } from "vitest";

import { runInterviews, type InterviewEntity } from "../interview";
import { MODELS } from "../models";

// In-memory Store: full puts keyed by (model, id), scope filter on query.
class MemoryStore implements Store {
  entities = new Map<string, EntityLike>();
  private key(model: string, id: string) {
    return `${model}:${id}`;
  }
  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }
  async get<T extends EntityLike>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    const found = this.entities.get(this.key(model, id));
    return found ? (structuredClone(found) as T) : undefined;
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
    this.entities.set(
      this.key(entity.model, entity.id),
      structuredClone(entity),
    );
    return entity;
  }
}

interface StubLlm extends LlmClient {
  calls: number;
}

// Fixed-answer respondent: always the first enum label on choice items, 5 on
// open numeric items, free text on unformatted (explain) turns.
function stubLlm(): StubLlm {
  const llm: StubLlm = {
    calls: 0,
    async operate(_prompt: string, options?: LlmOperateOptions) {
      llm.calls += 1;
      const format = options?.format as
        | { properties?: { response?: { enum?: string[]; type?: string } } }
        | undefined;
      if (!format) return { content: "Because it wins.", history: [] };
      const response = format.properties?.response?.enum?.[0] ?? 5;
      return { content: { response }, history: [] };
    },
  };
  return llm;
}

describe("runInterviews", () => {
  it("completes a sitting and records one value per repetition", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const interviews = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
    });
    expect(interviews).toHaveLength(1);
    const interview = interviews[0]!;
    expect(interview.status).toBe("complete");
    expect(interview.respondentModel).toBe("stub-model");
    expect(interview.answered).toBe(3);
    expect(interview.declined).toBe(0);
    expect(interview.remaining).toBe(0);
    expect(interview.completedAt).toBeDefined();
    // Choice items score the first label's code on every turn; the open
    // numeric item scores the stub's 5.
    expect(interview.responses.throw!.values).toEqual([1, 1]);
    expect(interview.responses.throw!.value).toBe(1);
    expect(interview.responses.throw!.orders).toHaveLength(2);
    expect(interview.responses.counter!.values).toEqual([1, 1]);
    expect(interview.responses.rounds!.values).toEqual([5, 5]);
    expect(interview.responses.rounds!.orders).toBeUndefined();
    // 3 items × 2 repetitions, one call per turn.
    expect(llm.calls).toBe(6);
    // The completed record is persisted.
    const persisted = await store.get<InterviewEntity>(
      "interview",
      interview.id,
    );
    expect(persisted?.status).toBe("complete");
  });

  it("fields the instrument's own panel when none is named", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const interviews = await runInterviews({
      plan: "paper-rock-scissors",
      repetitions: 1,
      store,
      llm,
    });
    // paper-rock-scissors fields to solo: one model, panel recorded.
    expect(interviews).toHaveLength(1);
    expect(interviews[0]!.panel).toBe("solo");
    expect(interviews[0]!.respondentModel).toBe(MODELS.SONNET);
  });

  it("resume tops up to the new target, asking only the shortfall", async () => {
    const store = new MemoryStore();
    const llm = stubLlm();
    const [first] = await runInterviews({
      plan: "paper-rock-scissors",
      models: ["stub-model"],
      repetitions: 2,
      store,
      llm,
    });
    expect(llm.calls).toBe(6);
    const resumed = await runInterviews({
      resume: [first!.id],
      repetitions: 4,
      store,
      llm,
    });
    expect(resumed).toHaveLength(1);
    const interview = resumed[0]!;
    expect(interview.id).toBe(first!.id);
    expect(interview.status).toBe("complete");
    expect(interview.repetitions).toBe(4);
    // Only the shortfall is asked: 3 items × (4 − 2) banked turns.
    expect(llm.calls).toBe(12);
    expect(interview.responses.throw!.values).toEqual([1, 1, 1, 1]);
    expect(interview.responses.rounds!.values).toEqual([5, 5, 5, 5]);
  });
});
