import { describe, expect, it } from "vitest";

import city from "../../../art/sites/city/geography.json";
import house from "../../../art/sites/house/geography.json";
import village from "../../../art/sites/village/geography.json";
import { ARCHETYPES, DECOR, MARKERS, TERRAINS, WATERS } from "../catalog";
import { STAGE_SETS } from "../sets";
import {
  ORDER_LABELS,
  SITES,
  siteMapOf,
  siteOf,
  type Site,
  type SiteId,
} from "../sites";

const LANGUAGES = ["en", "zh"] as const;
const grounds = new Set<string>([...TERRAINS, ...WATERS]);

interface GeographyFile {
  fills: { terrain: string; feature?: string }[];
  places: Record<string, { x: number; y: number; marker?: string }>;
  decor: { id: string }[];
}
const GEOGRAPHIES: Record<SiteId, GeographyFile> = { city, village, house };

describe("sites", () => {
  it("lists each site once, by id, with its own route", () => {
    expect(SITES.map((site) => site.id)).toEqual(["city", "village", "house"]);
    expect(new Set(SITES.map((site) => site.path)).size).toBe(SITES.length);
    for (const site of SITES) {
      expect(siteOf(site.id)).toBe(site);
      expect(site.path).toBe(`/craft/${site.id}`);
      expect(site.intro.length).toBeGreaterThan(200);
      expect(site.sources.length).toBeGreaterThan(2);
    }
  });

  describe.each(SITES.map((site): [SiteId, Site] => [site.id, site]))(
    "%s",
    (id, site) => {
      const geography = GEOGRAPHIES[id];
      const places = Object.keys(geography.places);

      it("names every place the geography draws, and nothing else", () => {
        expect(Object.keys(site.names).sort()).toEqual([...places].sort());
        for (const [key, label] of Object.entries(site.names)) {
          for (const language of LANGUAGES) {
            expect(label[language], `${key}.${language}`).toBeTruthy();
          }
        }
      });

      it("notes every feature the geography names, and nothing else", () => {
        const drawn = new Set(
          geography.fills.flatMap((fill) =>
            fill.feature ? [fill.feature] : [],
          ),
        );
        expect(Object.keys(site.features).sort()).toEqual([...drawn].sort());
        for (const [key, note] of Object.entries(site.features)) {
          for (const language of LANGUAGES) {
            expect(
              note.title[language],
              `${key}.title.${language}`,
            ).toBeTruthy();
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
          if (place.marker) {
            expect(MARKERS, `${key}: ${place.marker}`).toContain(place.marker);
          }
        }
        for (const decor of geography.decor) {
          expect(DECOR, decor.id).toContain(decor.id);
        }
      });

      it("seats every figure at a place, as an archetype the catalog draws", () => {
        const seats = new Set<string>();
        for (const person of site.folk) {
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
        for (const home of site.smoking) expect(places).toContain(home);
      });

      it("strolls only to named places", () => {
        expect(site.strollPlaces.length).toBeGreaterThan(10);
        for (const place of site.strollPlaces) {
          expect(places).toContain(place);
        }
      });

      it("gives each art set its own map and one feature sidecar", () => {
        const urls = new Set<string>();
        for (const set of STAGE_SETS) {
          const map = siteMapOf(site, set);
          expect(map.features).toBe(`/stage/${id}.features.json`);
          urls.add(map.url);
        }
        expect(urls.size).toBe(STAGE_SETS.length);
      });
    },
  );
});
