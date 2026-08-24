import type { EntityLike, Store } from "@modelstudies/workflows";
import { describe, expect, it } from "vitest";

import {
  estimateFielding,
  estimateSitting,
  HEURISTIC_ANSWER_OUTPUT,
  HEURISTIC_PROBE_OUTPUT,
  heuristicFigures,
  measureUsage,
} from "../estimate";
import { buildInstrument } from "../instrument";

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
    this.entities.set(`${entity.model}/${entity.id}`, entity);
    return entity;
  }
}

const PRICES = { "priced-model": { input: 1, output: 10 } };

describe("estimateSitting", () => {
  it("prices the heuristic figures per call and names the source", () => {
    const instrument = buildInstrument({ plan: "paper-rock-scissors" });
    const heuristic = heuristicFigures(instrument);
    const estimate = estimateSitting({
      instrument,
      model: "priced-model",
      repetitions: 2,
      explain: true,
      prices: PRICES,
    });
    const turns = instrument.items.length * 2;
    expect(estimate.calls).toBe(turns * 2);
    expect(estimate.answer.source).toBe("heuristic");
    expect(estimate.answer.output).toBe(HEURISTIC_ANSWER_OUTPUT);
    expect(estimate.probe?.output).toBe(HEURISTIC_PROBE_OUTPUT);
    expect(estimate.input).toBe(
      turns * heuristic.answer!.input + turns * heuristic.probe!.input,
    );
    // $1 per M input, $10 per M output
    expect(estimate.usd).toBeCloseTo(
      (estimate.input * 1 + estimate.output * 10) / 1e6,
      6,
    );
  });

  it("reads an unpriced model as null and reports it on the fielding", async () => {
    const estimate = await estimateFielding({
      plan: "paper-rock-scissors",
      models: ["priced-model", "mystery-model"],
      repetitions: 1,
      prices: PRICES,
    });
    expect(estimate.sittings[1]!.usd).toBeNull();
    expect(estimate.unpriced).toEqual(["mystery-model"]);
    expect(estimate.usd).toBe(estimate.sittings[0]!.usd);
    expect(estimate.calls).toBe(6);
  });

  it("measures tokens per call from a prior sitting of the model", async () => {
    const store = new MemoryStore();
    await store.create({
      id: "prior",
      model: "interview",
      scope: "apex",
      plan: "crisis",
      respondent: "priced-model",
      respondentModel: "priced-model",
      status: "complete",
      responses: {
        e1: {
          name: "e1",
          value: 1,
          values: [1, 1],
          usage: [
            [{ input: 300, output: 20, reasoning: 0, total: 320 }],
            [{ input: 500, output: 40, reasoning: 0, total: 540 }],
          ],
          ms: [1000, 3000],
        },
      },
    });
    await store.create({
      id: "prior#e1",
      model: "probe",
      scope: "prior",
      category: "explanation",
      name: "e1",
      query: "Why?",
      responses: ["a", "b"],
      usage: [[{ input: 400, output: 200, reasoning: 0, total: 600 }], null],
      ms: [4000, null],
    });
    const measured = await measureUsage({ store, model: "priced-model" });
    expect(measured.answer).toEqual({
      input: 400,
      output: 30,
      source: "measured",
      n: 2,
    });
    expect(measured.probe).toEqual({
      input: 400,
      output: 200,
      source: "measured",
      n: 1,
    });
    expect(measured.answerMs).toBe(2000);
    expect(measured.probeMs).toBe(4000);
    const estimate = await estimateFielding({
      plan: "paper-rock-scissors",
      models: ["priced-model", "other-model"],
      repetitions: 3,
      explain: true,
      store,
      prices: PRICES,
    });
    expect(estimate.sittings[0]!.answer.source).toBe("measured");
    expect(estimate.sittings[0]!.input).toBe(9 * 400 + 9 * 400);
    expect(estimate.sittings[1]!.answer.source).toBe("heuristic");
    // serial wall clock at the measured rates; the fielding takes its longest sitting
    expect(estimate.sittings[0]!.ms).toBe(9 * 2000 + 9 * 4000);
    expect(estimate.sittings[1]!.ms).toBeNull();
    expect(estimate.wallMs).toBe(54000);
  });

  it("estimates an arm on its own items with the arm's prompt", async () => {
    const whole = await estimateFielding({
      plan: "crisis-situated",
      models: ["priced-model"],
      repetitions: 12,
      explain: true,
      prices: PRICES,
    });
    const crux = await estimateFielding({
      plan: "crisis-situated",
      models: ["priced-model"],
      repetitions: 12,
      explain: true,
      items: buildInstrument({ plan: "crisis-situated" }).subsets!.crux,
      prices: PRICES,
    });
    const informed = await estimateFielding({
      plan: "crisis-situated",
      arm: "informed",
      models: ["priced-model"],
      repetitions: 12,
      explain: true,
      prices: PRICES,
    });
    const zh = await estimateFielding({
      plan: "crisis-situated",
      arm: "zh",
      models: ["priced-model"],
      repetitions: 12,
      explain: true,
      prices: PRICES,
    });
    expect(whole.sittings[0]!.items).toBe(88);
    expect(informed.arm).toBe("informed");
    expect(informed.sittings[0]!.arm).toBe("informed");
    expect(informed.sittings[0]!.items).toBe(12);
    expect(informed.calls).toBe(crux.calls);
    // the appended line lengthens every answer prompt
    expect(informed.sittings[0]!.answer.input).toBeGreaterThan(
      crux.sittings[0]!.answer.input,
    );
    // the zh probe is the arm's
    expect(zh.sittings[0]!.probe!.input).not.toBe(
      crux.sittings[0]!.probe!.input,
    );
    await expect(
      estimateFielding({
        plan: "crisis-situated",
        arm: "nope",
        models: ["priced-model"],
        repetitions: 1,
      }),
    ).rejects.toThrow(/Unknown arm/);
  });
});
