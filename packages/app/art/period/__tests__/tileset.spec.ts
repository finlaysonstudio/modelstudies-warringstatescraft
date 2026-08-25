import { describe, expect, it } from "vitest";

import {
  BLOB_COLUMNS,
  BLOB_FULL,
  blobIndexOf,
  E,
  N,
  NE,
} from "../../vendor/blob";
import { blankImage, pixelAt } from "../../vendor/png";
import {
  greyBlue,
  wangBlobSheet,
  wangFillSheet,
  type WangMetadata,
} from "../tileset";

const TILE = 4;
const HALF = TILE / 2;

/**
 * A synthetic Wang sheet: tile i (i = NW·8 + NE·4 + SW·2 + SE) sits at grid
 * position i, and every pixel carries (i, local x, local y) as colour, so a
 * composed quadrant names exactly which source quadrant it came from.
 */
const synthetic = (): {
  sheet: ReturnType<typeof blankImage>;
  meta: WangMetadata;
} => {
  const sheet = blankImage(4 * TILE, 4 * TILE);
  const tiles: WangMetadata["tileset_data"]["tiles"] = [];
  for (let i = 0; i < 16; i += 1) {
    const x = (i % 4) * TILE;
    const y = Math.floor(i / 4) * TILE;
    for (let dy = 0; dy < TILE; dy += 1) {
      for (let dx = 0; dx < TILE; dx += 1) {
        const at = ((y + dy) * sheet.width + (x + dx)) * 4;
        sheet.data[at] = i;
        sheet.data[at + 1] = dx;
        sheet.data[at + 2] = dy;
        sheet.data[at + 3] = 255;
      }
    }
    const value = (bit: number): "upper" | "lower" =>
      (i & bit) !== 0 ? "upper" : "lower";
    tiles.push({
      corners: { NW: value(8), NE: value(4), SW: value(2), SE: value(1) },
      bounding_box: { x, y, width: TILE, height: TILE },
    });
  }
  return { sheet, meta: { tileset_data: { tiles } } };
};

/** the (tile, x, y) colour at a blob position's quadrant origin */
const at = (
  out: ReturnType<typeof blankImage>,
  index: number,
  ox: 0 | 1,
  oy: 0 | 1,
): number[] =>
  pixelAt(
    out,
    (index % BLOB_COLUMNS) * TILE + ox * HALF,
    Math.floor(index / BLOB_COLUMNS) * TILE + oy * HALF,
  ).slice(0, 3);

describe("wangBlobSheet", () => {
  const { sheet, meta } = synthetic();
  const out = wangBlobSheet({ sheet, meta, tile: TILE });

  it("is the 47-tile blob sheet", () => {
    expect(out.width).toBe(BLOB_COLUMNS * TILE);
    expect(out.height).toBe(6 * TILE);
  });

  it("fills the interior tile from the all-upper Wang tile", () => {
    const index = BLOB_FULL;
    expect(at(out, index, 0, 0)).toEqual([15, HALF, HALF]);
    expect(at(out, index, 1, 0)).toEqual([15, 0, HALF]);
    expect(at(out, index, 0, 1)).toEqual([15, HALF, 0]);
    expect(at(out, index, 1, 1)).toEqual([15, 0, 0]);
  });

  it("composes the isolated tile from the four single-corner Wang tiles", () => {
    const index = blobIndexOf(0);
    // NW quadrant ← SE quadrant of the tile whose SE corner alone is upper
    expect(at(out, index, 0, 0)).toEqual([0b0001, HALF, HALF]);
    expect(at(out, index, 1, 0)).toEqual([0b0010, 0, HALF]);
    expect(at(out, index, 0, 1)).toEqual([0b0100, HALF, 0]);
    expect(at(out, index, 1, 1)).toEqual([0b1000, 0, 0]);
  });

  it("carries an edge neighbour into both corner cells it touches", () => {
    const index = blobIndexOf(N | E | NE);
    // NW corner cell: north neighbour upper → key NW=0 NE=1 SW=0 SE=1
    expect(at(out, index, 0, 0)).toEqual([0b0101, HALF, HALF]);
    // NE corner cell: north, diagonal, and east all upper → all-upper key
    expect(at(out, index, 1, 0)).toEqual([0b1111, 0, HALF]);
    // SE corner cell: east upper → key NW=1 NE=1 SW=0 SE=0
    expect(at(out, index, 1, 1)).toEqual([0b1100, 0, 0]);
  });

  it("refuses a tileset missing a corner combination", () => {
    const partial: WangMetadata = {
      tileset_data: { tiles: meta.tileset_data.tiles.slice(0, -1) },
    };
    expect(() => wangBlobSheet({ sheet, meta: partial, tile: TILE })).toThrow(
      /no tile for corners/,
    );
  });
});

describe("wangFillSheet", () => {
  const { sheet, meta } = synthetic();

  it("repeats the pure-lower tile over every blob cell", () => {
    const out = wangFillSheet({ sheet, meta, tile: TILE, fill: "lower" });
    expect(at(out, 0, 0, 0)).toEqual([0, 0, 0]);
    expect(at(out, 46, 1, 1)).toEqual([0, HALF, HALF]);
  });

  it("repeats the pure-upper tile when asked", () => {
    const out = wangFillSheet({ sheet, meta, tile: TILE, fill: "upper" });
    expect(at(out, 0, 0, 0)).toEqual([15, 0, 0]);
  });
});

describe("greyBlue", () => {
  it("greys only blue-dominant pixels toward luminance", () => {
    const image = blankImage(2, 1);
    image.data.set([10, 20, 90, 255, 10, 90, 20, 255]);
    const out = greyBlue(image, 0.5);
    expect(pixelAt(out, 0, 0)).toEqual([25, 30, 65, 255]);
    expect(pixelAt(out, 1, 0)).toEqual([10, 90, 20, 255]);
  });
});
