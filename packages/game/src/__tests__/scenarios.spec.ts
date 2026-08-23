import { describe, expect, it } from "vitest";

import {
  getScenario,
  getScenarioText,
  listScenarios,
  listScenarioTexts,
  renderingsOf,
} from "../scenarios";
import { CHRONICLE } from "../world/chronicle";

describe("the scenario registry", () => {
  it("lists the chronicle's chapters in chronicle order, then the plain scenarios", () => {
    const ids = listScenarios().map((scenario) => scenario.id);
    expect(ids.slice(0, 13)).toEqual([
      "strait-states",
      "land-register",
      "salt-and-iron",
      "heavy-coin",
      "famine-granary",
      "schools-of-the-hundred",
      "royal-domain",
      "conscription-rolls",
      "borrowed-road",
      "corridor-states",
      "hostage-prince",
      "river-works",
      "assassins-map",
    ]);
    expect(ids[13]).toBe("taiwan-strait");
    expect(ids.slice(14).every((id) => id.startsWith("lamparth-2024-"))).toBe(
      true,
    );
  });

  it("every chapter agrees with the chronicle on its order and date", () => {
    const texts = listScenarioTexts();
    expect(texts.map((text) => text.id)).toEqual(
      CHRONICLE.map((chapter) => chapter.id),
    );
    for (const text of texts) {
      const chapter = CHRONICLE.find((entry) => entry.id === text.id)!;
      expect(text.chapter, text.id).toEqual({
        order: chapter.order,
        date: chapter.date,
      });
      expect(text.en.title, text.id).toBeTruthy();
      expect(text.pivots?.length ?? 0, `${text.id} pivots`).toBeGreaterThan(0);
      expect(text.simulates).toMatch(/^[^:]{8,60}: .{20,}$/);
    }
  });

  it("renders and caches chapters and refuses options on plain scenarios", () => {
    const en = getScenario("land-register");
    expect(getScenario("land-register")).toBe(en);
    const zh = getScenario("land-register", { language: "zh" });
    expect(zh).not.toBe(en);
    expect(zh.language).toBe("zh");
    expect(renderingsOf("land-register")).toHaveLength(4);
    expect(renderingsOf("strait-states")).toHaveLength(6);
    expect(renderingsOf("taiwan-strait")).toEqual([{}]);
    expect(getScenarioText("taiwan-strait")).toBeUndefined();
    expect(() => getScenario("taiwan-strait", { language: "zh" })).toThrow(
      /one rendering/,
    );
    expect(() => getScenario("nowhere")).toThrow(/Unknown scenario/);
  });

  it("every seat of every chapter plays a cast member and every chapter forks once", () => {
    for (const text of listScenarioTexts()) {
      for (const naming of renderingsOf(text.id)) {
        const scenario = getScenario(text.id, naming);
        expect(scenario.seats, text.id).toHaveLength(3);
        expect(scenario.turns, text.id).toHaveLength(6);
        expect(scenario.decisionPoints, text.id).toHaveLength(1);
        for (const seat of scenario.seats) {
          expect(seat.state, `${text.id} ${seat.id}`).toBe(seat.id);
        }
      }
    }
  });
});
