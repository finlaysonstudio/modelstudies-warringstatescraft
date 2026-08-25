import { createHash } from "node:crypto";

import { BadRequestError } from "@jaypie/errors";

import { A2_LAYOUTS, type A2Layout } from "./autotile";
import type { SpriteMeta } from "./slice";

export type SheetKind = "a2" | "a1" | "characters" | "image";

export interface BlockRef {
  x: number;
  y: number;
}

export interface KeyOutRef {
  /** Sheet holding the base fill (default: the same sheet). */
  file?: string;
  block: BlockRef;
  /** `phase` (default) or `palette`; see `ExpandOptions.keyOutMode`. */
  mode?: "phase" | "palette";
}

export interface SheetSpec {
  /** Stage asset id: `terrain.<name>`, `water.<name>`, `sprite.<name>`, `image.<name>`. */
  id: string;
  kind: SheetKind;
  /** Path relative to the pack root. */
  file: string;
  /** Recorded sha1 of the source file; a mismatch refuses the build. */
  sha1?: string;
  /** a2 / a1: the block to expand. */
  block?: BlockRef;
  /** a2 / a1: the block's top-row layout (default: the pack's, then `corners-fill`). */
  layout?: A2Layout;
  /** a2 / a1: key the surrounding base out of the expanded tiles. */
  keyOut?: KeyOutRef;
  /** a1: frames side by side (default 3). */
  frames?: number;
  /** characters: the cell one character occupies. */
  cell?: { width: number; height: number };
  /** characters: a name per cell, row major; a blank cell or name is skipped. */
  names?: (string | null)[];
  /** characters: frame size inside a cell (default 16×32, 3 columns). */
  frame?: { width: number; height: number; columns?: number };
  /** image: copy only this rectangle of the sheet. */
  crop?: { x: number; y: number; width: number; height: number };
}

export interface PackSpec {
  id: string;
  title: string;
  vendor: string;
  url?: string;
  license: string;
  /** The top-row layout of every a2 / a1 sheet in the pack unless the sheet says otherwise. */
  layout?: A2Layout;
  sheets: SheetSpec[];
}

export interface PacksManifest {
  version: 1;
  /** Default pack root relative to the repository; `STAGE_VENDOR_DIR` overrides. */
  root: string;
  packs: PackSpec[];
}

export type AssetKind = "blob" | "water" | "sprite" | "image" | "effect";

/**
 * How one asset was made. The period layer writes it from `items.json` (the
 * build spec is also the prompt record), so the showcase page can say what
 * was asked for and what was done to the reply without reading the spec.
 * The vendor step never writes one: a purchased sheet has no prompt, and
 * nothing from those packs travels with the app.
 */
export interface AssetRecord {
  tool: string;
  prompt: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  characterId?: string;
  date?: string;
  /** how many generations the id cost, failed attempts included */
  generations?: number;
  note?: string;
  /** what the build did to the download (keying, colour, stacking) */
  finish?: Record<string, unknown>;
}

export interface AssetEntry {
  file: string;
  kind: AssetKind;
  width: number;
  height: number;
  /** water: stacked frames; effect: frames side by side. */
  frames?: number;
  /** effect: one frame's size. */
  frame?: { width: number; height: number };
  /** sprite: frame geometry and walk rows. */
  sprite?: SpriteMeta;
  /** blob / water: the Tiled tileset written beside the sheet. */
  tileset?: string;
  pack: string;
  /** period only: the prompt and the finishing the id was made with. */
  record?: AssetRecord;
}

export type ManifestSource = "fallback" | "vendor" | "period" | "period32";

export interface VendorManifest {
  version: 1;
  source: ManifestSource;
  /** the tile this layer's ground sheets are drawn at (16 when absent) */
  tile?: number;
  assets: Record<string, AssetEntry>;
}

export const ASSET_PREFIXES: Record<AssetKind, string> = {
  blob: "terrain.",
  water: "water.",
  sprite: "sprite.",
  image: "image.",
  effect: "effect.",
};

export const sha1Of = (bytes: Uint8Array): string =>
  createHash("sha1").update(bytes).digest("hex");

const KINDS: SheetKind[] = ["a2", "a1", "characters", "image"];

/** Shape checks on a packs manifest; returns the problems found. */
export const validatePacks = (manifest: PacksManifest): string[] => {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const pack of manifest.packs) {
    if (pack.layout && !A2_LAYOUTS.includes(pack.layout)) {
      problems.push(`${pack.id}: unknown layout "${pack.layout}"`);
    }
    for (const sheet of pack.sheets) {
      const label = `${pack.id}/${sheet.id}`;
      if (ids.has(sheet.id)) problems.push(`${label}: duplicate id`);
      if (sheet.layout && !A2_LAYOUTS.includes(sheet.layout)) {
        problems.push(`${label}: unknown layout "${sheet.layout}"`);
      }
      ids.add(sheet.id);
      if (!KINDS.includes(sheet.kind)) {
        problems.push(`${label}: unknown kind "${sheet.kind}"`);
        continue;
      }
      if (sheet.kind === "a2" && !sheet.id.startsWith(ASSET_PREFIXES.blob)) {
        problems.push(`${label}: an a2 sheet is a "terrain." asset`);
      }
      if (sheet.kind === "a1" && !sheet.id.startsWith(ASSET_PREFIXES.water)) {
        problems.push(`${label}: an a1 sheet is a "water." asset`);
      }
      if ((sheet.kind === "a2" || sheet.kind === "a1") && !sheet.block) {
        problems.push(`${label}: ${sheet.kind} needs a block`);
      }
      if (sheet.kind === "characters") {
        if (!sheet.cell) problems.push(`${label}: characters need a cell`);
        if (!sheet.names?.length)
          problems.push(`${label}: characters need names`);
        for (const name of sheet.names ?? []) {
          if (name && ids.has(`sprite.${name}`)) {
            problems.push(`${label}: duplicate sprite "${name}"`);
          }
          if (name) ids.add(`sprite.${name}`);
        }
      }
      if (
        sheet.kind === "image" &&
        !sheet.id.startsWith(ASSET_PREFIXES.image)
      ) {
        problems.push(`${label}: an image sheet is an "image." asset`);
      }
    }
  }
  return problems;
};

export const assertPacks = (manifest: PacksManifest): void => {
  const problems = validatePacks(manifest);
  if (problems.length) {
    throw new BadRequestError(`packs manifest: ${problems.join("; ")}`);
  }
};
