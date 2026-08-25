import { describe, expect, it } from "vitest";

import { blankImage, fillRect, isBlank, pixelAt } from "../png";
import { sliceGrid, spriteMeta } from "../slice";

describe("sliceGrid", () => {
  it("cuts a sheet into row-major cells", () => {
    const sheet = blankImage(4, 4);
    fillRect(sheet, { x: 2, y: 2, width: 2, height: 2 }, [9, 9, 9, 255]);
    const cells = sliceGrid(sheet, { width: 2, height: 2 });
    expect(cells).toHaveLength(4);
    expect(isBlank(cells[0])).toBe(true);
    expect(isBlank(cells[3])).toBe(false);
    expect(pixelAt(cells[3], 0, 0)).toEqual([9, 9, 9, 255]);
  });

  it("refuses a cell that does not divide the sheet", () => {
    expect(() => sliceGrid(blankImage(5, 4), { width: 2, height: 2 })).toThrow(
      /does not divide/,
    );
  });
});

describe("spriteMeta", () => {
  it("lays the walk rows out in RPG Maker order", () => {
    expect(spriteMeta()).toEqual({
      frameWidth: 16,
      frameHeight: 32,
      columns: 3,
      walk: {
        down: [0, 1, 2],
        left: [3, 4, 5],
        right: [6, 7, 8],
        up: [9, 10, 11],
      },
    });
    expect(spriteMeta({ columns: 4 }).walk.up).toEqual([12, 13, 14, 15]);
  });
});
