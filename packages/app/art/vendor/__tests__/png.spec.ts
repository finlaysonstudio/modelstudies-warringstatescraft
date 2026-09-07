import { describe, expect, it } from "vitest";

import { blankImage, downsampleImage, pixelAt, setPixel } from "../png";

describe("downsampleImage", () => {
  it("averages each block, weighting colour by alpha", () => {
    const image = blankImage(4, 2);
    // top-left block: one opaque red pixel and three clear ones
    setPixel(image, 0, 0, [255, 0, 0, 255]);
    // top-right block: two opaque pixels, black and white
    setPixel(image, 2, 0, [0, 0, 0, 255]);
    setPixel(image, 3, 0, [255, 255, 255, 255]);
    setPixel(image, 2, 1, [0, 0, 0, 255]);
    setPixel(image, 3, 1, [255, 255, 255, 255]);
    const out = downsampleImage(image, 2);
    expect([out.width, out.height]).toEqual([2, 1]);
    // the clear pixels lend no colour, only transparency
    expect(pixelAt(out, 0, 0)).toEqual([255, 0, 0, 64]);
    expect(pixelAt(out, 1, 0)).toEqual([128, 128, 128, 255]);
  });

  it("refuses a size the factor does not divide", () => {
    expect(() => downsampleImage(blankImage(3, 2), 2)).toThrow(/downsample/);
  });

  it("is the identity at a factor of one", () => {
    const image = blankImage(2, 2);
    setPixel(image, 1, 1, [1, 2, 3, 4]);
    expect(downsampleImage(image, 1)).toEqual(image);
  });
});
