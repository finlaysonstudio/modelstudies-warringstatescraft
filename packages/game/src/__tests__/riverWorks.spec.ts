import { describe, expect, it } from "vitest";

import { RIVER_WORKS } from "../scenario/riverWorks";

describe("The River Works", () => {
  it("keeps the river game's structure: three seats, six turns, one fork", () => {
    expect(RIVER_WORKS.seats.map((seat) => seat.id)).toEqual([
      "highreach",
      "fenmarch",
      "stonegate",
    ]);
    expect(RIVER_WORKS.escalationLadder).toHaveLength(8);
    expect(RIVER_WORKS.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(RIVER_WORKS.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 6, 7, 5, 5,
    ]);
    // the decision point is the downstream state's, at the planting moon
    expect(RIVER_WORKS.decisionPoints).toEqual([{ turn: 4, seat: "fenmarch" }]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = RIVER_WORKS;
    const text = JSON.stringify(played);
    for (const noun of [
      "Mekong",
      "Nile",
      "Tigris",
      "dam",
      "hydro",
      "turbine",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
