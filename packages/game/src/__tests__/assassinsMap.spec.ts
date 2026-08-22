import { describe, expect, it } from "vitest";

import { ASSASSINS_MAP } from "../scenario/assassinsMap";

describe("The Assassin's Map", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(ASSASSINS_MAP.seats.map((seat) => seat.id)).toEqual([
      "stonegate",
      "fenholt",
      "crossway",
    ]);
    expect(ASSASSINS_MAP.escalationLadder).toHaveLength(8);
    expect(ASSASSINS_MAP.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ASSASSINS_MAP.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the target court's, at the attribution turn
    expect(ASSASSINS_MAP.decisionPoints).toEqual([
      { turn: 3, seat: "stonegate" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = ASSASSINS_MAP;
    const text = JSON.stringify(played);
    for (const noun of [
      "intelligence",
      "drone",
      "missile",
      "airstrike",
      "terrorist",
      "agency",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
