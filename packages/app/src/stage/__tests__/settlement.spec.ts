import { describe, expect, it } from "vitest";

import geography from "../../../art/settlement/geography.json";
import { ARCHETYPES, DECOR, MARKERS, TERRAINS, WATERS } from "../catalog";
import {
  ORDER_LABELS,
  SETTLEMENT_FEATURES,
  SETTLEMENT_NAMES,
  settlementMapOf,
  STROLL_PLACES,
  TOWNSFOLK,
} from "../settlement";
import { STAGE_SETS } from "../sets";

const LANGUAGES = ["en", "zh"] as const;
const places = Object.keys(geography.places);
const grounds = new Set<string>([...TERRAINS, ...WATERS]);

describe("settlement", () => {
  it("names every place the geography draws, and nothing else", () => {
    expect(Object.keys(SETTLEMENT_NAMES).sort()).toEqual([...places].sort());
    for (const [key, label] of Object.entries(SETTLEMENT_NAMES)) {
      for (const language of LANGUAGES) {
        expect(label[language], `${key}.${language}`).toBeTruthy();
      }
    }
  });

  it("notes every feature the geography names, and nothing else", () => {
    const drawn = new Set(
      geography.fills.flatMap((fill) => (fill.feature ? [fill.feature] : [])),
    );
    expect(Object.keys(SETTLEMENT_FEATURES).sort()).toEqual([...drawn].sort());
    for (const [key, note] of Object.entries(SETTLEMENT_FEATURES)) {
      for (const language of LANGUAGES) {
        expect(note.title[language], `${key}.title.${language}`).toBeTruthy();
        expect(note.what[language], `${key}.what.${language}`).toBeTruthy();
        expect(
          note.history[language],
          `${key}.history.${language}`,
        ).toBeTruthy();
      }
    }
  });

  it("draws only grounds, markers, and decor the catalog knows", () => {
    for (const fill of geography.fills) {
      expect(grounds.has(fill.terrain), fill.terrain).toBe(true);
    }
    for (const [key, place] of Object.entries(geography.places)) {
      if ("marker" in place && place.marker) {
        expect(MARKERS, `${key}: ${place.marker}`).toContain(place.marker);
      }
    }
    for (const decor of geography.decor) {
      expect(DECOR, decor.id).toContain(decor.id);
    }
  });

  it("seats every townsperson at a place, as an archetype the catalog draws", () => {
    const seats = new Set<string>();
    for (const person of TOWNSFOLK) {
      expect(ARCHETYPES, person.archetype).toContain(person.archetype);
      expect(seats.has(person.archetype), `${person.archetype} twice`).toBe(
        false,
      );
      seats.add(person.archetype);
      if (person.home) expect(places, person.home).toContain(person.home);
      expect(ORDER_LABELS[person.order]).toBeDefined();
      for (const language of LANGUAGES) {
        expect(
          person.label[language],
          `${person.archetype}.${language}`,
        ).toBeTruthy();
      }
    }
  });

  it("strolls only to named places", () => {
    expect(STROLL_PLACES.length).toBeGreaterThan(10);
    for (const place of STROLL_PLACES) expect(places).toContain(place);
  });

  it("gives each art set its own map and the shared feature sidecar", () => {
    const urls = new Set<string>();
    for (const set of STAGE_SETS) {
      const map = settlementMapOf(set);
      expect(map.features).toBe("/stage/settlement.features.json");
      urls.add(map.url);
    }
    expect(urls.size).toBe(STAGE_SETS.length);
  });
});
