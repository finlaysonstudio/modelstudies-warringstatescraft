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
  adjustColour,
  greyBlue,
  keepPalette,
  variantSheet,
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

describe("keepPalette", () => {
  it("keeps what the palette names and drops the rest", () => {
    const image = blankImage(3, 1);
    image.data.set([10, 20, 30, 255, 14, 24, 34, 255, 200, 40, 40, 255]);
    const out = keepPalette(image, [[10, 20, 30, 255]], 4);
    expect(pixelAt(out, 0, 0)).toEqual([10, 20, 30, 255]);
    // within tolerance: the collar's anti-aliased blends stay with their terrain
    expect(pixelAt(out, 1, 0)).toEqual([14, 24, 34, 255]);
    expect(pixelAt(out, 2, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe("adjustColour", () => {
  it("turns the hue without touching a grey", () => {
    const image = blankImage(2, 1);
    image.data.set([255, 0, 0, 255, 100, 100, 100, 255]);
    const out = adjustColour(image, { hue: 120 });
    expect(pixelAt(out, 0, 0)).toEqual([0, 255, 0, 255]);
    expect(pixelAt(out, 1, 0)).toEqual([100, 100, 100, 255]);
  });

  it("scales saturation and value", () => {
    const image = blankImage(1, 1);
    image.data.set([200, 100, 100, 255]);
    const out = adjustColour(image, { saturation: 0, value: 0.5 });
    expect(pixelAt(out, 0, 0)).toEqual([100, 100, 100, 255]);
  });

  it("leaves a transparent pixel alone", () => {
    const image = blankImage(1, 1);
    const out = adjustColour(image, { hue: 90, saturation: 2, value: 2 });
    expect(pixelAt(out, 0, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe("variantSheet", () => {
  const source = (): ReturnType<typeof blankImage> => {
    const image = blankImage(TILE, TILE);
    image.data.set([80, 80, 80, 255], 0);
    return image;
  };

  it("stacks a block per variant, the first one untouched", () => {
    const out = variantSheet(source(), 3, { tile: TILE });
    expect(out.height).toBe(TILE * 3);
    expect(pixelAt(out, 0, 0)).toEqual([80, 80, 80, 255]);
  });

  it("shifts each later block within the tile, wrapping at its edge", () => {
    const out = variantSheet(source(), 2, { tile: TILE });
    // block 1 samples (x + 5, y + 7), so the corner pixel lands where the
    // shift wraps it back to
    const dx = (TILE - (5 % TILE)) % TILE;
    const dy = (TILE - (7 % TILE)) % TILE;
    expect(pixelAt(out, dx, TILE + dy)).toEqual([80, 80, 80, 255]);
  });

  it("gives each block its own tone when asked", () => {
    const out = variantSheet(source(), 2, { tone: 0.5, tile: TILE });
    expect(pixelAt(out, 0, 0)[0]).toBe(40);
  });
});
