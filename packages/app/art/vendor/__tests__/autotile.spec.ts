import { describe, expect, it } from "vitest";

import { expandA1Block, expandA2Block, fillTileOf } from "../autotile";
import {
  BLOB_COLUMNS,
  BLOB_FULL,
  BLOB_MASKS,
  blobIndexOf,
  E,
  N,
  S,
  W,
} from "../blob";
import { blankImage, pixelAt, type Image, type Rgba } from "../png";

const TILE = 4;
const MINI = TILE / 2;

/** A block whose every mini carries its own block-local mini coordinates as colour. */
const syntheticBlock = (): Image => {
  const sheet = blankImage(2 * TILE * 2, 3 * TILE); // two blocks wide, one tall
  for (let y = 0; y < sheet.height; y += 1) {
    for (let x = 0; x < sheet.width; x += 1) {
      const at = (y * sheet.width + x) * 4;
      sheet.data[at] = Math.floor(x / MINI);
      sheet.data[at + 1] = Math.floor(y / MINI);
      sheet.data[at + 2] = 7;
      sheet.data[at + 3] = 255;
    }
  }
  return sheet;
};

const quadrant = (out: Image, index: number, ox: 0 | 1, oy: 0 | 1): Rgba =>
  pixelAt(
    out,
    (index % BLOB_COLUMNS) * TILE + ox * MINI,
    Math.floor(index / BLOB_COLUMNS) * TILE + oy * MINI,
  );

describe("expandA2Block", () => {
  const out = expandA2Block(syntheticBlock(), { x: 0, y: 0 }, { tile: TILE });

  it("lays 47 tiles out in eight columns by six rows", () => {
    expect(BLOB_MASKS).toHaveLength(47);
    expect(out.width).toBe(BLOB_COLUMNS * TILE);
    expect(out.height).toBe(6 * TILE);
  });

  it("composes an isolated tile from the four outer corners of the box", () => {
    const index = blobIndexOf(0);
    // box minis are rows 2..5 of the block (below the corner and fill tiles)
    expect(quadrant(out, index, 0, 0).slice(0, 2)).toEqual([0, 2]);
    expect(quadrant(out, index, 1, 0).slice(0, 2)).toEqual([3, 2]);
    expect(quadrant(out, index, 0, 1).slice(0, 2)).toEqual([0, 5]);
    expect(quadrant(out, index, 1, 1).slice(0, 2)).toEqual([3, 5]);
  });

  it("uses the inner-corner minis when both edges meet without the diagonal", () => {
    const index = blobIndexOf(N | E | S | W);
    expect(quadrant(out, index, 0, 0).slice(0, 2)).toEqual([1, 1]);
    expect(quadrant(out, index, 1, 0).slice(0, 2)).toEqual([0, 1]);
    expect(quadrant(out, index, 0, 1).slice(0, 2)).toEqual([1, 0]);
    expect(quadrant(out, index, 1, 1).slice(0, 2)).toEqual([0, 0]);
  });

  it("copies the plain fill tile for a fully surrounded tile", () => {
    expect(quadrant(out, BLOB_FULL, 0, 0).slice(0, 2)).toEqual([2, 0]);
    expect(quadrant(out, BLOB_FULL, 1, 1).slice(0, 2)).toEqual([3, 1]);
  });

  it("takes edge minis along an open side and interior minis along a closed one", () => {
    const index = blobIndexOf(N | S); // vertical strip: W and E open
    expect(quadrant(out, index, 0, 0).slice(0, 2)).toEqual([0, 4]); // xEdge, yInt
    expect(quadrant(out, index, 1, 0).slice(0, 2)).toEqual([3, 4]);
    const horizontal = blobIndexOf(E | W);
    expect(quadrant(out, horizontal, 0, 0).slice(0, 2)).toEqual([2, 2]); // xInt, yEdge
    expect(quadrant(out, horizontal, 0, 1).slice(0, 2)).toEqual([2, 5]);
  });

  it("keys the base terrain out of the expanded tiles", () => {
    const sheet = syntheticBlock();
    // paint the box's outer corner mini (0, 2) with the base's pixel pattern
    const base = fillTileOf(sheet, { x: 1, y: 0 }, TILE);
    for (let y = 0; y < MINI; y += 1) {
      for (let x = 0; x < MINI; x += 1) {
        const [r, g, b, a] = pixelAt(base, x, y);
        const at = ((TILE + y) * sheet.width + x) * 4;
        sheet.data.set([r, g, b, a], at);
      }
    }
    const keyed = expandA2Block(
      sheet,
      { x: 0, y: 0 },
      { tile: TILE, keyOut: base },
    );
    const plain = expandA2Block(sheet, { x: 0, y: 0 }, { tile: TILE });
    expect(quadrant(plain, blobIndexOf(0), 0, 0)[3]).toBe(255);
    expect(quadrant(keyed, blobIndexOf(0), 0, 0)[3]).toBe(0);
    expect(quadrant(keyed, blobIndexOf(0), 1, 1)[3]).toBe(255);
  });

  it("refuses a block outside the sheet", () => {
    expect(() =>
      expandA2Block(syntheticBlock(), { x: 2, y: 0 }, { tile: TILE }),
    ).toThrow(/outside/);
  });
});

describe("expandA1Block", () => {
  it("stacks one expanded block per frame", () => {
    const sheet = syntheticBlock();
    const out = expandA1Block(sheet, { x: 0, y: 0 }, { tile: TILE, frames: 2 });
    expect(out.height).toBe(2 * 6 * TILE);
    // frame 1 is the block one to the right: mini x offset 4
    const frame1 = pixelAt(out, 0, 6 * TILE);
    expect(frame1.slice(0, 2)).toEqual([4, 2]);
  });
});

describe("palette keying", () => {
  it("keys every pixel whose colour the base uses, at any phase", () => {
    const sheet = syntheticBlock();
    const base = fillTileOf(sheet, { x: 1, y: 0 }, TILE);
    // the base's colours are the fill tile's own mini colours; paint the
    // colour of its bottom-right mini into the box's outer corner mini, where
    // the phase comparison meets the top-left mini instead
    const [r, g, b] = pixelAt(base, TILE - 1, TILE - 1);
    const at = ((TILE + 1) * sheet.width + 1) * 4;
    sheet.data.set([r, g, b, 255], at);
    const phase = expandA2Block(
      sheet,
      { x: 0, y: 0 },
      { tile: TILE, keyOut: base },
    );
    const palette = expandA2Block(
      sheet,
      { x: 0, y: 0 },
      {
        tile: TILE,
        keyOut: base,
        keyOutMode: "palette",
      },
    );
    const index = blobIndexOf(0);
    const px = (out: Image) =>
      pixelAt(
        out,
        (index % BLOB_COLUMNS) * TILE + 1,
        Math.floor(index / BLOB_COLUMNS) * TILE + 1,
      );
    expect(px(phase)[3]).toBe(255);
    expect(px(palette)[3]).toBe(0);
  });
});
