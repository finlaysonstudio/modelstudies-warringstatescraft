import { describe, expect, it } from "vitest";

import { LAND_REGISTER, LAND_REGISTER_TEXT } from "../scenario/landRegister";
import { expectChapter } from "./chapter";

describe("The Register", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(LAND_REGISTER_TEXT, {
      seats: ["qin", "clan", "wei"],
      menus: [7, 7, 7, 7, 7, 5],
      // the decision point is the neighbor's, at the turn the two letters arrive
      decisionPoints: [{ turn: 4, seat: "wei" }],
      ladder: 8,
    });
  });

  it("opens the chronicle with the reform and corrects the brainstorm's errors", () => {
    expect(LAND_REGISTER.chapter).toEqual({ order: 1, date: "356–338 BCE" });
    expect(LAND_REGISTER.title).toBe("The Register");
    const text = JSON.stringify(LAND_REGISTER);
    expect(text).toContain("twenty grades");
    expect(text).toContain("tattooed");
    expect(text).not.toContain("branded");
    // chapter 1 has no memory: the court remembers nothing yet
    expect(LAND_REGISTER.seats[0].brief).not.toContain(
      "What your court remembers",
    );
  });
});
