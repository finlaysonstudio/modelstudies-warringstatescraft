import { describe, expect, it } from "vitest";

// the episodes are imported from their own module rather than the package
// index, which pulls the node graph this package's DOM-lib typecheck refuses
import { listEpisodes } from "../../../../game/src/annals/episodes";
import { MARKERS } from "../../stage/catalog";

/**
 * What the Annals put on the country has to be something the map can draw.
 * `WorldChange.marker` is a plain string on the game side, because `game`
 * does not import the app's catalog; this spec is the join.
 */
/** the markers the chapters' own map already places */
const PLAYED = new Set<string>([
  "court",
  "town",
  "pass",
  "ford",
  "field",
  "works",
  "harbour",
  "camp",
  "hall",
  "saltern",
  "market",
  "academy",
  "altar",
  "weir",
]);

describe("what the Annals leave on the map", () => {
  const episodes = listEpisodes();

  it("marks places with markers the catalog draws", () => {
    const known = new Set<string>(MARKERS);
    let marked = 0;
    for (const episode of episodes) {
      for (const change of episode.effects ?? []) {
        if (!("marker" in change)) continue;
        marked += 1;
        expect(
          known.has(change.marker),
          `${episode.id}: ${change.marker}`,
        ).toBe(true);
      }
    }
    expect(marked).toBeGreaterThan(0);
  });

  it("holds three markers in reserve and no more", () => {
    // the fallback art draws every marker in the catalog; three of them wait
    // on a scene that warrants them rather than on a scene written to use
    // them, and this pins the reserve so it cannot grow unnoticed
    const used = new Set<string>();
    for (const episode of episodes) {
      for (const change of episode.effects ?? []) {
        if ("marker" in change) used.add(change.marker);
      }
    }
    const spare = MARKERS.filter(
      (marker) => !used.has(marker) && !PLAYED.has(marker),
    );
    expect(spare).toEqual(["foundry", "bridge", "ferry"]);
  });
});
