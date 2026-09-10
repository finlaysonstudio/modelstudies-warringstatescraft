/**
 * The house's own cases (plan `20260909_Plan_house_year.md` §10), runtime
 * free: one household on the lineage convention, every stop a place and a
 * pose the sprite carries, every event's places on the map with the steps
 * and the shrine among them, every cite in the lake, the register changes of
 * the capping, the marriage, the mission, and the death consistent, and every
 * place reachable from the gate through the doors of the built map.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import geography from "../../../art/sites/house/geography.json";
import {
  ARCHETYPES,
  DIRECTION_RULES,
  OVERLAYS,
  SPRITE_VARIANTS,
} from "../catalog";
import { gridOf, type GridMap } from "../grid";
import { findPath } from "../route";
import { HOUSE } from "../sites";
import { HOUSE_CIRCUITS, HOUSE_DAYS } from "../sites/house/circuits";
import { HOUSE_EVENTS } from "../sites/house/events";
import {
  HOUSE_ID,
  HOUSE_MEMBERS,
  HOUSE_PEOPLE,
  HOUSE_REGISTER,
  HOUSE_SURNAME,
  HOUSE_VISITORS,
} from "../sites/house/register";

const LANGUAGES = ["en", "zh"] as const;

/** the poses of plan §7.2, the only strings a stop or a direction may carry */
const POSES = new Set([
  "kneel",
  "bow",
  "sit",
  "read",
  "shoot",
  "weave",
  "serve",
  "write",
  "spin",
  "zither",
  "carry",
  "liubo",
  "play",
  "strike",
  "stand",
  "sweep",
  "draw",
  "cook",
  "chop",
  "groom",
  "lead",
  "call",
  "divine",
]);

/** the stop placeholders `circuitOf` resolves */
const PLACEHOLDERS = new Set(["home", "well", "plot", "block", "edge"]);

const places = new Set(Object.keys(geography.places));
const people = new Map(HOUSE_PEOPLE.map((person) => [person.id, person]));
const ids = new Set(people.keys());
const archetypes = new Set<string>(ARCHETYPES);

const indexFile = resolve(process.cwd(), "var/lake/index.json");
const lakePresent = existsSync(indexFile);
const lake = new Set<string>(
  lakePresent
    ? (
        JSON.parse(readFileSync(indexFile, "utf8")).docs as { id: string }[]
      ).map((doc) => doc.id)
    : [],
);

const mapFile = resolve(process.cwd(), "packages/app/public/stage/house.tmj");
const mapPresent = existsSync(mapFile);

const placesOfEvent = (event: (typeof HOUSE_EVENTS)[number]): Set<string> => {
  const used = new Set<string>();
  for (const direction of event.script.flat()) {
    for (const place of [direction.from, direction.to, direction.at]) {
      if (place) used.add(place);
    }
  }
  return used;
};

describe("the house's register", () => {
  it("is one household of the lineage, twenty-five listed and twenty-four drawn, no wu", () => {
    expect(HOUSE_REGISTER).toHaveLength(1);
    const [household] = HOUSE_REGISTER;
    expect(household.id).toBe(HOUSE_ID);
    expect(household.surname).toBe(HOUSE_SURNAME);
    expect(household.wu).toBeUndefined();
    expect(household.members).toHaveLength(25);
    expect(household.members.filter((member) => member.drawn)).toHaveLength(24);
    expect(household.members.map((member) => member.id)).toContain(
      household.head,
    );
    expect(HOUSE_VISITORS).toHaveLength(6);
    expect(HOUSE.register).toBe(HOUSE_REGISTER);
    expect(HOUSE.visitors).toBe(HOUSE_VISITORS);
  });

  it("gives every person a unique id on the lineage's prefix, a name in both languages, and a drawn archetype", () => {
    expect(ids.size).toBe(HOUSE_PEOPLE.length);
    for (const person of HOUSE_PEOPLE) {
      const where = person.id;
      expect(
        person.id.startsWith(`${HOUSE_ID}.`) ||
          person.id.startsWith("visitor."),
        where,
      ).toBe(true);
      expect(person.id, where).toMatch(/^[a-z]+\.[a-z-]+$/);
      for (const language of LANGUAGES) {
        expect(person.name[language].trim(), `${where}.${language}`).not.toBe(
          "",
        );
      }
      expect(
        archetypes.has(person.archetype),
        `${where} ${person.archetype}`,
      ).toBe(true);
      if (person.sprite) {
        expect(
          SPRITE_VARIANTS[person.archetype],
          `${where} ${person.sprite}`,
        ).toContain(person.sprite);
      }
      for (const overlay of person.overlays ?? []) {
        expect(OVERLAYS, `${where} ${overlay}`).toHaveProperty(overlay);
      }
    }
  });

  it("homes every person at a place of the map, the visitors at the street's end", () => {
    for (const person of HOUSE_PEOPLE) {
      expect(places.has(person.home), `${person.id} at ${person.home}`).toBe(
        true,
      );
    }
    for (const visitor of HOUSE_VISITORS) {
      expect(visitor.home, visitor.id).toBe("edge");
    }
    expect("marker" in geography.places.edge).toBe(false);
  });

  it("is what the site walks", () => {
    const drawn = HOUSE_PEOPLE.filter((person) => person.drawn);
    expect(HOUSE.folk).toHaveLength(drawn.length);
    const homes = new Set(HOUSE.folk.map((person) => person.home));
    for (const home of homes) {
      expect(places.has(home ?? ""), `folk home ${home}`).toBe(true);
    }
    expect(HOUSE.strollPlaces).not.toContain("edge");
    expect(HOUSE.strollPlaces).not.toContain("roof");
  });
});

describe("the house's circuits", () => {
  it("are the flattened days of the roles the register carries", () => {
    expect(HOUSE.circuits).toBe(HOUSE_CIRCUITS);
    expect(HOUSE_CIRCUITS.length).toBeGreaterThan(0);
    const roles = new Set(HOUSE_PEOPLE.map((person) => person.role));
    const seen = new Set<string>();
    for (const circuit of HOUSE_CIRCUITS) {
      const key = `${circuit.role}:${circuit.month}`;
      expect(seen.has(key), `${key} twice`).toBe(false);
      seen.add(key);
      expect(roles.has(circuit.role), circuit.role).toBe(true);
      expect(circuit.month).toBeGreaterThanOrEqual(1);
      expect(circuit.month).toBeLessThanOrEqual(12);
    }
    for (const role of Object.keys(HOUSE_DAYS)) {
      expect(roles.has(role as never), role).toBe(true);
    }
  });

  it("stops at a place of the map or a placeholder, in a pose the sprite carries, hours ascending", () => {
    for (const circuit of HOUSE_CIRCUITS) {
      const where = `${circuit.role} ${circuit.month}`;
      expect(circuit.stops.length, where).toBeGreaterThan(0);
      let last = 0;
      for (const stop of circuit.stops) {
        expect(stop.hour, `${where} ${stop.hour}`).toBeGreaterThan(last);
        last = stop.hour;
        expect(
          PLACEHOLDERS.has(stop.at) || places.has(stop.at),
          `${where} at ${stop.at}`,
        ).toBe(true);
        if (stop.pose)
          expect(POSES.has(stop.pose), `${where} pose ${stop.pose}`).toBe(true);
        for (const overlay of stop.overlays ?? []) {
          expect(OVERLAYS, `${where} ${overlay}`).toHaveProperty(overlay);
        }
        if (stop.cite) {
          expect(typeof stop.cite.line, `${where} cite ${stop.cite.id}`).toBe(
            "number",
          );
        }
      }
    }
  });

  it("send the master out to the street's end and back, and keep the gatekeeper up at night", () => {
    const master = HOUSE_CIRCUITS.find(
      (c) => c.role === "master" && c.month === 4,
    );
    expect(master?.stops.some((stop) => stop.at === "edge")).toBe(true);
    // he sleeps in the chamber; his dais is where the day begins
    expect(["home", "chamber"]).toContain(master?.stops.at(-1)?.at);
    const keeper = HOUSE_CIRCUITS.find(
      (c) => c.role === "gatekeeper" && c.month === 4,
    );
    const hours = new Set(keeper?.stops.map((stop) => stop.hour));
    expect(hours.has(11)).toBe(true);
    expect(hours.has(2)).toBe(true);
    const maid = HOUSE_CIRCUITS.find((c) => c.role === "maid" && c.month === 4);
    const lamp = maid?.stops.find((stop) => stop.hour > 10);
    expect(lamp?.overlays).toContain("lamp");
  });

  it.skipIf(!lakePresent)("cites the lake on its notable stops", () => {
    for (const circuit of HOUSE_CIRCUITS) {
      for (const stop of circuit.stops) {
        if (stop.cite) expect(lake.has(stop.cite.id), stop.cite.id).toBe(true);
      }
    }
  });
});

describe("the house's events", () => {
  it("are the year in order with unique ids", () => {
    expect(HOUSE.events).toBe(HOUSE_EVENTS);
    expect(HOUSE_EVENTS.length).toBeGreaterThanOrEqual(30);
    const seen = new Set<string>();
    let last = 0;
    for (const event of HOUSE_EVENTS) {
      expect(seen.has(event.id), `${event.id} twice`).toBe(false);
      seen.add(event.id);
      const when = event.month * 10000 + event.day * 100 + event.hour;
      expect(when, event.id).toBeGreaterThanOrEqual(last);
      last = when;
      expect(event.day).toBeGreaterThanOrEqual(1);
      expect(event.day).toBeLessThanOrEqual(30);
      for (const language of LANGUAGES) {
        expect(
          event.title[language].trim(),
          `${event.id}.${language}`,
        ).not.toBe("");
        expect(event.line[language].trim(), `${event.id}.${language}`).not.toBe(
          "",
        );
      }
      expect(event.cite.length, event.id).toBeGreaterThan(0);
      expect(event.script.length, event.id).toBeGreaterThan(0);
    }
  });

  it("stages every scene at places of the map by people of the register, in the vocabulary's kinds", () => {
    for (const event of HOUSE_EVENTS) {
      for (const [index, scene] of event.script.entries()) {
        expect(scene.length, `${event.id} scene ${index}`).toBeGreaterThan(0);
        for (const direction of scene) {
          const where = `${event.id} scene ${index} ${direction.kind}`;
          const rule = DIRECTION_RULES[direction.kind];
          expect(rule, where).toBeDefined();
          if (rule.places === "route") {
            expect(direction.from, where).toBeDefined();
            expect(direction.to, where).toBeDefined();
            expect(direction.at, where).toBeUndefined();
          } else {
            expect(direction.at, where).toBeDefined();
          }
          for (const place of [direction.from, direction.to, direction.at]) {
            if (place)
              expect(places.has(place), `${where} at ${place}`).toBe(true);
          }
          const { seat, archetype, overlays, variant } = direction.actor;
          expect(seat.startsWith("house:"), where).toBe(true);
          const who = seat.slice("house:".length);
          expect(archetypes.has(archetype), `${where} ${archetype}`).toBe(true);
          if (ids.has(who)) {
            expect(people.get(who)?.archetype, `${where} ${who}`).toBe(
              archetype,
            );
          } else {
            // a crowd is seated by its archetype
            expect(who, `${where} seat ${who}`).toBe(archetype);
          }
          if (variant) {
            expect(SPRITE_VARIANTS[archetype], `${where} ${variant}`).toContain(
              variant,
            );
          }
          for (const overlay of overlays ?? []) {
            expect(OVERLAYS, `${where} ${overlay}`).toHaveProperty(overlay);
          }
          if (direction.pose) {
            expect(
              POSES.has(direction.pose),
              `${where} pose ${direction.pose}`,
            ).toBe(true);
          }
        }
      }
      if (
        event.attend &&
        typeof event.attend === "object" &&
        "villagers" in event.attend
      ) {
        for (const id of event.attend.villagers) {
          expect(ids.has(id), `${event.id} attend ${id}`).toBe(true);
        }
      }
    }
  });

  it("plays by the steps and at the shrine", () => {
    const used = new Set<string>();
    for (const event of HOUSE_EVENTS) {
      for (const place of placesOfEvent(event)) used.add(place);
    }
    for (const place of [
      "east-steps",
      "west-steps",
      "shrine",
      "tablets",
      "roof",
      "edge",
      "gate",
    ]) {
      expect(used.has(place), place).toBe(true);
    }
    expect(geography.places["east-steps"].marker).toBe("steps");
    expect(geography.places["west-steps"].marker).toBe("steps");
    expect(geography.places.shrine.room).toBe(true);
    expect(geography.rooms.some((room) => room.id === "shrine")).toBe(true);
  });

  it.skipIf(!lakePresent)(
    "cites the lake on every event, with a line where the text has one",
    () => {
      for (const event of HOUSE_EVENTS) {
        for (const cite of event.cite) {
          expect(lake.has(cite.id), `${event.id} cites ${cite.id}`).toBe(true);
        }
      }
      for (const cite of HOUSE_EVENTS.flatMap((event) => event.cite)) {
        if (cite.id.endsWith("-zh") && cite.id !== "season-shangsi-zh") {
          expect(typeof cite.line, cite.id).toBe("number");
        }
      }
    },
  );

  it("changes the register consistently: the capping, the marriage, the mission, the death", () => {
    const changesOf = (id: string) =>
      HOUSE_EVENTS.filter((event) => event.id === id).flatMap(
        (event) => event.changes ?? [],
      );
    for (const event of HOUSE_EVENTS) {
      for (const change of event.changes ?? []) {
        expect(
          ids.has(change.villager),
          `${event.id} changes ${change.villager}`,
        ).toBe(true);
        expect(
          HOUSE_MEMBERS.some((member) => member.id === change.villager),
          `${event.id} changes a visitor`,
        ).toBe(true);
      }
    }
    // the heir is capped in the second month: the sprite and the age class
    const capping = changesOf("capping");
    expect(capping).toContainEqual({
      villager: `${HOUSE_ID}.jia`,
      set: { sprite: "sprite.heir-capped", age: "大" },
    });
    expect(people.get(`${HOUSE_ID}.jia`)?.age).toBe("小");
    // the daughter is away for the year and struck at the fetching
    const fetching = changesOf("fetching");
    expect(
      fetching.some(
        (c) => c.villager === `${HOUSE_ID}.ji` && c.set.away === "year",
      ),
    ).toBe(true);
    expect(
      fetching.some((c) => c.villager === `${HOUSE_ID}.ji` && c.set.struck),
    ).toBe(true);
    // the master is away the month of his mission
    expect(changesOf("mission")).toContainEqual({
      villager: `${HOUSE_ID}.ao`,
      set: { away: 10 },
    });
    // the death: the tutor away from the eleventh month, hemp on the household, struck at the burial
    const death = HOUSE_EVENTS.find((event) => event.id === "death");
    const burial = HOUSE_EVENTS.find((event) => event.id === "burial");
    expect(death?.month).toBe(11);
    expect(burial?.month).toBe(12);
    expect(death?.changes).toContainEqual({
      villager: `${HOUSE_ID}.tutor`,
      set: { away: "year" },
    });
    const hemp = (death?.changes ?? []).filter((c) =>
      c.set.overlays?.includes("hemp"),
    );
    expect(hemp.length).toBeGreaterThanOrEqual(5);
    expect(hemp.map((c) => c.villager)).toContain(`${HOUSE_ID}.ao`);
    expect(hemp.map((c) => c.villager)).not.toContain(`${HOUSE_ID}.tutor`);
    expect(burial?.changes).toEqual([
      { villager: `${HOUSE_ID}.tutor`, set: { struck: true } },
    ]);
    // no one is struck before being away, and no one struck walks in a later event
    const struckFrom = new Map<string, number>();
    for (const event of HOUSE_EVENTS) {
      for (const change of event.changes ?? []) {
        if (change.set.struck) struckFrom.set(change.villager, event.month);
      }
    }
    for (const event of HOUSE_EVENTS) {
      for (const direction of event.script.flat()) {
        const who = direction.actor.seat.slice("house:".length);
        const from = struckFrom.get(who);
        if (from !== undefined) {
          expect(
            event.month,
            `${who} walks in ${event.id} after being struck`,
          ).toBeLessThanOrEqual(from);
        }
      }
    }
  });
});

describe("the house's ground", () => {
  it("names every place and notes every feature", () => {
    expect(new Set(Object.keys(HOUSE.names))).toEqual(places);
    const features = new Set<string>();
    for (const fill of geography.fills)
      if ("feature" in fill && fill.feature) features.add(fill.feature);
    for (const room of geography.rooms)
      if ("feature" in room && room.feature) features.add(room.feature);
    for (const wall of geography.walls)
      if (wall.feature) features.add(wall.feature);
    expect(new Set(Object.keys(HOUSE.features))).toEqual(features);
    expect(features.has("shrine")).toBe(true);
  });

  it.skipIf(!mapPresent)(
    "reaches every place from the gate through the doors, the shrine by its own",
    () => {
      const map = JSON.parse(readFileSync(mapFile, "utf8")) as GridMap;
      const grid = gridOf(map);
      const layer = map.layers.find((l) => l.name === "places");
      const cells = new Map(
        (layer?.objects ?? []).map((object) => [
          object.name ?? "",
          {
            x: Math.floor(object.x / map.tilewidth),
            y: Math.floor(object.y / map.tileheight),
          },
        ]),
      );
      const gate = cells.get("gate");
      expect(gate).toBeDefined();
      for (const [name, cell] of cells) {
        // the roof is climbed by the invocator alone and the pond is water: neither is strolled to
        if (name === "roof" || name === "pond") continue;
        const path = findPath({ grid, from: gate!, to: cell });
        expect(path, `gate → ${name}`).not.toBeNull();
      }
      // the shrine's door is its own: the path in enters through the south wall's gap
      const shrine = geography.rooms.find((room) => room.id === "shrine")!;
      const [x, y, w, h] = shrine.rect;
      const path = findPath({ grid, from: gate!, to: cells.get("tablets")! })!;
      const entry = path.find(
        (cell) =>
          cell.x >= x && cell.x < x + w && cell.y >= y && cell.y < y + h,
      );
      expect(entry).toBeDefined();
      expect(entry!.y).toBe(y + h - 1);
    },
  );
});
