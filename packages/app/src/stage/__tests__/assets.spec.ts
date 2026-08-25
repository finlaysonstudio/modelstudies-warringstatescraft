import { describe, expect, it } from "vitest";

import { loadStageManifest, spriteFor } from "../assets";
import type { StageManifestFile } from "../manifest";

const sprite = (file: string): StageManifestFile["assets"][string] => ({
  file,
  kind: "sprite",
  width: 96,
  height: 96,
  sprite: {
    frameWidth: 24,
    frameHeight: 24,
    columns: 4,
    walk: {
      down: [0, 1, 2, 3],
      left: [4, 5, 6, 7],
      right: [8, 9, 10, 11],
      up: [12, 13, 14, 15],
    },
  },
  pack: "test",
});

const layers: Record<string, StageManifestFile> = {
  fallback: {
    version: 1,
    source: "fallback",
    assets: {
      "sprite.official": sprite("official.png"),
      "sprite.knight": sprite("knight.png"),
      "sprite.cavalry": sprite("cavalry.png"),
    },
  },
  vendor: {
    version: 1,
    source: "vendor",
    assets: {
      "sprite.official": sprite("official-vendor.png"),
      "sprite.horse": sprite("horse.png"),
    },
  },
  period: {
    version: 1,
    source: "period",
    assets: { "sprite.envoy": sprite("envoy.png") },
  },
};

const fetcher = (present: string[]): typeof fetch =>
  (async (url: string | URL | Request) => {
    const source = String(url).match(/\/stage\/(\w+)\/\1\.json$/)?.[1];
    const file = source && present.includes(source) ? layers[source] : null;
    return {
      ok: file !== null,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => file,
    } as Response;
  }) as typeof fetch;

describe("loadStageManifest", () => {
  it("merges the layers in order and records which are present", async () => {
    const manifest = await loadStageManifest({
      set: "period-16",
      fetcher: fetcher(["fallback", "vendor", "period"]),
    });
    expect(manifest.sources).toEqual(["fallback", "vendor", "period"]);
    expect(manifest.vendor).toBe(true);
    expect(manifest.assets["sprite.official"]).toMatchObject({
      source: "vendor",
      url: "/stage/vendor/official-vendor.png",
    });
    expect(manifest.assets["sprite.knight"].source).toBe("fallback");
    expect(manifest.assets["sprite.envoy"].source).toBe("period");
  });

  it("runs on the fallback alone", async () => {
    const manifest = await loadStageManifest({
      set: "period-16",
      fetcher: fetcher(["fallback"]),
    });
    expect(manifest.sources).toEqual(["fallback"]);
    expect(manifest.vendor).toBe(false);
  });

  it("refuses a missing fallback", async () => {
    await expect(
      loadStageManifest({ set: "period-16", fetcher: fetcher(["vendor"]) }),
    ).rejects.toThrow(/fallback manifest is missing/);
  });
});

describe("spriteFor", () => {
  it("prefers the archetype's own sprite over a stand-in", async () => {
    const manifest = await loadStageManifest({
      set: "period-16",
      fetcher: fetcher(["fallback", "vendor", "period"]),
    });
    expect(spriteFor(manifest, "envoy")?.id).toBe("sprite.envoy");
    expect(spriteFor(manifest, "general")?.id).toBe("sprite.knight");
  });

  it("falls back to the stand-in when the period sprite is absent", async () => {
    const manifest = await loadStageManifest({
      set: "period-16",
      fetcher: fetcher(["fallback", "vendor"]),
    });
    expect(spriteFor(manifest, "envoy")?.id).toBe("sprite.official");
    expect(spriteFor(manifest, "boat")).toBeUndefined();
  });
});
