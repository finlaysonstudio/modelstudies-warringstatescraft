import { describe, expect, it } from "vitest";

import { buildChapter } from "../scenario/render";
import { STRAIT_STATES, STRAIT_STATES_TEXT } from "../scenario/straitStates";
import { LANGUAGES } from "../types";
import { expectChapter, playedText } from "./chapter";

/** the frozen shape: the Lamparth bridge and the `taiwan-strait` twin pin it */
const SHAPE = {
  seats: ["wu", "yue", "qi"],
  menus: [7, 7, 7, 6, 5, 5],
  // the decision point is the distant naval power's, at the incident turn
  decisionPoints: [{ turn: 3, seat: "qi" }],
  ladder: 7,
};

describe("The Strait", () => {
  it("keeps the strait game's structure in both languages under every naming", () => {
    expectChapter(STRAIT_STATES_TEXT, SHAPE);
  });

  it("renders the modern naming with present-day names around the period institutions", () => {
    for (const language of LANGUAGES) {
      const scenario = buildChapter(STRAIT_STATES_TEXT, {
        naming: "modern",
        language,
      });
      const label = `strait-states modern ${language}`;
      expect(
        scenario.seats.map((seat) => seat.name),
        label,
      ).toEqual(
        language === "en"
          ? ["PRC", "Taiwan", "United States"]
          : ["中国大陆", "台湾", "美国"],
      );
      expect(
        scenario.seats.map((seat) => seat.id),
        label,
      ).toEqual(SHAPE.seats);
      expect(
        scenario.turns.map((turn) => turn.moveMenu?.length),
        label,
      ).toEqual(SHAPE.menus);
      expect(scenario.decisionPoints, label).toEqual(SHAPE.decisionPoints);
      expect(scenario.escalationLadder, label).toHaveLength(SHAPE.ladder);
      const played = playedText(scenario);
      expect(played, label).not.toMatch(/[{}]/);
      // the period institutions stay under the modern names
      expect(played, label).toContain(language === "en" ? "war boat" : "战船");
      expect(played, label).toContain(language === "en" ? "trip-line" : "绊索");
    }
  });

  it("is the prologue: the seven-rung ladder topped by general war, the battery that looses without an order, and no memory yet", () => {
    expect(STRAIT_STATES.chapter).toEqual({ order: 0, date: "c. 485 BCE" });
    expect(STRAIT_STATES.title).toBe("The Strait");
    expect(STRAIT_STATES.escalationLadder[6]).toBe("General war");
    const text = JSON.stringify(STRAIT_STATES);
    expect(text).toContain("looses without an order");
    expect(text).toContain("met it in the Gulf and beat it");
    expect(text).toContain(" li ");
    // the prologue has nothing to remember
    for (const seat of STRAIT_STATES.seats) {
      expect(seat.brief).not.toContain("What your court remembers");
    }
    // the pivot moves the incident from accident to policy
    const pivoted = buildChapter(STRAIT_STATES_TEXT, {
      pivot: "order-accident",
    });
    expect(pivoted.turns[2].inject).toContain("looses on a standing order");
  });
});
