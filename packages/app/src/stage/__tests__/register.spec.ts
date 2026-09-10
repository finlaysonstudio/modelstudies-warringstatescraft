import { describe, expect, it } from "vitest";

import { ARCHETYPES, OVERLAYS, SPRITE_VARIANTS } from "../catalog";
import {
  allVillagers,
  applyChange,
  circuitOf,
  householdOf,
  isPresent,
  ORDER_OF_ROLE,
  registerAt,
  seatOfVillager,
  villagersOf,
  type RegisterState,
} from "../register";
import type { Month } from "../almanac";
import { ORDER_LABELS, SITES, type Site } from "../sites";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Month[];

describe("register", () => {
  it("names a seat per villager, so two of one archetype are two people", () => {
    expect(seatOfVillager({ seat: "v" }, "a1")).toBe("v:a1");
  });

  it("derives the folk from the register where a site has one", () => {
    for (const site of SITES) {
      const folk = villagersOf(site);
      if (!site.register) {
        expect(folk).toEqual(site.folk);
        continue;
      }
      const drawn = allVillagers(site).filter((v) => v.drawn);
      expect(folk.length).toBe(drawn.length);
      for (const person of folk) {
        expect(ORDER_LABELS[person.order], person.archetype).toBeDefined();
        expect(person.home, person.label.en).toBeTruthy();
      }
    }
  });

  for (const site of SITES.filter((s) => s.register)) {
    describe(`the ${site.id}'s register`, () => {
      const villagers = allVillagers(site);
      const places = new Set(Object.keys(site.names));

      it("gives every villager an id of its own, a home on the map, and an archetype the catalog draws", () => {
        const ids = new Set<string>();
        for (const v of villagers) {
          expect(ids.has(v.id), `${v.id} twice`).toBe(false);
          ids.add(v.id);
          expect(places.has(v.home), `${v.id} at ${v.home}`).toBe(true);
          expect(ARCHETYPES).toContain(v.archetype);
          expect(v.name.en).toBeTruthy();
          expect(v.name.zh).toBeTruthy();
          expect(ORDER_OF_ROLE[v.role]).toBeDefined();
          if (v.sprite) {
            expect(
              SPRITE_VARIANTS[v.archetype] ?? [],
              `${v.id} wears ${v.sprite}`,
            ).toContain(v.sprite);
          }
          for (const overlay of v.overlays ?? []) {
            expect(OVERLAYS, `${v.id} carries ${overlay}`).toHaveProperty(
              overlay,
            );
          }
        }
      });

      it("heads every household with one of its members and plots it on the map", () => {
        for (const household of site.register!) {
          expect(
            household.members.map((m) => m.id),
            household.id,
          ).toContain(household.head);
          expect(householdOf(site, household.head)?.id).toBe(household.id);
          if (household.plot)
            expect(places.has(household.plot), household.plot).toBe(true);
          if (household.wu) {
            expect(
              site.wus?.some((wu) => wu.id === household.wu),
              household.wu,
            ).toBe(true);
          }
        }
      });

      it("groups the households into 伍 of five under one of their own", () => {
        for (const wu of site.wus ?? []) {
          expect(wu.households.length).toBe(5);
          for (const id of wu.households) {
            expect(
              site.register!.some((h) => h.id === id),
              id,
            ).toBe(true);
          }
          const elder = householdOf(site, wu.wulao);
          expect(elder && wu.households.includes(elder.id), wu.id).toBe(true);
        }
      });

      it("writes every circuit against a role on the register and stops it at places or placeholders", () => {
        const roles = new Set(villagers.map((v) => v.role));
        const placeholders = new Set(["home", "well", "plot", "block", "edge"]);
        for (const circuit of site.circuits ?? []) {
          expect(
            roles.has(circuit.role),
            `${circuit.role} in month ${circuit.month}`,
          ).toBe(true);
          expect(MONTHS).toContain(circuit.month);
          let last = 0;
          for (const stop of circuit.stops) {
            expect(stop.hour).toBeGreaterThanOrEqual(last);
            last = stop.hour;
            expect(
              placeholders.has(stop.at) || places.has(stop.at),
              `${circuit.role}: ${stop.at}`,
            ).toBe(true);
            for (const overlay of stop.overlays ?? [])
              expect(OVERLAYS).toHaveProperty(overlay);
          }
        }
      });

      it("dates every event, cites it, and changes only villagers on the register", () => {
        const ids = new Set(villagers.map((v) => v.id));
        const seen = new Set<string>();
        for (const event of site.events ?? []) {
          expect(seen.has(event.id), event.id).toBe(false);
          seen.add(event.id);
          expect(MONTHS).toContain(event.month);
          expect(event.day).toBeGreaterThanOrEqual(1);
          expect(event.day).toBeLessThanOrEqual(30);
          expect(event.hour).toBeGreaterThanOrEqual(1);
          expect(event.hour).toBeLessThanOrEqual(12);
          expect(event.cite.length, event.id).toBeGreaterThan(0);
          expect(event.script.length, event.id).toBeGreaterThan(0);
          for (const scene of event.script) {
            for (const direction of scene) {
              if (direction.at)
                expect(
                  places.has(direction.at),
                  `${event.id}: ${direction.at}`,
                ).toBe(true);
              if (direction.from)
                expect(
                  places.has(direction.from) || direction.from === "edge",
                  `${event.id}: ${direction.from}`,
                ).toBe(true);
              if (direction.to)
                expect(
                  places.has(direction.to) || direction.to === "edge",
                  `${event.id}: ${direction.to}`,
                ).toBe(true);
            }
          }
          for (const change of event.changes ?? []) {
            expect(
              ids.has(change.villager),
              `${event.id} changes ${change.villager}`,
            ).toBe(true);
            if (change.set.household) {
              expect(
                site.register!.some((h) => h.id === change.set.household),
              ).toBe(true);
            }
          }
        }
      });

      it("resolves every circuit onto the map for every present villager", () => {
        const context = {
          places: Object.fromEntries(
            Object.keys(site.names).map((key) => [key, { x: 0, y: 0 }]),
          ),
          markers: {} as Record<string, string | undefined>,
          edge: site.names.edge ? "edge" : undefined,
        };
        const wells = Object.keys(site.names).filter((key) => /well/.test(key));
        for (const key of wells) context.markers[key] = "well";
        for (const month of MONTHS) {
          const state = registerAt(site, month);
          for (const villager of allVillagers(state)) {
            const stops = circuitOf({ site, villager, month, context, state });
            if (!isPresent(state, villager)) {
              expect(stops).toEqual([]);
              continue;
            }
            for (const stop of stops)
              expect(
                places.has(stop.at),
                `${villager.id} ${month}: ${stop.at}`,
              ).toBe(true);
          }
        }
      });
    });
  }

  it("folds changes forward by month and marks the month's own absence", () => {
    const site = {
      register: [
        {
          id: "a",
          surname: "A",
          head: "a1",
          members: [
            {
              id: "a1",
              name: { en: "a1", zh: "a1" },
              relation: "head",
              age: "大",
              sex: "m",
              archetype: "elder",
              role: "head",
              drawn: true,
              home: "h",
            },
            {
              id: "a2",
              name: { en: "a2", zh: "a2" },
              relation: "son",
              age: "小",
              sex: "m",
              archetype: "elder",
              role: "son",
              drawn: true,
              home: "h",
            },
          ],
        },
      ],
      visitors: [],
      events: [
        {
          id: "cap",
          month: 2,
          day: 1,
          hour: 5,
          title: { en: "", zh: "" },
          line: { en: "", zh: "" },
          cite: [],
          script: [],
          changes: [
            { villager: "a2", set: { age: "大", role: "head", away: 2 } },
          ],
        },
        {
          id: "gone",
          month: 5,
          day: 1,
          hour: 5,
          title: { en: "", zh: "" },
          line: { en: "", zh: "" },
          cite: [],
          script: [],
          changes: [{ villager: "a1", set: { struck: true } }],
        },
      ],
    } as unknown as Site;
    const jan = registerAt(site, 1);
    expect(jan.register[0].members[1].age).toBe("小");
    expect(jan.away.size).toBe(0);
    const feb = registerAt(site, 2);
    expect(feb.register[0].members[1].age).toBe("小");
    expect(feb.away.get("a2")).toBe(2);
    expect(isPresent(feb, feb.register[0].members[1])).toBe(false);
    const mar = registerAt(site, 3);
    expect(mar.register[0].members[1].age).toBe("大");
    expect(mar.register[0].members[1].role).toBe("head");
    expect(mar.away.has("a2")).toBe(false);
    const jun = registerAt(site, 6);
    expect(jun.struck.has("a1")).toBe(true);
    // a struck villager is off the household as well as off the map
    expect(jun.register[0].members.map((m) => m.id)).toEqual(["a2"]);
    expect(isPresent(jun, site.register![0].members[0])).toBe(false);
    const state: RegisterState = registerAt(site, 1);
    applyChange(state, { villager: "a2", set: { away: "year" } }, 1);
    expect(state.away.get("a2")).toBe("year");
  });
});
