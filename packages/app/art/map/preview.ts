import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  blobIndexOf,
  BLOB_COLUMNS,
  BLOB_FULL,
  BLOB_TILE_COUNT,
  maskOf,
} from "../vendor/blob";
import {
  blankImage,
  blit,
  cropImage,
  readPng,
  writePng,
  type Image,
} from "../vendor/png";
import {
  isWater,
  orientationOf,
  rasterize,
  tilesetIdOf,
  variantOf,
  DRAW_ORDER,
  type Geography,
  type Ground,
} from "./map";

/**
 * Renders the geography to a flat PNG with the same tiles the stage loads, so
 * the map can be looked at without a browser. Art layers resolve in the
 * stage's order (a later directory replaces an earlier asset of the same id),
 * water takes its first frame, and `--zoom` scales by whole pixels.
 */

export interface PreviewOptions {
  geo: Geography;
  /** asset directories, lowest layer first */
  layers: string[];
  tile?: number;
  zoom?: number;
  /** [x, y, width, height] in tiles; the whole map by default */
  window?: [number, number, number, number];
}

const sheetsOf = (layers: string[], tile: number): Map<Ground, Image> => {
  const sheets = new Map<Ground, Image>();
  for (const dir of layers) {
    for (const ground of DRAW_ORDER.concat("grass")) {
      const file = path.join(dir, `${tilesetIdOf(ground)}.png`);
      if (!existsSync(file)) continue;
      const sheet = readPng(file);
      // a sheet of another set's tile belongs to another map; the map build's
      // coverage check is what reports a ground this set leaves unanswered
      if (sheet.width !== BLOB_COLUMNS * tile) continue;
      sheets.set(ground, sheet);
    }
  }
  return sheets;
};

const scale = (image: Image, zoom: number): Image => {
  if (zoom === 1) return image;
  const out = blankImage(image.width * zoom, image.height * zoom);
  for (let y = 0; y < out.height; y += 1) {
    const sy = Math.floor(y / zoom);
    for (let x = 0; x < out.width; x += 1) {
      const sx = Math.floor(x / zoom);
      const from = (sy * image.width + sx) * 4;
      const to = (y * out.width + x) * 4;
      out.data.set(image.data.subarray(from, from + 4), to);
    }
  }
  return out;
};

export const previewMap = ({
  geo,
  layers,
  tile = 16,
  zoom = 1,
  window,
}: PreviewOptions): Image => {
  const grid = rasterize(geo);
  const sheets = sheetsOf(layers, tile);
  const canvas = blankImage(geo.width * tile, geo.height * tile);
  const draw = (ground: Ground, index: number, x: number, y: number): void => {
    const sheet = sheets.get(ground);
    if (!sheet) return;
    // the same orientation the map builder stamps on a fully surrounded tile
    const flip =
      index % BLOB_TILE_COUNT === BLOB_FULL && !isWater(ground)
        ? orientationOf(x, y)
        : 0;
    blit({
      source: sheet,
      sx: (index % BLOB_COLUMNS) * tile,
      sy: Math.floor(index / BLOB_COLUMNS) * tile,
      width: tile,
      height: tile,
      target: canvas,
      tx: x * tile,
      ty: y * tile,
      flipX: (flip & 1) !== 0,
      flipY: (flip & 2) !== 0,
    });
  };
  for (let y = 0; y < geo.height; y += 1) {
    for (let x = 0; x < geo.width; x += 1) {
      // the same stacked variant the map builder picks for the cell
      draw("grass", variantOf(x, y) * BLOB_TILE_COUNT + BLOB_FULL, x, y);
    }
  }
  const same =
    (ground: Ground) => (x: number, y: number) => (dx: number, dy: number) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= geo.width || ny >= geo.height) return true;
      return grid[ny][nx] === ground;
    };
  for (const ground of DRAW_ORDER) {
    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        if (grid[y][x] !== ground) continue;
        // a water sheet stacks a blob block per frame; the first frame is enough
        draw(ground, blobIndexOf(maskOf(same(ground)(x, y))), x, y);
      }
    }
  }
  const cropped = window
    ? cropImage(canvas, {
        x: window[0] * tile,
        y: window[1] * tile,
        width: window[2] * tile,
        height: window[3] * tile,
      })
    : canvas;
  return scale(cropped, zoom);
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../../../..");
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const at = args.indexOf(`--${name}`);
    return at === -1 ? undefined : args[at + 1];
  };
  const geo = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile(path.join(here, "geography.json"), "utf8"),
  ) as Geography;
  const stage = path.join(repo, "packages/app/public/stage");
  const { stageSetOf } = await import("../../src/stage/sets");
  const set = stageSetOf(flag("set"));
  const layers = set.sources
    .map((name) => path.join(stage, name))
    .filter((dir) => existsSync(dir));
  const windowArg = flag("window");
  const image = previewMap({
    geo,
    layers,
    tile: set.tile,
    zoom: Number(flag("zoom") ?? 1),
    window: windowArg
      ? (windowArg.split(",").map(Number) as [number, number, number, number])
      : undefined,
  });
  const out =
    flag("out") ?? path.join(repo, `var/preview/overworld-${set.id}.png`);
  await (
    await import("node:fs/promises")
  ).mkdir(path.dirname(out), {
    recursive: true,
  });
  writePng(out, image);
  console.log(`${image.width}x${image.height} → ${path.relative(repo, out)}`);
}
