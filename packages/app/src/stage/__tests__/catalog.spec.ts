import { describe, expect, it } from "vitest";

// the vocabulary module directly: the game package index pulls the node
// graph, which the app's DOM-lib typecheck refuses
import {
  ARCHETYPES as GAME_ARCHETYPES,
  BANDS,
  DIRECTIONS,
  EFFECTS as GAME_EFFECTS,
} from "../../../../game/src/stage/vocabulary";
import {
  ARCHETYPES,
  BAND_LABELS,
  DIRECTION_CAPTIONS,
  DIRECTION_RULES,
  EFFECTS,
} from "../catalog";

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
        ...(rule.scope !== undefined ? { scope: rule.scope } : {}),
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

  it("mirrors every archetype and effect", () => {
    expect([...ARCHETYPES]).toEqual(GAME_ARCHETYPES);
    expect([...EFFECTS]).toEqual(GAME_EFFECTS);
  });

  it("captions every direction", () => {
    expect(Object.keys(DIRECTION_CAPTIONS).sort()).toEqual(
      Object.keys(DIRECTIONS).sort(),
    );
  });
});
