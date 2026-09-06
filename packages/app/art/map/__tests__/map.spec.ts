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
  blockedOf,
  fillsOf,
  roofPlacementsOf,
  wallPlacementsOf,
  type Geography,
} from "../map";
import { KIT, KIT_WALL_TILES } from "../../../src/stage/kit";

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

  it("breaks a tie toward the lower ground the set can draw it against", () => {
    // a wall between the yard and the terrace: three of each beneath the
    // wall's row, and the terrace is drawn higher, but only the yard has a
    // sheet, and the plain wall it would otherwise fall back to is drawn
    // against grass and wears a collar of it
    const walled: Geography = {
      width: 5,
      height: 3,
      fills: [
        { terrain: "earth", rect: [0, 0, 5, 3] },
        { terrain: "platform", rect: [0, 2, 5, 1] },
        {
          terrain: "wall",
          path: [
            [0, 1],
            [4, 1],
          ],
          width: 1,
        },
      ],
      places: {},
    };
    const walledGrid = rasterize(walled);
    const earthOnly = new Set([pairIdOf("wall", "earth")]);
    expect(againstOf(walledGrid, earthOnly)[1][2]).toBe("earth");
    // with both sheets the tie still goes to the ground drawn highest
    const both = new Set([
      pairIdOf("wall", "earth"),
      pairIdOf("wall", "platform"),
    ]);
    expect(againstOf(walledGrid, both)[1][2]).toBe("platform");
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

describe("rooms and walls", () => {
  const house = (): Geography => ({
    width: 12,
    height: 10,
    fills: [{ terrain: "earth", rect: [0, 0, 12, 10] }],
    rooms: [
      {
        id: "hall",
        kit: "kit.hall",
        rect: [2, 4, 6, 4],
        doors: [{ side: "s", at: 2 }],
      },
      {
        id: "ring",
        kit: "kit.wall",
        rect: [0, 0, 12, 10],
        floor: null,
        feature: "outerwall",
      },
    ],
    walls: [
      {
        kit: "kit.wall",
        from: [1, 2],
        to: [10, 2],
        gaps: [{ at: 4, width: 3 }],
        feature: "courtwall",
      },
    ],
    places: {
      hall: { x: 4, y: 5, marker: "audience-hall", room: true },
      yard: { x: 4, y: 8 },
    },
  });

  it("lays a plank floor under a room and none under a ring", () => {
    const fills = fillsOf(house());
    expect(fills).toHaveLength(2);
    expect(fills[1]).toEqual({ terrain: "plank", rect: [2, 4, 6, 4] });
    const grid = rasterize(house());
    expect(grid[5][3]).toBe("plank");
    expect(grid[4][2]).toBe("plank");
    expect(grid[8][4]).toBe("earth");
  });

  it("names a wall's cells after its feature and leaves their ground alone", () => {
    const file = featureFileOf(house());
    expect(file.features.outerwall).toContain(0);
    expect(file.features.courtwall).toContain(2 * 12 + 1);
    // the lintel pieces either side of the gap are the wall's; the gap is not
    expect(file.features.courtwall).toContain(2 * 12 + 5);
    expect(file.features.courtwall).not.toContain(2 * 12 + 6);
    expect(rasterize(house())[0][0]).toBe("earth");
  });

  it("composes a ring of wall pieces with the door cut", () => {
    const pieces = wallPlacementsOf(house());
    const at = (x: number, y: number) =>
      pieces.find((p) => p.placement.x === x && p.placement.y === y);
    expect(at(2, 4)?.placement.piece).toBe(KIT.outer.nw);
    expect(at(7, 7)?.placement.piece).toBe(KIT.outer.se);
    expect(at(4, 7)?.placement.piece).toBe(KIT.door.s[0]);
    expect(at(5, 7)?.placement.piece).toBe(KIT.door.s[1]);
    expect(at(3, 5)).toBeUndefined();
    expect(at(1, 2)?.placement.piece).toBe(KIT.side.n);
    expect(at(5, 2)?.placement.piece).toBe(KIT.door.n[0]);
    expect(at(6, 2)).toBeUndefined();
    expect(at(7, 2)?.placement.piece).toBe(KIT.door.n[1]);
    expect(at(0, 0)?.kit).toBe("kit.wall");
    expect(at(2, 4)?.room).toBe("hall");
  });

  it("roofs a room with a floor, lifted by the wall's height", () => {
    const roofs = roofPlacementsOf(house());
    expect(roofs.every((r) => r.room === "hall")).toBe(true);
    expect(roofs).toHaveLength(24);
    const ys = new Set(roofs.map((r) => r.placement.y));
    expect(Math.min(...ys)).toBe(4 - KIT_WALL_TILES);
    expect(Math.max(...ys)).toBe(7 - KIT_WALL_TILES);
    const nw = roofs.find(
      (r) => r.placement.x === 2 && r.placement.y === 4 - KIT_WALL_TILES,
    );
    expect(nw?.placement.piece).toBe(KIT.roof.hip.nw);
  });

  it("blocks every wall piece but a doorway, and the water", () => {
    const geo = house();
    geo.fills.push({ terrain: "river", rect: [9, 8, 1, 1] });
    const blocked = blockedOf(geo);
    expect(blocked[4][2]).toBe(true);
    expect(blocked[7][4]).toBe(false);
    expect(blocked[5][3]).toBe(false);
    expect(blocked[2][5]).toBe(false);
    expect(blocked[2][1]).toBe(true);
    expect(blocked[8][9]).toBe(true);
  });

  it("writes walls, roofs, rooms, and a room place with no stamp of its own", () => {
    const geo = house();
    const map = buildTiledMap({
      geo,
      grid: rasterize(geo),
      tile: 32,
      imageDir: "period32",
      pairs: new Set(),
    });
    const layer = (name: string) =>
      map.layers.find((l) => l.name === name) as { objects: unknown[] };
    expect(layer("walls").objects.length).toBe(wallPlacementsOf(geo).length);
    expect(layer("roofs").objects.length).toBe(24);
    const rooms = layer("rooms").objects as { name: string; width: number }[];
    expect(rooms.map((r) => r.name)).toEqual(["hall", "ring"]);
    expect(rooms[0].width).toBe(6 * 32);
    const wall = layer("walls").objects[0] as {
      type: string;
      x: number;
      properties: { name: string; value: unknown }[];
    };
    expect(wall.type).toBe("kit.hall");
    expect(wall.properties.map((p) => p.name)).toEqual(["piece", "room"]);
    const places = layer("places").objects as {
      name: string;
      type: string;
      properties?: { name: string; value: unknown }[];
    }[];
    const hall = places.find((p) => p.name === "hall")!;
    expect(hall.type).toBe("audience-hall");
    expect(hall.properties).toEqual([
      { name: "room", type: "bool", value: true },
    ]);
  });

  it("refuses a room place with no room, and a wall off a row or a column", () => {
    const geo = house();
    geo.places.court = { x: 1, y: 1, room: true };
    expect(() =>
      buildTiledMap({
        geo,
        grid: rasterize(geo),
        tile: 32,
        imageDir: "period32",
        pairs: new Set(),
      }),
    ).toThrow(/no room is called court/);
    const skew = house();
    skew.walls = [{ kit: "kit.wall", from: [0, 0], to: [3, 2] }];
    expect(() => wallPlacementsOf(skew)).toThrow(/not along a row/);
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
