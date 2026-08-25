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

export interface ExpandOptions {
  /** Tile edge in pixels (default 16). */
  tile?: number;
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
  inner: [number, number];
}

/**
 * An RPG Maker A2 block is 2 tiles wide and 3 tall: tile (0,0) holds the four
 * inner-corner minis, tile (1,0) the plain fill, and rows 1 to 2 a 2×2 box of
 * the outer edges. Every output tile is composed from four minis, one per
 * quadrant, chosen by that quadrant's vertical (v), horizontal (h), and
 * diagonal (d) neighbours.
 */
const QUADRANTS: Quadrant[] = [
  {
    ox: 0,
    oy: 0,
    v: N,
    h: W,
    d: NW,
    xEdge: 0,
    xInt: 2,
    yEdge: 0,
    yInt: 2,
    inner: [1, 1],
  },
  {
    ox: 1,
    oy: 0,
    v: N,
    h: E,
    d: NE,
    xEdge: 3,
    xInt: 1,
    yEdge: 0,
    yInt: 2,
    inner: [0, 1],
  },
  {
    ox: 0,
    oy: 1,
    v: S,
    h: W,
    d: SW,
    xEdge: 0,
    xInt: 2,
    yEdge: 3,
    yInt: 1,
    inner: [1, 0],
  },
  {
    ox: 1,
    oy: 1,
    v: S,
    h: E,
    d: SE,
    xEdge: 3,
    xInt: 1,
    yEdge: 3,
    yInt: 1,
    inner: [0, 0],
  },
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

/** Expands one A2 block into the 47-tile blob sheet. */
export const expandA2Block = (
  sheet: Image,
  block: Block,
  options: ExpandOptions = {},
): Image => {
  const tile = options.tile ?? 16;
  const mini = tile / 2;
  const originX = block.x * 2 * tile;
  const originY = block.y * 3 * tile;
  if (originX + 2 * tile > sheet.width || originY + 3 * tile > sheet.height) {
    throw new BadRequestError(
      `block (${block.x}, ${block.y}) lies outside a ${sheet.width}×${sheet.height} sheet`,
    );
  }
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  BLOB_MASKS.forEach((mask, index) => {
    const tx = (index % BLOB_COLUMNS) * tile;
    const ty = Math.floor(index / BLOB_COLUMNS) * tile;
    if (mask === 255) {
      copyRect({
        source: sheet,
        sx: originX + tile,
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
        sx = originX + q.inner[0] * mini;
        sy = originY + q.inner[1] * mini;
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

/** The plain fill tile of a block: tile (1,0). */
export const fillTileOf = (sheet: Image, block: Block, tile = 16): Image => {
  const out = blankImage(tile, tile);
  copyRect({
    source: sheet,
    sx: block.x * 2 * tile + tile,
    sy: block.y * 3 * tile,
    width: tile,
    height: tile,
    target: out,
    tx: 0,
    ty: 0,
  });
  return out;
};
