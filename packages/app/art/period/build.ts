import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BadRequestError } from "@jaypie/errors";

import type { StageSource } from "../../src/stage/manifest";
import type {
  AssetEntry,
  AssetRecord,
  VendorManifest,
} from "../vendor/manifest";
import {
  blankImage,
  copyRect,
  readPng,
  writePng,
  type Image,
} from "../vendor/png";
import { FACINGS, type SpriteMeta } from "../vendor/slice";
import {
  applyFinish,
  cornerPalette,
  keepPalette,
  keyPalette,
  lowerPalette,
  splitFinish,
  wangBlobSheet,
  variantSheet,
  wangFillSheet,
  waterFrames,
  type ColourAdjustment,
  type SheetFinish,
  type WangMetadata,
} from "./tileset";

/**
 * The period layer: art generated on PixelLab for this project (the terms
 * grant ownership and distribution, so the output is committed), assembled
 * from the raw downloads under `var/assets/pixellab/` into
 * `public/stage/period/` with a manifest the stage loads over the vendor
 * layer. `items.json` is both the build spec and the record of every prompt.
 */

export interface PeriodRecord {
  tool: string;
  prompt: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  characterId?: string;
  date?: string;
  generations?: number;
  note?: string;
}

export interface PeriodImageItem extends PeriodRecord {
  id: string;
  kind: "image";
  /** the raw download, relative to the source root */
  file: string;
}

export interface PeriodSpriteItem extends PeriodRecord {
  id: string;
  kind: "sprite";
  /** directory holding `walk/<facing>-<n>.png` frames (south, west, east, north) */
  dir: string;
  frame: number;
  frames: number;
}

export interface PeriodTilesetItem extends PeriodRecord {
  id: string;
  kind: "tileset";
  /** the raw 4x4 Wang sheet, relative to the source root */
  file: string;
  /** the tileset metadata JSON beside it (corner map and bounding boxes) */
  metadata: string;
  /** `lower` builds a plain fill sheet of the lower terrain (the ground) */
  fill?: "lower" | "upper";
  /** grey blue-dominant pixels toward luminance by this amount (0..1) */
  desaturate?: number;
  /**
   * The ground this sheet's lower terrain is: the sheet was generated against
   * that terrain's own base tile, so its surround is the art the map already
   * lays there and the two meet with a drawn boundary rather than a cut. The
   * build then finishes the sheet in two halves, because the lower terrain
   * wears its own colour correction everywhere else on the map and must wear
   * it here (`splitFinish`). An id of the form `terrain.mountain@forest` is
   * the mountain as it meets the forest; the plain id is the sheet the ground
   * falls back to, which is drawn against grass.
   */
  against?: string;
  /**
   * Key the lower terrain out to transparency so the map's layer beneath
   * shows through the surround instead of a collar of this tileset's own
   * lower rendering. Wanted whenever the generator drew a lower terrain of
   * its own invention rather than the one the map lays, and off when the
   * sheet is chained (`against`), where the surround is the real thing.
   *
   * `upper` keeps only the upper terrain's own colours instead. It is the
   * wrong instrument for any biome whose own tile legitimately carries the
   * lower terrain's colours — a range with dry grass on its shoulders, a
   * canopy with sun on it — because the collar then falls inside the palette
   * it keeps and survives as a halo.
   */
  key?: "lower" | "upper";
  /**
   * Per-channel distance from the lower palette that still counts as the
   * lower terrain (default 0). One predicate serves both readers: what `key`
   * removes, and which half of a chained sheet `against` finishes as ground.
   */
  keyTolerance?: number;
  /**
   * Stack this many animation frames, cycling the upper terrain's brightest
   * tones between them. Water only: the scene advances a water tile by a
   * whole blob block per frame.
   */
  frames?: number;
  /**
   * Stack this many rearrangements of a `fill` sheet, so the ground layer can
   * pick one per cell. Must match `GROUND_VARIANTS` in the map builder.
   */
  variants?: number;
  /** value swing between variant blocks (0 leaves every block the same tone) */
  variantTone?: number;
  /** turn the hue and scale saturation and value (the defaults leave them) */
  adjust?: ColourAdjustment;
}

export type PeriodItem = PeriodImageItem | PeriodSpriteItem | PeriodTilesetItem;

/**
 * One art set's spec: the layer it writes, the tile its ground sheets are
 * drawn at, where the raw downloads sit, and where the built layer lands. The
 * period step builds whichever spec it is given, so a second set at a second
 * resolution is a second file rather than a second script.
 */
export interface PeriodSpec {
  version: 1;
  /** the layer this spec writes (`period`, `period32`) */
  source: StageSource;
  /** the tile its ground sheets are drawn at */
  tile: number;
  /** the raw PixelLab downloads, relative to the repository */
  root: string;
  /** the built layer, relative to the repository */
  out: string;
  items: PeriodItem[];
}

/** PixelLab facings → the stage's facings (rows down, left, right, up) */
const FACING_SOURCE: Record<(typeof FACINGS)[number], string> = {
  down: "south",
  left: "west",
  right: "east",
  up: "north",
};

export const assembleSprite = (
  frames: Record<string, Image[]>,
  { frame, count }: { frame: number; count: number },
): { image: Image; meta: SpriteMeta } => {
  const image = blankImage(frame * count, frame * FACINGS.length);
  const walk = {} as SpriteMeta["walk"];
  FACINGS.forEach((facing, row) => {
    const list = frames[FACING_SOURCE[facing]];
    if (!list || list.length < count) {
      throw new BadRequestError(
        `sprite is missing ${FACING_SOURCE[facing]} frames (${list?.length ?? 0} of ${count})`,
      );
    }
    list.slice(0, count).forEach((source, column) => {
      if (source.width !== frame || source.height !== frame) {
        throw new BadRequestError(
          `frame ${FACING_SOURCE[facing]}-${column} is ${source.width}x${source.height}, not ${frame}x${frame}`,
        );
      }
      copyRect({
        source,
        sx: 0,
        sy: 0,
        width: frame,
        height: frame,
        target: image,
        tx: column * frame,
        ty: row * frame,
      });
    });
    walk[facing] = Array.from({ length: count }, (_, i) => row * count + i);
  });
  return {
    image,
    meta: { frameWidth: frame, frameHeight: frame, columns: count, walk },
  };
};

/**
 * What the build did to the download. `items.json` carries these beside the
 * prompt, and they are as much of the art as the generation is: the same
 * sheet keyed two ways is two different biomes on the map.
 */
const finishOf = (item: PeriodItem): Record<string, unknown> | undefined => {
  if (item.kind !== "tileset") return undefined;
  const finish: Record<string, unknown> = {};
  if (item.against) finish.against = item.against;
  if (item.fill) finish.fill = item.fill;
  if (item.desaturate) finish.desaturate = item.desaturate;
  if (item.key) finish.key = item.key;
  if (item.keyTolerance) finish.keyTolerance = item.keyTolerance;
  if (item.frames) finish.frames = item.frames;
  if (item.variants) finish.variants = item.variants;
  if (item.variantTone) finish.variantTone = item.variantTone;
  if (item.adjust) finish.adjust = item.adjust;
  return Object.keys(finish).length ? finish : undefined;
};

/** The making of one id, carried into the manifest for the showcase page. */
export const recordOf = (item: PeriodItem): AssetRecord => {
  const finish = finishOf(item);
  return {
    tool: item.tool,
    prompt: item.prompt,
    ...(item.settings ? { settings: item.settings } : {}),
    ...(item.jobId ? { jobId: item.jobId } : {}),
    ...(item.characterId ? { characterId: item.characterId } : {}),
    ...(item.date ? { date: item.date } : {}),
    ...(item.generations === undefined
      ? {}
      : { generations: item.generations }),
    ...(item.note ? { note: item.note } : {}),
    ...(finish ? { finish } : {}),
  };
};

/**
 * The finish the ground named by `against` wears everywhere else on the map.
 * A chained sheet paints that ground in its own surround, so it has to be
 * corrected the same way or the map shows a patch of differently-lit grass
 * around every range.
 */
export const finishAgainst = (
  spec: PeriodSpec,
  against: string,
): SheetFinish => {
  const item = spec.items.find(
    (candidate) =>
      candidate.kind === "tileset" &&
      (candidate.id === `terrain.${against}` ||
        candidate.id === `water.${against}`),
  ) as PeriodTilesetItem | undefined;
  if (!item) {
    throw new BadRequestError(
      `no tileset item draws "${against}", which another sheet is drawn against`,
    );
  }
  return { desaturate: item.desaturate, adjust: item.adjust };
};

export interface BuildPeriodOptions {
  spec: PeriodSpec;
  root: string;
  outDir: string;
  log?: (line: string) => void;
}

export const buildPeriod = async ({
  spec,
  root,
  outDir,
  log = () => {},
}: BuildPeriodOptions): Promise<VendorManifest> => {
  await mkdir(outDir, { recursive: true });
  const assets: Record<string, AssetEntry> = {};
  for (const item of spec.items) {
    const file = `${item.id}.png`;
    if (item.kind === "tileset") {
      const tile = spec.tile;
      const raw = await readPng(path.join(root, item.file));
      const meta = JSON.parse(
        await readFile(path.join(root, item.metadata), "utf8"),
      ) as WangMetadata;
      const own: SheetFinish = {
        desaturate: item.desaturate,
        adjust: item.adjust,
      };
      const beneath = item.against
        ? finishAgainst(spec, item.against)
        : undefined;
      const sheet = beneath
        ? splitFinish(raw, {
            lowerPalette: lowerPalette(raw, meta, tile),
            upperPalette: cornerPalette(raw, meta, "upper", tile),
            lower: beneath,
            upper: own,
          })
        : applyFinish(raw, own);
      let image = item.fill
        ? wangFillSheet({ sheet, meta, tile, fill: item.fill })
        : wangBlobSheet({ sheet, meta, tile });
      if (item.key === "lower") {
        image = keyPalette(
          image,
          lowerPalette(sheet, meta, tile),
          item.keyTolerance ?? 0,
        );
      }
      if (item.key === "upper") {
        image = keepPalette(
          image,
          cornerPalette(sheet, meta, "upper", tile),
          item.keyTolerance ?? 0,
        );
      }
      if (item.frames) {
        image = waterFrames(image, {
          frames: item.frames,
          palette: cornerPalette(sheet, meta, "upper", tile),
        });
      }
      if (item.variants) {
        image = variantSheet(image, item.variants, {
          tone: item.variantTone,
          tile,
        });
      }
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "blob",
        width: image.width,
        height: image.height,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(`${item.id}  ${image.width}x${image.height}  ← ${item.file}`);
      continue;
    }
    if (item.kind === "image") {
      const image = await readPng(path.join(root, item.file));
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "image",
        width: image.width,
        height: image.height,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(`${item.id}  ${image.width}x${image.height}  ← ${item.file}`);
      continue;
    }
    const frames: Record<string, Image[]> = {};
    for (const source of Object.values(FACING_SOURCE)) {
      frames[source] = [];
      for (let i = 0; i < item.frames; i += 1) {
        frames[source].push(
          await readPng(
            path.join(root, item.dir, "walk", `${source}-${i}.png`),
          ),
        );
      }
    }
    const { image, meta } = assembleSprite(frames, {
      frame: item.frame,
      count: item.frames,
    });
    await writePng(path.join(outDir, file), image);
    assets[item.id] = {
      file,
      kind: "sprite",
      width: image.width,
      height: image.height,
      sprite: meta,
      pack: "pixellab",
      record: recordOf(item),
    };
    log(
      `${item.id}  ${image.width}x${image.height}  ${item.frames} frames  ← ${item.dir}`,
    );
  }
  const manifest: VendorManifest = {
    version: 1,
    source: spec.source,
    tile: spec.tile,
    assets,
  };
  await writeFile(
    path.join(outDir, `${spec.source}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../../../..");
  const file = process.argv[2] ?? "items.json";
  const spec = JSON.parse(
    await readFile(path.resolve(here, file), "utf8"),
  ) as PeriodSpec;
  const root = process.env.STAGE_PIXELLAB_DIR ?? path.join(repo, spec.root);
  const outDir = path.join(repo, spec.out);
  const manifest = await buildPeriod({
    spec,
    root,
    outDir,
    log: (line) => console.log(line),
  });
  console.log(
    `${Object.keys(manifest.assets).length} ${spec.source} assets at ${spec.tile} px → ${path.relative(repo, outDir)}/${spec.source}.json`,
  );
}
