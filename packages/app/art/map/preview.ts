import { existsSync, readFileSync } from "node:fs";
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
  MARKER_VARIANTS,
  decorId,
  hashOf,
  markerId,
  type Decor,
  type Marker,
} from "../../src/stage/catalog";
import { KIT_COLUMNS } from "../../src/stage/kit";
import type { VendorManifest } from "../vendor/manifest";
import {
  againstOf,
  groundMask,
  isWater,
  orientationOf,
  pairIdOf,
  rasterize,
  roofPlacementsOf,
  tilesetIdOf,
  variantOf,
  wallPlacementsOf,
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
  /** draw the roofs over the rooms (off to look at the interiors) */
  roofs?: boolean;
}

/** a kit sheet with the frame and cell geometry its layer's manifest names */
interface KitSheet {
  image: Image;
  frame: { width: number; height: number };
  cell: { x: number; y: number; size: number };
}

/**
 * The kit sheets the geography's rooms and walls name, highest layer winning.
 * The geometry comes from the layer's manifest rather than the 32 px
 * constants, because a derived layer carries the same kit at another tile
 * and the scene reads the manifest the same way.
 */
const kitsOf = (geo: Geography, layers: string[]): Map<string, KitSheet> => {
  const kits = new Map<string, KitSheet>();
  const ids = new Set([
    ...(geo.rooms ?? []).map((room) => room.kit),
    ...(geo.walls ?? []).map((wall) => wall.kit),
  ]);
  for (const dir of layers) {
    const manifestFile = path.join(dir, `${path.basename(dir)}.json`);
    const manifest = existsSync(manifestFile)
      ? (JSON.parse(readFileSync(manifestFile, "utf8")) as VendorManifest)
      : null;
    for (const id of ids) {
      const file = path.join(dir, `${id}.png`);
      const entry = manifest?.assets[id];
      if (!existsSync(file) || !entry?.frame || !entry.kit) continue;
      kits.set(id, {
        image: readPng(file),
        frame: entry.frame,
        cell: entry.kit.cell,
      });
    }
  }
  return kits;
};

/**
 * The furniture: every decor and marker image the geography places, highest
 * layer winning. An image is drawn at its own size, the way the scene draws
 * the set's own layer, so a lower layer's art standing in at another tile
 * lands at the wrong scale and says so.
 */
const furnitureOf = (geo: Geography, layers: string[]): Map<string, Image> => {
  const images = new Map<string, Image>();
  const ids = new Set<string>();
  for (const decor of geo.decor ?? []) ids.add(decorId(decor.id as Decor));
  for (const place of Object.values(geo.places)) {
    if (!place.marker || place.room) continue;
    for (const id of MARKER_VARIANTS[place.marker as Marker] ?? [
      markerId(place.marker as Marker),
    ]) {
      ids.add(id);
    }
  }
  for (const dir of layers) {
    for (const id of ids) {
      const file = path.join(dir, `${id}.png`);
      if (existsSync(file)) images.set(id, readPng(file));
    }
  }
  return images;
};

const sheetsOf = (layers: string[], tile: number): Map<string, Image> => {
  const sheets = new Map<string, Image>();
  const grounds = DRAW_ORDER.concat("grass");
  const ids = grounds
    .map(tilesetIdOf)
    .concat(
      grounds.flatMap((ground) =>
        grounds.map((lower) => pairIdOf(ground, lower)),
      ),
    );
  for (const dir of layers) {
    for (const id of ids) {
      const file = path.join(dir, `${id}.png`);
      if (!existsSync(file)) continue;
      const sheet = readPng(file);
      // a sheet of another set's tile belongs to another map; the map build's
      // coverage check is what reports a ground this set leaves unanswered
      if (sheet.width !== BLOB_COLUMNS * tile) continue;
      sheets.set(id, sheet);
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
  roofs = true,
}: PreviewOptions): Image => {
  const grid = rasterize(geo);
  const sheets = sheetsOf(layers, tile);
  const pairs = new Set(
    [...sheets.keys()].filter((id) => id.includes("@")),
  ) as ReadonlySet<string>;
  const against = againstOf(grid, pairs);
  const canvas = blankImage(geo.width * tile, geo.height * tile);
  const draw = (
    ground: Ground,
    index: number,
    x: number,
    y: number,
    id = tilesetIdOf(ground),
  ): void => {
    const sheet = sheets.get(id) ?? sheets.get(tilesetIdOf(ground));
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
  for (const ground of DRAW_ORDER) {
    const mask = groundMask(grid, against, ground);
    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        if (grid[y][x] !== ground) continue;
        const lower = against[y][x];
        const index = blobIndexOf(maskOf(mask(x, y)));
        // the same stacked rearrangement the map builder picks: a fully
        // surrounded tile of a plain land sheet, and nothing else
        const block =
          index === BLOB_FULL && !isWater(ground) && !lower
            ? variantOf(x, y) * BLOB_TILE_COUNT
            : 0;
        // a water sheet stacks a blob block per frame; the first frame is enough
        draw(
          ground,
          block + index,
          x,
          y,
          lower ? pairIdOf(ground, lower) : tilesetIdOf(ground),
        );
      }
    }
  }
  // the kit pieces, north to south so a southern piece's face overdraws the
  // top of the piece behind it, walls first and the roofs over them; a kit
  // whose cell is not this set's tile is left undrawn rather than scaled
  const kits = kitsOf(geo, layers);
  const drawPiece = (
    kit: string,
    x: number,
    y: number,
    piece: number,
  ): void => {
    const sheet = kits.get(kit);
    if (!sheet || sheet.cell.size !== tile) return;
    blit({
      source: sheet.image,
      sx: (piece % KIT_COLUMNS) * sheet.frame.width,
      sy: Math.floor(piece / KIT_COLUMNS) * sheet.frame.height,
      width: sheet.frame.width,
      height: sheet.frame.height,
      target: canvas,
      tx: x * tile - sheet.cell.x,
      ty: y * tile - sheet.cell.y,
    });
  };
  const byRow = <T extends { placement: { y: number; x: number } }>(
    entries: T[],
  ): T[] =>
    [...entries].sort(
      (a, b) => a.placement.y - b.placement.y || a.placement.x - b.placement.x,
    );
  for (const { kit, placement } of byRow(wallPlacementsOf(geo))) {
    drawPiece(kit, placement.x, placement.y, placement.piece);
  }
  // the furniture between the walls and the roofs, in the scene's draw
  // order (nearer the front of the map on top) and at its anchor (the image
  // centred on the cell with its feet near the cell's bottom edge)
  const furniture = furnitureOf(geo, layers);
  const standing: { id: string; x: number; y: number }[] = [];
  for (const decor of geo.decor ?? []) {
    standing.push({ id: decorId(decor.id as Decor), x: decor.x, y: decor.y });
  }
  for (const [key, place] of Object.entries(geo.places)) {
    if (!place.marker || place.room) continue;
    const pool = (
      MARKER_VARIANTS[place.marker as Marker] ?? [
        markerId(place.marker as Marker),
      ]
    ).filter((id) => furniture.has(id));
    if (!pool.length) continue;
    standing.push({
      id: pool[hashOf(key) % pool.length],
      x: place.x,
      y: place.y,
    });
  }
  standing.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const { id, x, y } of standing) {
    const image = furniture.get(id);
    if (!image) continue;
    blit({
      source: image,
      sx: 0,
      sy: 0,
      width: image.width,
      height: image.height,
      target: canvas,
      tx: Math.round((x + 0.5) * tile - image.width * 0.5),
      ty: Math.round((y + 0.5) * tile - image.height * 0.85),
    });
  }
  if (roofs) {
    for (const { kit, placement } of byRow(roofPlacementsOf(geo))) {
      drawPiece(kit, placement.x, placement.y, placement.piece);
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
  // `--geo <path>` renders another geography (the settlement's) with the same tiles
  const geoFile = flag("geo")
    ? path.resolve(flag("geo")!)
    : path.join(here, "geography.json");
  const geo = JSON.parse(
    await (await import("node:fs/promises")).readFile(geoFile, "utf8"),
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
    // `--no-roofs` looks inside the rooms
    roofs: !args.includes("--no-roofs"),
  });
  const out =
    flag("out") ??
    path.join(
      repo,
      `var/preview/${path.basename(path.dirname(geoFile))}-${set.id}.png`,
    );
  await (
    await import("node:fs/promises")
  ).mkdir(path.dirname(out), {
    recursive: true,
  });
  writePng(out, image);
  console.log(`${image.width}x${image.height} → ${path.relative(repo, out)}`);
}
