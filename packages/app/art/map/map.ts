import { BadRequestError } from "@jaypie/errors";

import {
  TERRAINS,
  WATERS,
  type Terrain,
  type Water,
} from "../../src/stage/catalog";
import {
  BLOB_FULL,
  BLOB_TILE_COUNT,
  blobIndexOf,
  maskOf,
} from "../vendor/blob";
import { blobTileset, type TiledTileset } from "../vendor/tileset";

export type Ground = Terrain | Water;

export interface Fill {
  terrain: Ground;
  /** [x, y, width, height] in tiles. */
  rect?: [number, number, number, number];
  /** [cx, cy, rx, ry] in tiles. */
  ellipse?: [number, number, number, number];
  /** A polyline in tiles, painted `width` tiles wide. */
  path?: [number, number][];
  width?: number;
}

export interface PlaceSpec {
  x: number;
  y: number;
  /** A catalog marker; absent for a region that carries a label only. */
  marker?: string;
  state?: string;
}

export interface Geography {
  width: number;
  height: number;
  /** Painted in order; a later fill overwrites an earlier one. */
  fills: Fill[];
  places: Record<string, PlaceSpec>;
}

export const GROUNDS: readonly Ground[] = [...TERRAINS, ...WATERS];

/** Blob layers above the grass ground, bottom to top. */
export const DRAW_ORDER: readonly Ground[] = [
  "loess",
  "field",
  "forest",
  "marsh",
  "mountain",
  "cobble",
  "road",
  "river",
  "sea",
];

export const LETTERS: Record<Ground, string> = {
  grass: ".",
  loess: ":",
  road: "-",
  cobble: "#",
  forest: "T",
  mountain: "^",
  marsh: "%",
  field: '"',
  river: "~",
  sea: "=",
};

const WATER_SET = new Set<string>(WATERS);
export const isWater = (ground: Ground): boolean => WATER_SET.has(ground);

const assertGround = (terrain: string): Ground => {
  if (!GROUNDS.includes(terrain as Ground)) {
    throw new BadRequestError(`unknown terrain "${terrain}"`);
  }
  return terrain as Ground;
};

/** Paints the geography onto a grid of ground names (grass by default). */
export const rasterize = (geo: Geography): Ground[][] => {
  const grid: Ground[][] = Array.from({ length: geo.height }, () =>
    Array.from({ length: geo.width }, () => "grass" as Ground),
  );
  const paint = (x: number, y: number, ground: Ground): void => {
    if (x < 0 || y < 0 || x >= geo.width || y >= geo.height) return;
    grid[y][x] = ground;
  };
  for (const fill of geo.fills) {
    const ground = assertGround(fill.terrain);
    if (fill.rect) {
      const [x, y, w, h] = fill.rect;
      for (let j = y; j < y + h; j += 1) {
        for (let i = x; i < x + w; i += 1) paint(i, j, ground);
      }
    } else if (fill.ellipse) {
      const [cx, cy, rx, ry] = fill.ellipse;
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j += 1) {
        for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i += 1) {
          const dx = (i + 0.5 - cx) / rx;
          const dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) paint(i, j, ground);
        }
      }
    } else if (fill.path) {
      const radius = (fill.width ?? 1) / 2;
      for (let s = 0; s < fill.path.length - 1; s += 1) {
        const [ax, ay] = fill.path[s];
        const [bx, by] = fill.path[s + 1];
        const length = Math.hypot(bx - ax, by - ay);
        const steps = Math.max(1, Math.ceil(length * 4));
        for (let k = 0; k <= steps; k += 1) {
          const px = ax + ((bx - ax) * k) / steps + 0.5;
          const py = ay + ((by - ay) * k) / steps + 0.5;
          for (
            let j = Math.floor(py - radius);
            j <= Math.ceil(py + radius);
            j += 1
          ) {
            for (
              let i = Math.floor(px - radius);
              i <= Math.ceil(px + radius);
              i += 1
            ) {
              if (Math.hypot(i + 0.5 - px, j + 0.5 - py) <= radius + 0.01) {
                paint(i, j, ground);
              }
            }
          }
        }
      }
    } else {
      throw new BadRequestError(
        `a fill of ${fill.terrain} names no rect, ellipse, or path`,
      );
    }
  }
  return grid;
};

export const asciiOf = (grid: Ground[][]): string =>
  grid.map((row) => row.map((ground) => LETTERS[ground]).join("")).join("\n");

export interface TiledLayer {
  id: number;
  name: string;
  type: "tilelayer" | "objectgroup";
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
  width?: number;
  height?: number;
  data?: number[];
  objects?: TiledObject[];
  draworder?: "topdown";
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  point: true;
  properties?: { name: string; type: "string"; value: string }[];
}

export interface TiledMap {
  type: "map";
  version: string;
  tiledversion: string;
  orientation: "orthogonal";
  renderorder: "right-down";
  infinite: false;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  nextlayerid: number;
  nextobjectid: number;
  tilesets: (TiledTileset & { firstgid: number })[];
  layers: TiledLayer[];
}

export interface BuildTiledMapOptions {
  geo: Geography;
  grid?: Ground[][];
  /** Directory the tileset images are named under (informational; the stage binds by key). */
  imageDir?: string;
  tile?: number;
  frames?: number;
}

export const tilesetIdOf = (ground: Ground): string =>
  isWater(ground) ? `water.${ground}` : `terrain.${ground}`;

/** The Tiled map: a grass ground layer, one blob layer per ground in draw order, and the places. */
export const buildTiledMap = ({
  geo,
  grid = rasterize(geo),
  imageDir = "fallback",
  tile = 16,
  frames = 3,
}: BuildTiledMapOptions): TiledMap => {
  const tilesets: (TiledTileset & { firstgid: number })[] = [];
  const firstgid: Partial<Record<Ground, number>> = {};
  let next = 1;
  for (const ground of GROUNDS) {
    const id = tilesetIdOf(ground);
    const set = blobTileset({
      name: id,
      image: `${imageDir}/${id}.png`,
      tile,
      frames: isWater(ground) ? frames : 1,
    });
    tilesets.push({ firstgid: next, ...set });
    firstgid[ground] = next;
    next += set.tilecount;
  }
  const same =
    (ground: Ground) => (x: number, y: number) => (dx: number, dy: number) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= geo.width || ny >= geo.height) return true;
      return grid[ny][nx] === ground;
    };
  const layers: TiledLayer[] = [];
  let layerId = 1;
  const tileLayer = (name: string, data: number[]): void => {
    layers.push({
      id: layerId,
      name,
      type: "tilelayer",
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      width: geo.width,
      height: geo.height,
      data,
    });
    layerId += 1;
  };
  const cells = geo.width * geo.height;
  tileLayer(
    "ground",
    Array.from({ length: cells }, () => (firstgid.grass ?? 1) + BLOB_FULL),
  );
  for (const ground of DRAW_ORDER) {
    const present = grid.some((row) => row.includes(ground));
    if (!present) continue;
    const data = new Array<number>(cells).fill(0);
    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        if (grid[y][x] !== ground) continue;
        data[y * geo.width + x] =
          (firstgid[ground] ?? 0) + blobIndexOf(maskOf(same(ground)(x, y)));
      }
    }
    tileLayer(ground, data);
  }
  let objectId = 1;
  const objects: TiledObject[] = Object.entries(geo.places).map(
    ([key, place]) => {
      const properties: TiledObject["properties"] = [];
      if (place.state)
        properties.push({ name: "state", type: "string", value: place.state });
      const object: TiledObject = {
        id: objectId,
        name: key,
        type: place.marker ?? "region",
        x: (place.x + 0.5) * tile,
        y: (place.y + 0.5) * tile,
        width: 0,
        height: 0,
        rotation: 0,
        visible: true,
        point: true,
        ...(properties.length ? { properties } : {}),
      };
      objectId += 1;
      return object;
    },
  );
  layers.push({
    id: layerId,
    name: "places",
    type: "objectgroup",
    draworder: "topdown",
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    objects,
  });
  layerId += 1;
  return {
    type: "map",
    version: "1.10",
    tiledversion: "1.11.0",
    orientation: "orthogonal",
    renderorder: "right-down",
    infinite: false,
    width: geo.width,
    height: geo.height,
    tilewidth: tile,
    tileheight: tile,
    nextlayerid: layerId,
    nextobjectid: objectId,
    tilesets,
    layers,
  };
};

/** Tiles per water frame: the scene advances a water tile's index by this much per frame. */
export const WATER_FRAME_STRIDE = BLOB_TILE_COUNT;
