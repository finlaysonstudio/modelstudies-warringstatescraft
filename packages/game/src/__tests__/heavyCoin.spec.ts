import { describe, expect, it } from "vitest";

import { HEAVY_COIN, HEAVY_COIN_TEXT } from "../scenario/heavyCoin";
import { expectChapter } from "./chapter";

describe("The Heavy Coin", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(HEAVY_COIN_TEXT, {
      seats: ["qin", "qi", "tao"],
      menus: [7, 7, 6, 7, 7, 5],
      // the decision point is the market's, at the turn the scales must choose
      decisionPoints: [{ turn: 4, seat: "tao" }],
      ladder: 8,
    });
  });

  it("plays the period's monetary contest: coin weight, state buying, the pass, the scales", () => {
    expect(HEAVY_COIN.chapter).toEqual({ order: 3, date: "c. 330s BCE" });
    expect(HEAVY_COIN.title).toBe("The Heavy Coin");
    const text = JSON.stringify(HEAVY_COIN);
    expect(text).toContain("round coin");
    expect(text).toContain("mother weighs the child");
    expect(text).toContain("gold by the yi");
    expect(text).toContain("officers of light and heavy");
    // the interior power remembers the register; the market remembers nothing yet
    expect(HEAVY_COIN.seats[0].brief).toContain("What your court remembers");
    expect(HEAVY_COIN.seats[0].brief).toContain("register");
    expect(HEAVY_COIN.seats[1].brief).toContain("salt office");
    expect(HEAVY_COIN.seats[2].brief).not.toContain(
      "What your court remembers",
    );
  });
});
