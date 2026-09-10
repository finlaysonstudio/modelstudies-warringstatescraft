import { describe, expect, it } from "vitest";

import { DAY_START, SHICHEN_MS } from "../clock";
import { Populace, attendeesOf, type PopulaceDriver } from "../populace";
import type { CircuitContext } from "../register";
import type { Site, SiteEvent, Villager } from "../site";

/** a villager of the fake register */
const person = (
  id: string,
  role: Villager["role"],
  home: string,
  extra: Partial<Villager> = {},
): Villager => ({
  id,
  name: { en: id, zh: id },
  relation: role,
  age: "大",
  sex: "m",
  archetype: "elder",
  role,
  drawn: true,
  home,
  ...extra,
});

const EVENT: SiteEvent = {
  id: "muster",
  month: 3,
  day: 1,
  hour: 6,
  title: { en: "The muster", zh: "點名" },
  line: { en: "The 伍 stands at the shrine.", zh: "伍立於社。" },
  cite: [],
  attend: "all",
  script: [
    [{ kind: "rite", actor: { seat: "v", archetype: "elder" }, at: "shrine" }],
  ],
  changes: [{ villager: "b1", set: { struck: true } }],
};

const SITE = {
  id: "village",
  seat: "v",
  scale: 10,
  register: [
    {
      id: "a",
      wu: "w1",
      surname: "A",
      head: "a1",
      plot: "plot-a",
      members: [
        person("a1", "head", "house-a"),
        person("a2", "wife", "house-a", { sex: "f" }),
      ],
    },
    {
      id: "b",
      wu: "w1",
      surname: "B",
      head: "b1",
      members: [
        person("b1", "head", "house-b"),
        person("b2", "child", "house-b", { age: "小", drawn: false }),
      ],
    },
  ],
  wus: [{ id: "w1", order: 1, households: ["a", "b"], wulao: "a1" }],
  visitors: [person("p1", "pedlar", "edge")],
  circuits: [
    {
      role: "head",
      month: 3,
      stops: [
        { hour: 5, at: "plot", pose: "hoe", line: { en: "hoes", zh: "鋤" } },
        { hour: 8, at: "well" },
        { hour: 10, at: "home" },
      ],
    },
    {
      role: "pedlar",
      month: 3,
      stops: [
        { hour: 6, at: "well" },
        { hour: 9, at: "edge" },
      ],
    },
  ],
  events: [EVENT],
} as unknown as Site;

const CONTEXT: CircuitContext = {
  places: {
    "house-a": { x: 0, y: 0 },
    "house-b": { x: 10, y: 0 },
    "plot-a": { x: 0, y: 50 },
    well: { x: 5, y: 5 },
    shrine: { x: 20, y: 20 },
    edge: { x: 100, y: 0 },
  },
  markers: { well: "well", shrine: "temple" },
  edge: "edge",
};

interface Call {
  op: string;
  id?: string;
  arg?: unknown;
}

/** a driver that walks instantly and records what it was told */
const driverOf = (
  calls: Call[],
  instant = true,
): PopulaceDriver & { arrive: (() => void)[] } => {
  const pending: (() => void)[] = [];
  return {
    arrive: pending,
    place: (f, at) => calls.push({ op: "place", id: f.id, arg: at }),
    walk: (f, to, onArrive) => {
      calls.push({ op: "walk", id: f.id, arg: to });
      if (instant) onArrive();
      else pending.push(onArrive);
    },
    pose: (f, pose) => calls.push({ op: "pose", id: f.id, arg: pose }),
    overlays: (f, ids) => calls.push({ op: "overlays", id: f.id, arg: ids }),
    show: (f, visible) => calls.push({ op: "show", id: f.id, arg: visible }),
    line: (text, clock, f) =>
      calls.push({ op: "line", id: f.id, arg: text.en }),
    event: (event) => calls.push({ op: "event", arg: event.id }),
    remove: (f) => calls.push({ op: "remove", id: f.id }),
  };
};

const open = (
  options: {
    hour?: number;
    event?: string;
    instant?: boolean;
    events?: boolean;
  } = {},
) => {
  const calls: Call[] = [];
  const driver = driverOf(calls, options.instant ?? true);
  const populace = new Populace({
    site: options.events === false ? { ...SITE, events: [] } : SITE,
    month: 3,
    context: CONTEXT,
    driver,
    hour: options.hour,
    event: options.event,
  });
  return { populace, calls, driver };
};

/** ticks the clock forward by whole double-hours of day */
const hours = (populace: Populace, n: number) => {
  for (let i = 0; i < n * 10; i += 1) populace.tick(SHICHEN_MS / 10);
};

describe("Populace", () => {
  it("builds one figure per drawn villager and visitor, at home at 卯", () => {
    const { populace, calls } = open();
    expect(populace.figures.map((f) => f.id)).toEqual(["a1", "a2", "b1", "p1"]);
    expect(populace.clock).toEqual({ month: 3, day: 1, hour: DAY_START });
    const placed = calls.filter((c) => c.op === "place");
    expect(placed.map((c) => `${c.id}@${c.arg}`)).toEqual([
      "a1@house-a",
      "a2@house-a",
      "b1@house-b",
      "p1@edge",
    ]);
    // the pedlar stands at the edge, out of sight, until the day brings him in
    const p1 = calls.filter((c) => c.id === "p1" && c.op === "show").pop();
    expect(p1?.arg).toBe(false);
  });

  it("resolves a role's circuit with its placeholders and a jitter on the hour", () => {
    const { populace } = open();
    const a1 = populace.figure("a1")!;
    expect(a1.stops.map((s) => s.at)).toEqual(["plot-a", "well", "house-a"]);
    for (const [i, stop] of a1.stops.entries()) {
      expect(
        Math.abs(stop.hour - SITE.circuits![0].stops[i].hour),
      ).toBeLessThan(0.2);
    }
    // a head with no plot has no field to go to: the stop is dropped
    expect(populace.figure("b1")!.stops.map((s) => s.at)).toEqual([
      "well",
      "house-b",
    ]);
    // a wife has no circuit this month and stays home
    expect(populace.figure("a2")!.stops).toEqual([]);
  });

  it("walks a figure to its stop when the hour comes, poses it, and logs its line", () => {
    const { populace, calls } = open();
    calls.length = 0;
    hours(populace, 1.5);
    const walk = calls.find((c) => c.op === "walk" && c.id === "a1");
    expect(walk?.arg).toBe("plot-a");
    const pose = calls.filter((c) => c.op === "pose" && c.id === "a1").pop();
    expect(pose?.arg).toBe("hoe");
    expect(
      calls.some((c) => c.op === "line" && c.id === "a1" && c.arg === "hoes"),
    ).toBe(true);
  });

  it("gathers the attendants to the month's event and lets them go when it is done", () => {
    const { populace, calls } = open({ hour: 5.9 });
    calls.length = 0;
    hours(populace, 0.3);
    expect(calls.find((c) => c.op === "event")?.arg).toBe("muster");
    const going = calls
      .filter((c) => c.op === "walk" && c.arg === "shrine")
      .map((c) => c.id);
    expect(going).toContain("a1");
    expect(going).toContain("b1");
    expect(populace.current?.id).toBe("muster");
    expect(populace.figure("a1")!.attending).toBe("muster");
    // while the event plays the day does not move them on
    hours(populace, 3);
    expect(populace.figure("a1")!.at).toBe("shrine");
    populace.eventDone("muster");
    expect(populace.current).toBeUndefined();
    expect(populace.figure("a1")!.attending).toBeUndefined();
    expect(populace.figure("a1")!.at).toBe("well");
    expect(populace.nextEvent()).toBeUndefined();
  });

  it("folds a played event's changes when the day rolls", () => {
    const { populace, calls } = open({ hour: 5.9 });
    hours(populace, 0.3);
    populace.eventDone("muster");
    expect(populace.register.struck.has("b1")).toBe(false);
    // through the night to the next day
    while (populace.clock.day === 1) populace.tick(SHICHEN_MS / 4);
    expect(populace.clock.day).toBe(2);
    expect(populace.register.struck.has("b1")).toBe(true);
    expect(populace.figure("b1")!.hidden).toBe(true);
    expect(
      calls.filter((c) => c.op === "show" && c.id === "b1").pop()?.arg,
    ).toBe(false);
    // the second day is ordinary: the event does not play again
    calls.length = 0;
    hours(populace, 9);
    expect(calls.some((c) => c.op === "event")).toBe(false);
  });

  it("hides a figure at home in the night and shows it walking out at dawn", () => {
    const { populace, calls } = open({ hour: 10.5, events: false });
    calls.length = 0;
    hours(populace, 1);
    const shown = calls.filter((c) => c.op === "show" && c.id === "a2").pop();
    expect(shown?.arg).toBe(false);
    expect(populace.figure("a2")!.at).toBe("house-a");
  });

  it("stands the pedlar at the edge and hides him after he leaves", () => {
    const { populace, calls } = open({ hour: 8.9 });
    calls.length = 0;
    hours(populace, 0.5);
    expect(calls.find((c) => c.op === "walk" && c.id === "p1")?.arg).toBe(
      "edge",
    );
    expect(
      calls.filter((c) => c.op === "show" && c.id === "p1").pop()?.arg,
    ).toBe(false);
  });

  it("jumps to an hour and settles everyone where the day has them", () => {
    const { populace, calls } = open();
    calls.length = 0;
    populace.jumpTo(9);
    expect(populace.clock.hour).toBe(9);
    expect(populace.figure("a1")!.at).toBe("well");
    expect(calls.some((c) => c.op === "walk")).toBe(false);
    expect(calls.find((c) => c.op === "place" && c.id === "a1")?.arg).toBe(
      "well",
    );
    // the muster is behind the clock now
    expect(populace.nextEvent()).toBeUndefined();
  });

  it("opens just before an event and jumps back to one", () => {
    const { populace } = open({ event: "muster" });
    expect(populace.clock.hour).toBeLessThan(6);
    expect(populace.clock.hour).toBeGreaterThan(5.5);
    expect(populace.nextEvent()?.id).toBe("muster");
    populace.jumpTo(11);
    expect(populace.nextEvent()).toBeUndefined();
    populace.jumpToEvent("muster");
    expect(populace.clock.day).toBe(1);
    expect(populace.nextEvent()?.id).toBe("muster");
  });

  it("stands still while paused", () => {
    const { populace } = open();
    populace.paused = true;
    hours(populace, 3);
    expect(populace.clock.hour).toBe(DAY_START);
  });

  it("waits for a walk to end before sending the figure on", () => {
    const { populace, driver } = open({ instant: false, events: false });
    hours(populace, 1.5);
    const a1 = populace.figure("a1")!;
    expect(a1.walking).toBe(true);
    hours(populace, 3);
    expect(a1.at).toBe("plot-a");
    driver.arrive.shift()!();
    expect(a1.walking).toBe(false);
    hours(populace, 0.1);
    expect(a1.at).toBe("well");
  });
});

describe("attendeesOf", () => {
  it("picks by attendance", () => {
    const { populace } = open();
    const figures = populace.figures;
    const ids = (a: Parameters<typeof attendeesOf>[0]) =>
      attendeesOf(a, figures, SITE.wus).map((f) => f.id);
    expect(ids("all")).toEqual(["a1", "a2", "b1", "p1"]);
    expect(ids("heads")).toEqual(["a1", "b1"]);
    expect(ids("women")).toEqual(["a2"]);
    expect(ids("men")).toEqual(["a1", "b1", "p1"]);
    expect(ids("none")).toEqual([]);
    expect(ids({ wu: "w1" })).toEqual(["a1", "a2", "b1"]);
    expect(ids({ villagers: ["b1", "zz"] })).toEqual(["b1"]);
    expect(ids(undefined)).toEqual([]);
  });
});
