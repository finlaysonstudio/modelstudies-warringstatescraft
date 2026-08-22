import { BadRequestError } from "@jaypie/errors";
import { describe, expect, it } from "vitest";

import { buildInstrument } from "../instrument";
import { MODELS } from "../models";
import { DEFAULT_PANEL, getPanel, listPanels, resolvePanel } from "../panel";

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
  it("production is the seven-model fielded cohort", () => {
    expect(getPanel("production").models).toEqual([
      MODELS.OPUS,
      MODELS.GEMINI_FLASH,
      MODELS.SOL,
      MODELS.GROK,
      MODELS.FIREWORKS_GLM,
      MODELS.FIREWORKS_KIMI,
      MODELS.FIREWORKS_QWEN,
    ]);
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
