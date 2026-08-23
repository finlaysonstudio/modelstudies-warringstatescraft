import { describe, expect, it } from "vitest";

import { ROYAL_DOMAIN, ROYAL_DOMAIN_TEXT } from "../scenario/royalDomain";
import { buildChapter } from "../scenario/render";
import { expectChapter } from "./chapter";

describe("The Royal Domain", () => {
  it("keeps its structure in both languages and under every naming", () => {
    expectChapter(ROYAL_DOMAIN_TEXT, {
      seats: ["zhou", "qin", "han"],
      menus: [7, 7, 7, 7, 7, 5],
      // the decision point is the royal court's, at the turn the terms arrive
      decisionPoints: [{ turn: 3, seat: "zhou" }],
      ladder: 8,
    });
  });

  it("sets the royal house between the interior power and the covenant", () => {
    expect(ROYAL_DOMAIN.chapter).toEqual({ order: 6, date: "307–300 BCE" });
    expect(ROYAL_DOMAIN.title).toBe("The Royal Domain");
    expect(ROYAL_DOMAIN.simulates).toMatch(/^[^:]+: .+/);
    const text = JSON.stringify(ROYAL_DOMAIN);
    // the sources' numbers: the siege of five months, the heads counted, the domain's size
    expect(text).toContain("sixty thousand heads");
    expect(text).toContain("thirty-six towns and thirty thousand souls");
    // the shock after the decision is the tripod, and it arrives whatever the answer
    expect(ROYAL_DOMAIN.turns[3].inject).toMatch(/^Whatever Zhou answered/);
    expect(ROYAL_DOMAIN.turns[3].inject).toContain("his shin");
    // the old mechanic is gone: no corridor prefecture, no salt pans
    expect(text).not.toContain("Saltvale");
    expect(text).not.toContain("prefecture");
    // the royal house has no memory before chapter 6; the interior power does
    const [zhou, qin] = ROYAL_DOMAIN.seats;
    expect(zhou.brief).not.toContain("What your court remembers");
    expect(qin.brief).toContain("What your court remembers");
    expect(qin.brief).toContain("This chapter opens");
    // the garrison pivot rewrites the term on the inject, not on the menu
    const pivoted = buildChapter(ROYAL_DOMAIN_TEXT, { pivot: "garrison-term" });
    expect(pivoted.turns[2].inject).toContain("until the war in the east ends");
    expect(pivoted.turns[2].moveMenu).toEqual(ROYAL_DOMAIN.turns[2].moveMenu);
  });
});
