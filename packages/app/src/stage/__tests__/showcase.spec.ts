import { describe, expect, it } from "vitest";

import { BLOB_FULL, BLOB_MASKS, blobIndexOf } from "../../../art/vendor/blob";
import type { StageAsset, StageManifest } from "../manifest";
import {
  PATCH,
  groupOf,
  islandShape,
  lowerOf,
  patchIndexes,
  showcaseOf,
} from "../showcase";

const asset = (
  id: string,
  source: StageAsset["source"],
  generations?: number,
): StageAsset => ({
  id,
  source,
  url: `/stage/${source}/${id}.png`,
  file: `${id}.png`,
  kind: id.startsWith("sprite.") ? "sprite" : "image",
  tile: 16,
  width: 16,
  height: 16,
  pack: source === "period" ? "pixellab" : "test",
  ...(generations === undefined
    ? {}
    : { record: { tool: "t", prompt: "p", generations } }),
});

const manifestOf = (assets: StageAsset[]): StageManifest => ({
  assets: Object.fromEntries(assets.map((entry) => [entry.id, entry])),
  sources: ["fallback", "period"],
  vendor: false,
  set: "period-16",
  tile: 16,
});

describe("groupOf", () => {
  it("reads the group off the id prefix", () => {
    expect(groupOf("terrain.loess")).toBe("ground");
    expect(groupOf("water.river")).toBe("ground");
    expect(groupOf("image.court")).toBe("place");
    expect(groupOf("decor.pine")).toBe("decor");
    expect(groupOf("sprite.envoy")).toBe("figure");
    expect(groupOf("effect.fire")).toBeNull();
  });

  it("reads a transition as its own group, whichever ground it draws", () => {
    expect(groupOf("terrain.mountain@forest")).toBe("pair");
    expect(groupOf("water.river@tallgrass")).toBe("pair");
    expect(lowerOf("terrain.mountain@forest")).toBe("forest");
    expect(lowerOf("terrain.mountain")).toBeNull();
  });
});

describe("showcaseOf", () => {
  const manifest = manifestOf([
    asset("terrain.mountain", "period", 1),
    asset("terrain.mountain@forest", "period", 1),
    asset("terrain.grass", "period", 2),
    asset("terrain.road", "fallback"),
    asset("image.court", "period", 1),
    asset("sprite.envoy", "period", 6),
    asset("sprite.knight", "vendor"),
  ]);

  it("shows only the project's own layer", () => {
    const showcase = showcaseOf(manifest);
    const ids = showcase.sections.flatMap((section) =>
      section.assets.map((entry) => entry.id),
    );
    expect(ids).not.toContain("sprite.knight");
    expect(ids).not.toContain("terrain.road");
    expect(showcase.count).toBe(5);
  });

  it("orders a section by the catalog, not by the manifest", () => {
    const [ground] = showcaseOf(manifest).sections;
    expect(ground.group).toBe("ground");
    expect(ground.assets.map((entry) => entry.id)).toEqual([
      "terrain.grass",
      "terrain.mountain",
    ]);
    // a transition answers an adjacency, not a catalog id, so it sits in its
    // own section rather than after the grounds
    const pairs = showcaseOf(manifest).sections[1];
    expect(pairs.group).toBe("pair");
    expect(pairs.assets.map((entry) => entry.id)).toEqual([
      "terrain.mountain@forest",
    ]);
  });

  it("drops a section with nothing in it", () => {
    const groups = showcaseOf(manifest).sections.map(
      (section) => section.group,
    );
    expect(groups).toEqual(["ground", "pair", "place", "figure"]);
  });

  it("totals the generations the layer cost", () => {
    expect(showcaseOf(manifest).generations).toBe(11);
  });

  it("names what the set still borrows, and the layer standing in", () => {
    const { borrowed } = showcaseOf(manifest);
    const ids = borrowed.map((entry) => entry.id);
    expect(ids).toContain("terrain.road");
    expect(ids).toContain("effect.fire");
    expect(ids).not.toContain("terrain.grass");
    expect(borrowed.find((entry) => entry.id === "terrain.road")?.from).toBe(
      "fallback",
    );
    // nothing answers an id no layer supplies
    expect(
      borrowed.find((entry) => entry.id === "effect.fire")?.from,
    ).toBeNull();
  });

  it("shows the set the manifest names, and the layer that set draws", () => {
    const showcase = showcaseOf(manifest);
    expect(showcase.set.id).toBe("period-16");
    expect(showcase.own).toBe("period");
  });
});

describe("islandShape", () => {
  const shape = islandShape();

  it("leaves a margin of ground on every side", () => {
    expect(shape).toHaveLength(PATCH.height);
    expect(shape[0].every((cell) => !cell)).toBe(true);
    expect(shape[PATCH.height - 1].every((cell) => !cell)).toBe(true);
    expect(shape.every((row) => !row[0])).toBe(true);
  });

  it("exercises the sheet: the lone tile, the fill, and an inner corner", () => {
    const used = new Set(
      patchIndexes(shape)
        .flat()
        .filter((index) => index >= 0),
    );
    expect(used.has(blobIndexOf(0))).toBe(true);
    expect(used.has(BLOB_FULL)).toBe(true);
    const innerCorner = [...used].some((index) => {
      const mask = BLOB_MASKS[index];
      const pairs: [number, number, number][] = [
        [1, 4, 2],
        [16, 4, 8],
        [16, 64, 32],
        [1, 64, 128],
      ];
      return pairs.some(
        ([a, b, diagonal]) =>
          (mask & a) !== 0 && (mask & b) !== 0 && (mask & diagonal) === 0,
      );
    });
    expect(innerCorner).toBe(true);
    expect(used.size).toBeGreaterThanOrEqual(12);
  });
});

describe("patchIndexes", () => {
  it("marks an absent cell -1 and reads off the patch as absent", () => {
    const shape = [
      [true, true],
      [true, false],
    ];
    const indexes = patchIndexes(shape);
    expect(indexes[1][1]).toBe(-1);
    // the top-left corner has E and S neighbours only, never the fill
    expect(indexes[0][0]).toBe(blobIndexOf(4 + 16));
  });
});
