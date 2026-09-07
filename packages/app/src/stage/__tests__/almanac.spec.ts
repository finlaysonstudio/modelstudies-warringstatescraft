/// <reference types="node" />
// the one app spec that reads the lake; node types are referenced here alone
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DIRECTIONS } from "../../../../game/src/stage/vocabulary";
import {
  DECOR_MONTHS,
  MONTHS,
  MONTH_IDS,
  SEASONAL_DECOR,
  SEASONS,
  TASK_SHARE,
  isShownInMonth,
  monthOfToday,
  monthRecord,
  parseMonth,
  parseSeasonalId,
  seasonOf,
  seasonalDecorId,
  seasonalSheetId,
  type Cite,
  type Month,
} from "../almanac";
import { DECOR, DIRECTION_RULES } from "../catalog";
import { SITES, type Site, type SiteId } from "../sites";

const LANGUAGES = ["en", "zh"] as const;

interface IndexedDocument {
  id: string;
  use: string;
}
const indexFile = resolve(process.cwd(), "var/lake/index.json");
const lakePresent = existsSync(indexFile);
const lakeDocs = lakePresent
  ? (JSON.parse(readFileSync(indexFile, "utf8")).docs as IndexedDocument[])
  : [];
const lake = new Map(lakeDocs.map((doc) => [doc.id, doc]));

const TOWN_KINDS = Object.entries(DIRECTIONS)
  .filter(([, rule]) => rule.scope === "town")
  .map(([kind]) => kind);

describe("the almanac", () => {
  it("has twelve months in order, three to a season", () => {
    expect(MONTHS.map((record) => record.month)).toEqual([...MONTH_IDS]);
    for (const month of MONTH_IDS) {
      expect(monthRecord(month).month).toBe(month);
      expect(monthRecord(month).season).toBe(seasonOf(month));
    }
    for (const season of SEASONS) {
      expect(MONTHS.filter((record) => record.season === season)).toHaveLength(
        3,
      );
    }
  });

  it("names each month, its terms, six pentads, and an ordinance in both languages", () => {
    for (const record of MONTHS) {
      expect(record.pentads, `month ${record.month}`).toHaveLength(6);
      for (const language of LANGUAGES) {
        expect(record.name[language]).toBeTruthy();
        expect(record.terms[language]).toBeTruthy();
        expect(record.ordinance[language].length).toBeGreaterThan(20);
        for (const pentad of record.pentads) {
          expect(pentad[language]).toBeTruthy();
        }
      }
      expect(record.sources.length).toBeGreaterThan(1);
    }
  });

  it("keeps the weather a chance and the light a grade", () => {
    for (const record of MONTHS) {
      if (record.weather) {
        expect(record.weather.chance).toBeGreaterThan(0);
        expect(record.weather.chance).toBeLessThanOrEqual(1);
      }
    }
    // snow falls in winter alone, and the geese cross in autumn or spring
    for (const record of MONTHS) {
      if (record.weather?.kind === "snow") {
        expect(["winter", "spring"]).toContain(record.season);
      }
      if (record.geese) {
        expect(["spring", "autumn"]).toContain(record.season);
      }
    }
  });

  it("opens on the Xia month of today's date", () => {
    expect(monthOfToday(new Date(2026, 0, 15))).toBe(12);
    expect(monthOfToday(new Date(2026, 1, 15))).toBe(1);
    expect(monthOfToday(new Date(2026, 8, 7))).toBe(8);
    expect(monthOfToday(new Date(2026, 11, 1))).toBe(11);
    expect(parseMonth("7")).toBe(7);
    expect(parseMonth("0")).toBeNull();
    expect(parseMonth("13")).toBeNull();
    expect(parseMonth("x")).toBeNull();
    expect(parseMonth(null)).toBeNull();
  });

  it("names only catalog decor in the seasonal rules", () => {
    for (const key of Object.keys(DECOR_MONTHS)) {
      expect(DECOR, key).toContain(key);
      expect(
        DECOR_MONTHS[key as keyof typeof DECOR_MONTHS]!.length,
      ).toBeGreaterThan(0);
    }
    for (const key of Object.keys(SEASONAL_DECOR)) {
      expect(DECOR, key).toContain(key);
    }
    expect(isShownInMonth("haystack", 10)).toBe(true);
    expect(isShownInMonth("haystack", 5)).toBe(false);
    expect(isShownInMonth("pine", 5)).toBe(true);
  });

  it("names seasonal sheets with a tilde and reads them back", () => {
    expect(seasonalSheetId("terrain.field", "autumn")).toBe(
      "terrain.field~autumn",
    );
    expect(parseSeasonalId("terrain.field~autumn")).toEqual({
      id: "terrain.field",
      season: "autumn",
    });
    expect(parseSeasonalId("terrain.field")).toBeNull();
    expect(parseSeasonalId("terrain.field~mud")).toBeNull();
    expect(seasonalDecorId("plum", "spring")).toBe("decor.plum");
    expect(seasonalDecorId("plum", "winter")).toBe("decor.plum~winter");
    expect(seasonalDecorId("pine", "winter")).toBe("decor.pine");
    for (const variants of Object.values(SEASONAL_DECOR)) {
      for (const id of Object.values(variants)) {
        expect(parseSeasonalId(id)).not.toBeNull();
      }
    }
  });

  it("draws tasks more often than strolls", () => {
    expect(TASK_SHARE).toBeGreaterThan(0.5);
    expect(TASK_SHARE).toBeLessThan(1);
  });

  it("cites the lake where it is checked out", () => {
    if (!lakePresent) return;
    for (const record of MONTHS) {
      for (const cite of record.sources)
        expectCite(cite, `month ${record.month}`);
    }
  });
});

const expectCite = (cite: Cite, where: string) => {
  expect(lake.has(cite.id), `${where}: ${cite.id}`).toBe(true);
  if (cite.line !== undefined) expect(cite.line).toBeGreaterThan(0);
};

describe.each(SITES.map((site): [SiteId, Site] => [site.id, site]))(
  "the %s year",
  (id, site) => {
    const folk = new Set(site.folk.map((person) => person.archetype));
    const places = new Set(Object.keys(site.names));

    it("plans every month with a note and tasks", () => {
      for (const month of MONTH_IDS) {
        const plan = site.year[month];
        expect(plan, `${id} month ${month}`).toBeDefined();
        for (const language of LANGUAGES) {
          expect(plan.note[language].length, `${id} ${month}`).toBeGreaterThan(
            20,
          );
        }
        expect(
          plan.tasks.length,
          `${id} month ${month}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it("gives every task to one of its own people at one of its own places", () => {
      for (const month of MONTH_IDS) {
        for (const task of site.year[month].tasks) {
          const where = `${id} ${month} ${task.who} ${task.kind}`;
          expect(folk.has(task.who), where).toBe(true);
          expect(TOWN_KINDS, where).toContain(task.kind);
          const rule = DIRECTION_RULES[task.kind];
          if (rule.places === "route") {
            expect(task.from && places.has(task.from), where).toBe(true);
            expect(task.to && places.has(task.to), where).toBe(true);
            expect(task.from).not.toBe(task.to);
            expect(task.at, where).toBeUndefined();
          } else {
            expect(task.at && places.has(task.at), where).toBe(true);
            expect(task.from, where).toBeUndefined();
          }
          if (task.count !== undefined) {
            expect(task.count).toBeGreaterThan(0);
            expect(task.count).toBeLessThanOrEqual(16);
          }
          for (const language of LANGUAGES) {
            expect(task.line[language], where).toBeTruthy();
          }
        }
      }
    });

    it("keeps every rite at a place of its own, led by its own people, with a citation", () => {
      let rites = 0;
      for (const month of MONTH_IDS) {
        for (const rite of site.year[month].rites ?? []) {
          rites += 1;
          const where = `${id} ${month} ${rite.title.en}`;
          expect(folk.has(rite.who), where).toBe(true);
          expect(places.has(rite.at), where).toBe(true);
          for (const language of LANGUAGES) {
            expect(rite.title[language], where).toBeTruthy();
            expect(rite.line[language], where).toBeTruthy();
          }
          expect(rite.cite.id, where).toBeTruthy();
          if (lakePresent) expectCite(rite.cite, where);
        }
      }
      expect(rites).toBeGreaterThanOrEqual(5);
    });

    it("sends its people to every quarter of the site over the year", () => {
      const visited = new Set<string>();
      const working = new Set<string>();
      for (const month of MONTH_IDS) {
        for (const task of site.year[month].tasks) {
          working.add(task.who);
          for (const place of [task.at, task.from, task.to]) {
            if (place) visited.add(place);
          }
        }
      }
      // most of the folk work at some point in the year
      expect(working.size).toBeGreaterThanOrEqual(Math.floor(folk.size * 0.7));
      expect(visited.size).toBeGreaterThanOrEqual(10);
    });
  },
);

describe("the catalog's month helpers", () => {
  it("returns a Month for every id", () => {
    for (const month of MONTH_IDS) {
      expect(parseMonth(String(month))).toBe(month satisfies Month);
    }
  });
});
