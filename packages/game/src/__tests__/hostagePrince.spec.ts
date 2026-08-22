import { describe, expect, it } from "vitest";

import { HOSTAGE_PRINCE } from "../scenario/hostagePrince";

describe("The Hostage Prince", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(HOSTAGE_PRINCE.seats.map((seat) => seat.id)).toEqual([
      "northreach",
      "kingsmere",
      "goldford",
    ]);
    expect(HOSTAGE_PRINCE.escalationLadder).toHaveLength(8);
    expect(HOSTAGE_PRINCE.turns.map((t) => t.index)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(HOSTAGE_PRINCE.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the prince's court's, at the deadline turn
    expect(HOSTAGE_PRINCE.decisionPoints).toEqual([
      { turn: 3, seat: "kingsmere" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = HOSTAGE_PRINCE;
    const text = JSON.stringify(played);
    for (const noun of [
      "consular",
      "embassy",
      "sanctions",
      "passport",
      "prisoner swap",
      "detainee",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
