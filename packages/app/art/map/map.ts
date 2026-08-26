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
  /**
   * The named thing this fill draws (`river` for the He, `plankroad` for the
   * roads into Shu): a gazetteer key, so the explorer can name it under the
   * reader's naming and language. A later fill takes the tiles it overpaints,
   * feature and all, which is what keeps a feature's cells honest.
   */
  feature?: string;
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
 * Blob layers above the grass ground, bottom to top: the fen, then the other
 * grasses, then the flat country, then the raised ground (hills below the
 * ranges, so a range that meets a hill stands on it), then the works and the
 * water.
 *
 * `marsh` is first, below every other terrain. A fen is the low ground by
 * definition: whatever it meets stands over it and draws the boundary down
 * into it, and the alternative reads as a plateau of mud lifted above the
 * grass around it. Water is at the top and so covers it anyway, which leaves
 * the fen the low element against everything.
 */
export const DRAW_ORDER: readonly Ground[] = [
  "marsh",
  "tallgrass",
  "scrub",
  "loess",
  "steppe",
  "field",
  "forest",
  "bamboo",
  "hills",
  "mountain",
  "qinling",
  "taihang",
  "luliang",
  "shu",
  "cobble",
  "road",
  "wall",
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
  wall: "|",
  forest: "T",
  bamboo: "y",
  hills: "n",
  mountain: "^",
  qinling: "Q",
  taihang: "H",
  luliang: "L",
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

/** The painted map: the ground at every cell, and the feature that drew it. */
export interface RasterMap {
  grid: Ground[][];
  /** the feature each cell belongs to, or null where the ground is anonymous */
  features: (string | null)[][];
}

/** Paints the geography onto a grid of ground names (grass by default). */
export const rasterize = (geo: Geography): Ground[][] => rasterMapOf(geo).grid;

/**
 * Paints the geography, keeping what each cell belongs to beside what it is.
 * The two are painted by one pass on purpose: a fill laid over another takes
 * its cells' feature with its ground, so a river a marsh was later drawn over
 * does not go on claiming the tiles it no longer paints.
 */
export const rasterMapOf = (geo: Geography): RasterMap => {
  const grid: Ground[][] = Array.from({ length: geo.height }, () =>
    Array.from({ length: geo.width }, () => "grass" as Ground),
  );
  const features: (string | null)[][] = Array.from({ length: geo.height }, () =>
    Array.from({ length: geo.width }, () => null as string | null),
  );
  let feature: string | null = null;
  const paint = (x: number, y: number, ground: Ground): void => {
    if (x < 0 || y < 0 || x >= geo.width || y >= geo.height) return;
    grid[y][x] = ground;
    features[y][x] = feature;
  };
  for (const fill of geo.fills) {
    const ground = assertGround(fill.terrain);
    feature = fill.feature ?? null;
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
  return { grid, features };
};

/** What the explorer reads: feature id → the cells it holds, row by row. */
export interface FeatureFile {
  width: number;
  height: number;
  /** feature id → cell indexes (`y * width + x`), ascending */
  features: Record<string, number[]>;
}

export const featureFileOf = (
  geo: Geography,
  raster = rasterMapOf(geo),
): FeatureFile => {
  const features: Record<string, number[]> = {};
  for (let y = 0; y < geo.height; y += 1) {
    for (let x = 0; x < geo.width; x += 1) {
      const id = raster.features[y][x];
      if (!id) continue;
      (features[id] ??= []).push(y * geo.width + x);
    }
  }
  return { width: geo.width, height: geo.height, features };
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
  /**
   * The pair sheets the set's art layers supply (`terrain.mountain@forest`).
   * A pair the map has no art for is simply not drawn, so a set that carries
   * none builds exactly the map it built before pairs existed.
   */
  pairs?: ReadonlySet<string>;
}

export const tilesetIdOf = (ground: Ground): string =>
  isWater(ground) ? `water.${ground}` : `terrain.${ground}`;

/**
 * The sheet that draws `ground` where it is laid over `lower`: the same blob
 * layout as the plain sheet, but generated against that terrain rather than
 * against grass, so the two meet with a drawn boundary. `terrain.mountain@forest`
 * is the range as it meets the wood. Absent one of these, a ground falls back
 * to its plain sheet and wears a collar of grass wherever it meets anything
 * that is not grass.
 */
export const pairIdOf = (ground: Ground, lower: Ground): string =>
  `${tilesetIdOf(ground)}@${lower}`;

/** Where a ground sits in the stack; grass, the bed everything is laid on, is 0. */
const rankOf = (ground: Ground): number => DRAW_ORDER.indexOf(ground) + 1;

/**
 * For every cell, the lower ground its boundary is drawn against, or null for
 * the plain sheet. A tile can carry one transition, so where a cell's edge
 * faces two terrains the more numerous of them wins and the other is met by
 * whatever the tile's own surround holds: the alternative is a grass collar
 * against both. Only a ground drawn beneath this one is a candidate, because
 * a ground drawn above covers this boundary itself.
 */
export const againstOf = (
  grid: Ground[][],
  pairs: ReadonlySet<string>,
): (Ground | null)[][] => {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const ground = grid[y][x];
      const rank = rankOf(ground);
      const counts = new Map<Ground, number>();
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighbour = grid[ny][nx];
          if (neighbour === ground || rankOf(neighbour) > rank) continue;
          counts.set(neighbour, (counts.get(neighbour) ?? 0) + 1);
        }
      }
      let best: Ground | null = null;
      let most = 0;
      for (const [neighbour, count] of counts) {
        // ties go to the ground drawn highest, which is the one this cell's
        // edge is most likely to be read against
        if (
          count > most ||
          (count === most && best && rankOf(neighbour) > rankOf(best))
        ) {
          best = neighbour;
          most = count;
        }
      }
      if (!best || best === "grass") return null;
      return pairs.has(pairIdOf(ground, best)) ? best : null;
    }),
  );
};

/**
 * Whether the neighbour at (dx, dy) counts as this ground for the blob mask.
 * Its own cells do, and so does a cell of a higher ground that draws its
 * transition from this one: that cell carries the whole boundary inside its
 * tile, so this ground runs whole beneath it rather than stopping short and
 * showing an edge of its own under the art meant to cover it.
 */
export const groundMask =
  (grid: Ground[][], against: (Ground | null)[][], ground: Ground) =>
  (x: number, y: number) =>
  (dx: number, dy: number): boolean => {
    const nx = x + dx;
    const ny = y + dy;
    if (ny < 0 || ny >= grid.length) return true;
    if (nx < 0 || nx >= (grid[ny]?.length ?? 0)) return true;
    if (grid[ny][nx] === ground) return true;
    return against[ny][nx] === ground;
  };

const hashAt = (x: number, y: number): number =>
  Math.imul((x * 73856093) ^ (y * 19349663), 0x85ebca6b);

/**
 * The orientation of the tile at (x, y): bit 1 mirrors across the vertical
 * axis. Only a fully surrounded tile may take one — an edge tile's art has to
 * face its boundary — and mirroring it breaks up the grid the eye otherwise
 * reads across a wide field of one terrain. Free variety: no extra art, and it
 * holds for whichever layer supplies the asset.
 *
 * The horizontal mirror is the only one. A tile is not isotropic: top-down art
 * is lit from the top of the tile, so mirroring it across the horizontal axis
 * moves the light to the bottom and a field of it reads as a checkerboard of
 * alternating light. A hill drawn as a lit crown over a shadowed lower side is
 * where that shows worst, and it shows on any shaded ground.
 */
export const orientationOf = (x: number, y: number): number =>
  (hashAt(x, y) >>> 29) % 2;

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
  pairs = new Set<string>(),
}: BuildTiledMapOptions): TiledMap => {
  const against = againstOf(grid, pairs);
  const tilesets: (TiledTileset & { firstgid: number })[] = [];
  const firstgid = new Map<string, number>();
  let next = 1;
  const register = (id: string, ground: Ground): void => {
    const blocks = blocksOf(ground, frames);
    const set = blobTileset({
      name: id,
      image: `${imageDir}/${id}.png`,
      tile,
      blocks,
      // a ground's stacked blocks are rearrangements the builder picks between,
      // not frames: only water is asked to move
      frames: isWater(ground) ? blocks : 1,
    });
    tilesets.push({ firstgid: next, ...set });
    firstgid.set(id, next);
    next += set.tilecount;
  };
  for (const ground of GROUNDS) register(tilesetIdOf(ground), ground);
  // the pairs this map actually lays, in draw order, so a set's unused art
  // costs the scene nothing to load
  for (const ground of DRAW_ORDER) {
    for (const lower of DRAW_ORDER) {
      const id = pairIdOf(ground, lower);
      if (!pairs.has(id) || firstgid.has(id)) continue;
      const used = against.some((row, y) =>
        row.some((at, x) => at === lower && grid[y][x] === ground),
      );
      if (used) register(id, ground);
    }
  }
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
        (firstgid.get("terrain.grass") ?? 1) +
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
    const mask = groundMask(grid, against, ground);
    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        if (grid[y][x] !== ground) continue;
        const index = blobIndexOf(maskOf(mask(x, y)));
        // a water tile's art is a wave that reads in one direction, and its
        // three frames have to agree, so leave its gids plain
        const flip = index === BLOB_FULL && !isWater(ground) ? flipAt(x, y) : 0;
        const lower = against[y][x];
        const sheet = lower ? pairIdOf(ground, lower) : tilesetIdOf(ground);
        const base = firstgid.get(sheet) ?? firstgid.get(tilesetIdOf(ground));
        data[y * geo.width + x] = (base ?? 0) + index + flip;
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
