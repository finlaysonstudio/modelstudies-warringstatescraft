import { describe, expect, it } from "vitest";

import { FAMINE_GRANARY, FAMINE_GRANARY_TEXT } from "../scenario/famineGranary";
import { expectChapter } from "./chapter";

describe("The Granary Debt", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(FAMINE_GRANARY_TEXT, {
      seats: ["qin", "wei", "wey"],
      menus: [7, 7, 7, 7, 5, 5],
      // the decision point is the granary court's, at the granary gate turn
      decisionPoints: [{ turn: 3, seat: "wei" }],
      ladder: 8,
    });
  });

  it("opens the fourth chapter on the debt and keeps the carrier in play", () => {
    expect(FAMINE_GRANARY.chapter).toEqual({ order: 4, date: "330s BCE" });
    expect(FAMINE_GRANARY.title).toBe("The Granary Debt");
    const text = JSON.stringify(FAMINE_GRANARY);
    // the debt runs from Qin to Wei, a generation back, by boat
    expect(text).toContain("boat campaign");
    expect(text).toContain("a generation ago");
    // the carrier has a choice from the first turn, not the fourth
    expect(FAMINE_GRANARY.turns[0].moveMenu).toContain(
      "Hire the boats to whoever pays first, the toll paid in gold at the landing",
    );
    // the focal menu carries the closed granary and the march
    expect(FAMINE_GRANARY.turns[2].moveMenu?.length).toBe(7);
    // the court remembers the register and the coin, and not yet this famine
    const qin = FAMINE_GRANARY.seats[0].brief;
    expect(qin).toContain("What your court remembers");
    expect(qin).toContain("torn by chariots");
    expect(qin).not.toContain("closed granaries");
  });
});
