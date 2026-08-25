import { describe, expect, it } from "vitest";

import geography from "../../../art/map/geography.json";
import { DECOR, MARKERS, TERRAINS, WATERS } from "../catalog";
import {
  BARE_GROUND,
  DECOR_NOTES,
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
