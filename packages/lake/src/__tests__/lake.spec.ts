import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FileLake } from "../lake";
import { createFixtureLake, removeFixtureLake, ZHAN_GUO_CE } from "./fixture";

let root: string;
let lake: FileLake;

beforeEach(async () => {
  ({ root, lake } = await createFixtureLake());
});

afterEach(async () => {
  await removeFixtureLake(root);
});

describe("FileLake", () => {
  it("reads the built index", async () => {
    const index = await lake.index();
    expect(index.documents).toBe(5);
    expect(index.byCollection.period.documents).toBe(2);
    expect(index.byUse).toEqual({ prompt: 2, reader: 2, internal: 1 });
    expect(index.redistributable).toBe(3);
  });

  it("returns a manifest and its text by id", async () => {
    const manifest = await lake.manifest("zhan-guo-ce");
    expect(manifest?.use).toBe("prompt");
    expect(await lake.text("zhan-guo-ce")).toContain(ZHAN_GUO_CE);
  });

  it("returns undefined for an unknown id", async () => {
    expect(await lake.manifest("nothing-here")).toBeUndefined();
    expect(await lake.text("nothing-here")).toBeUndefined();
  });

  it("names the path and the fix when the lake has never been indexed", async () => {
    const empty = await mkdtemp(join(tmpdir(), "lake-absent-"));
    try {
      await expect(new FileLake(empty).index()).rejects.toThrow(
        /No lake index at .*index\.json/,
      );
    } finally {
      await rm(empty, { recursive: true, force: true });
    }
  });

  it("drops its cache on reload", async () => {
    const first = await lake.index();
    lake.reload();
    expect(await lake.index()).toEqual(first);
  });
});
