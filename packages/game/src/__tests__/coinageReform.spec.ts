import { describe, expect, it } from "vitest";

import { COINAGE_REFORM } from "../scenario/coinageReform";

describe("The Coinage Reform", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(COINAGE_REFORM.seats.map((seat) => seat.id)).toEqual([
      "stonegate",
      "eastreach",
      "crossmere",
    ]);
    expect(COINAGE_REFORM.escalationLadder).toHaveLength(8);
    expect(COINAGE_REFORM.turns.map((t) => t.index)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(COINAGE_REFORM.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 6, 7, 5, 5,
    ]);
    // the decision point is the merchant city's, at the turn the tables must choose
    expect(COINAGE_REFORM.decisionPoints).toEqual([
      { turn: 4, seat: "crossmere" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = COINAGE_REFORM;
    const text = JSON.stringify(played);
    for (const noun of [
      "dollar",
      "SWIFT",
      "sanction",
      "reserve currency",
      "yuan",
      "central bank",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
