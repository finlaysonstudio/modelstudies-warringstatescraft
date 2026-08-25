import { BadRequestError } from "@jaypie/errors";

import {
  DEFAULT_A2_LAYOUT,
  expandA1Block,
  expandA2Block,
  fillTileOf,
  type A2Layout,
} from "./autotile";
import {
  assertPacks,
  sha1Of,
  type AssetEntry,
  type PackSpec,
  type PacksManifest,
  type SheetSpec,
  type VendorManifest,
} from "./manifest";
import { cropImage, decodePng, encodePng, isBlank, type Image } from "./png";
import { sliceGrid, spriteMeta } from "./slice";
import { blobTileset } from "./tileset";

export interface BuildVendorOptions {
  packs: PacksManifest;
  /** Reads a source file by its manifest path. */
  load: (file: string) => Uint8Array;
  /** Writes an output file into the vendor directory. */
  emit: (file: string, bytes: Uint8Array | string) => void;
  tile?: number;
  log?: (line: string) => void;
}

const dimensionsOf = (bytes: Uint8Array): { width: number; height: number } => {
  const image = decodePng(bytes);
  return { width: image.width, height: image.height };
};

/**
 * Runs every transform the packs manifest declares and returns the vendor
 * manifest the stage reads. Pure over `load` and `emit`, so tests run it on
 * synthetic sheets in memory.
 */
export const buildVendor = ({
  packs,
  load,
  emit,
  tile = 16,
  log,
}: BuildVendorOptions): VendorManifest => {
  assertPacks(packs);
  const bytesCache = new Map<string, Uint8Array>();
  const imageCache = new Map<string, Image>();
  const bytesOf = (file: string, expected?: string): Uint8Array => {
    const cached = bytesCache.get(file);
    if (cached) return cached;
    const bytes = load(file);
    if (expected) {
      const actual = sha1Of(bytes);
      if (actual !== expected) {
        throw new BadRequestError(
          `${file}: sha1 ${actual} does not match the manifest's ${expected}`,
        );
      }
    }
    bytesCache.set(file, bytes);
    return bytes;
  };
  const imageOf = (file: string, expected?: string): Image => {
    const cached = imageCache.get(file);
    if (cached) return cached;
    const image = decodePng(bytesOf(file, expected));
    imageCache.set(file, image);
    return image;
  };
  const layoutOf = (pack: PackSpec, sheet: SheetSpec): A2Layout =>
    sheet.layout ?? pack.layout ?? DEFAULT_A2_LAYOUT;
  const keyOutOf = (pack: PackSpec, sheet: SheetSpec): Image | undefined =>
    sheet.keyOut
      ? fillTileOf(imageOf(sheet.keyOut.file ?? sheet.file), {
          block: sheet.keyOut.block,
          tile,
          layout: layoutOf(pack, sheet),
        })
      : undefined;

  const assets: Record<string, AssetEntry> = {};
  for (const pack of packs.packs) {
    for (const sheet of pack.sheets) {
      switch (sheet.kind) {
        case "a2": {
          const out = expandA2Block(
            imageOf(sheet.file, sheet.sha1),
            sheet.block!,
            {
              tile,
              layout: layoutOf(pack, sheet),
              keyOut: keyOutOf(pack, sheet),
              keyOutMode: sheet.keyOut?.mode,
            },
          );
          const file = `${sheet.id}.png`;
          const tileset = `${sheet.id}.tsj`;
          emit(file, encodePng(out));
          emit(
            tileset,
            JSON.stringify(
              blobTileset({ name: sheet.id, image: file, tile }),
              null,
              2,
            ),
          );
          assets[sheet.id] = {
            file,
            kind: "blob",
            width: out.width,
            height: out.height,
            tileset,
            pack: pack.id,
          };
          break;
        }
        case "a1": {
          const frames = sheet.frames ?? 3;
          const out = expandA1Block(
            imageOf(sheet.file, sheet.sha1),
            sheet.block!,
            {
              tile,
              frames,
              layout: layoutOf(pack, sheet),
              keyOut: keyOutOf(pack, sheet),
              keyOutMode: sheet.keyOut?.mode,
            },
          );
          const file = `${sheet.id}.png`;
          const tileset = `${sheet.id}.tsj`;
          emit(file, encodePng(out));
          emit(
            tileset,
            JSON.stringify(
              blobTileset({ name: sheet.id, image: file, tile, frames }),
              null,
              2,
            ),
          );
          assets[sheet.id] = {
            file,
            kind: "water",
            width: out.width,
            height: out.height,
            frames,
            tileset,
            pack: pack.id,
          };
          break;
        }
        case "characters": {
          const cells = sliceGrid(imageOf(sheet.file, sheet.sha1), sheet.cell!);
          const meta = spriteMeta({
            frameWidth: sheet.frame?.width,
            frameHeight: sheet.frame?.height,
            columns: sheet.frame?.columns,
          });
          (sheet.names ?? []).forEach((name, index) => {
            if (!name) return;
            const cell = cells[index];
            if (!cell) {
              throw new BadRequestError(
                `${sheet.id}: "${name}" names cell ${index} but the sheet has ${cells.length}`,
              );
            }
            if (isBlank(cell)) {
              log?.(
                `${sheet.id}: cell ${index} (${name}) is blank and was skipped`,
              );
              return;
            }
            const id = `sprite.${name}`;
            const file = `${id}.png`;
            emit(file, encodePng(cell));
            assets[id] = {
              file,
              kind: "sprite",
              width: cell.width,
              height: cell.height,
              sprite: meta,
              pack: pack.id,
            };
          });
          break;
        }
        case "image": {
          const file = `${sheet.id}.png`;
          if (sheet.crop) {
            const image = cropImage(
              imageOf(sheet.file, sheet.sha1),
              sheet.crop,
            );
            emit(file, encodePng(image));
            assets[sheet.id] = {
              file,
              kind: "image",
              width: image.width,
              height: image.height,
              pack: pack.id,
            };
            break;
          }
          const bytes = bytesOf(sheet.file, sheet.sha1);
          emit(file, bytes);
          assets[sheet.id] = {
            file,
            kind: "image",
            ...dimensionsOf(bytes),
            pack: pack.id,
          };
          break;
        }
      }
    }
  }
  return { version: 1, source: "vendor", assets };
};
