import { describe, expect, it } from "vitest";

import { LAND_REGISTER } from "../scenario/landRegister";

describe("The Land Register", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(LAND_REGISTER.seats.map((seat) => seat.id)).toEqual([
      "tallfield",
      "oldmarch",
      "greywold",
    ]);
    expect(LAND_REGISTER.escalationLadder).toHaveLength(8);
    expect(LAND_REGISTER.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(LAND_REGISTER.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 7, 5, 5,
    ]);
    // the decision point is the neighbor's, at the turn the two letters arrive
    expect(LAND_REGISTER.decisionPoints).toEqual([
      { turn: 4, seat: "greywold" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = LAND_REGISTER;
    const text = JSON.stringify(played);
    for (const noun of [
      "digital",
      "ID card",
      "national service",
      "database",
      "Shang Yang",
      "Qin",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
