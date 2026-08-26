import { describe, expect, it } from "vitest";

// the acts module directly: the game package index pulls the node graph,
// which the app's DOM-lib typecheck refuses
import { ACTS as GAME_ACTS } from "../../../../game/src/annals/acts";
import { ACTS, ACTS_BY_ID, episodeForChapter, episodesOfAct } from "../annals";
import type { EpisodeIndexEntry } from "../types";

const entry = (
  id: string,
  act: EpisodeIndexEntry["act"],
  chapter?: string,
): EpisodeIndexEntry => ({
  id,
  act,
  order: 0,
  date: "",
  year: 0,
  title: { en: id, zh: id },
  blurb: { en: "", zh: "" },
  ...(chapter ? { chapter } : {}),
  venues: [],
  sceneCount: 1,
});

describe("the app's acts mirror the Annals", () => {
  it("carries every act with the same order, date, and text", () => {
    expect(ACTS).toEqual(GAME_ACTS);
  });

  it("keys every act by id", () => {
    for (const act of ACTS) expect(ACTS_BY_ID[act.id]).toBe(act);
  });
});

describe("timeline helpers", () => {
  const episodes = [
    entry("a", "partition"),
    entry("b", "reformers", "land-register"),
    entry("c", "reformers"),
  ];

  it("groups by act in the order given", () => {
    expect(episodesOfAct(episodes, "reformers").map((e) => e.id)).toEqual([
      "b",
      "c",
    ]);
    expect(episodesOfAct(episodes, "ledger")).toEqual([]);
  });

  it("finds the episode a chapter anchors, and nothing when none does", () => {
    expect(episodeForChapter(episodes, "land-register")?.id).toBe("b");
    expect(episodeForChapter(episodes, "river-works")).toBeUndefined();
  });
});
