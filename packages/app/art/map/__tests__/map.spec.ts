import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkPlaces, placesOfTiledMap } from "@modelstudies/game";
import { describe, expect, it } from "vitest";

import {
  BLOB_FULL,
  BLOB_TILE_COUNT,
  blobIndexOf,
  E,
  N,
  S,
  SE,
  SW,
  W,
} from "../../vendor/blob";
import {
  GROUND_VARIANTS,
  againstOf,
  asciiOf,
  buildTiledMap,
  featureFileOf,
  flipAt,
  groundMask,
  pairIdOf,
  rasterize,
  blocksOf,
  pairBlocksOf,
  variantOf,
  type Geography,
} from "../map";

const here = dirname(fileURLToPath(import.meta.url));

const tiny = (): Geography => ({
  width: 6,
  height: 4,
  fills: [
    {
      terrain: "river",
      path: [
        [0, 1],
        [5, 1],
      ],
      width: 1,
    },
    { terrain: "forest", rect: [4, 2, 2, 2] },
  ],
  places: {
    xianyang: { x: 1, y: 3, marker: "court", state: "qin" },
    qin: { x: 0, y: 3 },
  },
});

describe("rasterize", () => {
  it("paints fills in order onto grass", () => {
    expect(asciiOf(rasterize(tiny()))).toBe(
      ["......", "~~~~~~", "....TT", "....TT"].join("\n"),
    );
  });

  it("refuses an unknown terrain", () => {
    const geo = tiny();
    geo.fills.push({ terrain: "lava" as never, rect: [0, 0, 1, 1] });
    expect(() => rasterize(geo)).toThrow(/unknown terrain/);
  });
});

describe("featureFileOf", () => {
  it("keeps the cells each named fill still paints", () => {
    const geo = tiny();
    geo.fills[0].feature = "river";
    const file = featureFileOf(geo);
    expect(file).toMatchObject({ width: 6, height: 4 });
    expect(file.features.river).toEqual([6, 7, 8, 9, 10, 11]);
  });

  it("hands a cell to whatever was painted over it", () => {
    const geo = tiny();
    geo.fills[0].feature = "river";
    // a marsh drawn across the river's last two tiles takes them with it
    geo.fills.push({
      terrain: "marsh",
      rect: [4, 1, 2, 1],
      feature: "yunmeng",
    });
    const file = featureFileOf(geo);
    expect(file.features.river).toEqual([6, 7, 8, 9]);
    expect(file.features.yunmeng).toEqual([10, 11]);
  });

  it("says nothing about ground no fill names", () => {
    expect(featureFileOf(tiny()).features).toEqual({});
  });
});

describe("blocksOf", () => {
  it("gives water its frames and every ground on land its rearrangements", () => {
    expect(blocksOf("river", 3)).toBe(3);
    expect(blocksOf("sea", 3)).toBe(3);
    expect(blocksOf("grass")).toBe(GROUND_VARIANTS);
    expect(blocksOf("loess")).toBe(GROUND_VARIANTS);
    // a ground the geography lays as a one-tile ribbon is no exception: which
    // grounds have a wide field is a fact about the country, not the art
    expect(blocksOf("road")).toBe(GROUND_VARIANTS);
  });

  it("gives a pair one block on land, because a boundary never varies", () => {
    expect(pairBlocksOf("loess")).toBe(1);
    expect(pairBlocksOf("road")).toBe(1);
    // a river laid over loess still has to keep moving
    expect(pairBlocksOf("river", 3)).toBe(3);
  });
});

describe("buildTiledMap", () => {
  const geo = tiny();
  const map = buildTiledMap({ geo });

  it("lays a ground layer, one blob layer per painted ground, and the places", () => {
    expect(map.layers.map((layer) => layer.name)).toEqual([
      "ground",
      "forest",
      "river",
      "places",
    ]);
    expect(map.tilesets.map((set) => set.name)).toContain("water.river");
    const grass = map.tilesets.find((set) => set.name === "terrain.grass")!;
    // every cell is the fill, in one of the stacked variants and one of the
    // four orientations the cell's own hash picks
    expect(
      map.layers[0].data!.every(
        (gid, at) =>
          gid ===
          grass.firstgid +
            variantOf(at % 6, Math.floor(at / 6)) * BLOB_TILE_COUNT +
            BLOB_FULL +
            flipAt(at % 6, Math.floor(at / 6)),
      ),
    ).toBe(true);
  });

  it("codes a tile's blob index from its same-ground neighbours", () => {
    const river = map.tilesets.find((set) => set.name === "water.river")!;
    const forest = map.tilesets.find((set) => set.name === "terrain.forest")!;
    const riverLayer = map.layers.find((layer) => layer.name === "river")!;
    const forestLayer = map.layers.find((layer) => layer.name === "forest")!;
    // a strip across the map: the edge tiles count out-of-bounds as river
    expect(riverLayer.data![1 * 6 + 2]).toBe(
      river.firstgid + blobIndexOf(E | W),
    );
    expect(riverLayer.data![1 * 6 + 0]).toBe(
      river.firstgid + blobIndexOf(E | W),
    );
    // the forest block's top-left tile sees E, S, and SE
    expect(forestLayer.data![2 * 6 + 4]).toBe(
      forest.firstgid + blobIndexOf(E | S | 8),
    );
    // the block's bottom-right corner touches the map edge on two sides, so
    // it reads as fully surrounded and takes the cell's own orientation and
    // its own rearrangement: an edge tile takes neither, because its art has
    // to face the boundary it draws
    expect(forestLayer.data![3 * 6 + 5]).toBe(
      forest.firstgid +
        variantOf(5, 3) * BLOB_TILE_COUNT +
        blobIndexOf(N | W | 128 | E | S | 8 | 32 | 2) +
        flipAt(5, 3),
    );
    expect(riverLayer.data![0]).toBe(0);
  });

  it("places every point object at its tile centre with its marker and state", () => {
    const places = map.layers.find((layer) => layer.name === "places")!;
    expect(places.objects).toHaveLength(2);
    expect(places.objects![0]).toMatchObject({
      name: "xianyang",
      type: "court",
      x: 24,
      y: 56,
      point: true,
      properties: [{ name: "state", type: "string", value: "qin" }],
    });
    expect(places.objects![1]).toMatchObject({ name: "qin", type: "region" });
    expect(places.objects![1].properties).toBeUndefined();
  });

  it("writes water tilesets with stacked frames", () => {
    const river = map.tilesets.find((set) => set.name === "water.river")!;
    expect(river.tilecount).toBe(144);
    expect(river.tiles?.[0].animation).toHaveLength(3);
  });

  it("declares an animation for water alone", () => {
    // grass stacks its blocks too, but they are rearrangements the builder
    // picks between per cell; declaring them as frames makes every cell that
    // lands on the first block cycle while its neighbours sit still
    const animated = map.tilesets
      .filter((set) => set.tiles?.some((tile) => tile.animation))
      .map((set) => set.name);
    expect(animated).toEqual(["water.river", "water.sea"]);
    const grass = map.tilesets.find((set) => set.name === "terrain.grass")!;
    expect(grass.tilecount).toBe(BLOB_TILE_COUNT * GROUND_VARIANTS);
    expect(grass.tiles ?? []).toEqual([]);
  });
});

describe("transitions", () => {
  // a wood with a range standing in it: every non-grass adjacency on the map
  // is this shape, one ground laid over another rather than over the field
  const wooded = (): Geography => ({
    width: 6,
    height: 5,
    fills: [
      { terrain: "forest", rect: [0, 2, 6, 3] },
      { terrain: "mountain", rect: [2, 3, 3, 2] },
    ],
    places: {},
  });
  const pair = pairIdOf("mountain", "forest");
  const pairs = new Set([pair]);
  const grid = rasterize(wooded());

  it("draws a ground against the lower ground it mostly meets", () => {
    const against = againstOf(grid, pairs);
    expect(against[3][2]).toBe("forest");
    expect(against[3][4]).toBe("forest");
    // the range's bottom row runs off the map, which counts as its own ground
    expect(against[4][3]).toBeNull();
    // the wood itself meets grass, which every plain sheet is drawn against
    expect(against[2][2]).toBeNull();
    expect(against[0][0]).toBeNull();
  });

  it("leaves a ground plain when no sheet draws the pair", () => {
    expect(againstOf(grid, new Set())[3][2]).toBeNull();
  });

  it("runs the lower ground whole beneath a neighbour that draws the boundary", () => {
    const against = againstOf(grid, pairs);
    // the range's tile carries the whole boundary, so the wood beneath it
    // does not stop short and show an edge of its own under that art
    expect(groundMask(grid, against, "forest")(2, 2)(0, 1)).toBe(true);
    expect(groundMask(grid, against, "forest")(2, 2)(0, -1)).toBe(false);
    // without the pair the wood draws its own edge against the range
    expect(
      groundMask(grid, againstOf(grid, new Set()), "forest")(2, 2)(0, 1),
    ).toBe(false);
  });

  it("lays the pair's own tileset where it applies and the plain one elsewhere", () => {
    const map = buildTiledMap({ geo: wooded(), pairs });
    const laid = map.tilesets.find((set) => set.name === pair)!;
    const plain = map.tilesets.find((set) => set.name === "terrain.mountain")!;
    const range = map.layers.find((layer) => layer.name === "mountain")!;
    expect(laid).toBeDefined();
    // the range's north-west corner: forest to the N, W, and NW, its own
    // ground to the E, S, and SE
    expect(range.data![3 * 6 + 2]).toBe(
      laid.firstgid + blobIndexOf(E | S | SE),
    );
    const wood = map.layers.find((layer) => layer.name === "forest")!;
    const forest = map.tilesets.find((set) => set.name === "terrain.forest")!;
    // the wood above the range reads it as its own, so only the range's tile
    // draws the boundary
    expect(wood.data![2 * 6 + 2]).toBe(
      forest.firstgid + blobIndexOf(E | S | SE | W | SW),
    );
    expect(plain.firstgid).toBeLessThan(laid.firstgid);
  });

  it("registers no pair tileset when the set supplies none", () => {
    const map = buildTiledMap({ geo: wooded() });
    expect(map.tilesets.some((set) => set.name.includes("@"))).toBe(false);
  });

  it("registers only the pairs the map actually lays", () => {
    const map = buildTiledMap({
      geo: wooded(),
      pairs: new Set([pair, pairIdOf("mountain", "marsh")]),
    });
    expect(map.tilesets.filter((set) => set.name.includes("@"))).toHaveLength(
      1,
    );
  });
});

describe("geography.json", () => {
  const geo = JSON.parse(
    readFileSync(join(here, "../geography.json"), "utf8"),
  ) as Geography;

  it("carries every place the chapters and homes require", () => {
    const map = buildTiledMap({ geo });
    const check = checkPlaces(placesOfTiledMap(map as never));
    expect(check.missing).toEqual([]);
    expect(check.extra).toEqual([]);
  });

  it("keeps every place inside the map and off the sea", () => {
    const grid = rasterize(geo);
    const outside = Object.entries(geo.places)
      .filter(
        ([, place]) =>
          place.x < 0 ||
          place.x >= geo.width ||
          place.y < 0 ||
          place.y >= geo.height,
      )
      .map(([key]) => key);
    expect(outside).toEqual([]);
    const atSea = Object.entries(geo.places)
      .filter(
        ([, place]) =>
          place.marker !== "harbour" && grid[place.y][place.x] === "sea",
      )
      .map(([key]) => key);
    expect(atSea).toEqual([]);
  });
});
