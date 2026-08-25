import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BadRequestError } from "@jaypie/errors";

import type { AssetEntry, VendorManifest } from "../vendor/manifest";
import {
  blankImage,
  copyRect,
  readPng,
  writePng,
  type Image,
} from "../vendor/png";
import { FACINGS, type SpriteMeta } from "../vendor/slice";
import {
  adjustColour,
  cornerPalette,
  greyBlue,
  keepPalette,
  keyPalette,
  lowerPalette,
  wangBlobSheet,
  variantSheet,
  wangFillSheet,
  waterFrames,
  type ColourAdjustment,
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
   * Key the lower terrain out to transparency so the map's layer beneath
   * shows through the surround instead of a collar of this tileset's own
   * lower rendering. Off for a `fill` sheet (it is the lower terrain) and
   * for a biome whose interior shares the lower palette. `upper` keeps only
   * the upper terrain's own colours, which also drops the collar the
   * generator paints across the transition.
   */
  key?: "lower" | "upper";
  /** per-channel distance from the lower palette that still keys (default 0) */
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

export interface PeriodSpec {
  version: 1;
  root: string;
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
      let sheet = await readPng(path.join(root, item.file));
      if (item.desaturate) sheet = greyBlue(sheet, item.desaturate);
      if (item.adjust) sheet = adjustColour(sheet, item.adjust);
      const meta = JSON.parse(
        await readFile(path.join(root, item.metadata), "utf8"),
      ) as WangMetadata;
      let image = item.fill
        ? wangFillSheet({ sheet, meta, fill: item.fill })
        : wangBlobSheet({ sheet, meta });
      if (item.key === "lower") {
        image = keyPalette(
          image,
          lowerPalette(sheet, meta),
          item.keyTolerance ?? 0,
        );
      }
      if (item.key === "upper") {
        image = keepPalette(
          image,
          cornerPalette(sheet, meta, "upper"),
          item.keyTolerance ?? 0,
        );
      }
      if (item.frames) {
        image = waterFrames(image, {
          frames: item.frames,
          palette: cornerPalette(sheet, meta, "upper"),
        });
      }
      if (item.variants)
        image = variantSheet(image, item.variants, { tone: item.variantTone });
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "blob",
        width: image.width,
        height: image.height,
        pack: "pixellab",
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
    };
    log(
      `${item.id}  ${image.width}x${image.height}  ${item.frames} frames  ← ${item.dir}`,
    );
  }
  const manifest: VendorManifest = { version: 1, source: "period", assets };
  await writeFile(
    path.join(outDir, "period.json"),
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
  const spec = JSON.parse(
    await readFile(path.join(here, "items.json"), "utf8"),
  ) as PeriodSpec;
  const root = process.env.STAGE_PIXELLAB_DIR ?? path.join(repo, spec.root);
  const outDir = path.join(repo, "packages/app/public/stage/period");
  const manifest = await buildPeriod({
    spec,
    root,
    outDir,
    log: (line) => console.log(line),
  });
  console.log(
    `${Object.keys(manifest.assets).length} period assets → ${path.relative(repo, outDir)}/period.json`,
  );
}
