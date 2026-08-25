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

export interface DecorSpec {
  /** A catalog decor name (`pine`, `beacon`, …); the object's type is `decor.<id>`. */
  id: string;
  x: number;
  y: number;
}

export interface Geography {
  width: number;
  height: number;
  /** Painted in order; a later fill overwrites an earlier one. */
  fills: Fill[];
  places: Record<string, PlaceSpec>;
  /** Set dressing: unlabeled images the scene scatters for visual interest. */
  decor?: DecorSpec[];
}

export const GROUNDS: readonly Ground[] = [...TERRAINS, ...WATERS];

/**
 * Rearrangements of the grass fill stacked in `terrain.grass`. The ground
 * layer picks one per cell, so the field the whole map is laid on stops
 * reading as one tile repeated 13,824 times. Every art layer's grass sheet
 * has to carry this many blocks (`variants` in the period spec, the same
 * count in the fallback generator).
 */
export const GROUND_VARIANTS = 4;

/**
 * Blob layers above the grass ground, bottom to top: the other grasses, then
 * the flat country, then the raised ground (hills below the ranges, so a
 * range that meets a hill stands on it), then the works and the water.
 */
export const DRAW_ORDER: readonly Ground[] = [
  "tallgrass",
  "scrub",
  "loess",
  "steppe",
  "field",
  "forest",
  "bamboo",
  "marsh",
  "hills",
  "mountain",
  "qinling",
  "taihang",
  "shu",
  "cobble",
  "road",
  "river",
  "sea",
];

export const LETTERS: Record<Ground, string> = {
  grass: ".",
  tallgrass: "w",
  scrub: "s",
  loess: ":",
  steppe: ",",
  road: "-",
  cobble: "#",
  forest: "T",
  bamboo: "y",
  hills: "n",
  mountain: "^",
  qinling: "Q",
  taihang: "H",
  shu: "K",
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

const hashAt = (x: number, y: number): number =>
  Math.imul((x * 73856093) ^ (y * 19349663), 0x85ebca6b);

/**
 * One of four orientations for the tile at (x, y): bit 1 mirrors across the
 * vertical axis, bit 2 across the horizontal. Only a fully surrounded tile
 * may take one — an edge tile's art has to face its boundary — but an
 * interior tile is isotropic, and turning it breaks up the grid the eye
 * otherwise reads across a wide field of one terrain. Free variety: no extra
 * art, and it holds for whichever layer supplies the asset.
 */
export const orientationOf = (x: number, y: number): number =>
  (hashAt(x, y) >>> 29) % 4;

/** Which stacked rearrangement of the grass fill the cell at (x, y) takes. */
export const variantOf = (x: number, y: number): number =>
  (hashAt(y, x) >>> 17) % GROUND_VARIANTS;

/**
 * How many stacked blob blocks a ground's sheet carries: a frame apiece for
 * water, a rearrangement apiece for the ground the whole map is laid on, one
 * for everything else. Every art layer builds to this, because a layer that
 * supplies fewer blocks than the map addresses renders blank where a later
 * block is asked for, and the layers shadow one another by id.
 */
export const blocksOf = (ground: Ground, frames = 3): number =>
  isWater(ground) ? frames : ground === "grass" ? GROUND_VARIANTS : 1;

/** Tiled's gid flip flags. They are added, never OR-ed: `|` is int32 in JS. */
const FLIPPED_HORIZONTALLY = 0x80000000;
const FLIPPED_VERTICALLY = 0x40000000;

/** The flip flags a fully surrounded tile at (x, y) carries in its gid. */
export const flipAt = (x: number, y: number): number => {
  const orientation = orientationOf(x, y);
  return (
    (orientation & 1 ? FLIPPED_HORIZONTALLY : 0) +
    (orientation & 2 ? FLIPPED_VERTICALLY : 0)
  );
};

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
    const blocks = blocksOf(ground, frames);
    const set = blobTileset({
      name: id,
      image: `${imageDir}/${id}.png`,
      tile,
      frames: blocks,
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
    Array.from({ length: cells }, (_, cell) => {
      const x = cell % geo.width;
      const y = Math.floor(cell / geo.width);
      const variant = variantOf(x, y);
      return (
        (firstgid.grass ?? 1) +
        variant * BLOB_TILE_COUNT +
        BLOB_FULL +
        flipAt(x, y)
      );
    }),
  );
  for (const ground of DRAW_ORDER) {
    const present = grid.some((row) => row.includes(ground));
    if (!present) continue;
    const data = new Array<number>(cells).fill(0);
    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        if (grid[y][x] !== ground) continue;
        const index = blobIndexOf(maskOf(same(ground)(x, y)));
        // water animates by advancing the tile index, so leave its gids plain
        const flip = index === BLOB_FULL && !isWater(ground) ? flipAt(x, y) : 0;
        data[y * geo.width + x] = (firstgid[ground] ?? 0) + index + flip;
      }
    }
    tileLayer(ground, data);
  }
  let objectId = 1;
  if (geo.decor?.length) {
    const decorObjects: TiledObject[] = geo.decor.map((decor, index) => {
      const object: TiledObject = {
        id: objectId,
        name: `decor-${index + 1}`,
        type: `decor.${decor.id}`,
        x: (decor.x + 0.5) * tile,
        y: (decor.y + 0.5) * tile,
        width: 0,
        height: 0,
        rotation: 0,
        visible: true,
        point: true,
      };
      objectId += 1;
      return object;
    });
    layers.push({
      id: layerId,
      name: "decor",
      type: "objectgroup",
      draworder: "topdown",
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      objects: decorObjects,
    });
    layerId += 1;
  }
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
