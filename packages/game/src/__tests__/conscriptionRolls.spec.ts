import { describe, expect, it } from "vitest";

import {
  CONSCRIPTION_ROLLS,
  CONSCRIPTION_ROLLS_TEXT,
} from "../scenario/conscriptionRolls";
import { expectChapter } from "./chapter";

describe("The Rolls of Shu", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(CONSCRIPTION_ROLLS_TEXT, {
      seats: ["qin", "shu", "mohists"],
      menus: [7, 7, 7, 7, 6, 5],
      // the decision point is the commandery's, at the turn the column's heralds restate the edict
      decisionPoints: [{ turn: 4, seat: "shu" }],
      ladder: 8,
    });
  });

  it("opens in the sixth year of the young king with the rolls demanded by the new moon", () => {
    expect(CONSCRIPTION_ROLLS.chapter).toEqual({ order: 7, date: "301 BCE" });
    expect(CONSCRIPTION_ROLLS.title).toBe("The Rolls of Shu");
    const text = JSON.stringify(CONSCRIPTION_ROLLS);
    // the Widows' Petition turn stays, with the reform's price for a head
    expect(text).toContain("The Widows' Petition");
    expect(text).toContain("a hundred mu of field, nine mu of house plot");
    // exemptions are earned by heads or bought with grain, never purchased outright
    expect(text).toContain("bought with grain");
    expect(text).not.toContain("exemptions purchased");
    expect(text).not.toContain("census");
    // the register of chapter 1 reaches the seat through the memory block, not the text
    const qin = CONSCRIPTION_ROLLS.seats[0];
    expect(qin.brief).toContain("What your court remembers");
    expect(qin.brief).toContain("The register stood.");
  });
});
