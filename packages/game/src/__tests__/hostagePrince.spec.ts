import { describe, expect, it } from "vitest";

import { HOSTAGE_PRINCE, HOSTAGE_PRINCE_TEXT } from "../scenario/hostagePrince";
import { expectChapter } from "./chapter";

describe("The Hostage Prince", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(HOSTAGE_PRINCE_TEXT, {
      seats: ["zhao", "qin", "merchant"],
      menus: [7, 7, 7, 6, 7, 6],
      // the decision point is the prince's court's, at the turn the price arrives
      decisionPoints: [{ turn: 3, seat: "qin" }],
      ladder: 8,
    });
  });

  it("opens at the siege of the holding court's capital and prices the prince in period terms", () => {
    expect(HOSTAGE_PRINCE.chapter).toEqual({ order: 10, date: "257 BCE" });
    expect(HOSTAGE_PRINCE.title).toBe("The Hostage Prince");
    const text = JSON.stringify(HOSTAGE_PRINCE);
    // the merchant's gold to the guards, as the chronicle remembers it
    expect(text).toContain("six hundred catties of gold");
    expect(text).toContain("rare goods");
    // the trigger is land, not tolls or loans
    expect(text).not.toMatch(/\btolls?\b/);
    expect(text).not.toMatch(/\bloans?\b/);
    // the holding court carries the corridor into the siege; the merchant house has no earlier chapter
    const [zhao, , merchant] = HOSTAGE_PRINCE.seats;
    expect(zhao.brief).toContain("What your court remembers");
    expect(zhao.brief).toContain("Changping");
    expect(merchant.brief).not.toContain("What your court remembers");
  });
});
