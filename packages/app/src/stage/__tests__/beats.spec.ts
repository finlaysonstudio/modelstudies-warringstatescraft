import { describe, expect, it } from "vitest";

import type { StageBeat } from "../../lib/types";
import {
  facingOf,
  formation,
  planAction,
  planBeat,
  WALK_MAX_MS,
  WALK_MIN_MS,
} from "../beats";

const places = {
  xianyang: { x: 100, y: 100 },
  handan: { x: 580, y: 100 },
  shangdang: { x: 300, y: 200 },
};
const homes = { qin: "xianyang", zhao: "handan" };

describe("planAction", () => {
  it("walks a route from its origin to its destination at a clamped pace", () => {
    const action = planAction({
      direction: {
        kind: "column",
        actor: { seat: "qin", archetype: "infantry" },
        from: "xianyang",
        to: "handan",
        count: 6,
        effect: "dust",
      },
      places,
      home: "xianyang",
    })!;
    expect(action.travels).toBe(true);
    expect(action.from).toEqual(places.xianyang);
    expect(action.to).toEqual(places.handan);
    expect(action.walkMs).toBe(3000);
    expect(action.count).toBe(6);
    expect(action.effect).toBe("dust");
  });

  it("clamps very short and very long walks", () => {
    const short = planAction({
      direction: {
        kind: "envoy",
        actor: { seat: "qin", archetype: "envoy" },
        from: "xianyang",
        to: "shangdang",
      },
      places: { xianyang: { x: 0, y: 0 }, shangdang: { x: 10, y: 0 } },
    })!;
    expect(short.walkMs).toBe(WALK_MIN_MS);
    const long = planAction({
      direction: {
        kind: "envoy",
        actor: { seat: "qin", archetype: "envoy" },
        from: "xianyang",
        to: "shangdang",
      },
      places: { xianyang: { x: 0, y: 0 }, shangdang: { x: 5000, y: 0 } },
    })!;
    expect(long.walkMs).toBe(WALK_MAX_MS);
  });

  it("stays put for an at direction and at home for a home direction", () => {
    const at = planAction({
      direction: {
        kind: "garrison",
        actor: { seat: "zhao", archetype: "infantry" },
        at: "shangdang",
        count: 4,
      },
      places,
      home: "handan",
    })!;
    expect(at.travels).toBe(false);
    expect(at.from).toEqual(places.shangdang);
    const idle = planAction({
      direction: { kind: "idle", actor: { seat: "zhao", archetype: "court" } },
      places,
      home: "handan",
    })!;
    expect(idle.to).toEqual(places.handan);
    expect(idle.walkMs).toBe(0);
  });

  it("returns null when the landing place is off the map", () => {
    expect(
      planAction({
        direction: {
          kind: "garrison",
          actor: { seat: "zhao", archetype: "infantry" },
          at: "atlantis",
        },
        places,
      }),
    ).toBeNull();
  });
});

describe("planBeat", () => {
  const beat: StageBeat = {
    id: "t1.narrative",
    kind: "narrative",
    turn: 1,
    focus: "shangdang",
    directions: [
      {
        kind: "column",
        actor: { seat: "qin", archetype: "infantry" },
        from: "xianyang",
        to: "shangdang",
        count: 6,
      },
      {
        kind: "garrison",
        actor: { seat: "zhao", archetype: "infantry" },
        at: "shangdang",
        count: 4,
      },
    ],
  };

  it("bounds every action and settles on the focus", () => {
    const plan = planBeat({ beat, places, homes });
    expect(plan.actions).toHaveLength(2);
    expect(plan.focus).toEqual(places.shangdang);
    expect(plan.bounds).toEqual({ x: 100, y: 100, width: 200, height: 100 });
    expect(plan.durationMs).toBeGreaterThan(plan.actions[0].totalMs);
  });

  it("falls back to the seat's home when a beat has no directions", () => {
    const plan = planBeat({
      beat: {
        id: "t1.brief.zhao",
        kind: "brief",
        turn: 1,
        seat: "zhao",
        directions: [],
      },
      places,
      homes,
    });
    expect(plan.focus).toEqual(places.handan);
    expect(plan.actions).toEqual([]);
  });
});

describe("helpers", () => {
  it("faces the dominant axis", () => {
    expect(facingOf({ x: 0, y: 0 }, { x: 10, y: 2 })).toBe("right");
    expect(facingOf({ x: 0, y: 0 }, { x: -1, y: -9 })).toBe("up");
  });

  it("spreads a column four abreast", () => {
    expect(formation(1)).toEqual([{ x: 0, y: 0 }]);
    expect(formation(6)).toHaveLength(6);
    expect(formation(6)[4].y).toBeGreaterThan(formation(6)[0].y);
  });
});
