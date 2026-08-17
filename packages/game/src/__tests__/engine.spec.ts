import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import { GameEngine } from "../engine";
import { buildScorecard } from "../metrics";
import type { Run } from "../types";

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
      scenario: "taiwan-strait",
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
      expect(child!.roster.us).toBe(child!.branch.decidedBy);
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

  it("resumes a run from stored state", async () => {
    const store = new MemoryStore();
    const engine = new GameEngine({
      llm: stubLlm,
      maxTurns: 2,
      roster: ["model-a"],
      scenario: "taiwan-strait",
      store,
    });
    const first = await engine.play();
    expect(first.status).toBe("complete");
    const again = await engine.play(first.id);
    expect(again.turns).toHaveLength(2);
  });
});
