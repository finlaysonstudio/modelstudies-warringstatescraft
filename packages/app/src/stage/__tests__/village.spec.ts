/// <reference types="node" />
// reads the lake index where it is checked out, as almanac.spec does
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DIRECTIONS } from "../../../../game/src/stage/vocabulary";
import geography from "../../../art/sites/village/geography.json";
import { MONTH_IDS, type Cite } from "../almanac";
import { ARCHETYPES, OVERLAYS, SPRITE_VARIANTS } from "../catalog";
import { registerAt, villagersOf } from "../register";
import type { Role, Stop } from "../site";
import { VILLAGE } from "../sites";
import { CORVEE_PARTY, eventVillagerIds } from "../sites/village/events";
import { HOUSE_SURNAMES } from "../sites/village/names";
import {
  VILLAGE_BLOCKS,
  VILLAGE_CIRCUITS,
  VILLAGE_DAYS,
  VILLAGE_EVENTS,
  VILLAGE_REGISTER,
  VILLAGE_VISITORS,
  VILLAGE_WUS,
  villageBlockOf,
} from "../sites/village";

const indexFile = resolve(process.cwd(), "var/lake/index.json");
const lakePresent = existsSync(indexFile);
const lake = new Set<string>(
  lakePresent
    ? (
        JSON.parse(readFileSync(indexFile, "utf8")).docs as { id: string }[]
      ).map((doc) => doc.id)
    : [],
);
const expectCite = (cite: Cite, where: string) => {
  expect(cite.id, where).toBeTruthy();
  if (!lakePresent) return;
  expect(lake.has(cite.id), `${where}: ${cite.id}`).toBe(true);
  if (cite.line !== undefined) expect(cite.line, where).toBeGreaterThan(0);
};

const places = new Set(Object.keys(geography.places));
const PLACEHOLDERS = new Set(["home", "well", "plot", "block", "edge"]);
const POSES = new Set([
  "hoe",
  "reap",
  "sow",
  "carry",
  "thresh",
  "chop",
  "kneel",
  "sit",
  "bow",
  "weave",
  "spin",
  "draw",
  "pick",
  "dye",
  "wash",
  "play",
  "fish",
  "read",
  "stand",
  "lead",
  "plough",
  "graze",
  "lie",
  "write",
  "inspect",
  "command",
  "stance",
]);
const TOWN_RULES = Object.fromEntries(
  Object.entries(DIRECTIONS).filter(([, rule]) => rule.scope === "town"),
);
const STOCK = new Set(HOUSE_SURNAMES.map(([, zh]) => zh));

const everyone = [
  ...VILLAGE_REGISTER.flatMap((h) => h.members),
  ...VILLAGE_VISITORS,
];
const byId = new Map(everyone.map((v) => [v.id, v]));

describe("the village register", () => {
  it("is twenty-five households in five 伍 with one 伍老 each", () => {
    expect(VILLAGE_REGISTER).toHaveLength(25);
    expect(VILLAGE_WUS).toHaveLength(5);
    for (const wu of VILLAGE_WUS) {
      expect(wu.households, wu.id).toHaveLength(5);
      const old = byId.get(wu.wulao);
      expect(old?.role, `${wu.id} 伍老`).toBe("wulao");
      expect(
        wu.households.some((h) => h === old?.id.split(".")[0]),
        `${wu.id}'s 伍老 lives in it`,
      ).toBe(true);
      for (const id of wu.households) {
        expect(VILLAGE_REGISTER.find((h) => h.id === id)?.wu).toBe(wu.id);
      }
    }
    const wulaos = everyone.filter((v) => v.role === "wulao");
    expect(wulaos).toHaveLength(5);
  });

  it("lists a hundred and five, draws a hundred and one, and keeps the visitors beside", () => {
    const members = VILLAGE_REGISTER.flatMap((h) => h.members);
    expect(members).toHaveLength(105);
    expect(members.filter((v) => v.drawn)).toHaveLength(101);
    expect(VILLAGE_VISITORS.filter((v) => v.archetype !== "ox")).toHaveLength(
      5,
    );
    expect(VILLAGE_VISITORS.filter((v) => v.archetype === "ox")).toHaveLength(
      4,
    );
    expect(VILLAGE.folk).toHaveLength(101 + VILLAGE_VISITORS.length);
    expect(VILLAGE.folk).toEqual(villagersOf(VILLAGE));
  });

  it("names everyone with one character and every household from the stock", () => {
    const ids = new Set<string>();
    for (const v of everyone) {
      expect([...v.name.zh], v.id).toHaveLength(1);
      expect(v.name.en, v.id).toMatch(/^[A-Z][a-zü]*$/);
      expect(ids.has(v.id), `${v.id} twice`).toBe(false);
      ids.add(v.id);
    }
    for (const h of VILLAGE_REGISTER) {
      expect([...h.surname], h.id).toHaveLength(1);
      expect(STOCK.has(h.surname), `${h.id} ${h.surname}`).toBe(true);
      expect(h.members[0]?.id, h.id).toBe(h.head);
      for (const v of h.members) {
        expect(v.id.startsWith(`${h.id}.`), v.id).toBe(true);
      }
    }
    // the plan's twenty-five surnames, in register order
    expect(VILLAGE_REGISTER.map((h) => h.surname)).toEqual(
      HOUSE_SURNAMES.map(([, zh]) => zh),
    );
  });

  it("homes everyone at a place, plots every household on a field, and dresses them from the catalog", () => {
    for (const v of everyone) {
      expect(places.has(v.home), `${v.id} home ${v.home}`).toBe(true);
      expect(ARCHETYPES, v.id).toContain(v.archetype);
      if (v.sprite) {
        expect(SPRITE_VARIANTS[v.archetype], `${v.id} ${v.sprite}`).toContain(
          v.sprite,
        );
      }
      for (const overlay of v.overlays ?? []) {
        expect(OVERLAYS[overlay], `${v.id} ${overlay}`).toBeDefined();
      }
    }
    for (const h of VILLAGE_REGISTER) {
      expect(h.plot && places.has(h.plot), `${h.id} plot`).toBe(true);
      expect(VILLAGE_BLOCKS, h.id).toContain(h.plot);
      expect(h.members.every((v) => v.home === `house-${h.id.slice(1)}`)).toBe(
        true,
      );
    }
  });

  it("spreads the sprites so a 伍's farmers are not one man", () => {
    for (const wu of VILLAGE_WUS) {
      const heads = wu.households
        .map((id) => VILLAGE_REGISTER.find((h) => h.id === id)!)
        .map((h) => byId.get(h.head)!)
        .filter((v) => v.archetype === "peasant");
      expect(new Set(heads.map((v) => v.sprite)).size, wu.id).toBe(
        heads.length,
      );
    }
  });
});

describe("the village circuits", () => {
  const roles = new Set<Role>(everyone.map((v) => v.role));

  it("gives every role on the register a day for every month", () => {
    for (const role of roles) {
      for (const month of MONTH_IDS) {
        expect(
          VILLAGE_CIRCUITS.find((c) => c.role === role && c.month === month),
          `${role} month ${month}`,
        ).toBeDefined();
      }
    }
    for (const role of Object.keys(VILLAGE_DAYS)) {
      expect(roles.has(role as Role), `${role} has nobody`).toBe(true);
    }
    expect(VILLAGE_CIRCUITS.length).toBe(roles.size * 12);
  });

  it("stops at a place of the map or a placeholder, in hour order, in a pose the plan names", () => {
    for (const circuit of VILLAGE_CIRCUITS) {
      const where = `${circuit.role} ${circuit.month}`;
      expect(circuit.stops.length, where).toBeGreaterThan(0);
      let last = 0;
      for (const stop of circuit.stops) {
        expect(stop.hour, where).toBeGreaterThanOrEqual(1);
        expect(stop.hour, where).toBeLessThanOrEqual(12);
        expect(stop.hour, `${where} in order`).toBeGreaterThanOrEqual(last);
        last = stop.hour;
        expect(
          places.has(stop.at) || PLACEHOLDERS.has(stop.at),
          `${where} at ${stop.at}`,
        ).toBe(true);
        if (stop.pose)
          expect(POSES.has(stop.pose), `${where} ${stop.pose}`).toBe(true);
        for (const overlay of stop.overlays ?? []) {
          expect(OVERLAYS[overlay], `${where} ${overlay}`).toBeDefined();
        }
        if (stop.line) {
          expect(stop.line.en, where).toBeTruthy();
          expect(stop.line.zh, where).toBeTruthy();
        }
        if (stop.cite) expectCite(stop.cite, where);
      }
    }
  });

  it("keeps a visitor who is not here at the edge", () => {
    const only = (role: Role, month: (typeof MONTH_IDS)[number]): Stop[] =>
      VILLAGE_CIRCUITS.find((c) => c.role === role && c.month === month)!.stops;
    expect(only("countyclerk", 3)).toEqual([{ hour: 4, at: "edge" }]);
    expect(only("countyclerk", 8).length).toBeGreaterThan(1);
    expect(only("fieldofficer", 4).length).toBeGreaterThan(1);
    expect(only("lieutenant", 5)).toEqual([{ hour: 4, at: "edge" }]);
    expect(only("lieutenant", 11).length).toBeGreaterThan(1);
  });
});

describe("the village events", () => {
  it("are dated, houred, unique, and in order", () => {
    const ids = new Set<string>();
    let last = 0;
    for (const e of VILLAGE_EVENTS) {
      expect(ids.has(e.id), `${e.id} twice`).toBe(false);
      ids.add(e.id);
      expect(e.day).toBeGreaterThanOrEqual(1);
      expect(e.day).toBeLessThanOrEqual(30);
      expect(e.hour).toBeGreaterThanOrEqual(1);
      expect(e.hour).toBeLessThanOrEqual(12);
      const key = e.month * 10000 + e.day * 100 + e.hour;
      expect(key, e.id).toBeGreaterThanOrEqual(last);
      last = key;
      expect(e.title.en && e.title.zh, e.id).toBeTruthy();
      expect(e.line.en && e.line.zh, e.id).toBeTruthy();
      expect(e.cite.length, e.id).toBeGreaterThan(0);
      for (const cite of e.cite) expectCite(cite, e.id);
    }
    // the plan's year, the month's 更卒, and the pedlar
    expect(VILLAGE_EVENTS.filter((e) => e.id.endsWith("-gengzu"))).toHaveLength(
      12,
    );
    expect(VILLAGE_EVENTS.filter((e) => e.id.endsWith("-pedlar"))).toHaveLength(
      12,
    );
    expect(VILLAGE_EVENTS.length).toBeGreaterThanOrEqual(60);
  });

  it("plays only town directions, at places of the map, for people of the register", () => {
    for (const e of VILLAGE_EVENTS) {
      expect(e.script.length, e.id).toBeGreaterThan(0);
      for (const scene of e.script) {
        expect(scene.length, e.id).toBeGreaterThan(0);
        for (const d of scene) {
          const where = `${e.id} ${d.kind}`;
          const rule = TOWN_RULES[d.kind];
          expect(rule, where).toBeDefined();
          if (rule!.places === "route") {
            expect(
              d.from && places.has(d.from),
              `${where} from ${d.from}`,
            ).toBe(true);
            expect(d.to && places.has(d.to), `${where} to ${d.to}`).toBe(true);
            expect(d.from, where).not.toBe(d.to);
            expect(d.at, where).toBeUndefined();
          } else {
            expect(d.at && places.has(d.at), `${where} at ${d.at}`).toBe(true);
            expect(d.from, where).toBeUndefined();
          }
          expect(ARCHETYPES, where).toContain(d.actor.archetype);
          expect(d.actor.seat.startsWith("village:"), where).toBe(true);
          const tail = d.actor.seat.slice("village:".length);
          if (tail.includes(".")) {
            const v = byId.get(tail);
            expect(v, `${where} ${tail}`).toBeDefined();
            expect(v?.archetype, where).toBe(d.actor.archetype);
            if (d.actor.variant) expect(d.actor.variant).toBe(v?.sprite);
          } else {
            expect(tail, where).toBe(d.actor.archetype);
          }
          for (const overlay of d.actor.overlays ?? []) {
            expect(OVERLAYS[overlay], `${where} ${overlay}`).toBeDefined();
          }
          if (d.pose)
            expect(POSES.has(d.pose), `${where} ${d.pose}`).toBe(true);
          if (d.count !== undefined) {
            expect(d.count, where).toBeGreaterThan(0);
            expect(d.count, where).toBeLessThanOrEqual(16);
          }
        }
      }
      const attend = e.attend;
      if (attend && typeof attend === "object") {
        if ("wu" in attend)
          expect(VILLAGE_WUS.map((w) => w.id)).toContain(attend.wu);
        else
          for (const id of attend.villagers)
            expect(byId.has(id), `${e.id} ${id}`).toBe(true);
      }
      for (const change of e.changes ?? []) {
        expect(byId.has(change.villager), `${e.id} ${change.villager}`).toBe(
          true,
        );
        if (change.set.household) {
          expect(VILLAGE_REGISTER.map((h) => h.id)).toContain(
            change.set.household,
          );
        }
        if (change.set.sprite) {
          expect(Object.values(SPRITE_VARIANTS).flat()).toContain(
            change.set.sprite,
          );
        }
      }
    }
    for (const id of eventVillagerIds(VILLAGE_EVENTS)) {
      expect(byId.has(id), id).toBe(true);
    }
  });

  it("changes the register as the year says", () => {
    // the bride is a Wang wife from the third month
    const spring = registerAt(VILLAGE, 3);
    const wang = spring.register.find((h) => h.id === "h03")!;
    expect(wang.members.map((v) => v.id)).toContain("h08.wa");
    expect(wang.members.find((v) => v.id === "h08.wa")?.role).toBe("wife");
    expect(
      spring.register.find((h) => h.id === "h08")!.members.map((v) => v.id),
    ).not.toContain("h08.wa");
    // the Zhou boy is grown from the ninth month
    const autumn = registerAt(VILLAGE, 9);
    const rong = autumn.register
      .find((h) => h.id === "h08")!
      .members.find((v) => v.id === "h08.rong")!;
    expect(rong.age).toBe("大");
    expect(rong.role).toBe("son");
    expect(
      registerAt(VILLAGE, 8)
        .register.find((h) => h.id === "h08")!
        .members.find((v) => v.id === "h08.rong")!.age,
    ).toBe("小");
    // the corvée party and the garrison man in the tenth month
    const winter = registerAt(VILLAGE, 10);
    for (const id of CORVEE_PARTY) expect(winter.away.get(id), id).toBe(10);
    expect(winter.away.get("h07.zhong")).toBe("year");
    expect(registerAt(VILLAGE, 12).away.get("h07.zhong")).toBe("year");
    expect(registerAt(VILLAGE, 11).away.has("h13.lang")).toBe(false);
    // the 更卒 by turns
    expect(registerAt(VILLAGE, 1).away.get("h03.sheng")).toBe(1);
    expect(registerAt(VILLAGE, 2).away.get("h23.xiong")).toBe(2);
    expect(registerAt(VILLAGE, 2).away.has("h03.sheng")).toBe(false);
    // the Wu mother is struck from the twelfth month
    expect(registerAt(VILLAGE, 12).struck.has("h09.ai")).toBe(true);
    expect(registerAt(VILLAGE, 11).struck.has("h09.ai")).toBe(false);
  });
});

describe("the village blocks", () => {
  it("answers for every household and month with a block of the map", () => {
    for (const h of VILLAGE_REGISTER) {
      for (const month of MONTH_IDS) {
        const block = villageBlockOf(h, month);
        expect(block, `${h.id} ${month}`).toBeDefined();
        expect(VILLAGE_BLOCKS, `${h.id} ${month}`).toContain(block);
        expect(VILLAGE.blockOf?.(h, month)).toBe(block);
      }
    }
    // in a wanting month a 伍 spreads over more than one block
    const third = VILLAGE_WUS[2]!.households.map((id) =>
      VILLAGE_REGISTER.find((h) => h.id === id)!,
    );
    expect(
      new Set(third.map((h) => villageBlockOf(h, 3))).size,
    ).toBeGreaterThan(1);
  });

  it("lays every crop ground in at least one block and names every block", () => {
    const laid = new Set(geography.fills.map((fill) => fill.terrain));
    for (const crop of ["field", "millet", "wheat", "bean", "hemp", "paddy"]) {
      expect(laid.has(crop), crop).toBe(true);
    }
    for (const block of VILLAGE_BLOCKS) {
      expect(places.has(block), block).toBe(true);
      expect(VILLAGE.names[block], block).toBeDefined();
    }
    expect(places.has("edge")).toBe(true);
    expect(geography.width).toBe(144);
    expect(geography.height).toBe(96);
  });
});
