import { describe, expect, it } from "vitest";

import { buildMaterials } from "../materials";
import { TAIWAN_STRAIT } from "../scenario/taiwanStrait";

describe("buildMaterials", () => {
  const materials = buildMaterials(TAIWAN_STRAIT, { createdAt: "2026-08-20" });

  it("renders one system prompt per seat containing its brief and ladder", () => {
    expect(materials.seats).toHaveLength(3);
    for (const seat of materials.seats) {
      expect(seat.systemPrompt).toContain(seat.brief);
      expect(seat.systemPrompt).toContain("6. Open interstate war");
    }
  });

  it("renders an opening-state prompt per turn and marks the fork", () => {
    expect(materials.turns).toHaveLength(6);
    expect(materials.turns[0].prompt).toContain("This is the opening turn.");
    expect(materials.turns[0].prompt).toContain(TAIWAN_STRAIT.turns[0].inject);
    const fork = materials.turns.filter((turn) => turn.decisionPoint);
    expect(fork.map((turn) => [turn.index, turn.focalSeat])).toEqual([
      [3, "us"],
    ]);
  });

  it("carries the judge, narrator, consensus, and schema materials", () => {
    expect(materials.judgeSystem).toContain("escalation adjudicator");
    expect(materials.narratorSystem).toContain(TAIWAN_STRAIT.summary);
    expect(materials.consensusPrompt).toContain("ADVISOR 2:");
    expect(materials.memoSchema.required).toContain("redLines");
    expect(materials.consensusSchema.required).toContain("brokeOn");
    expect(materials.model).toBe("scenarios");
    expect(materials.id).toBe("taiwan-strait");
  });
});
