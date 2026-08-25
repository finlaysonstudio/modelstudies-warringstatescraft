/**
 * The 47-tile blob autotile layout shared by the vendor step, the fallback
 * sheets, the map builder, and the stage.
 *
 * A tile's mask names which of its eight neighbours hold the same terrain
 * (N=1, NE=2, E=4, SE=8, S=16, SW=32, W=64, NW=128). A diagonal only counts
 * when both adjacent edges are set, which leaves 47 distinct masks; a sheet
 * lays them out in ascending mask order, eight columns by six rows, the
 * forty-eighth cell unused. Water sheets stack one such block per frame.
 */
export const N = 1;
export const NE = 2;
export const E = 4;
export const SE = 8;
export const S = 16;
export const SW = 32;
export const W = 64;
export const NW = 128;

export const BLOB_COLUMNS = 8;
export const BLOB_ROWS = 6;
export const BLOB_TILE_COUNT = BLOB_COLUMNS * BLOB_ROWS;

export const normalizeMask = (mask: number): number => {
  let m = mask & 255;
  if (!((m & N) !== 0 && (m & E) !== 0)) m &= ~NE;
  if (!((m & S) !== 0 && (m & E) !== 0)) m &= ~SE;
  if (!((m & S) !== 0 && (m & W) !== 0)) m &= ~SW;
  if (!((m & N) !== 0 && (m & W) !== 0)) m &= ~NW;
  return m;
};

const distinct = (): number[] => {
  const seen = new Set<number>();
  for (let mask = 0; mask < 256; mask += 1) seen.add(normalizeMask(mask));
  return [...seen].sort((a, b) => a - b);
};

/** The 47 masks in sheet order. */
export const BLOB_MASKS: readonly number[] = distinct();

const INDEX = new Map(BLOB_MASKS.map((mask, index) => [mask, index]));

export const blobIndexOf = (mask: number): number =>
  INDEX.get(normalizeMask(mask)) ?? 0;

/** The index of the fully surrounded tile (mask 255). */
export const BLOB_FULL = blobIndexOf(255);

export const maskOf = (same: (dx: number, dy: number) => boolean): number =>
  normalizeMask(
    (same(0, -1) ? N : 0) |
      (same(1, -1) ? NE : 0) |
      (same(1, 0) ? E : 0) |
      (same(1, 1) ? SE : 0) |
      (same(0, 1) ? S : 0) |
      (same(-1, 1) ? SW : 0) |
      (same(-1, 0) ? W : 0) |
      (same(-1, -1) ? NW : 0),
  );

/** Tiled "mixed" Wang id: [top, top-right, right, bottom-right, bottom, bottom-left, left, top-left]. */
export const wangIdOf = (mask: number): number[] => {
  const m = normalizeMask(mask);
  return [N, NE, E, SE, S, SW, W, NW].map((bit) => ((m & bit) !== 0 ? 1 : 0));
};
