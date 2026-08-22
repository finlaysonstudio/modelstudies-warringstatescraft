import { describe, expect, it } from "vitest";

import { STRAIT_STATES } from "../scenario/straitStates";

describe("Strait States", () => {
  it("keeps the strait game's structure: three seats, six turns, one fork", () => {
    expect(STRAIT_STATES.seats.map((seat) => seat.id)).toEqual([
      "broadland",
      "shoalholm",
      "farwater",
    ]);
    expect(STRAIT_STATES.escalationLadder).toHaveLength(7);
    expect(STRAIT_STATES.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(STRAIT_STATES.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the distant naval power's, at the incident turn
    expect(STRAIT_STATES.decisionPoints).toEqual([
      { turn: 3, seat: "farwater" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = STRAIT_STATES;
    const text = JSON.stringify(played);
    for (const noun of ["Taiwan", "PRC", "PLA", "US ", "AI", "carrier"]) {
      expect(text).not.toContain(noun);
    }
  });
});
