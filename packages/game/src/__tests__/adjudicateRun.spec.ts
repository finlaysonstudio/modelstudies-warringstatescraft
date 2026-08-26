import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import {
  adjudicateRun,
  adjudicationCoverage,
  applyAdjudications,
  panelIdOf,
  parentOfAdjudication,
  planAdjudication,
} from "../adjudicateRun";
import { usageOf, usageOfAdjudications } from "../cost";
import { getScenario } from "../scenarios";
import { CORRIDOR_STATES } from "../scenario/corridorStates";
import type { Adjudication, Run, TurnRecord } from "../types";

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
}

const scenario = getScenario(CORRIDOR_STATES.id);
const seat = scenario.seats[0].id;

const turn = (index: number, level: number): TurnRecord => ({
  index,
  title: `Turn ${index}`,
  inject: `Inject ${index}.`,
  briefs: [
    {
      seat,
      model: "model-a",
      memo: {
        situation: "",
        options: [],
        decision: `Decision ${index}.`,
        rationale: `Rationale ${index}.`,
        redLines: [],
      },
      usage: [
        {
          input: 10,
          output: 5,
          reasoning: 0,
          total: 15,
          model: "model-a",
          usd: 0.001,
        },
      ],
    },
  ],
  adjudication: {
    panel: [
      {
        judge: "escalation",
        model: "model-a",
        verdict: { escalation: level, reasoning: "as played", flags: [] },
        usage: [
          {
            input: 20,
            output: 6,
            reasoning: 0,
            total: 26,
            model: "model-a",
            usd: 0.002,
          },
        ],
      },
    ],
    mode: "median",
    escalation: level,
    narrative: `Narrative ${index}.`,
    narratorUsage: [
      {
        input: 30,
        output: 40,
        reasoning: 0,
        total: 70,
        model: "model-a",
        usd: 0.003,
      },
    ],
  },
});

const run = (over: Partial<Run> = {}): Run => ({
  id: "run_root",
  model: "runs",
  scenario: scenario.id,
  scenarioTitle: scenario.title,
  createdAt: "2026-08-25",
  status: "complete",
  roster: Object.fromEntries(
    scenario.seats.map((entry) => [entry.id, "model-a"]),
  ),
  narrator: "model-a",
  panel: { judges: ["model-a"], mode: "median" },
  escalationLadder: [...scenario.escalationLadder],
  branch: {
    parent: null,
    lane: "root",
    decidedBy: null,
    point: null,
    seed: null,
  },
  children: [],
  turns: [turn(1, 1), turn(2, 3), turn(3, 5)],
  debriefs: [],
  ...over,
});

/** every judge call answers rung 7 and records the prompt it read */
const panelLlm = (
  prompts: string[] = [],
  systems: string[] = [],
): LlmClient => ({
  async operate(prompt: string, options?: LlmOperateOptions) {
    if (!options?.format) throw new Error("a re-scoring never narrates");
    prompts.push(prompt);
    systems.push(options.system ?? "");
    return {
      content: { escalation: 7, reasoning: "re-scored", flags: [] },
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

describe("panelIdOf", () => {
  it("does not move with the order the judges were typed in", () => {
    expect(panelIdOf({ judges: ["a", "b", "c"], mode: "median" })).toBe(
      panelIdOf({ judges: ["c", "a", "b"], mode: "median" }),
    );
  });

  it("moves with the judges and with the mode", () => {
    expect(panelIdOf({ judges: ["a", "b"], mode: "median" })).not.toBe(
      panelIdOf({ judges: ["a", "c"], mode: "median" }),
    );
  });
});

describe("the truncation rule", () => {
  it("shows turn i the record before it and nothing of itself or after", async () => {
    const prompts: string[] = [];
    const store = new MemoryStore();
    await adjudicateRun({
      run: run(),
      panel: { judges: ["judge-x"], mode: "median" },
      panelId: "fixed",
      llm: panelLlm(prompts),
      store,
    });
    expect(prompts).toHaveLength(3);

    // turn 1 opens: no prior turn at all
    expect(prompts[0]).not.toContain("Narrative 1.");
    expect(prompts[0]).toContain("Decision 1.");

    // turn 2 reads turn 1's narrative and rung, not its own and not turn 3's
    expect(prompts[1]).toContain("Narrative 1.");
    expect(prompts[1]).not.toContain("Narrative 2.");
    expect(prompts[1]).not.toContain("Narrative 3.");
    expect(prompts[1]).toContain("Decision 2.");
    expect(prompts[1]).not.toContain("Decision 3.");

    expect(prompts[2]).toContain("Narrative 2.");
    expect(prompts[2]).not.toContain("Narrative 3.");
  });

  it("anchors the new panel on the rungs the seats played against", async () => {
    const prompts: string[] = [];
    await adjudicateRun({
      run: run(),
      panel: { judges: ["judge-x"], mode: "median" },
      panelId: "fixed",
      llm: panelLlm(prompts),
      store: new MemoryStore(),
    });
    // turn 1 was played at rung 1 and the re-scoring calls it 7; turn 2's
    // prompt still carries the 1, because that is the record the seats saw
    expect(prompts[1]).toContain(scenario.escalationLadder[1]);
    expect(prompts[1]).not.toContain(scenario.escalationLadder[7]);
  });
});

describe("adjudicateRun", () => {
  it("stores the scores beside the run and never touches the run", async () => {
    const store = new MemoryStore();
    const source = run();
    const { adjudication, built, calls } = await adjudicateRun({
      run: source,
      panel: { judges: ["judge-x", "judge-y"], mode: "median" },
      panelId: "fixed",
      llm: panelLlm(),
      store,
    });
    expect(built).toBe(true);
    expect(calls).toBe(6);
    expect(adjudication.id).toBe("run_root.fixed");
    expect(adjudication.model).toBe("adjudications");
    expect(adjudication.scope).toBe("run_root");
    expect(adjudication.turns.map((score) => score.index)).toEqual([1, 2, 3]);
    expect(adjudication.turns.every((score) => score.escalation === 7)).toBe(
      true,
    );
    expect(store.entities.has("runs/run_root")).toBe(false);
    expect(source.turns[0].adjudication!.escalation).toBe(1);
  });

  it("returns the scoring on record unless forced", async () => {
    const store = new MemoryStore();
    const options = {
      run: run(),
      panel: { judges: ["judge-x"], mode: "median" as const },
      panelId: "fixed",
      llm: panelLlm(),
      store,
    };
    await adjudicateRun(options);
    const second = await adjudicateRun(options);
    expect(second.built).toBe(false);
    expect(second.calls).toBe(0);
    const forced = await adjudicateRun({ ...options, force: true });
    expect(forced.built).toBe(true);
    expect(forced.calls).toBe(3);
  });

  it("refuses a run that is not complete, and one with no turns", async () => {
    const store = new MemoryStore();
    const options = {
      panel: { judges: ["judge-x"], mode: "median" as const },
      llm: panelLlm(),
      store,
    };
    await expect(
      adjudicateRun({ ...options, run: run({ status: "active" }) }),
    ).rejects.toThrow(/only a complete run/);
    await expect(
      adjudicateRun({ ...options, run: run({ turns: [] }) }),
    ).rejects.toThrow(/no turns/);
  });

  it("scores a zh run on the zh ladder, by the zh prompt", async () => {
    const prompts: string[] = [];
    const systems: string[] = [];
    const zh = getScenario(CORRIDOR_STATES.id, { language: "zh" });
    await adjudicateRun({
      run: run({ language: "zh", escalationLadder: [...zh.escalationLadder] }),
      panel: { judges: ["judge-x"], mode: "median" },
      panelId: "fixed",
      llm: panelLlm(prompts, systems),
      store: new MemoryStore(),
    });
    expect(systems[0]).toContain(zh.escalationLadder[1]);
    expect(systems[0]).not.toContain(scenario.escalationLadder[1]);
    // the prior-turn header names the rung the run was played at, in zh
    expect(prompts[1]).toContain(zh.escalationLadder[1]);
    expect(prompts[1]).not.toContain(scenario.escalationLadder[1]);
  });

  it("has no score where no judge answered", async () => {
    const broken: LlmClient = {
      async operate() {
        throw new Error("judge is down");
      },
    };
    const { adjudication } = await adjudicateRun({
      run: run(),
      panel: { judges: ["judge-x"], mode: "median" },
      panelId: "fixed",
      llm: broken,
      store: new MemoryStore(),
    });
    expect(adjudication.turns.every((score) => score.unscored)).toBe(true);
    expect(adjudication.turns.every((score) => score.escalation === 0)).toBe(
      true,
    );
  });
});

describe("inherited turns", () => {
  const point = { turn: 3, seat };
  const child = (): Run =>
    run({
      id: "run_child",
      branch: {
        parent: "run_root",
        lane: "independent",
        decidedBy: "model-b",
        point,
        seed: null,
      },
    });

  it("marks the pre-fork turns of a child as inherited", () => {
    const plans = planAdjudication(
      child(),
      parentOfAdjudication({
        id: "run_root.fixed",
        model: "adjudications",
        runId: "run_root",
        scenario: scenario.id,
        panelId: "fixed",
        panel: { judges: ["judge-x"], mode: "median" },
        createdAt: "",
        turns: [1, 2, 3].map((index) => ({
          index,
          panel: [],
          mode: "median" as const,
          escalation: 9,
        })),
      }),
    );
    expect(plans.map((plan) => plan.inherited)).toEqual([true, true, false]);
  });

  it("copies the parent's scores and makes no call for them", async () => {
    const store = new MemoryStore();
    const prompts: string[] = [];
    const panel = { judges: ["judge-x"], mode: "median" as const };
    const { adjudication: parent } = await adjudicateRun({
      run: run(),
      panel,
      panelId: "fixed",
      llm: panelLlm(),
      store,
    });
    const { adjudication, calls } = await adjudicateRun({
      run: child(),
      parent,
      panel,
      panelId: "fixed",
      llm: panelLlm(prompts),
      store,
    });
    expect(calls).toBe(1);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain("Decision 3.");
    expect(adjudication.turns.map((score) => Boolean(score.inherited))).toEqual(
      [true, true, false],
    );
    expect(adjudication.turns[0].escalation).toBe(parent.turns[0].escalation);
  });

  it("counts an inherited turn's calls on the parent, never twice", async () => {
    const store = new MemoryStore();
    const panel = { judges: ["judge-x"], mode: "median" as const };
    const { adjudication: parent } = await adjudicateRun({
      run: run(),
      panel,
      panelId: "fixed",
      llm: panelLlm(),
      store,
    });
    const { adjudication } = await adjudicateRun({
      run: child(),
      parent,
      panel,
      panelId: "fixed",
      llm: panelLlm(),
      store,
    });
    const fold = usageOfAdjudications([parent, adjudication]);
    expect(fold.total.calls).toBe(4);
  });

  it("scores a turn itself when the parent has no score for it", () => {
    const plans = planAdjudication(child(), {
      runId: "run_root",
      indexes: [1],
    });
    expect(plans.map((plan) => plan.inherited)).toEqual([true, false, false]);
  });
});

describe("applyAdjudications", () => {
  const scoring = (over: Partial<Adjudication> = {}): Adjudication => ({
    id: "run_root.fixed",
    model: "adjudications",
    scope: "run_root",
    runId: "run_root",
    scenario: scenario.id,
    panelId: "fixed",
    panel: { judges: ["judge-x"], mode: "median" },
    createdAt: "2026-08-25",
    turns: [1, 2, 3].map((index) => ({
      index,
      panel: [
        {
          judge: "escalation",
          model: "judge-x",
          verdict: { escalation: 7, reasoning: "re-scored", flags: [] },
          usage: [
            {
              input: 100,
              output: 20,
              reasoning: 0,
              total: 120,
              model: "judge-x",
              usd: 0.01,
            },
          ],
        },
      ],
      mode: "median" as const,
      escalation: 7,
    })),
    ...over,
  });

  it("swaps the score and keeps the narrative the seats played against", () => {
    const [overlaid] = applyAdjudications([run()], [scoring()]);
    expect(overlaid.turns.map((turn) => turn.adjudication!.escalation)).toEqual(
      [7, 7, 7],
    );
    expect(overlaid.turns[0].adjudication!.narrative).toBe("Narrative 1.");
    expect(overlaid.turns[0].adjudication!.panel[0].model).toBe("judge-x");
    expect(overlaid.panel!.judges).toEqual(["judge-x"]);
  });

  it("leaves the run on disk alone", () => {
    const source = run();
    applyAdjudications([source], [scoring()]);
    expect(source.turns[0].adjudication!.escalation).toBe(1);
    expect(source.panel!.judges).toEqual(["model-a"]);
  });

  it("keeps the re-scoring's spend off the run's own fold", () => {
    const source = run();
    const before = usageOf(source).total;
    const [overlaid] = applyAdjudications([source], [scoring()]);
    const after = usageOf(overlaid).total;
    expect(after.usd).toBeCloseTo(before.usd - 3 * 0.002, 10);
    // the narrator's calls are the run's own and survive
    expect(after.calls).toBe(before.calls - 3);
    expect(usageOfAdjudications([scoring()]).total.usd).toBeCloseTo(0.03, 10);
  });

  it("returns an unmatched run as it is, and counts it", () => {
    const other = run({ id: "run_other" });
    const runs = [run(), other];
    const overlaid = applyAdjudications(runs, [scoring()]);
    expect(overlaid[1]).toBe(other);
    expect(adjudicationCoverage(runs, [scoring()])).toEqual({
      runs: 1,
      of: 2,
    });
  });

  it("carries an unscored turn across as unscored", () => {
    const set = scoring();
    set.turns[1] = {
      index: 2,
      panel: [],
      mode: "median",
      escalation: 0,
      unscored: true,
    };
    const [overlaid] = applyAdjudications([run()], [set]);
    expect(overlaid.turns[1].adjudication!.unscored).toBe(true);
    expect(overlaid.turns[0].adjudication!.unscored).toBeUndefined();
  });
});
