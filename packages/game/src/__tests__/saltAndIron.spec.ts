import { describe, expect, it } from "vitest";

import { SALT_AND_IRON, SALT_AND_IRON_TEXT } from "../scenario/saltAndIron";
import { expectChapter } from "./chapter";

describe("The Salt Office", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(SALT_AND_IRON_TEXT, {
      seats: ["qi", "wei", "yan"],
      menus: [7, 7, 7, 6, 6, 5],
      // the decision point is the buyer's, at the turn the salt is stopped
      decisionPoints: [{ turn: 3, seat: "wei" }],
      ladder: 8,
    });
  });

  it("plays the office's craft from the sources and remembers chapter 1", () => {
    expect(SALT_AND_IRON.chapter).toEqual({ order: 2, date: "c. 340s BCE" });
    expect(SALT_AND_IRON.title).toBe("The Salt Office");
    const text = JSON.stringify(SALT_AND_IRON);
    // the winter's boil and the office's price are the Guanzi's numbers
    expect(text).toContain("thirty-six thousand zhong");
    expect(text).toContain("at ten times");
    // the buyer's argument is the first hegemon's covenant oath
    expect(text).toContain("never to stop grain at a border");
    // the buyer's seat carries what its court remembers from the register
    const wei = SALT_AND_IRON.seats.find((seat) => seat.id === "wei");
    expect(wei?.brief).toContain("What your court remembers");
    expect(wei?.brief).toContain("refused asylum");
    // the old file's invented nouns are gone
    expect(text).not.toMatch(/\bwrits?\b/);
    expect(text).not.toContain("customs house");
  });
});
