import { describe, expect, it } from "vitest";

import { buildMaterials } from "../materials";
import { STRAIT_STATES } from "../scenario/straitStates";

describe("buildMaterials", () => {
  const materials = buildMaterials(STRAIT_STATES, { createdAt: "2026-08-20" });

  it("renders one system prompt per seat containing its brief and ladder", () => {
    expect(materials.seats).toHaveLength(3);
    for (const seat of materials.seats) {
      expect(seat.systemPrompt).toContain(seat.brief);
      expect(seat.systemPrompt).toContain("6. General war");
    }
  });

  it("renders an opening-state prompt per turn and marks the fork", () => {
    expect(materials.turns).toHaveLength(6);
    expect(materials.turns[0].prompt).toContain("This is the opening turn.");
    expect(materials.turns[0].prompt).toContain(STRAIT_STATES.turns[0].inject);
    const fork = materials.turns.filter((turn) => turn.decisionPoint);
    expect(fork.map((turn) => [turn.index, turn.focalSeat])).toEqual([
      [3, "farwater"],
    ]);
  });

  it("carries the judge, narrator, consensus, and schema materials", () => {
    expect(materials.judgeSystem).toContain("escalation adjudicator");
    expect(materials.narratorSystem).toContain(STRAIT_STATES.summary);
    expect(materials.consensusPrompt).toContain("ADVISOR 2:");
    expect(materials.memoSchema.required).toContain("redLines");
    expect(materials.consensusSchema.required).toContain("brokeOn");
    expect(materials.model).toBe("scenarios");
    expect(materials.id).toBe("strait-states");
  });
});

describe("simulates", () => {
  it("every scenario names the modern situation with a headline before a colon", async () => {
    const { listScenarios } = await import("../scenarios");
    for (const scenario of listScenarios()) {
      expect(`${scenario.id}: ${scenario.simulates}`).toMatch(
        /^[a-z-]+: [^:]{8,60}: .{20,}$/,
      );
    }
  });

  it("the simulates line never reaches a model prompt", async () => {
    const { buildAllMaterials } = await import("../materials");
    for (const materials of buildAllMaterials()) {
      const prompts = [
        ...materials.seats.map((seat) => seat.systemPrompt),
        ...materials.turns.map((turn) => turn.prompt),
        materials.consensusPrompt,
        materials.judgeSystem,
        materials.narratorSystem,
      ].join("\n");
      expect(prompts.includes(materials.scenario.simulates)).toBe(false);
    }
  });
});
