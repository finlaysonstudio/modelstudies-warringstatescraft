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
} from "../vendor/blob";
import {
  blankImage,
  copyRect,
  pixelAt,
  setPixel,
  type Image,
} from "../vendor/png";

/**
 * Expands a PixelLab top-down Wang tileset (16 corner-coded tiles) into the
 * stage's 47-tile blob sheet by dual-grid quadrant sampling: every output
 * quadrant is the quadrant of the Wang cell centred on that tile corner, so
 * the terrain boundary (and its painted transition) lands inside the blob
 * tile and the surround out to the tile edge is the tileset's own lower
 * terrain. With every biome chained to one shared lower base, that surround
 * meets the ground layer in the same rendering.
 */

export type WangCornerValue = "upper" | "lower";

/**
 * Greys blue-dominant pixels toward their luminance by `amount` (0..1),
 * leaving green- and red-dominant pixels (the grass, the transition tufts)
 * untouched. The generator's stone keeps drifting violet however grey is
 * prompted; this pins it down deterministically.
 */
export const greyBlue = (image: Image, amount: number): Image => {
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = pixelAt(image, x, y);
      if (a > 0 && b > r && b > g) {
        const grey = Math.round((r + g + b) / 3);
        setPixel(out, x, y, [
          Math.round(r + (grey - r) * amount),
          Math.round(g + (grey - g) * amount),
          Math.round(b + (grey - b) * amount),
          a,
        ]);
      } else {
        setPixel(out, x, y, [r, g, b, a]);
      }
    }
  }
  return out;
};

export interface WangTileMeta {
  corners: Record<"NW" | "NE" | "SW" | "SE", WangCornerValue>;
  bounding_box: { x: number; y: number; width: number; height: number };
}

export interface WangMetadata {
  tileset_data: { tiles: WangTileMeta[] };
}

type Box = WangTileMeta["bounding_box"];

const keyOf = (nw: number, ne: number, sw: number, se: number): string =>
  `${nw}${ne}${sw}${se}`;

/** tile boxes by corner configuration (NW, NE, SW, SE; 1 = upper) */
export const wangIndex = (meta: WangMetadata): Map<string, Box> => {
  const index = new Map<string, Box>();
  for (const tile of meta.tileset_data.tiles) {
    const bit = (value: WangCornerValue): number => (value === "upper" ? 1 : 0);
    index.set(
      keyOf(
        bit(tile.corners.NW),
        bit(tile.corners.NE),
        bit(tile.corners.SW),
        bit(tile.corners.SE),
      ),
      tile.bounding_box,
    );
  }
  return index;
};

const boxOf = (index: Map<string, Box>, key: string): Box => {
  const box = index.get(key);
  if (!box) {
    throw new BadRequestError(
      `the Wang tileset has no tile for corners ${key}`,
    );
  }
  return box;
};

/** quadrant offsets within a tile, by quadrant name */
const QUADRANTS = {
  NW: { x: 0, y: 0 },
  NE: { x: 1, y: 0 },
  SW: { x: 0, y: 1 },
  SE: { x: 1, y: 1 },
} as const;

type QuadrantName = keyof typeof QUADRANTS;

export interface WangBlobOptions {
  sheet: Image;
  meta: WangMetadata;
  /** tile edge in pixels (default 16) */
  tile?: number;
}

/** The 47-tile blob sheet (8 x 6 grid) composed from a Wang tileset. */
export const wangBlobSheet = ({
  sheet,
  meta,
  tile = 16,
}: WangBlobOptions): Image => {
  const index = wangIndex(meta);
  const half = tile / 2;
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  const copyQuadrant = (
    sourceKey: string,
    sourceQuadrant: QuadrantName,
    tx: number,
    ty: number,
    targetQuadrant: QuadrantName,
  ): void => {
    const box = boxOf(index, sourceKey);
    const sq = QUADRANTS[sourceQuadrant];
    const tq = QUADRANTS[targetQuadrant];
    copyRect({
      source: sheet,
      sx: box.x + sq.x * half,
      sy: box.y + sq.y * half,
      width: half,
      height: half,
      target: out,
      tx: tx + tq.x * half,
      ty: ty + tq.y * half,
    });
  };
  BLOB_MASKS.forEach((mask, position) => {
    const tx = (position % BLOB_COLUMNS) * tile;
    const ty = Math.floor(position / BLOB_COLUMNS) * tile;
    const bit = (flag: number): number => ((mask & flag) !== 0 ? 1 : 0);
    const n = bit(N);
    const e = bit(E);
    const s = bit(S);
    const w = bit(W);
    // the Wang cell centred on each tile corner supplies that quadrant
    copyQuadrant(keyOf(bit(NW), n, w, 1), "SE", tx, ty, "NW");
    copyQuadrant(keyOf(n, bit(NE), 1, e), "SW", tx, ty, "NE");
    copyQuadrant(keyOf(w, 1, bit(SW), s), "NE", tx, ty, "SW");
    copyQuadrant(keyOf(1, e, s, bit(SE)), "NW", tx, ty, "SE");
  });
  return out;
};

/** A full blob sheet of one Wang tile (the ground layer's plain fill). */
export const wangFillSheet = ({
  sheet,
  meta,
  tile = 16,
  fill = "lower",
}: WangBlobOptions & { fill?: WangCornerValue }): Image => {
  const index = wangIndex(meta);
  const bit = fill === "upper" ? 1 : 0;
  const box = boxOf(index, keyOf(bit, bit, bit, bit));
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  BLOB_MASKS.forEach((_, position) => {
    copyRect({
      source: sheet,
      sx: box.x,
      sy: box.y,
      width: tile,
      height: tile,
      target: out,
      tx: (position % BLOB_COLUMNS) * tile,
      ty: Math.floor(position / BLOB_COLUMNS) * tile,
    });
  });
  return out;
};
