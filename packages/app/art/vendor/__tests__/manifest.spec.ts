import { describe, expect, it } from "vitest";

import { GROUND_VARIANTS } from "../../map/map";
import { sha1Of, validatePacks, type PacksManifest } from "../manifest";
import { blankImage, decodePng, encodePng, fillRect } from "../png";
import { buildVendor } from "../vendor";

const a2Sheet = (): Uint8Array => {
  const sheet = blankImage(32, 48); // one 16 px block
  fillRect(sheet, { x: 0, y: 0, width: 32, height: 48 }, [10, 120, 10, 255]);
  return encodePng(sheet);
};

const npcSheet = (): Uint8Array => {
  const sheet = blankImage(96, 128); // two 48×128 cells, the second blank
  fillRect(sheet, { x: 0, y: 0, width: 48, height: 128 }, [200, 50, 50, 255]);
  return encodePng(sheet);
};

const packs = (overrides: Partial<PacksManifest> = {}): PacksManifest => ({
  version: 1,
  root: "var/assets/vendor",
  packs: [
    {
      id: "test",
      title: "Test pack",
      vendor: "nobody",
      license: "test",
      sheets: [
        {
          id: "terrain.grass",
          kind: "a2",
          file: "a2.png",
          block: { x: 0, y: 0 },
        },
        {
          id: "water.river",
          kind: "a1",
          file: "a1.png",
          block: { x: 0, y: 0 },
          frames: 2,
        },
        {
          id: "sprite.people",
          kind: "characters",
          file: "npc.png",
          cell: { width: 48, height: 128 },
          names: ["envoy", "ghost"],
        },
        { id: "image.gate", kind: "image", file: "gate.png" },
      ],
    },
  ],
  ...overrides,
});

const files = (): Record<string, Uint8Array> => {
  const a1 = blankImage(64, 48);
  fillRect(a1, { x: 0, y: 0, width: 64, height: 48 }, [10, 10, 200, 255]);
  return {
    "a2.png": a2Sheet(),
    "a1.png": encodePng(a1),
    "npc.png": npcSheet(),
    "gate.png": encodePng(blankImage(16, 16)),
  };
};

describe("validatePacks", () => {
  it("accepts a well-formed manifest", () => {
    expect(validatePacks(packs())).toEqual([]);
  });

  it("names the problems", () => {
    const manifest = packs();
    manifest.packs[0].sheets.push(
      { id: "terrain.grass", kind: "a2", file: "x.png" },
      { id: "water.x", kind: "characters", file: "y.png" },
      { id: "terrain.oops", kind: "a1", file: "z.png", block: { x: 0, y: 0 } },
      {
        id: "terrain.rows",
        kind: "a2",
        file: "z.png",
        block: { x: 0, y: 0 },
        layout: "stacked" as never,
      },
    );
    manifest.packs[0].layout = "rpgmaker" as never;
    const problems = validatePacks(manifest);
    expect(problems).toContain('test: unknown layout "rpgmaker"');
    expect(problems).toContain('test/terrain.rows: unknown layout "stacked"');
    expect(problems).toContain("test/terrain.grass: duplicate id");
    expect(problems).toContain("test/terrain.grass: a2 needs a block");
    expect(problems).toContain("test/water.x: characters need a cell");
    expect(problems).toContain(
      'test/terrain.oops: an a1 sheet is a "water." asset',
    );
  });
});

describe("buildVendor", () => {
  it("writes every asset and the manifest that names them", () => {
    const written: Record<string, Uint8Array | string> = {};
    const skipped: string[] = [];
    const manifest = buildVendor({
      packs: packs(),
      load: (file) => files()[file],
      emit: (file, bytes) => {
        written[file] = bytes;
      },
      log: (line) => skipped.push(line),
    });
    expect(manifest.source).toBe("vendor");
    expect(Object.keys(manifest.assets).sort()).toEqual([
      "image.gate",
      "sprite.envoy",
      "terrain.grass",
      "water.river",
    ]);
    // the ground carries one block per variant the map builder addresses
    expect(manifest.assets["terrain.grass"]).toMatchObject({
      kind: "blob",
      width: 128,
      height: 96 * GROUND_VARIANTS,
      tileset: "terrain.grass.tsj",
    });
    expect(manifest.assets["water.river"]).toMatchObject({
      kind: "water",
      frames: 2,
      height: 192,
    });
    expect(manifest.assets["sprite.envoy"].sprite?.walk.up).toEqual([
      9, 10, 11,
    ]);
    expect(manifest.assets["image.gate"]).toMatchObject({
      kind: "image",
      width: 16,
    });
    expect(skipped).toEqual([
      "sprite.people: cell 1 (ghost) is blank and was skipped",
    ]);
    const grass = decodePng(written["terrain.grass.png"] as Uint8Array);
    expect(grass.width).toBe(128);
    const tileset = JSON.parse(written["water.river.tsj"] as string);
    expect(tileset.tilecount).toBe(96);
    expect(tileset.tiles[0].animation).toEqual([
      { tileid: 0, duration: 400 },
      { tileid: 48, duration: 400 },
    ]);
    expect(tileset.wangsets[0].wangtiles).toHaveLength(47);
  });

  it("refuses a source whose sha1 drifted", () => {
    const manifest = packs();
    manifest.packs[0].sheets[0].sha1 = sha1Of(new Uint8Array([1, 2, 3]));
    expect(() =>
      buildVendor({
        packs: manifest,
        load: (file) => files()[file],
        emit: () => {},
      }),
    ).toThrow(/sha1 .* does not match/);
  });

  it("accepts a source whose sha1 matches", () => {
    const manifest = packs();
    manifest.packs[0].sheets[0].sha1 = sha1Of(files()["a2.png"]);
    expect(() =>
      buildVendor({
        packs: manifest,
        load: (file) => files()[file],
        emit: () => {},
      }),
    ).not.toThrow();
  });
});
