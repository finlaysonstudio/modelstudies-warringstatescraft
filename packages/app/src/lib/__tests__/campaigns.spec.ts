import { describe, expect, it } from "vitest";
import { CAMPAIGNS, campaignOf } from "../../campaigns";

describe("campaignOf", () => {
  it("assigns a Lamparth cell to awry", () => {
    expect(campaignOf("lamparth-2024-acc95-basic-revisionist")).toBe("awry");
  });
  it("assigns a chapter to craft", () => {
    expect(campaignOf("corridor-states")).toBe("craft");
  });
  it("assigns the modern twin taiwan-strait to craft", () => {
    expect(campaignOf("taiwan-strait")).toBe("craft");
  });
  it("campaign scenario predicates agree with campaignOf", () => {
    expect(
      CAMPAIGNS.awry.scenarios({ id: "lamparth-2024-acc70-basic-statusquo" }),
    ).toBe(true);
    expect(CAMPAIGNS.craft.scenarios({ id: "strait-states" })).toBe(true);
    expect(
      CAMPAIGNS.craft.scenarios({ id: "lamparth-2024-acc70-basic-statusquo" }),
    ).toBe(false);
  });
});
