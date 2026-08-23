import { describe, expect, it } from "vitest";

import { ASSASSINS_MAP, ASSASSINS_MAP_TEXT } from "../scenario/assassinsMap";
import { buildChapter } from "../scenario/render";
import { expectChapter } from "./chapter";

describe("The Map of Dukang", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(ASSASSINS_MAP_TEXT, {
      seats: ["qin", "yan", "dai"],
      menus: [7, 7, 7, 6, 7, 5],
      // the decision point is the target court's, at the attribution turn
      decisionPoints: [{ turn: 3, seat: "qin" }],
      ladder: 8,
    });
  });

  it("closes the chronicle with the dagger in the map and names no one", () => {
    expect(ASSASSINS_MAP.chapter).toEqual({ order: 12, date: "227 BCE" });
    expect(ASSASSINS_MAP.title).toBe("The Map of Dukang");
    const text = JSON.stringify(ASSASSINS_MAP);
    expect(text).toContain("a thousand catties of gold");
    expect(text).toContain("the sword on your back");
    expect(text).toContain("two hundred yi of gold");
    // persons are offices; the sources' names stay out of the played text
    for (const name of ["Jing Ke", "Fan Wuji", "Dan", "Xi", "Jia"]) {
      expect(text).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
    // the sender remembers the hostage it was in chapter 10
    const yan = ASSASSINS_MAP.seats.find((seat) => seat.id === "yan");
    expect(yan?.brief).toContain("What your court remembers");
    expect(yan?.brief).toContain("fled home");
    // the local names render under the masked naming without a chronicle leak
    const masked = buildChapter(ASSASSINS_MAP_TEXT, { naming: "masked" });
    expect(JSON.stringify(masked)).toContain("the Coldwater");
    expect(JSON.stringify(masked)).not.toContain("Liaodong");
  });
});
