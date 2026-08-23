import { describe, expect, it } from "vitest";

import { BORROWED_ROAD } from "../scenario/borrowedRoad";

describe("The Borrowed Road", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(BORROWED_ROAD.seats.map((seat) => seat.id)).toEqual([
      "oathfold",
      "sealmoor",
      "highreach",
    ]);
    expect(BORROWED_ROAD.escalationLadder).toHaveLength(8);
    expect(BORROWED_ROAD.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(BORROWED_ROAD.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the remaining courts', when the oath is invoked
    expect(BORROWED_ROAD.decisionPoints).toEqual([
      { turn: 4, seat: "oathfold" },
    ]);
  });

  it("puts the focal cue at the end of the fork turn's inject", () => {
    const fork = BORROWED_ROAD.turns.find((turn) => turn.index === 4);
    expect(fork?.inject).toContain("The decision now falls to the focal seat:");
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = BORROWED_ROAD;
    const text = JSON.stringify(played);
    for (const noun of [
      "Greenland",
      "Denmark",
      "Arctic",
      "NATO",
      "Trump",
      "Pituffik",
      "Thule",
      "Nuuk",
      "Copenhagen",
      "Europe",
      "American",
      "Article",
      "alliance",
      "sanctions",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
