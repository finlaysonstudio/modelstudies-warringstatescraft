import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import { GameEngine } from "../engine";
import { buildScorecard } from "../metrics";
import { HUMAN_MODEL, MASKED_MODEL } from "../types";
import type { HumanPrompt, Run } from "../types";

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

/** returns a decision memo unless the prompt is a judge/narrator/debrief call */
const stubLlm: LlmClient = {
  async operate(prompt: string, options?: LlmOperateOptions) {
    if (options?.system?.includes("escalation adjudicator")) {
      return { content: { escalation: 2, reasoning: "test", flags: [] } };
    }
    if (options?.system?.includes("game master narrator")) {
      return { content: "The turn resolves quietly." };
    }
    if (prompt.includes("Write a candid")) {
      return { content: "Debrief text." };
    }
    if (prompt.includes("CONSENSUS decision")) {
      return {
        content: {
          ...memo(`consensus by ${options?.model}`),
          deferredOn: ["convoy pace"],
          brokeOn: [],
        },
      };
    }
    return { content: memo(`decision by ${options?.model}`) };
  },
};

describe("GameEngine", () => {
  it("plays turns, branches n·2 at the decision point, and completes children", async () => {
    const store = new MemoryStore();
    const roster = ["model-a", "model-b", "model-c"];
    const engine = new GameEngine({
      llm: stubLlm,
      maxTurns: 4,
      roster,
      scenario: "strait-states",
      store,
    });
    const root = await engine.play();

    expect(root.status).toBe("complete");
    expect(root.statusDetail).toContain("branched at turn 3");
    // turns 1-2 adjudicated, turn 3 is the decision matrix
    expect(root.turns).toHaveLength(3);
    expect(root.turns[0].adjudication?.escalation).toBe(2);
    expect(root.turns[2].adjudication).toBeUndefined();
    // decision matrix: 2 non-focal + 3 independent + 3 consensus
    expect(root.turns[2].briefs).toHaveLength(8);
    expect(root.children).toHaveLength(6);

    const children = await Promise.all(
      root.children.map((id) => store.get<Run>("runs", id)),
    );
    for (const child of children) {
      expect(child).toBeDefined();
      expect(child!.status).toBe("complete");
      expect(child!.turns).toHaveLength(4); // seeded turn 3 + turn 4
      expect(child!.turns[2].adjudication).toBeDefined();
      expect(child!.debriefs).toHaveLength(3);
      expect(child!.roster.qi).toBe(child!.branch.decidedBy);
      expect(child!.branch.parent).toBe(root.id);
    }
    const lanes = children.map((child) => child!.branch.lane);
    expect(lanes.filter((lane) => lane === "independent")).toHaveLength(3);
    expect(lanes.filter((lane) => lane === "consensus")).toHaveLength(3);

    const scorecard = await buildScorecard({ rootId: root.id, store });
    expect(scorecard.branches).toHaveLength(6);
    expect(scorecard.conformity).toHaveLength(3);
    expect(scorecard.conformity[0].changed).toBe(true);
    expect(scorecard.divergence.turnIndexes.length).toBeGreaterThan(0);
  });

  it("seats models explicitly and adds two human lanes at the fork", async () => {
    const store = new MemoryStore();
    const prompts: HumanPrompt[] = [];
    const engine = new GameEngine({
      human: {
        async decide(prompt) {
          prompts.push(prompt);
          return {
            ...memo(`human ${prompt.kind} in ${prompt.runId}`),
            ...(prompt.kind === "informed"
              ? { consensus: { deferredOn: ["advisor 2"], brokeOn: [] } }
              : {}),
          };
        },
      },
      llm: stubLlm,
      maxTurns: 5,
      roster: ["model-a", "model-b"],
      scenario: "corridor-states",
      seats: { qin: "model-b", zhao: "model-a" },
      store,
    });
    const root = await engine.play();

    expect(root.roster).toEqual({
      qin: "model-b",
      zhao: "model-a",
      qi: "model-a",
    });
    expect(root.statusDetail).toContain("branched at turn 4 (qi)");
    // 2 non-focal + 2 independent + 2 consensus + blind + informed
    expect(root.turns[3].briefs).toHaveLength(8);
    expect(root.children).toHaveLength(6);

    const blind = prompts.find((prompt) => prompt.kind === "blind");
    const informed = prompts.find((prompt) => prompt.kind === "informed");
    expect(blind?.candidates).toBeUndefined();
    expect(blind?.prompt).toContain("TURN 4");
    expect(informed?.candidates).toHaveLength(2);
    expect(informed?.prompt).toContain("ADVISOR 2");

    const children = await Promise.all(
      root.children.map((id) => store.get<Run>("runs", id)),
    );
    const humanChildren = children.filter(
      (child) => child!.branch.decidedBy === HUMAN_MODEL,
    );
    expect(humanChildren).toHaveLength(2);
    expect(humanChildren.map((child) => child!.branch.lane).sort()).toEqual([
      "consensus",
      "independent",
    ]);
    for (const child of humanChildren) {
      // the human keeps the focal seat through turn 5 in their own branches
      expect(child!.status).toBe("complete");
      expect(child!.roster.qi).toBe(HUMAN_MODEL);
      expect(child!.turns[4].briefs.find((b) => b.seat === "qi")?.model).toBe(
        HUMAN_MODEL,
      );
      expect(child!.debriefs.find((d) => d.seat === "qi")?.text).toContain(
        "human",
      );
    }
    // blind + informed + one turn-5 memo per human branch
    expect(prompts.map((prompt) => prompt.kind).sort()).toEqual([
      "blind",
      "informed",
      "turn",
      "turn",
    ]);
  });

  it("rejects a human seat without a human player", () => {
    expect(
      () =>
        new GameEngine({
          llm: stubLlm,
          roster: ["model-a"],
          scenario: "corridor-states",
          seats: { qi: HUMAN_MODEL },
          store: new MemoryStore(),
        }),
    ).toThrow(/human/);
  });

  it("resumes a run from stored state", async () => {
    const store = new MemoryStore();
    const engine = new GameEngine({
      llm: stubLlm,
      maxTurns: 2,
      roster: ["model-a"],
      scenario: "strait-states",
      store,
    });
    const first = await engine.play();
    expect(first.status).toBe("complete");
    const again = await engine.play(first.id);
    expect(again.turns).toHaveLength(2);
  });

  it("forks at the start into one branch per matrix combination", async () => {
    const store = new MemoryStore();
    const prompts: HumanPrompt[] = [];
    const root = await new GameEngine({
      human: {
        decide: async (prompt) => {
          prompts.push(prompt);
          return memo(`human in ${prompt.runId}`);
        },
      },
      llm: stubLlm,
      matrix: {
        qin: ["model-a", "model-b"],
        zhao: ["model-a"],
        qi: ["model-b", HUMAN_MODEL],
      },
      maxTurns: 2,
      scenario: "corridor-states",
      store,
    }).play();

    expect(root.matrix).toBeDefined();
    expect(root.turns).toHaveLength(0);
    expect(root.status).toBe("complete");
    expect(root.statusDetail).toContain("forked at start into 4 branches");
    expect(root.children).toHaveLength(4);

    const children = await Promise.all(
      root.children.map((id) => store.get<Run>("runs", id)),
    );
    const rosters = children.map((child) => child!.roster);
    expect(rosters).toContainEqual({
      qin: "model-a",
      zhao: "model-a",
      qi: "model-b",
    });
    expect(rosters).toContainEqual({
      qin: "model-b",
      zhao: "model-a",
      qi: HUMAN_MODEL,
    });
    for (const child of children) {
      expect(child!.branch.lane).toBe("matrix");
      expect(child!.branch.parent).toBe(root.id);
      expect(child!.status).toBe("complete");
      // no decision-point fork inside a matrix branch
      expect(child!.children).toHaveLength(0);
      expect(child!.turns).toHaveLength(2);
      expect(child!.turns[1].adjudication).toBeDefined();
    }

    // the human plays every turn of the two branches they sit in
    expect(prompts).toHaveLength(4);
    const humanRuns = new Set(prompts.map((prompt) => prompt.runId));
    expect(humanRuns.size).toBe(2);
    const second = prompts.find((prompt) => prompt.turn.index === 2)!;
    // history is this branch's own line, and the table holds the other seats
    expect(second.history).toHaveLength(1);
    expect(second.history[0].adjudication?.narrative).toContain("quietly");
    expect(second.table?.map((brief) => brief.seat).sort()).toEqual([
      "qin",
      "zhao",
    ]);
    expect(second.roster.qi).toBe(HUMAN_MODEL);
    // the human never learns which model holds another seat or sat on the panel
    expect(second.roster.qin).toBe(MASKED_MODEL);
    expect(second.table?.every((brief) => brief.model === MASKED_MODEL)).toBe(
      true,
    );
    expect(
      second.history[0].briefs
        .filter((brief) => brief.seat !== "qi")
        .every((brief) => brief.model === MASKED_MODEL),
    ).toBe(true);
    expect(
      second.history[0].adjudication?.panel.every(
        (verdict) => verdict.model === MASKED_MODEL,
      ),
    ).toBe(true);
    // the stored run keeps the truth
    const humanRun = await store.get<Run>("runs", second.runId);
    expect(humanRun!.roster.qin).toMatch(/^model-/);
    expect(humanRun!.panel).toEqual({
      judges: ["model-a", "model-b"],
      mode: "median",
    });
    expect(humanRun!.narrator).toBe("model-a");
  });

  it("records the panel config and seats the human as judge and narrator", async () => {
    const store = new MemoryStore();
    const root = await new GameEngine({
      human: {
        decide: async () => {
          throw new Error("not seated");
        },
        judge: async (prompt) => {
          expect(prompt.turn.briefs.every((b) => b.model === "model")).toBe(
            true,
          );
          expect(prompt.escalationLadder.length).toBeGreaterThan(0);
          return { escalation: 99, reasoning: "too far", flags: ["over"] };
        },
        narrate: async (prompt) => {
          expect(prompt.panel.map((v) => v.model)).toEqual(["model", "human"]);
          return `human narration at ${prompt.escalation}`;
        },
      },
      llm: stubLlm,
      maxTurns: 1,
      narrator: "human",
      panel: { judges: ["model-b", "human"] },
      roster: ["model-a", "model-b"],
      scenario: "corridor-states",
      store,
    }).play();
    expect(root.panel).toEqual({
      judges: ["model-b", "human"],
      mode: "median",
    });
    expect(root.narrator).toBe("human");
    const adjudication = root.turns[0].adjudication!;
    expect(adjudication.panel.map((verdict) => verdict.model)).toEqual([
      "model-b",
      "human",
    ]);
    // the human's level is clamped to the ladder before it combines
    expect(adjudication.panel[1].verdict.escalation).toBe(
      root.escalationLadder.length - 1,
    );
    expect(adjudication.narrative).toBe(
      `human narration at ${adjudication.escalation}`,
    );
  });

  it("refuses a human judge or narrator without a human player", () => {
    const options = {
      llm: stubLlm,
      roster: ["model-a"],
      scenario: "corridor-states",
      store: new MemoryStore(),
    };
    expect(
      () => new GameEngine({ ...options, panel: { judges: ["human"] } }),
    ).toThrow(/human judge/);
    expect(() => new GameEngine({ ...options, narrator: "human" })).toThrow(
      /human narrator/,
    );
  });

  it("resumes a matrix root and finishes its active branches", async () => {
    const store = new MemoryStore();
    const options = {
      llm: stubLlm,
      matrix: {
        qin: ["model-a"],
        zhao: ["model-a"],
        qi: ["model-b"],
      },
      maxTurns: 1,
      scenario: "corridor-states",
      store,
    };
    const root = await new GameEngine(options).play();
    const again = await new GameEngine(options).play(root.id);
    expect(again.children).toEqual(root.children);
    const child = await store.get<Run>("runs", root.children[0]);
    expect(child!.turns).toHaveLength(1);
  });
});
