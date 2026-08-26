import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { GAZETTEER } from "../../world/gazetteer";
import { placesOfTiledMap } from "../../stage/tiled";
import type { TiledMap } from "../../stage/tiled";
import { validateScript } from "../../stage/validate";
import { DIRECTIONS, scopeOf } from "../../stage/vocabulary";
import { ACTS } from "../acts";
import { episodeIds, listEpisodes } from "../episodes";
import { PEOPLE_BY_KEY } from "../people";
import { ANNALS_PLACES } from "../places";
import { worldAfterAll, worldAt } from "../world";

const LANGUAGES = ["en", "zh"] as const;

/** the country the episodes are validated against: the built overworld */
const mapPlaces = () => {
  const file = resolve(
    process.cwd(),
    "packages/app/public/stage/overworld.tmj",
  );
  const map = JSON.parse(readFileSync(file, "utf8")) as TiledMap;
  return placesOfTiledMap(map);
};

describe("the Annals", () => {
  const episodes = listEpisodes();

  it("has episodes, in dense unique chronicle order", () => {
    expect(episodes.length).toBeGreaterThan(0);
    expect(episodeIds().length).toBe(new Set(episodeIds()).size);
    episodes.forEach((episode, index) => {
      expect(episode.order, episode.id).toBe(index);
      expect(episode.model).toBe("episodes");
    });
  });

  it("runs forward in time within each act, and the acts in order", () => {
    const actOrder = Object.fromEntries(ACTS.map((act) => [act.id, act.order]));
    let seen = 0;
    for (const episode of episodes) {
      const order = actOrder[episode.act];
      expect(order, `${episode.id}: unknown act ${episode.act}`).toBeDefined();
      expect(order, episode.id).toBeGreaterThanOrEqual(seen);
      seen = order;
    }
    for (const act of ACTS) {
      const inAct = episodes.filter((episode) => episode.act === act.id);
      const years = inAct.map((episode) => episode.year);
      expect(
        [...years].sort((a, b) => a - b),
        act.id,
      ).toEqual(years);
    }
  });

  it("validates every episode against the map the stage plays on", () => {
    const places = mapPlaces();
    for (const episode of episodes) {
      expect(validateScript(episode, places), episode.id).toEqual([]);
    }
  });

  it("addresses only places the chapters or the Annals declare", () => {
    const known = new Set([...ANNALS_PLACES, ...Object.keys(GAZETTEER)]);
    for (const episode of episodes) {
      for (const key of episode.places) {
        expect(known.has(key), `${episode.id}: ${key}`).toBe(true);
      }
    }
    const addressed = new Set(episodes.flatMap((episode) => episode.places));
    for (const key of ANNALS_PLACES) {
      expect(addressed.has(key), `${key} is declared but never staged`).toBe(
        true,
      );
    }
  });

  it("plays every seat as a cast member with a home on the map", () => {
    const places = mapPlaces();
    for (const episode of episodes) {
      for (const [id, seat] of Object.entries(episode.seats)) {
        expect(
          GAZETTEER[seat.state ?? id],
          `${episode.id}: ${id}`,
        ).toBeDefined();
        expect(places.has(seat.home), `${episode.id}: ${id}`).toBe(true);
        expect(seat.model).toBe("authored");
      }
    }
  });

  it("writes every title, blurb, card, and line in both languages", () => {
    for (const episode of episodes) {
      for (const language of LANGUAGES) {
        expect(episode.title[language], episode.id).toBeTruthy();
        expect(episode.blurb[language], episode.id).toBeTruthy();
      }
      for (const beat of episode.beats) {
        for (const language of LANGUAGES) {
          if (beat.card) {
            expect(
              beat.card.title[language],
              `${episode.id} ${beat.id}`,
            ).toBeTruthy();
          }
          for (const line of beat.lines ?? []) {
            expect(
              line.text[language],
              `${episode.id} ${beat.id}`,
            ).toBeTruthy();
          }
        }
        for (const line of beat.lines ?? []) {
          const known =
            PEOPLE_BY_KEY[line.speaker] !== undefined ||
            GAZETTEER[line.speaker] !== undefined;
          expect(known, `${episode.id}: speaker ${line.speaker}`).toBe(true);
        }
      }
    }
  });

  it("opens every episode with a card and numbers its scenes from one", () => {
    for (const episode of episodes) {
      expect(episode.beats[0]?.card, episode.id).toBeDefined();
      episode.beats.forEach((beat, index) => {
        expect(beat.kind, `${episode.id} ${beat.id}`).toBe("scene");
        expect(beat.turn, `${episode.id} ${beat.id}`).toBe(index + 1);
      });
    }
  });

  it("anchors each bench chapter at most once", () => {
    const seen = new Set<string>();
    for (const episode of episodes) {
      if (!episode.chapter) continue;
      expect(seen.has(episode.chapter), episode.chapter).toBe(false);
      seen.add(episode.chapter);
    }
  });

  it("folds the world forward and leaves no house standing twice", () => {
    expect(worldAt(0)).toEqual({ markers: {}, extinguished: [] });
    const end = worldAfterAll();
    expect(end.extinguished.length).toBe(new Set(end.extinguished).size);
    for (const state of end.extinguished) {
      expect(GAZETTEER[state], state).toBeDefined();
    }
    for (const place of Object.keys(end.markers)) {
      expect(GAZETTEER[place], place).toBeDefined();
    }
  });

  it("reaches for the historical vocabulary", () => {
    const used = new Set(
      episodes.flatMap((episode) =>
        episode.beats.flatMap((beat) =>
          beat.directions.map((direction) => direction.kind),
        ),
      ),
    );
    expect(used.size).toBeGreaterThan(0);
    expect(
      [...used].some((kind) => scopeOf(kind) === "annals"),
      "no annals-scoped direction is used",
    ).toBe(true);
    for (const kind of used) expect(DIRECTIONS[kind], kind).toBeDefined();
  });
});
