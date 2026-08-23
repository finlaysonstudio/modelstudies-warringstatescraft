import { describe, expect, it } from "vitest";

import { buildMaterials, materialsId } from "../materials";
import { STRAIT_STATES } from "../scenario/straitStates";
import { getScenario } from "../scenarios";
import { MODERN_NOUNS } from "./chapter";

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
      [3, "qi"],
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
    expect(materials.base).toBe("strait-states");
    expect(materials.naming).toBe("chronicle");
    expect(materials.language).toBe("en");
  });

  it("lists every rendering of the prologue, the default first", () => {
    expect(materials.renderings.map((rendering) => rendering.id)).toEqual([
      "strait-states",
      "strait-states.zh",
      "strait-states.masked",
      "strait-states.masked.zh",
      "strait-states.modern",
      "strait-states.modern.zh",
    ]);
    expect(materials.cast.map((member) => member.seat)).toEqual([
      "wu",
      "yue",
      "qi",
    ]);
  });

  it("renders a rendering under its own id with its own names and strings", () => {
    const masked = buildMaterials(
      getScenario("strait-states", { naming: "masked", language: "zh" }),
      { createdAt: "2026-08-20" },
    );
    expect(masked.id).toBe("strait-states.masked.zh");
    expect(masked.base).toBe("strait-states");
    expect(masked.seats.map((seat) => seat.name)).toEqual([
      "广陆",
      "沙屿",
      "盐海",
    ]);
    expect(masked.judgeSystem).not.toContain("escalation adjudicator");
    expect(masked.memoSchema.properties.decision.description).not.toBe(
      materials.memoSchema.properties.decision.description,
    );
  });
});

describe("materialsId", () => {
  it("suffixes the naming and language only when not the default", () => {
    expect(materialsId("x")).toBe("x");
    expect(materialsId("x", { language: "zh" })).toBe("x.zh");
    expect(materialsId("x", { naming: "masked" })).toBe("x.masked");
    expect(materialsId("x", { naming: "modern", language: "zh" })).toBe(
      "x.modern.zh",
    );
  });
});

describe("simulates", () => {
  it("every scenario names the modern situation with a headline before a colon", async () => {
    const { listScenarios } = await import("../scenarios");
    for (const scenario of listScenarios()) {
      expect(`${scenario.id}: ${scenario.simulates}`).toMatch(
        /^[a-z0-9-]+: [^:]{8,60}: .{20,}$/,
      );
    }
  });

  it("no modern noun reaches a period prompt in any rendering", async () => {
    const { buildAllMaterials } = await import("../materials");
    for (const materials of buildAllMaterials()) {
      // the modern-noun twin and the Lamparth cells are modern on purpose
      if (
        materials.base === "taiwan-strait" ||
        materials.base.startsWith("lamparth-2024-") ||
        materials.naming === "modern"
      ) {
        continue;
      }
      const prompts = [
        ...materials.seats.map((seat) => seat.systemPrompt),
        ...materials.turns.map((turn) => turn.prompt),
        materials.consensusPrompt,
        materials.judgeSystem,
        materials.narratorSystem,
      ].join("\n");
      for (const noun of MODERN_NOUNS) {
        const pattern = /[\u3400-\u9fff]/.test(noun)
          ? new RegExp(noun)
          : new RegExp(`\\b${noun}\\b`, "i");
        expect(prompts, `${materials.id}: ${noun}`).not.toMatch(pattern);
      }
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
