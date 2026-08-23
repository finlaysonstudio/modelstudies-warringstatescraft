import { describe, expect, it } from "vitest";

import {
  CORRIDOR_STATES,
  CORRIDOR_STATES_TEXT,
} from "../scenario/corridorStates";
import { expectChapter } from "./chapter";

describe("The Corridor", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(CORRIDOR_STATES_TEXT, {
      seats: ["qin", "zhao", "qi"],
      menus: [5, 5, 5, 5, 5, 5],
      // the decision point is the coastal power's, when both envoys stand in its hall
      decisionPoints: [{ turn: 4, seat: "qi" }],
      ladder: 8,
    });
  });

  it("is the saga's climax: the highland given away, the grain refused, the army buried", () => {
    expect(CORRIDOR_STATES.chapter).toEqual({ order: 9, date: "262–260 BCE" });
    expect(CORRIDOR_STATES.title).toBe("The Corridor");
    const text = JSON.stringify(CORRIDOR_STATES);
    expect(text).toContain("seventeen walled towns");
    expect(text).toContain("forty-six days");
    expect(text).toContain("two hundred and forty boys");
    // the coastal court remembers the five states and the eastern emperor before it decides
    const qi = CORRIDOR_STATES.seats.find((seat) => seat.id === "qi");
    expect(qi?.brief).toContain("What your court remembers");
    expect(qi?.brief).toContain("eastern emperor");
    // the fork turn ends on the focal cue
    const fork = CORRIDOR_STATES.turns.find((turn) => turn.index === 4);
    expect(fork?.inject).toContain("The decision now falls to the focal seat:");
  });
});
