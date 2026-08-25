import { describe, expect, it } from "vitest";

// the world's own table, imported directly: the package index pulls the node
// graph the app's DOM-lib typecheck refuses (as `catalog.spec` does)
import { GAZETTEER } from "../../../../game/src/world/gazetteer";
import geography from "../../../art/map/geography.json";
import { DECOR, MARKERS, TERRAINS, WATERS } from "../catalog";
import {
  BARE_GROUND,
  DECOR_NOTES,
  FEATURE_NOTES,
  featureFor,
  KIND_LABELS,
  legendFor,
  MARKER_NOTES,
  TERRAIN_NOTES,
  WATER_NOTES,
  type LegendKind,
  type LegendNote,
} from "../legend";

const LANGUAGES = ["en", "zh"] as const;

/** every note the map can show, named for the failure message */
const NOTES: [string, LegendNote][] = [
  ...WATERS.map((water): [string, LegendNote] => [water, WATER_NOTES[water]]),
  ...DECOR.map((decor): [string, LegendNote] => [decor, DECOR_NOTES[decor]]),
  ...MARKERS.map((marker): [string, LegendNote] => [
    marker,
    MARKER_NOTES[marker],
  ]),
  ["region", MARKER_NOTES.region],
];

describe("legend", () => {
  it("says something about every terrain but the bare ground", () => {
    for (const terrain of TERRAINS) {
      const note = TERRAIN_NOTES[terrain];
      if (terrain === BARE_GROUND) {
        expect(note).toBeUndefined();
        continue;
      }
      expect(note, terrain).toBeDefined();
      for (const language of LANGUAGES) {
        expect(note?.title[language], `${terrain} title`).toBeTruthy();
        expect(note?.what[language], `${terrain} what`).toBeTruthy();
        expect(note?.history[language], `${terrain} history`).toBeTruthy();
      }
    }
  });

  it("says something about every water, decor, and marker", () => {
    for (const [name, note] of NOTES) {
      expect(note, name).toBeDefined();
      for (const language of LANGUAGES) {
        expect(note.title[language], `${name} title`).toBeTruthy();
        expect(note.what[language], `${name} what`).toBeTruthy();
        expect(note.history[language], `${name} history`).toBeTruthy();
      }
    }
  });

  it("answers everything the geography actually puts on the map", () => {
    const grounds = new Set(geography.fills.map((fill) => fill.terrain));
    for (const ground of grounds) {
      if (ground === BARE_GROUND) continue;
      const kind: LegendKind = WATERS.includes(
        ground as (typeof WATERS)[number],
      )
        ? "water"
        : "terrain";
      expect(legendFor(kind, ground), ground).not.toBeNull();
    }
    for (const decor of geography.decor ?? []) {
      expect(legendFor("decor", decor.id), decor.id).not.toBeNull();
    }
    const places: Record<string, { x: number; y: number; marker?: string }> =
      geography.places;
    for (const [key, place] of Object.entries(places)) {
      expect(legendFor("place", place.marker ?? "region"), key).not.toBeNull();
    }
  });

  it("names every feature the geography draws, in both languages", () => {
    const fills: { terrain: string; feature?: string }[] = geography.fills;
    const drawn = new Set(
      fills.map((fill) => fill.feature).filter((id): id is string => !!id),
    );
    expect(drawn.size).toBeGreaterThan(0);
    for (const id of drawn) {
      const note = featureFor(id);
      expect(note, id).not.toBeNull();
      for (const language of LANGUAGES) {
        expect(note?.title[language], `${id} title`).toBeTruthy();
        expect(note?.what[language], `${id} what`).toBeTruthy();
        expect(note?.history[language], `${id} history`).toBeTruthy();
        // the gazetteer is what the explorer actually shows, so every feature
        // has to be a key it can render under either naming
        expect(
          GAZETTEER[id]?.chronicle[language],
          `${id} chronicle`,
        ).toBeTruthy();
        expect(GAZETTEER[id]?.masked[language], `${id} masked`).toBeTruthy();
      }
      if (note?.modern) {
        for (const language of LANGUAGES) {
          expect(note.modern[language], `${id} modern`).toBeTruthy();
        }
      }
    }
    // and nothing is written about a feature the map never draws
    for (const id of Object.keys(FEATURE_NOTES)) {
      expect(drawn.has(id), `${id} is written but not drawn`).toBe(true);
    }
  });

  it("has nothing to say about an unnamed stretch of ground", () => {
    expect(featureFor(undefined)).toBeNull();
    expect(featureFor("atlantis")).toBeNull();
  });

  it("names each kind in both languages", () => {
    for (const [kind, label] of Object.entries(KIND_LABELS)) {
      for (const language of LANGUAGES) {
        expect(label[language], `${kind} ${language}`).toBeTruthy();
      }
    }
  });

  it("has nothing to say about grass or an id off the catalog", () => {
    expect(legendFor("terrain", BARE_GROUND)).toBeNull();
    expect(legendFor("decor", "windmill")).toBeNull();
    expect(legendFor("place", "spaceport")).toBeNull();
  });
});
