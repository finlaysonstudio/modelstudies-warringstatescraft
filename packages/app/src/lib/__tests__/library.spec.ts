import { describe, expect, it } from "vitest";
import { libraryOf, matchGames, pickRandom } from "../library";
import type { RunIndexEntry } from "../types";

const entry = (over: Partial<RunIndexEntry>): RunIndexEntry => ({
  id: "run_x",
  scenario: "corridor-states",
  scenarioTitle: "The Corridor",
  createdAt: "2026-08-20T00:00:00.000Z",
  status: "complete",
  roster: { qin: "model-a", zhao: "model-b", qi: "model-c" },
  branch: { parent: null, lane: "matrix", decidedBy: null },
  childrenCount: 0,
  turnCount: 6,
  ...over,
});

describe("libraryOf", () => {
  it("keeps complete, human-free runs with turns", () => {
    const games = libraryOf([entry({ id: "run_1" })], "corridor-states");
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ id: "run_1", lane: "matrix" });
  });
  it("excludes active runs, human seats, and turnless matrix roots", () => {
    const runs = [
      entry({ id: "active", status: "active" }),
      entry({ id: "human", roster: { qin: "human", zhao: "m", qi: "m" } }),
      entry({
        id: "root",
        turnCount: 0,
        branch: { parent: null, lane: "root", decidedBy: null },
      }),
      entry({ id: "other", scenario: "land-register" }),
    ];
    expect(libraryOf(runs, "corridor-states")).toHaveLength(0);
  });
  it("spans every scenario when none is named", () => {
    const runs = [
      entry({ id: "a" }),
      entry({ id: "b", scenario: "land-register" }),
    ];
    expect(libraryOf(runs)).toHaveLength(2);
  });
  it("carries the study when the run was an arm", () => {
    const games = libraryOf([entry({ id: "armed", study: "study_1" })]);
    expect(games[0].study).toBe("study_1");
  });
});

describe("matchGames", () => {
  const games = libraryOf([
    entry({
      id: "ab",
      roster: { qin: "model-a", zhao: "model-b", qi: "model-c" },
    }),
    entry({
      id: "ba",
      roster: { qin: "model-b", zhao: "model-a", qi: "model-c" },
    }),
  ]);
  it("keeps games matching every constrained seat", () => {
    expect(
      matchGames(games, "qi", { qin: "model-a" }).map((g) => g.id),
    ).toEqual(["ab"]);
  });
  it("matches any model on an unconstrained seat", () => {
    expect(matchGames(games, "qi", {})).toHaveLength(2);
    expect(matchGames(games, "qi", { zhao: undefined })).toHaveLength(2);
  });
  it("ignores a constraint on the followed seat", () => {
    expect(matchGames(games, "qin", { qin: "model-a" })).toHaveLength(2);
  });
});

describe("pickRandom", () => {
  const games = libraryOf([
    entry({ id: "one" }),
    entry({ id: "two" }),
    entry({ id: "three" }),
  ]);
  it("is stable for one seed", () => {
    const first = pickRandom(games, "seed-1");
    expect(pickRandom(games, "seed-1")).toEqual(first);
  });
  it("returns undefined on an empty library", () => {
    expect(pickRandom([], "seed")).toBeUndefined();
  });
  it("stays inside the list", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      expect(games).toContainEqual(pickRandom(games, seed));
    }
  });
});
