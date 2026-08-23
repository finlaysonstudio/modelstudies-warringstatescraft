import { describe, expect, it } from "vitest";

import { RIVER_WORKS, RIVER_WORKS_TEXT } from "../scenario/riverWorks";
import { buildChapter } from "../scenario/render";
import { expectChapter } from "./chapter";

describe("The Engineer's Canal", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(RIVER_WORKS_TEXT, {
      seats: ["qin", "wei", "han"],
      menus: [7, 7, 6, 7, 6, 5],
      // the decision point is the downstream court's, at the planting moon
      decisionPoints: [{ turn: 4, seat: "wei" }],
      ladder: 8,
    });
  });

  it("bends the canal's year onto the city below the River", () => {
    expect(RIVER_WORKS.chapter).toEqual({
      order: 11,
      date: "246 BCE (bent to the 270s)",
    });
    expect(RIVER_WORKS.title).toBe("The Engineer's Canal");
    const text = JSON.stringify(RIVER_WORKS);
    expect(text).toContain("three hundred li");
    expect(text).toContain("ten thousand generations");
    expect(text).toContain("three boards above the water");
    // the old text's rice beds and court of arbitration are gone
    expect(text).not.toMatch(/\brice\b/);
    expect(text).not.toContain("arbitration");
    // the local name renders under both namings and never as a placeholder
    expect(text).toContain("the Great Ditch");
    expect(
      JSON.stringify(buildChapter(RIVER_WORKS_TEXT, { naming: "masked" })),
    ).toContain("the Long Cut");
    // chapter 11 remembers: every seat carries a memory block
    for (const seat of RIVER_WORKS.seats) {
      expect(seat.brief).toContain("What your court remembers");
    }
    expect(RIVER_WORKS_TEXT.pivots?.map((pivot) => pivot.id)).toEqual([
      "flood-month-week",
      "cut-before-fills",
    ]);
  });
});
