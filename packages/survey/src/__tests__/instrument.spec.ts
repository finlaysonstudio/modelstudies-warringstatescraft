import { BadRequestError } from "@jaypie/errors";
import { describe, expect, it } from "vitest";

import {
  armItems,
  buildInstrument,
  listPlans,
  resolveArm,
  resolveItems,
} from "../instrument";

describe("buildInstrument", () => {
  it("defaults to the paper-rock-scissors plan", () => {
    const instrument = buildInstrument();
    expect(instrument.id).toBe("paper-rock-scissors");
    expect(instrument.category).toBe("debug");
  });
  it("applies include and exclude filters within the plan", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      exclude: ["rounds"],
    });
    expect(instrument.items.map((item) => item.name)).not.toContain("rounds");
    const only = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw", "rounds"],
    });
    expect(only.items.map((item) => item.name).sort()).toEqual(
      ["throw", "rounds"].sort(),
    );
  });
  it("filters by topics", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      topics: ["throw"],
    });
    expect(instrument.items).toHaveLength(2);
    expect(instrument.items.every((item) => item.topic === "throw")).toBe(true);
  });
  it("throws BadRequestError on an unknown plan", () => {
    expect(() => buildInstrument({ plan: "classic" as never })).toThrow(
      BadRequestError,
    );
  });
  it("lists plans", () => {
    expect(listPlans()).toEqual([
      "crisis",
      "crisis-situated",
      "model-values-96",
      "paper-rock-scissors",
    ]);
  });
  it("model-values-96 plan is the full 96-item bank with its protocol", () => {
    const instrument = buildInstrument({ plan: "model-values-96" });
    expect(instrument.title).toBe("Model Values (96)");
    expect(instrument.items).toHaveLength(96);
    expect(instrument.instruction).toMatch(/should prevail/);
    expect(instrument.probe).toBe("Please explain your selection.");
    expect(instrument.optionOrder).toBe("balanced-random");
    // Every item is a two-statement forced choice under the shared stem.
    for (const item of instrument.items) {
      expect(item.wording).toBe("Choose the statement that should prevail.");
      expect(item.options).toHaveLength(2);
    }
  });
  it("paper-rock-scissors is the debug plan: three items, fields to solo", () => {
    const instrument = buildInstrument({ plan: "paper-rock-scissors" });
    expect(instrument.title).toBe("Paper Rock Scissors");
    expect(instrument.category).toBe("debug");
    expect(instrument.panel).toBe("solo");
    expect(instrument.items.map((item) => item.name)).toEqual([
      "throw",
      "counter",
      "rounds",
    ]);
    // One open numeric, so a debug sitting exercises both answer paths.
    expect(
      instrument.items.filter((item) => item.options.length === 0),
    ).toHaveLength(1);
  });
  it("every plan declares a category, and only external plans cite references", () => {
    for (const plan of listPlans()) {
      const instrument = buildInstrument({ plan });
      expect(["external", "internal", "debug"]).toContain(instrument.category);
      for (const reference of instrument.references ?? []) {
        expect(reference.name.length).toBeGreaterThan(0);
        expect(reference.url).toMatch(/^https?:\/\//);
      }
      if (instrument.category === "external") {
        expect(instrument.references?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("resolveItems", () => {
  it("expands a declared subset, keeps item names, refuses unknown ones", () => {
    const situated = buildInstrument({ plan: "crisis-situated" });
    expect(resolveItems(situated, ["crux"])).toHaveLength(12);
    expect(resolveItems(situated, ["f1", " d2 ", "f1"])).toEqual(["f1", "d2"]);
    expect(() => resolveItems(situated, ["nope"])).toThrow(BadRequestError);
    expect(() => resolveItems(situated, [])).toThrow(BadRequestError);
    const debug = buildInstrument({ plan: "paper-rock-scissors" });
    expect(() => resolveItems(debug, ["crux"])).toThrow(/Unknown items/);
  });

  it("crisis-situated declares five arms on the crux, and resolveArm refuses an unknown one", () => {
    const instrument = buildInstrument({ plan: "crisis-situated" });
    expect(Object.keys(instrument.arms ?? {})).toEqual([
      "priorities",
      "informed",
      "dress-period",
      "dress-modern",
      "zh",
    ]);
    for (const [id, arm] of Object.entries(instrument.arms!)) {
      expect(armItems(instrument, arm), id).toEqual(instrument.subsets!.crux);
    }
    expect(resolveArm(instrument, "informed").append).toBe("majority");
    expect(resolveArm(instrument, "zh").language).toBe("zh");
    expect(() => resolveArm(instrument, "nope")).toThrow(BadRequestError);
    expect(() => resolveArm(instrument, "nope")).toThrow(/known: priorities/);
    expect(() =>
      resolveArm(buildInstrument({ plan: "paper-rock-scissors" }), "zh"),
    ).toThrow(/declares no arms/);
    // an arm without items fields the whole plan
    expect(armItems(instrument, { title: "all" })).toHaveLength(88);
    expect(() =>
      armItems(instrument, { title: "bad", items: ["zz9"] }),
    ).toThrow(/lacks: zz9/);
  });
});
