import { BadRequestError } from "@jaypie/errors";
import { MODEL_PRICES } from "@modelstudies/workflows";
import { describe, expect, it } from "vitest";

import { buildInstrument } from "../instrument";
import { MODELS } from "../models";
import {
  DEFAULT_PANEL,
  getPanel,
  listPanels,
  PRODUCTION_FROZEN,
  resolvePanel,
} from "../panel";

describe("panels", () => {
  it("registers rosters of bare model ids", () => {
    const panels = listPanels();
    expect(panels.length).toBeGreaterThan(0);
    for (const panel of panels) {
      expect(panel.models.length).toBeGreaterThan(0);
      expect(new Set(panel.models).size).toBe(panel.models.length);
      expect(panel.description.length).toBeGreaterThan(0);
      expect(getPanel(panel.id)).toEqual(panel);
    }
  });
  it("names a default panel that is registered", () => {
    expect(getPanel(DEFAULT_PANEL).id).toBe(DEFAULT_PANEL);
  });
  it("defaults to the dev panel", () => {
    expect(DEFAULT_PANEL).toBe("dev");
  });
  it("dev is the three-model iteration roster", () => {
    expect(getPanel("dev").models).toEqual([
      MODELS.SONNET,
      MODELS.GEMINI_FLASH,
      MODELS.LUNA,
    ]);
  });
  it("production is the frozen eight-model fielded cohort", () => {
    // Literal ids on purpose: a frozen roster does not follow the mirror.
    const production = getPanel("production");
    expect(production.frozen).toBe(PRODUCTION_FROZEN);
    expect(production.frozen).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(production.models).toEqual([
      "claude-sonnet-5",
      "gemini-3.7-flash",
      "gpt-5.6-sol",
      "grok-4.6",
      "accounts/fireworks/models/deepseek-v4-pro",
      "accounts/fireworks/models/glm-5p2",
      "accounts/fireworks/models/kimi-k3",
      "accounts/fireworks/models/qwen3p7-plus",
    ]);
  });
  it("production carries the mirror's current id for every tier it fields", () => {
    // A Jaypie bump moves the mirror and this fails: append the new id to
    // PRODUCTION (keep the old one) and advance nothing else.
    const production = new Set(getPanel("production").models);
    for (const name of [
      "SONNET",
      "GEMINI_FLASH",
      "SOL",
      "GROK",
      "FIREWORKS_DEEPSEEK",
      "FIREWORKS_GLM",
      "FIREWORKS_KIMI",
      "FIREWORKS_QWEN",
    ] as const) {
      expect(
        production.has(MODELS[name]),
        `${name} (${MODELS[name]}) is not on the frozen production roster`,
      ).toBe(true);
    }
  });
  it("every production model is priced, so a budget cap can charge it", () => {
    for (const model of getPanel("production").models) {
      expect(MODEL_PRICES[model], model).toBeDefined();
    }
  });
  it("only production is frozen", () => {
    for (const panel of listPanels()) {
      expect(panel.frozen !== undefined, panel.id).toBe(
        panel.id === "production",
      );
    }
  });
  it("throws BadRequestError on an unknown panel", () => {
    expect(() => getPanel("nobody")).toThrow(BadRequestError);
  });
  it("resolves most specific first: explicit, instrument, default", () => {
    expect(resolvePanel({ panel: "solo", instrumentPanel: "full" }).id).toBe(
      "solo",
    );
    expect(resolvePanel({ instrumentPanel: "full" }).id).toBe("full");
    expect(resolvePanel().id).toBe(DEFAULT_PANEL);
  });
  it("full is a superset of every other measuring lab-ladder panel", () => {
    // Composed, not hand-listed — a hand-maintained superset silently stops
    // being one. Solo is excluded: it is a smoke roster, not a cohort.
    const full = new Set(getPanel("full").models);
    for (const id of ["frontier", "balanced", "fast", "open"]) {
      for (const model of getPanel(id).models) {
        expect(full.has(model)).toBe(true);
      }
    }
    expect(getPanel("full").models).toHaveLength(full.size);
  });
  it("the closed-lab rungs are disjoint, so size is the only variable", () => {
    // frontier / balanced / fast are one ladder read three times. A model
    // appearing on two rungs would silently confound the comparison.
    const rungs = ["frontier", "balanced", "fast"].map(
      (id) => new Set(getPanel(id).models),
    );
    for (const [index, rung] of rungs.entries()) {
      for (const other of rungs.slice(index + 1)) {
        for (const model of rung) expect(other.has(model)).toBe(false);
      }
    }
  });
  it("rosters carry resolved model ids, not constant names", () => {
    for (const panel of listPanels()) {
      for (const model of panel.models) {
        expect(model).toMatch(/^[a-z0-9]/i);
        expect(model).not.toMatch(/undefined/);
      }
    }
  });
  it("every instrument's declared panel is registered", () => {
    const panel = buildInstrument({ plan: "paper-rock-scissors" }).panel;
    expect(panel).toBe("solo");
    expect(getPanel(panel!).models).toHaveLength(1);
  });
});
