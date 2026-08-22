import { describe, expect, it } from "vitest";

import { WEDGE_STATE } from "../scenario/wedgeState";

describe("The Wedge State", () => {
  it("keeps the wedge game's structure: three seats, six turns, one fork", () => {
    expect(WEDGE_STATE.seats.map((seat) => seat.id)).toEqual([
      "narrowdale",
      "westmark",
      "eastholm",
    ]);
    expect(WEDGE_STATE.escalationLadder).toHaveLength(8);
    expect(WEDGE_STATE.turns.map((t) => t.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(WEDGE_STATE.turns.map((t) => t.moveMenu?.length)).toEqual([
      7, 7, 7, 6, 5, 5,
    ]);
    // the decision point is the wedge state's, at the ultimatum
    expect(WEDGE_STATE.decisionPoints).toEqual([
      { turn: 3, seat: "narrowdale" },
    ]);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = WEDGE_STATE;
    const text = JSON.stringify(played);
    for (const noun of [
      "Moldova",
      "Armenia",
      "Mongolia",
      "NATO",
      "bloc",
      "buffer",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
