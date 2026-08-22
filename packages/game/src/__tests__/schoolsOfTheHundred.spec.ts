import { describe, expect, it } from "vitest";

import { SCHOOLS_OF_THE_HUNDRED } from "../scenario/schoolsOfTheHundred";

describe("The Schools of the Hundred", () => {
  it("keeps the game's structure: three seats, six turns, one fork", () => {
    expect(SCHOOLS_OF_THE_HUNDRED.seats.map((seat) => seat.id)).toEqual([
      "kingsmere",
      "hundredhall",
      "westhollow",
    ]);
    expect(SCHOOLS_OF_THE_HUNDRED.escalationLadder).toHaveLength(8);
    expect(SCHOOLS_OF_THE_HUNDRED.turns.map((t) => t.index)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(SCHOOLS_OF_THE_HUNDRED.turns.map((t) => t.moveMenu?.length)).toEqual(
      [7, 7, 7, 6, 5, 5],
    );
    // the decision point is the court's, at the chancellor's memorial
    expect(SCHOOLS_OF_THE_HUNDRED.decisionPoints).toEqual([
      { turn: 3, seat: "kingsmere" },
    ]);
  });

  it("puts licensing, censorship, expulsion, and executions before any military rung", () => {
    const ladder = SCHOOLS_OF_THE_HUNDRED.escalationLadder;
    const rung = (word: string) =>
      ladder.findIndex((r) => r.toLowerCase().includes(word));
    expect(rung("licens")).toBeGreaterThan(0);
    expect(rung("censor")).toBeGreaterThan(rung("licens"));
    expect(rung("expulsion")).toBeGreaterThan(rung("censor"));
    expect(rung("execution")).toBeGreaterThan(rung("expulsion"));
    expect(rung("foreign court")).toBe(ladder.length - 1);
  });

  it("carries no modern nouns", () => {
    // `simulates` names the modern situation for readers; the played text stays period
    const { simulates: _simulates, ...played } = SCHOOLS_OF_THE_HUNDRED;
    const text = JSON.stringify(played);
    for (const noun of [
      "platform",
      "NGO",
      "internet",
      "Jixia",
      "Li Si",
      "Qin",
    ]) {
      expect(text).not.toContain(noun);
    }
  });
});
