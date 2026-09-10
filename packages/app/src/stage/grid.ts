/**
 * The cost grid a site is walked on: what every cell of a built map costs to
 * step onto, read from the map itself rather than declared beside it. The
 * tile layers are named for the ground they paint (as `pickAt` relies on),
 * so the topmost non-empty layer at a cell is its ground; the `places` layer
 * gives every marker's footprint, the `decor` layer the fences and piles,
 * and a `walls` layer the kit pieces a figure cannot pass. Browser-safe and
 * Phaser-free: the scene hands it the Tiled JSON out of the cache, and the
 * specs build it in node from the same file.
 */
import {
  BLOCKING_DECOR,
  MARKER_FOOTPRINTS,
  type Decor,
  type Marker,
} from "./catalog";
import { KIT_PASSABLE } from "./kit";
import type { Grid } from "./route";

/** the price of a step onto each ground; water and the fen are not walked */
export const GROUND_COSTS: Record<string, number> = {
  road: 1,
  plank: 1,
  cobble: 1,
  earth: 2,
  platform: 2,
  grass: 3,
  tallgrass: 6,
  garden: 6,
  mulberry: 6,
  field: 8,
  millet: 8,
  wheat: 8,
  bean: 8,
  hemp: 8,
  paddy: 12,
  scrub: 12,
  forest: 12,
  bamboo: 12,
  loess: 12,
  steppe: 6,
  shu: 24,
  hills: 24,
  mountain: 24,
  qinling: 24,
  taihang: 24,
  luliang: 24,
  wall: 0,
  marsh: 0,
  river: 0,
  sea: 0,
};

/** what a ground the table does not name costs */
export const DEFAULT_COST = 3;
/** the cost of the water a ford crosses */
export const FORD_COST = 2;

/** the slice of a Tiled map the grid reads */
export interface GridMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: {
    name: string;
    type: string;
    data?: number[];
    objects?: {
      name?: string;
      type?: string;
      class?: string;
      x: number;
      y: number;
      properties?: { name: string; value: unknown }[] | Record<string, unknown>;
    }[];
  }[];
  properties?: { name: string; value: unknown }[] | Record<string, unknown>;
}

const propertiesOf = (
  properties: GridMap["properties"],
): Record<string, unknown> =>
  Array.isArray(properties)
    ? Object.fromEntries(properties.map((p) => [p.name, p.value]))
    : (properties ?? {});

/** whether the site build stamped the map as one the populace routes on */
export const isRouted = (
  map: Pick<GridMap, "properties" | "layers">,
): boolean =>
  propertiesOf(map.properties).routed === true ||
  map.layers.some((layer) => layer.name === "walls");

/**
 * The grid of a built map: a cost per cell, and `blocked` where the cost is
 * zero. Every tile layer is read bottom to top so the topmost ground wins;
 * then the markers' footprints, the blocking decor, and the wall pieces are
 * closed. A ford opens the water under and around it at `FORD_COST`, so the
 * brook is crossed there and nowhere else.
 */
export const gridOf = (map: GridMap): Grid => {
  const { width, height, tilewidth, tileheight } = map;
  const size = width * height;
  const cost = new Uint8Array(size).fill(DEFAULT_COST);
  const water = new Uint8Array(size);
  for (const layer of map.layers) {
    if (layer.type !== "tilelayer" || !layer.data) continue;
    const ground = layer.name === "ground" ? "grass" : layer.name;
    const price = GROUND_COSTS[ground] ?? DEFAULT_COST;
    const isWater = ground === "river" || ground === "sea";
    for (let i = 0; i < size; i += 1) {
      if (!layer.data[i]) continue;
      cost[i] = price;
      water[i] = isWater ? 1 : 0;
    }
  }
  const cellOf = (object: { x: number; y: number }) => ({
    x: Math.floor(object.x / tilewidth),
    y: Math.floor(object.y / tileheight),
  });
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height;
  const close = (x: number, y: number) => {
    if (inside(x, y)) cost[y * width + x] = 0;
  };
  const fords: { x: number; y: number }[] = [];
  for (const layer of map.layers) {
    if (layer.type !== "objectgroup" || !layer.objects) continue;
    if (layer.name === "places") {
      for (const object of layer.objects) {
        const marker = object.type || object.class || "";
        const cell = cellOf(object);
        if (marker === "ford") fords.push(cell);
        for (const [dx, dy] of MARKER_FOOTPRINTS[marker as Marker] ?? []) {
          close(cell.x + dx, cell.y + dy);
        }
      }
    } else if (layer.name === "decor") {
      for (const object of layer.objects) {
        const id = (object.type || object.class || "").replace(/^decor\./, "");
        if (!BLOCKING_DECOR.has(id as Decor)) continue;
        const cell = cellOf(object);
        close(cell.x, cell.y);
      }
    } else if (layer.name === "walls") {
      for (const object of layer.objects) {
        const piece = propertiesOf(object.properties).piece;
        if (typeof piece !== "number" || KIT_PASSABLE.has(piece)) continue;
        const cell = cellOf(object);
        close(cell.x, cell.y);
      }
    }
  }
  // a ford is where the water is walked: its own cell and the water beside it
  for (const ford of fords) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = ford.x + dx;
        const y = ford.y + dy;
        if (!inside(x, y)) continue;
        const i = y * width + x;
        if ((dx === 0 && dy === 0) || water[i]) cost[i] = FORD_COST;
      }
    }
  }
  const blocked = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) blocked[i] = cost[i] === 0 ? 1 : 0;
  return { width, height, blocked, cost };
};
