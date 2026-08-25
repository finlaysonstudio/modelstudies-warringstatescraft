import { describe, expect, it } from "vitest";

import type { StageBeat, StageScript } from "../../lib/types";
import { beatIdsForStep, beatsRevealed } from "../cursor";

const beat = (id: string): StageBeat => ({
  id,
  kind: id.endsWith("inject") ? "inject" : "brief",
  turn: 1,
  directions: [],
});

const script = (): StageScript => ({
  id: "run_1",
  model: "stagings",
  run: "run_1",
  scenario: "corridor-states",
  language: "en",
  naming: "chronicle",
  createdAt: "2026-08-25T00:00:00.000Z",
  source: "fallback",
  seats: {},
  places: [],
  beats: [
    beat("t1.inject"),
    beat("t1.brief.qin"),
    beat("t1.brief.zhao"),
    beat("t1.brief.qi"),
    beat("t1.verdict"),
    beat("t1.narrative"),
    beat("debrief"),
  ],
});

const context = { seat: "zhao", seats: ["qin", "zhao", "qi"] };

describe("beatIdsForStep", () => {
  it("maps the followed seat to its brief and the table to the others", () => {
    expect(beatIdsForStep({ turn: 1, kind: "you" }, context)).toEqual([
      "t1.brief.zhao",
    ]);
    expect(beatIdsForStep({ turn: 1, kind: "table" }, context)).toEqual([
      "t1.brief.qin",
      "t1.brief.qi",
    ]);
    expect(beatIdsForStep({ turn: 2, kind: "narrative" }, context)).toEqual([
      "t2.narrative",
    ]);
  });
});

describe("beatsRevealed", () => {
  const steps = [
    { turn: 1, kind: "inject" as const },
    { turn: 1, kind: "you" as const },
    { turn: 1, kind: "table" as const },
    { turn: 1, kind: "verdict" as const },
    { turn: 1, kind: "narrative" as const },
  ];

  it("returns the beats behind the revealed steps in reveal order", () => {
    expect(
      beatsRevealed({ script: script(), steps, revealed: 3, context }).map(
        (b) => b.id,
      ),
    ).toEqual(["t1.inject", "t1.brief.zhao", "t1.brief.qin", "t1.brief.qi"]);
  });

  it("skips beats the script does not hold and appends the debrief when done", () => {
    const s = script();
    s.beats = s.beats.filter((b) => b.id !== "t1.verdict");
    const ids = beatsRevealed({
      script: s,
      steps,
      revealed: 5,
      done: true,
      context,
    }).map((b) => b.id);
    expect(ids).toEqual([
      "t1.inject",
      "t1.brief.zhao",
      "t1.brief.qin",
      "t1.brief.qi",
      "t1.narrative",
      "debrief",
    ]);
  });

  it("reveals nothing for zero steps", () => {
    expect(
      beatsRevealed({ script: script(), steps, revealed: 0, context }),
    ).toEqual([]);
  });
});
