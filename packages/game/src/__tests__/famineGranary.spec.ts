import { describe, expect, it } from "vitest";

import { FAMINE_GRANARY } from "../scenario/famineGranary";

describe("The Famine Granary", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(FAMINE_GRANARY.seats.map((seat) => seat.id)).toEqual([
      "dryfold",
      "fullbarn",
      "millford",
    ]);
    expect(FAMINE_GRANARY.escalationLadder).toHaveLength(8);
    expect(FAMINE_GRANARY.turns.map((t) => t.index)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(FAMINE_GRANARY.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the granary court's, at the granary gate turn
    expect(FAMINE_GRANARY.decisionPoints).toEqual([
      { turn: 3, seat: "fullbarn" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = FAMINE_GRANARY;
    const text = JSON.stringify(played);
    for (const noun of [
      "earthquake",
      "epidemic",
      "humanitarian",
      "NGO",
      "sanctions",
      "airlift",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
