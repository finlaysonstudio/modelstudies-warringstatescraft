import { describe, expect, it } from "vitest";

import { BLOCKING_DECOR, MARKER_FOOTPRINTS } from "../catalog";
import {
  DEFAULT_COST,
  FORD_COST,
  GROUND_COSTS,
  gridOf,
  isRouted,
  type GridMap,
} from "../grid";
import { KIT_PASSABLE } from "../kit";
import { findPath } from "../route";

const TILE = 16;

/** a tile layer painted where the rows show `#` */
const layerOf = (name: string, rows: string[]) => ({
  name,
  type: "tilelayer",
  data: rows
    .join("")
    .split("")
    .map((c) => (c === "#" ? 1 : 0)),
});

const mapOf = (
  layers: GridMap["layers"],
  properties?: GridMap["properties"],
): GridMap => ({
  width: 8,
  height: 4,
  tilewidth: TILE,
  tileheight: TILE,
  layers,
  properties,
});

const at = (x: number, y: number) => ({ x: x * TILE + 1, y: y * TILE + 1 });

describe("isRouted", () => {
  it("reads the build's stamp, or a walls layer", () => {
    expect(isRouted({ layers: [] })).toBe(false);
    expect(
      isRouted({ layers: [], properties: [{ name: "routed", value: true }] }),
    ).toBe(true);
    expect(isRouted({ layers: [], properties: { routed: true } })).toBe(true);
    expect(isRouted({ layers: [{ name: "walls", type: "objectgroup" }] })).toBe(
      true,
    );
  });
});

describe("gridOf", () => {
  it("prices every cell by the topmost ground and blocks the water", () => {
    const map = mapOf([
      layerOf("ground", ["########", "########", "########", "########"]),
      layerOf("road", ["........", "########", "........", "........"]),
      layerOf("river", ["........", "........", "........", "########"]),
    ]);
    const grid = gridOf(map);
    expect(grid.width).toBe(8);
    expect(grid.height).toBe(4);
    expect(grid.cost![0]).toBe(GROUND_COSTS.grass);
    expect(grid.cost![8]).toBe(GROUND_COSTS.road);
    expect(grid.cost![3 * 8]).toBe(0);
    expect(grid.blocked[3 * 8]).toBe(1);
    expect(grid.blocked[0]).toBe(0);
  });

  it("falls back to the default cost for a ground the table does not name", () => {
    const grid = gridOf(
      mapOf([
        layerOf("moondust", ["########", "........", "........", "........"]),
      ]),
    );
    expect(grid.cost![0]).toBe(DEFAULT_COST);
  });

  it("opens the water at a ford and nowhere else", () => {
    const map = mapOf([
      layerOf("ground", ["########", "########", "########", "########"]),
      layerOf("river", ["........", "########", "........", "........"]),
      {
        name: "places",
        type: "objectgroup",
        objects: [{ name: "ford", type: "ford", ...at(3, 1) }],
      },
    ]);
    const grid = gridOf(map);
    expect(grid.cost![1 * 8 + 3]).toBe(FORD_COST);
    expect(grid.cost![1 * 8 + 2]).toBe(FORD_COST);
    expect(grid.cost![1 * 8 + 4]).toBe(FORD_COST);
    expect(grid.blocked[1 * 8 + 0]).toBe(1);
    expect(grid.blocked[1 * 8 + 7]).toBe(1);
    // the bank beside the ford keeps its own price
    expect(grid.cost![0 * 8 + 3]).toBe(GROUND_COSTS.grass);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 0, y: 3 } });
    expect(path).not.toBeNull();
    const crossing = path!.filter((cell) => cell.y === 1);
    expect(crossing.length).toBe(1);
    expect([2, 3, 4]).toContain(crossing[0].x);
  });

  it("closes a marker's footprint, a blocking decor, and an impassable wall piece", () => {
    const marker = Object.keys(MARKER_FOOTPRINTS).find(
      (key) =>
        (MARKER_FOOTPRINTS[key as keyof typeof MARKER_FOOTPRINTS] ?? [])
          .length > 0,
    )!;
    const footprint =
      MARKER_FOOTPRINTS[marker as keyof typeof MARKER_FOOTPRINTS]!;
    const decor = [...BLOCKING_DECOR][0];
    let piece = 0;
    while (KIT_PASSABLE.has(piece)) piece += 1;
    const map = mapOf([
      layerOf("ground", ["########", "########", "########", "########"]),
      {
        name: "places",
        type: "objectgroup",
        objects: [{ name: "spot", type: marker, ...at(2, 1) }],
      },
      {
        name: "decor",
        type: "objectgroup",
        objects: [{ type: `decor.${decor}`, ...at(6, 0) }],
      },
      {
        name: "walls",
        type: "objectgroup",
        objects: [
          {
            type: "kit.hall",
            ...at(7, 3),
            properties: [{ name: "piece", value: piece }],
          },
          {
            type: "kit.hall",
            ...at(0, 3),
            properties: [{ name: "piece", value: [...KIT_PASSABLE][0] }],
          },
        ],
      },
    ]);
    const grid = gridOf(map);
    for (const [dx, dy] of footprint) {
      const x = 2 + dx;
      const y = 1 + dy;
      if (x < 0 || y < 0 || x >= 8 || y >= 4) continue;
      expect(grid.blocked[y * 8 + x], `${marker} at ${x},${y}`).toBe(1);
    }
    expect(grid.blocked[0 * 8 + 6]).toBe(1);
    expect(grid.blocked[3 * 8 + 7]).toBe(1);
    expect(grid.blocked[3 * 8 + 0]).toBe(0);
  });
});
