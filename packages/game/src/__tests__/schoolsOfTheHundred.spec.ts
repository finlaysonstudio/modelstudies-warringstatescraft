import { describe, expect, it } from "vitest";

import {
  SCHOOLS_OF_THE_HUNDRED,
  SCHOOLS_OF_THE_HUNDRED_TEXT,
} from "../scenario/schoolsOfTheHundred";
import { expectChapter } from "./chapter";

describe("The Masters of Jixia", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(SCHOOLS_OF_THE_HUNDRED_TEXT, {
      seats: ["qi", "jixia", "yan"],
      menus: [7, 7, 7, 6, 6, 5],
      // the decision point is the court's, at the chancellor's memorial
      decisionPoints: [{ turn: 3, seat: "qi" }],
      ladder: 8,
    });
  });

  it("opens at the hall's gate with the conquest of the north half-made", () => {
    expect(SCHOOLS_OF_THE_HUNDRED.chapter).toEqual({
      order: 5,
      date: "314 BCE",
    });
    expect(SCHOOLS_OF_THE_HUNDRED.title).toBe("The masters of Jixia");
    const text = JSON.stringify(SCHOOLS_OF_THE_HUNDRED);
    expect(text).toContain("seventy-six");
    expect(text).toContain("fifty days");
    expect(text).toContain("medicine, divination, and planting");
    // the ladder climbs from remonstrance through license, seizure,
    // expulsion, and execution before the books burn and the exiles march
    const ladder = SCHOOLS_OF_THE_HUNDRED.escalationLadder;
    const rung = (word: string) =>
      ladder.findIndex((label) => label.toLowerCase().includes(word));
    expect(rung("licens")).toBeGreaterThan(rung("remonstrance"));
    expect(rung("expulsion")).toBeGreaterThan(rung("seizure"));
    expect(rung("execution")).toBeGreaterThan(rung("expulsion"));
    expect(rung("burned")).toBeGreaterThan(rung("execution"));
    expect(rung("foreign court")).toBe(ladder.length - 1);
    // the court remembers the salt office and the heavy coin before this chapter
    expect(SCHOOLS_OF_THE_HUNDRED.seats[0].brief).toContain(
      "What your court remembers",
    );
    expect(SCHOOLS_OF_THE_HUNDRED.seats[0].brief).toContain("knife coin");
  });
});
