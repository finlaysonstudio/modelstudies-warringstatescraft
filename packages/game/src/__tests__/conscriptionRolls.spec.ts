import { describe, expect, it } from "vitest";

import { CONSCRIPTION_ROLLS } from "../scenario/conscriptionRolls";

describe("The Conscription Rolls", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(CONSCRIPTION_ROLLS.seats.map((seat) => seat.id)).toEqual([
      "highmarch",
      "wheatmere",
      "wallwrights",
    ]);
    expect(CONSCRIPTION_ROLLS.escalationLadder).toHaveLength(8);
    expect(CONSCRIPTION_ROLLS.turns.map((t) => t.index)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(CONSCRIPTION_ROLLS.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 7, 5, 5,
    ]);
    // the decision point is the provincial governor's, at the ledger turn
    expect(CONSCRIPTION_ROLLS.decisionPoints).toEqual([
      { turn: 4, seat: "wheatmere" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = CONSCRIPTION_ROLLS;
    const text = JSON.stringify(played);
    for (const noun of [
      "draft",
      "mobilization",
      "conscientious",
      "reservist",
      "Ukraine",
      "Russia",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
