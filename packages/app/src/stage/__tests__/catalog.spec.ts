import { describe, expect, it } from "vitest";

// the vocabulary module directly: the game package index pulls the node
// graph, which the app's DOM-lib typecheck refuses
import { BANDS, DIRECTIONS } from "../../../../game/src/stage/vocabulary";
import { BAND_LABELS, DIRECTION_CAPTIONS, DIRECTION_RULES } from "../catalog";

// The catalog is the browser mirror of the stage vocabulary; these hold the
// mirrored rules, bands, and captions to the game package so drift fails CI.
describe("catalog mirrors the stage vocabulary", () => {
  it("carries every direction with the vocabulary's rule", () => {
    expect(Object.keys(DIRECTION_RULES).sort()).toEqual(
      Object.keys(DIRECTIONS).sort(),
    );
    for (const [kind, rule] of Object.entries(DIRECTIONS)) {
      expect(
        DIRECTION_RULES[kind as keyof typeof DIRECTION_RULES],
        kind,
      ).toEqual({
        band: rule.band,
        places: rule.places,
        actor: rule.actor,
        ...(rule.effect !== undefined ? { effect: rule.effect } : {}),
        ...(rule.count !== undefined ? { count: rule.count } : {}),
      });
    }
  });

  it("labels every band", () => {
    expect(BAND_LABELS).toEqual(BANDS);
  });

  it("captions every direction", () => {
    expect(Object.keys(DIRECTION_CAPTIONS).sort()).toEqual(
      Object.keys(DIRECTIONS).sort(),
    );
  });
});
