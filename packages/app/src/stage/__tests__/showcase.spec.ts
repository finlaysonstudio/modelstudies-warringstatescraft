import { describe, expect, it } from "vitest";

import { BLOB_FULL, BLOB_MASKS, blobIndexOf } from "../../../art/vendor/blob";
import type { StageAsset, StageManifest } from "../manifest";
import {
  PATCH,
  groupOf,
  islandShape,
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
});

describe("showcaseOf", () => {
  const manifest = manifestOf([
    asset("terrain.mountain", "period", 1),
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
    expect(showcase.count).toBe(4);
  });

  it("orders a section by the catalog, not by the manifest", () => {
    const [ground] = showcaseOf(manifest).sections;
    expect(ground.group).toBe("ground");
    expect(ground.assets.map((entry) => entry.id)).toEqual([
      "terrain.grass",
      "terrain.mountain",
    ]);
  });

  it("drops a section with nothing in it", () => {
    const groups = showcaseOf(manifest).sections.map(
      (section) => section.group,
    );
    expect(groups).toEqual(["ground", "place", "figure"]);
  });

  it("totals the generations the layer cost", () => {
    expect(showcaseOf(manifest).generations).toBe(10);
  });

  it("names what the map still borrows rather than rendering it", () => {
    const { borrowed } = showcaseOf(manifest);
    expect(borrowed).toContain("terrain.road");
    expect(borrowed).toContain("effect.fire");
    expect(borrowed).not.toContain("terrain.grass");
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
