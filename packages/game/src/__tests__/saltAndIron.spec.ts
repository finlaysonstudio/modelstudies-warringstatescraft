import { describe, expect, it } from "vitest";

import { SALT_AND_IRON } from "../scenario/saltAndIron";

describe("The Salt and Iron Monopoly", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(SALT_AND_IRON.seats.map((seat) => seat.id)).toEqual([
      "brinefell",
      "millford",
      "ashwick",
    ]);
    expect(SALT_AND_IRON.escalationLadder).toHaveLength(8);
    expect(SALT_AND_IRON.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(SALT_AND_IRON.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the largest buyer's, at the sealed-passes turn
    expect(SALT_AND_IRON.decisionPoints).toEqual([
      { turn: 3, seat: "millford" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = SALT_AND_IRON;
    const text = JSON.stringify(played);
    for (const noun of [
      "rare earth",
      "lithography",
      "sanction",
      "export control",
      "semiconductor",
      "China",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
