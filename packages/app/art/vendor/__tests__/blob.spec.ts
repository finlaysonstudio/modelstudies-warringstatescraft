import { describe, expect, it } from "vitest";

import {
  BLOB_FULL,
  BLOB_MASKS,
  blobIndexOf,
  maskOf,
  N,
  NE,
  normalizeMask,
  wangIdOf,
} from "../blob";

describe("blob masks", () => {
  it("has 47 distinct normalized masks in ascending order", () => {
    expect(BLOB_MASKS).toHaveLength(47);
    expect([...BLOB_MASKS].sort((a, b) => a - b)).toEqual([...BLOB_MASKS]);
    expect(BLOB_MASKS[0]).toBe(0);
    expect(BLOB_MASKS[46]).toBe(255);
    expect(BLOB_FULL).toBe(46);
  });

  it("drops a diagonal whose edges are not both set", () => {
    expect(normalizeMask(NE)).toBe(0);
    expect(normalizeMask(N | NE)).toBe(N);
    expect(blobIndexOf(N | NE)).toBe(blobIndexOf(N));
  });

  it("reads the eight neighbours into a mask", () => {
    expect(maskOf(() => true)).toBe(255);
    expect(maskOf((dx, dy) => dy === -1 && dx === 0)).toBe(N);
  });

  it("writes a Tiled mixed wang id", () => {
    expect(wangIdOf(255)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(wangIdOf(N)).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
  });
});
