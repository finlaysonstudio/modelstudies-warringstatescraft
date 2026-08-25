import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import { adjudicateTurn } from "../adjudicate";
import { publicRecord } from "../briefs";
import { GameEngine } from "../engine";
import { buildScorecard } from "../metrics";
import { BASIC_REPORT } from "../reports/basic";
import type { BasicReport } from "../reports/basic";
import { getScenario } from "../scenarios";
import { CORRIDOR_STATES } from "../scenario/corridorStates";
import type { Run, Study, TurnRecord } from "../types";

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

const run = (turns: TurnRecord[] = []): Run => ({
  id: "run_test",
  model: "runs",
  scenario: scenario.id,
  scenarioTitle: scenario.title,
  createdAt: "2026-08-24",
  status: "active",
  roster: Object.fromEntries(
    scenario.seats.map((seat) => [seat.id, "model-a"]),
  ),
  escalationLadder: [...scenario.escalationLadder],
  branch: {
    parent: null,
    lane: "root",
    decidedBy: null,
    point: null,
    seed: null,
  },
  children: [],
  turns,
  debriefs: [],
});

const turnRecord = (): TurnRecord => ({
  index: 1,
  title: scenario.turns[0].title,
  inject: scenario.turns[0].inject,
  briefs: [
    {
      seat: scenario.seats[0].id,
      model: "model-a",
      memo: {
        situation: "",
        options: [],
        decision: "Hold the pass.",
        rationale: "It is the only road.",
        redLines: [],
      },
    },
  ],
});

/** every judge throws; the narrator answers */
const brokenPanel = (): LlmClient => ({
  async operate(_prompt: string, options?: LlmOperateOptions) {
    if (options?.format) throw new Error("judge is down");
    return { content: "The pass holds through the season." };
  },
});

describe("a panel that returns nothing usable", () => {
  it("records the absence instead of a fabricated rung 0", async () => {
    const adjudication = await adjudicateTurn({
      llm: brokenPanel(),
      panel: { judges: ["model-a", "model-b"], mode: "median" },
      narrator: "model-a",
      run: run(),
      scenario,
      turn: turnRecord(),
    });
    expect(adjudication.unscored).toBe(true);
    expect(adjudication.escalation).toBe(0);
    expect(adjudication.panel.every((entry) => entry.error)).toBe(true);
    expect(adjudication.narrative).toBe("The pass holds through the season.");
  });

  it("tells the narrator there is no consensus rather than naming rung 0", async () => {
    const prompts: string[] = [];
    const llm: LlmClient = {
      async operate(prompt: string, options?: LlmOperateOptions) {
        if (options?.format) throw new Error("judge is down");
        prompts.push(prompt);
        return { content: "Narrated." };
      },
    };
    await adjudicateTurn({
      llm,
      panel: { judges: ["model-a"], mode: "median" },
      narrator: "model-a",
      run: run(),
      scenario,
      turn: turnRecord(),
    });
    expect(prompts[0]).toContain("returned no usable escalation score");
    expect(prompts[0]).not.toContain("Panel escalation consensus");
    expect(prompts[0]).not.toContain(scenario.escalationLadder[0]);
  });

  it("stays scored when one judge among the errors is readable", async () => {
    let call = 0;
    const llm: LlmClient = {
      async operate(_prompt: string, options?: LlmOperateOptions) {
        if (!options?.format) return { content: "Narrated." };
        call += 1;
        if (call === 1) throw new Error("judge is down");
        return { content: { escalation: 4, reasoning: "fires", flags: [] } };
      },
    };
    const adjudication = await adjudicateTurn({
      llm,
      panel: { judges: ["model-a", "model-b"], mode: "median" },
      narrator: "model-a",
      run: run(),
      scenario,
      turn: turnRecord(),
    });
    expect(adjudication.unscored).toBeUndefined();
    expect(adjudication.escalation).toBe(4);
  });

  it("keeps the fabricated rung out of the next turn's prompt", () => {
    const scored = turnRecord();
    scored.adjudication = {
      panel: [],
      mode: "median",
      escalation: 3,
      narrative: "The column advances.",
    };
    expect(publicRecord(run([scored]), scenario)).toContain(
      `escalation: ${scenario.escalationLadder[3]}`,
    );

    const unscored = turnRecord();
    unscored.adjudication = {
      panel: [],
      mode: "median",
      escalation: 0,
      unscored: true,
      narrative: "The column advances.",
    };
    const record = publicRecord(run([unscored]), scenario);
    expect(record).toContain("(unscored)");
    expect(record).toContain("The column advances.");
    expect(record).not.toContain("escalation:");
    expect(record).not.toContain(scenario.escalationLadder[0]);
  });
});

describe("folds over an unscored turn", () => {
  const withTurns = (id: string, levels: (number | null)[]): Run => ({
    ...run(
      levels.map((level, index) => ({
        index: index + 1,
        title: `T${index + 1}`,
        inject: "",
        briefs: [],
        adjudication: {
          panel: [],
          mode: "median" as const,
          escalation: level ?? 0,
          ...(level === null ? { unscored: true as const } : {}),
          narrative: "",
        },
      })),
    ),
    id,
  });

  it("omits it from the basic report rather than counting a 0", async () => {
    const study: Study = {
      id: "study_test",
      model: "studies",
      title: "test",
      createdAt: "2026-08-24",
      status: "complete",
      report: "basic",
      scenarios: [scenario.id],
      models: ["model-a"],
      replicates: 1,
      arms: [
        {
          scenario: scenario.id,
          model: "model-a",
          replicate: 1,
          runId: "run_one",
          status: "complete",
        },
      ],
    };
    const clean = (await BASIC_REPORT.build({
      study,
      scenarios: [scenario],
      runs: [withTurns("run_one", [4, 4])],
      store: new MemoryStore(),
      bootstrap: 50,
      seed: 1,
    })) as BasicReport;
    expect(clean.byModel[0].peak.value).toBe(4);
    expect(clean.byModel[0].turns).toHaveLength(2);

    const holed = (await BASIC_REPORT.build({
      study,
      scenarios: [scenario],
      runs: [withTurns("run_one", [4, null])],
      store: new MemoryStore(),
      bootstrap: 50,
      seed: 1,
    })) as BasicReport;
    // the unscored turn drops out; a counted 0 would pull the mean to 2
    expect(holed.byModel[0].turns).toHaveLength(1);
    expect(holed.byModel[0].peak.value).toBe(4);
    expect(holed.byModel[0].final.value).toBe(4);
  });

  it("omits it from the branch scorecard", async () => {
    const store = new MemoryStore();
    const root = { ...run(), id: "run_root", children: ["run_child"] };
    const child: Run = {
      ...withTurns("run_child", [3, null]),
      branch: {
        parent: root.id,
        lane: "independent",
        decidedBy: "model-a",
        point: { turn: 1, seat: scenario.seats[0].id },
        seed: null,
      },
      status: "complete",
    };
    await store.update(root);
    await store.update(child);
    const scorecard = await buildScorecard({ rootId: root.id, store });
    expect(scorecard.branches[0].escalation).toEqual([3]);
    expect(scorecard.branches[0].peak).toBe(3);
    expect(scorecard.branches[0].final).toBe(3);
  });
});

describe("the engine with a broken panel", () => {
  it("marks the turn unscored and plays on", async () => {
    const llm: LlmClient = {
      async operate(prompt: string, options?: LlmOperateOptions) {
        if (options?.system?.includes("escalation adjudicator")) {
          throw new Error("judge is down");
        }
        if (options?.format) {
          return {
            content: {
              situation: "s",
              options: [],
              decision: "Hold the pass.",
              rationale: "r",
              redLines: [],
            },
          };
        }
        return { content: "Narrated." };
      },
    };
    const played = await new GameEngine({
      llm,
      maxTurns: 1,
      roster: ["model-a"],
      scenario: CORRIDOR_STATES.id,
      store: new MemoryStore(),
    }).play();
    const turns = played.turns.filter((turn) => turn.adjudication);
    expect(turns.length).toBeGreaterThan(0);
    for (const turn of turns) expect(turn.adjudication!.unscored).toBe(true);
  });
});
