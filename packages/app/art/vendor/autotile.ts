import { BadRequestError } from "@jaypie/errors";

import {
  BLOB_COLUMNS,
  BLOB_MASKS,
  BLOB_ROWS,
  E,
  N,
  NE,
  NW,
  S,
  SE,
  SW,
  W,
} from "./blob";
import {
  blankImage,
  copyRect,
  pixelAt,
  samePixel,
  setPixel,
  type Image,
} from "./png";

export interface Block {
  x: number;
  y: number;
}

export type KeyOutMode = "phase" | "palette";

/**
 * How a sheet lays out the top row of a 2×3 block. `corners-fill` (the
 * RPG Maker VX/MV convention) holds the four inner-corner minis at tile (0,0)
 * and the plain fill at tile (1,0). `single-corners` (VectoRaith's "RPG Maker
 * ready" sheets) holds the isolated single tile at (0,0) and the inner-corner
 * minis at (1,0), with no plain fill tile: the fill is the interior of the
 * box. Rows 1 to 2 are the 2×2 box of outer edges under both.
 */
export type A2Layout = "corners-fill" | "single-corners";

export const A2_LAYOUTS: readonly A2Layout[] = [
  "corners-fill",
  "single-corners",
];

export const DEFAULT_A2_LAYOUT: A2Layout = "corners-fill";

export interface ExpandOptions {
  /** Tile edge in pixels (default 16). */
  tile?: number;
  /** The block's top-row layout (default `corners-fill`). */
  layout?: A2Layout;
  /**
   * The sheet's plain fill tile of the terrain the block sits on. Pixels of
   * the expanded tiles that match it are keyed transparent so the blob can
   * rest on any ground layer: `phase` (default) matches the base pixel at
   * the same tile position, `palette` matches any colour the base uses
   * (for a block whose surround is drawn at a different phase).
   */
  keyOut?: Image;
  keyOutMode?: KeyOutMode;
}

interface Quadrant {
  ox: 0 | 1;
  oy: 0 | 1;
  v: number;
  h: number;
  d: number;
  xEdge: number;
  xInt: number;
  yEdge: number;
  yInt: number;
}

/**
 * Every output tile is composed from four minis, one per quadrant, chosen by
 * that quadrant's vertical (v), horizontal (h), and diagonal (d) neighbours:
 * an open side takes the box's edge mini, a closed one its interior mini, and
 * two closed sides without the diagonal take the inner-corner tile's mini at
 * the quadrant's own position (the tile draws each notch in its own corner).
 */
const QUADRANTS: Quadrant[] = [
  { ox: 0, oy: 0, v: N, h: W, d: NW, xEdge: 0, xInt: 2, yEdge: 0, yInt: 2 },
  { ox: 1, oy: 0, v: N, h: E, d: NE, xEdge: 3, xInt: 1, yEdge: 0, yInt: 2 },
  { ox: 0, oy: 1, v: S, h: W, d: SW, xEdge: 0, xInt: 2, yEdge: 3, yInt: 1 },
  { ox: 1, oy: 1, v: S, h: E, d: SE, xEdge: 3, xInt: 1, yEdge: 3, yInt: 1 },
];

const paletteOf = (image: Image): Set<number> => {
  const colors = new Set<number>();
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i + 3] === 0) continue;
    colors.add(
      ((image.data[i] << 16) | (image.data[i + 1] << 8) | image.data[i + 2]) >>>
        0,
    );
  }
  return colors;
};

const keyOut = (
  image: Image,
  base: Image,
  tile: number,
  mode: KeyOutMode,
): number => {
  let keyed = 0;
  const palette = mode === "palette" ? paletteOf(base) : null;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const matches = palette
        ? (() => {
            const [r, g, b, a] = pixelAt(image, x, y);
            return a !== 0 && palette.has(((r << 16) | (g << 8) | b) >>> 0);
          })()
        : samePixel(image, x, y, base, x % tile, y % tile);
      if (matches) {
        setPixel(image, x, y, [0, 0, 0, 0]);
        keyed += 1;
      }
    }
  }
  return keyed;
};

/**
 * The top-row tile a mask copies whole rather than composes: the plain fill
 * for a fully surrounded tile under `corners-fill`, the drawn single for an
 * isolated tile under `single-corners`.
 */
const wholeTileOf = (layout: A2Layout, mask: number): number | undefined => {
  if (layout === "corners-fill" && mask === 255) return 1;
  if (layout === "single-corners" && mask === 0) return 0;
  return undefined;
};

/** Expands one A2 block into the 47-tile blob sheet. */
export const expandA2Block = (
  sheet: Image,
  block: Block,
  options: ExpandOptions = {},
): Image => {
  const tile = options.tile ?? 16;
  const layout = options.layout ?? DEFAULT_A2_LAYOUT;
  const mini = tile / 2;
  const originX = block.x * 2 * tile;
  const originY = block.y * 3 * tile;
  const cornersX = originX + (layout === "corners-fill" ? 0 : tile);
  if (originX + 2 * tile > sheet.width || originY + 3 * tile > sheet.height) {
    throw new BadRequestError(
      `block (${block.x}, ${block.y}) lies outside a ${sheet.width}×${sheet.height} sheet`,
    );
  }
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  BLOB_MASKS.forEach((mask, index) => {
    const tx = (index % BLOB_COLUMNS) * tile;
    const ty = Math.floor(index / BLOB_COLUMNS) * tile;
    const whole = wholeTileOf(layout, mask);
    if (whole !== undefined) {
      copyRect({
        source: sheet,
        sx: originX + whole * tile,
        sy: originY,
        width: tile,
        height: tile,
        target: out,
        tx,
        ty,
      });
      return;
    }
    for (const q of QUADRANTS) {
      const v = (mask & q.v) !== 0;
      const h = (mask & q.h) !== 0;
      const d = (mask & q.d) !== 0;
      let sx: number;
      let sy: number;
      if (v && h && !d) {
        sx = cornersX + q.ox * mini;
        sy = originY + q.oy * mini;
      } else {
        const bx = h ? q.xInt : q.xEdge;
        const by = v ? q.yInt : q.yEdge;
        sx = originX + bx * mini;
        sy = originY + tile + by * mini;
      }
      copyRect({
        source: sheet,
        sx,
        sy,
        width: mini,
        height: mini,
        target: out,
        tx: tx + q.ox * mini,
        ty: ty + q.oy * mini,
      });
    }
  });
  if (options.keyOut)
    keyOut(out, options.keyOut, tile, options.keyOutMode ?? "phase");
  return out;
};

export interface ExpandA1Options extends ExpandOptions {
  /** Animation frames laid side by side in the sheet (default 3). */
  frames?: number;
}

/** Expands an animated A1 block (frames side by side) into stacked blob sheets. */
export const expandA1Block = (
  sheet: Image,
  block: Block,
  options: ExpandA1Options = {},
): Image => {
  const frames = options.frames ?? 3;
  const tile = options.tile ?? 16;
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile * frames);
  for (let frame = 0; frame < frames; frame += 1) {
    const expanded = expandA2Block(
      sheet,
      { x: block.x + frame, y: block.y },
      options,
    );
    copyRect({
      source: expanded,
      sx: 0,
      sy: 0,
      width: expanded.width,
      height: expanded.height,
      target: out,
      tx: 0,
      ty: frame * BLOB_ROWS * tile,
    });
  }
  return out;
};

export interface FillTileOptions {
  block: Block;
  /** Tile edge in pixels (default 16). */
  tile?: number;
  /** The block's top-row layout (default `corners-fill`). */
  layout?: A2Layout;
}

/**
 * The plain fill tile of a block: tile (1,0) under `corners-fill`, the centre
 * of the box under `single-corners`.
 */
export const fillTileOf = (
  sheet: Image,
  { block, tile = 16, layout = DEFAULT_A2_LAYOUT }: FillTileOptions,
): Image => {
  const mini = tile / 2;
  const originX = block.x * 2 * tile;
  const originY = block.y * 3 * tile;
  const [sx, sy] =
    layout === "corners-fill"
      ? [originX + tile, originY]
      : [originX + mini, originY + tile + mini];
  const out = blankImage(tile, tile);
  copyRect({
    source: sheet,
    sx,
    sy,
    width: tile,
    height: tile,
    target: out,
    tx: 0,
    ty: 0,
  });
  return out;
};
