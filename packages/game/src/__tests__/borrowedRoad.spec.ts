import { describe, expect, it } from "vitest";

import { BORROWED_ROAD, BORROWED_ROAD_TEXT } from "../scenario/borrowedRoad";
import { buildChapter } from "../scenario/render";
import { expectChapter } from "./chapter";

describe("The Borrowed Road", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(BORROWED_ROAD_TEXT, {
      seats: ["council", "song", "qi"],
      menus: [7, 7, 7, 7, 7, 5],
      // the decision point is the council's, at the turn the oath is invoked
      decisionPoints: [{ turn: 4, seat: "council" }],
      ladder: 8,
    });
  });

  it("is chapter 8, the presiding court's seizure of a member's market", () => {
    expect(BORROWED_ROAD.chapter).toEqual({ order: 8, date: "286 BCE" });
    expect(BORROWED_ROAD.title).toBe("The Borrowed Road");
    const text = JSON.stringify(BORROWED_ROAD);
    // the oath names the west as the attacker; the seizure is by the covenant's own garrison
    expect(text).toContain("the attacker named on the stone is Qin");
    expect(text).toContain("Before dawn the garrison marches");
    // the sources' outcome arrives at turn 5 whatever the council chose
    expect(BORROWED_ROAD.turns[4].inject).toContain(
      "Whatever the council answered",
    );
    expect(BORROWED_ROAD.turns[4].inject).toContain("a thousand li");
    // the Norse layer is gone: the dependency has a lord and elders, the west is Qin
    expect(text).not.toContain("Highreach");
    expect(text).not.toContain("isle");
    // the presiding court remembers the salt office, the coin, and the two years in the north
    const qi = BORROWED_ROAD.seats.find((seat) => seat.id === "qi");
    expect(qi?.brief).toContain("What your court remembers");
    expect(qi?.brief).toContain("fifty days");
    // the pivots move the focal inject, not a menu
    for (const pivot of BORROWED_ROAD_TEXT.pivots ?? []) {
      const pivoted = buildChapter(BORROWED_ROAD_TEXT, { pivot: pivot.id });
      expect(pivoted.turns[3].inject).toContain(pivot.en.to);
      expect(pivoted.turns[3].moveMenu).toEqual(
        BORROWED_ROAD.turns[3].moveMenu,
      );
    }
  });
});
