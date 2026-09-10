import { describe, expect, it } from "vitest";

import { animationsOf } from "../fetch";
import { blankImage, pixelAt, setPixel, type Image } from "../../vendor/png";
import { FACINGS } from "../../vendor/slice";
import {
  anchorsOf,
  assembleSprite,
  fitFrame,
  beatFrames,
  mirrorImage,
  overlaySheet,
  pivotOf,
  scaleAnchors,
  scaleEntry,
} from "../build";

const FRAME = 8;

/** A frame with one opaque pixel at (x, y) carrying its own coordinates. */
const dot = (x: number, y: number, size = FRAME): Image => {
  const image = blankImage(size, size);
  setPixel(image, x, y, [x, y, 0, 255]);
  return image;
};

/**
 * A figure: an opaque box from (left, top) to (right, bottom) with one
 * tag pixel so the mirror can be told from the original.
 */
const figure = (
  left: number,
  top: number,
  right: number,
  bottom: number,
  size = FRAME,
): Image => {
  const image = blankImage(size, size);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      setPixel(image, x, y, [100, 100, 100, 255]);
    }
  }
  setPixel(image, left, top, [255, 0, 0, 255]);
  return image;
};

const facings = (make: (i: number) => Image, count: number) =>
  Object.fromEntries(
    ["south", "west", "east", "north"].map((source) => [
      source,
      Array.from({ length: count }, (_, i) => make(i)),
    ]),
  );

describe("mirrorImage", () => {
  it("flips every column across the vertical axis and nothing else", () => {
    const image = figure(1, 2, 3, 5);
    const mirrored = mirrorImage(image);
    expect(pixelAt(mirrored, FRAME - 2, 2)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(mirrored, 1, 2)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(mirrored, FRAME - 4, 5)).toEqual([100, 100, 100, 255]);
    // twice is the identity
    expect(mirrorImage(mirrored).data).toEqual(image.data);
  });
});

describe("assembleSprite", () => {
  it("stacks the walk rows first, then four rows per action", () => {
    const walk = facings((i) => dot(i, 0), 2);
    const hoe = facings((i) => dot(i, 1), 3);
    const { image, meta } = assembleSprite(walk, {
      frame: FRAME,
      count: 2,
      actions: [{ id: "hoe", count: 3, frames: hoe }],
    });
    // as wide as the longest row, eight rows tall
    expect(meta.columns).toBe(3);
    expect(image.width).toBe(3 * FRAME);
    expect(image.height).toBe(8 * FRAME);
    expect(meta.walk).toEqual({
      down: [0, 1],
      left: [3, 4],
      right: [6, 7],
      up: [9, 10],
    });
    expect(meta.actions).toEqual({
      hoe: {
        down: [12, 13, 14],
        left: [15, 16, 17],
        right: [18, 19, 20],
        up: [21, 22, 23],
      },
    });
    // the walk's blank third cell is empty, the hoe's third is drawn
    expect(pixelAt(image, 2 * FRAME + 2, 0)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(image, 2 * FRAME + 2, 4 * FRAME + 1)).toEqual([
      2, 1, 0, 255,
    ]);
  });

  it("carries an anchor per frame of the sheet, blank cells included", () => {
    const walk = facings(() => figure(2, 1, 5, 6), 2);
    const kneel = facings(() => figure(1, 3, 6, 6), 4);
    const { meta } = assembleSprite(walk, {
      frame: FRAME,
      count: 2,
      actions: [{ id: "kneel", count: 4, frames: kneel }],
    });
    expect(meta.anchors).toHaveLength(8 * 4);
    // the walk's own frames read the figure; its blank third and fourth
    // cells anchor at the centre
    expect(meta.anchors?.[0].head).toEqual([3, 1]);
    expect(meta.anchors?.[2].head).toEqual([4, 4]);
    expect(meta.anchors?.[16].head).toEqual([3, 3]);
  });

  it("crops a pose drawn on a padded canvas to the sprite's frame", () => {
    // a v3 pose lands on the character's canvas plus an even margin
    const padded = blankImage(FRAME + 4, FRAME + 4);
    setPixel(padded, 2 + 3, 2 + 5, [9, 9, 9, 255]);
    const fitted = fitFrame(padded, FRAME, "hoe frame south-0");
    expect([fitted.width, fitted.height]).toEqual([FRAME, FRAME]);
    expect(pixelAt(fitted, 3, 5)).toEqual([9, 9, 9, 255]);
    // a frame already at size is returned as it is
    const own = dot(1, 1);
    expect(fitFrame(own, FRAME, "walk")).toBe(own);
    // a smaller frame or an odd margin is refused
    expect(() =>
      fitFrame(blankImage(FRAME - 2, FRAME - 2), FRAME, "x"),
    ).toThrow("is 6x6, not 8x8");
    expect(() =>
      fitFrame(blankImage(FRAME + 3, FRAME + 3), FRAME, "x"),
    ).toThrow("is 11x11, not 8x8");
    // and the stacker takes the padded pose where the walk is at size
    const walk = facings((i) => dot(i, 0), 2);
    const hoe = facings(() => padded, 2);
    const { image } = assembleSprite(walk, {
      frame: FRAME,
      count: 2,
      actions: [{ id: "hoe", count: 2, frames: hoe }],
    });
    expect(pixelAt(image, 3, 4 * FRAME + 5)).toEqual([9, 9, 9, 255]);
  });

  it("leaves a sprite with no actions as it was, plus its anchors", () => {
    const walk = facings((i) => dot(i, 0), 4);
    const { image, meta } = assembleSprite(walk, { frame: FRAME, count: 4 });
    expect(image.width).toBe(4 * FRAME);
    expect(image.height).toBe(4 * FRAME);
    expect(meta.actions).toBeUndefined();
    expect(meta.anchors).toHaveLength(16);
    expect(meta.walk.up).toEqual([12, 13, 14, 15]);
  });

  it("refuses a short row and a frame of the wrong size", () => {
    const walk = facings((i) => dot(i, 0), 2);
    expect(() => assembleSprite(walk, { frame: FRAME, count: 3 })).toThrow(
      /missing south frames/,
    );
    const odd = facings((i) => dot(i, 0, FRAME + 1), 2);
    expect(() => assembleSprite(odd, { frame: FRAME, count: 2 })).toThrow(
      /not 8x8/,
    );
  });
});

describe("anchorsOf", () => {
  const box = figure(2, 1, 5, 7);

  it("puts the head on the topmost row's centre and the shoulders a quarter down", () => {
    const anchors = anchorsOf(box, "down");
    expect(anchors.head).toEqual([3, 1]);
    // height 6, a quarter is row 1 + 2 (rounded)
    expect(anchors.shoulders).toEqual([3, 3]);
  });

  it("puts the hand on the leading side at mid-height and the back on the trailing side", () => {
    // mid-height: 1 + round(6 / 2) = 4
    expect(anchorsOf(box, "left").hand).toEqual([2, 4]);
    expect(anchorsOf(box, "left").back).toEqual([5, 4]);
    expect(anchorsOf(box, "right").hand).toEqual([5, 4]);
    expect(anchorsOf(box, "right").back).toEqual([2, 4]);
    // facing the viewer, the figure's right hand is screen left; facing
    // away it is screen right
    expect(anchorsOf(box, "down").hand).toEqual([2, 4]);
    expect(anchorsOf(box, "up").hand).toEqual([5, 4]);
  });

  it("reads the outermost opaque column, not the box", () => {
    const reach = figure(2, 1, 5, 7);
    // a hoe held out to the left at mid-height
    setPixel(reach, 0, 4, [50, 50, 50, 255]);
    expect(anchorsOf(reach, "left").hand).toEqual([0, 4]);
    expect(anchorsOf(reach, "right").back).toEqual([0, 4]);
  });

  it("anchors a blank frame at its centre", () => {
    const anchors = anchorsOf(blankImage(FRAME, FRAME), "down");
    expect(anchors.head).toEqual([4, 4]);
    expect(anchors.hand).toEqual([4, 4]);
  });

  it("answers the mirrored frame with the mirrored hand", () => {
    const reach = figure(2, 1, 5, 7);
    setPixel(reach, 0, 4, [50, 50, 50, 255]);
    const west = anchorsOf(reach, "left");
    const east = anchorsOf(mirrorImage(reach), "right");
    expect(east.hand[0]).toBe(FRAME - 1 - west.hand[0]);
    expect(east.hand[1]).toBe(west.hand[1]);
  });
});

describe("overlaySheet", () => {
  const hat = figure(1, 2, 4, 3, 6);

  it("lays one still per facing, the east mirrored", () => {
    const { image, meta } = overlaySheet({ still: hat }, "head");
    expect(image.width).toBe(4 * 6);
    expect(image.height).toBe(6);
    expect(meta.slot).toBe("head");
    expect(meta.facings).toEqual({ down: 0, left: 1, right: 2, up: 3 });
    // the tag pixel stays left for south and lands right for east
    expect(pixelAt(image, 1, 2)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(image, 2 * 6 + 4, 2)).toEqual([255, 0, 0, 255]);
  });

  it("pivots a head piece by its bottom centre, a shoulder piece by its top, the rest by the middle", () => {
    expect(pivotOf(hat, "head")).toEqual([2, 3]);
    expect(pivotOf(hat, "shoulders")).toEqual([2, 2]);
    expect(pivotOf(hat, "hand")).toEqual([2, 2]);
    // the mirrored frame's pivot is read from the mirrored pixels
    const brim = figure(0, 2, 2, 3, 6);
    const { meta } = overlaySheet({ still: brim }, "head");
    expect(meta.pivots.down).toEqual([1, 3]);
    expect(meta.pivots.right).toEqual([4, 3]);
  });

  it("takes a facing's own frame where one is given", () => {
    const east = figure(0, 0, 1, 1, 6);
    const { meta } = overlaySheet({ still: hat, right: east }, "hand");
    expect(meta.pivots.right).toEqual([0, 0]);
    expect(() => overlaySheet({ right: east }, "hand")).toThrow(/no down/);
  });
});

describe("beatFrames", () => {
  it("lays the still out four times, swollen on the beat and clipped to its cell", () => {
    const SIZE = 16;
    const drum = figure(2, 2, 13, 13, SIZE);
    const { image, frame } = beatFrames(drum);
    expect(frame).toEqual({ width: SIZE, height: SIZE });
    expect(image.width).toBe(4 * SIZE);
    // frame 0 is the still; frame 1 is bigger, frame 3 smaller
    expect(pixelAt(image, 2, 2)).toEqual([255, 0, 0, 255]);
    const opaque = (cell: number): number => {
      let count = 0;
      for (let y = 0; y < SIZE; y += 1) {
        for (let x = 0; x < SIZE; x += 1) {
          if (pixelAt(image, cell * SIZE + x, y)[3] !== 0) count += 1;
        }
      }
      return count;
    };
    expect(opaque(0)).toBe(144);
    expect(opaque(2)).toBe(144);
    expect(opaque(1)).toBeGreaterThan(144);
    expect(opaque(3)).toBeLessThan(144);
  });
});

describe("the derive", () => {
  it("halves the anchors and the pivots onto the pixel their block shrinks to", () => {
    expect(
      scaleAnchors(
        { head: [7, 1], shoulders: [6, 4], hand: [1, 9], back: [12, 9] },
        2,
      ),
    ).toEqual({ head: [3, 0], shoulders: [3, 2], hand: [0, 4], back: [6, 4] });
    const entry = scaleEntry(
      {
        file: "overlay.hat.png",
        kind: "overlay",
        width: 96,
        height: 24,
        frames: 4,
        frame: { width: 24, height: 24 },
        overlay: {
          slot: "head",
          facings: { down: 0, left: 1, right: 2, up: 3 },
          pivots: {
            down: [11, 21],
            left: [11, 21],
            right: [12, 21],
            up: [11, 21],
          },
        },
        pack: "pixellab",
      },
      2,
      "overlay.hat",
    );
    expect(entry.frame).toEqual({ width: 12, height: 12 });
    expect(entry.overlay?.pivots.right).toEqual([6, 10]);
    expect(entry.overlay?.facings.up).toBe(3);
  });
});

describe("animationsOf", () => {
  it("names every animation group an archive holds", () => {
    const entries = new Map<string, Uint8Array>();
    for (const name of [
      "Idle/rotations/south.png",
      "Idle/animations/walk/south/frame_000.png",
      "Idle/animations/walk/west/frame_000.png",
      "Idle/animations/hoe/south/frame_000.png",
      "Idle/animations/hoe/south/frame_001.png",
      "metadata.json",
    ]) {
      entries.set(name, new Uint8Array());
    }
    expect(animationsOf(entries)).toEqual(["hoe", "walk"]);
    expect(FACINGS).toEqual(["down", "left", "right", "up"]);
  });
});
