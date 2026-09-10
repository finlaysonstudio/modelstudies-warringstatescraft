/** Browser mirror of `art/vendor/manifest.ts` (the stage reads, never writes). */
import type { StageSetId } from "./sets";

/** the layers a stage asset can come from, lowest first */
export type StageSource = "fallback" | "vendor" | "period" | "period32";
export const STAGE_SOURCES: StageSource[] = [
  "fallback",
  "vendor",
  "period",
  "period32",
];

export type StageAssetKind =
  "blob" | "water" | "sprite" | "image" | "effect" | "kit" | "overlay";

/** kit: where the map cell sits on every frame of the sheet */
export interface StageKitMeta {
  cell: { x: number; y: number; size: number };
}

export type StageFacing = "down" | "left" | "right" | "up";

/** Where an overlay attaches on a figure. */
export type StageOverlaySlot = "head" | "shoulders" | "hand" | "back";

/** One frame's anchors, `[x, y]` per slot in the frame's own pixels. */
export type StageSpriteAnchors = Record<StageOverlaySlot, [number, number]>;

export interface StageSpriteMeta {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  walk: Record<StageFacing, number[]>;
  /**
   * The poses a period sprite carries beyond the walk, each the frame
   * indexes per facing (`actions.hoe.left`), stacked after the walk rows.
   * The scene registers `${id}:${pose}:${facing}` beside the walk's.
   */
  actions?: Record<string, Record<StageFacing, number[]>>;
  /**
   * The overlay anchors of every frame, indexed by frame: `head` the
   * topmost opaque row's centre, `shoulders` a quarter down the figure,
   * `hand` the outermost opaque column at mid-height on the facing's
   * leading side, `back` the trailing side. An overlay drawn at the current
   * frame's anchor follows the walk's bob and a pose's reach.
   */
  anchors?: StageSpriteAnchors[];
}

/**
 * An overlay (`overlay.<name>`): a small still per facing keyed to a slot,
 * one frame per facing side by side on the sheet. The scene draws the
 * facing's frame with its `pivot` on the wearer's anchor for `slot`.
 */
export interface StageOverlayMeta {
  slot: StageOverlaySlot;
  facings: Record<StageFacing, number>;
  pivots: Record<StageFacing, [number, number]>;
}

/**
 * How one asset was made: the prompt, the generator's settings, and what the
 * build did to the reply. Only the period layer carries it (a purchased sheet
 * has no prompt), and `/craft/tiles` is what reads it.
 */
export interface StageAssetRecord {
  tool: string;
  prompt: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  characterId?: string;
  date?: string;
  generations?: number;
  note?: string;
  finish?: Record<string, unknown>;
  /** the layer this asset was downsampled from; its generations were spent there */
  derived?: StageSource;
  /** the season this is the plain id's sibling in (`terrain.field~autumn`) */
  season?: string;
}

export interface StageAssetEntry {
  file: string;
  kind: StageAssetKind;
  width: number;
  height: number;
  frames?: number;
  frame?: { width: number; height: number };
  sprite?: StageSpriteMeta;
  tileset?: string;
  kit?: StageKitMeta;
  /** overlay: the slot, the frame per facing, and each frame's pivot */
  overlay?: StageOverlayMeta;
  pack: string;
  record?: StageAssetRecord;
}

export interface StageManifestFile {
  version: 1;
  source: StageSource;
  /** the tile this layer's art is drawn at (16 unless the layer says otherwise) */
  tile?: number;
  assets: Record<string, StageAssetEntry>;
}

/** One resolved asset: the manifest entry plus the URL it loads from. */
export interface StageAsset extends StageAssetEntry {
  id: string;
  source: StageSource;
  url: string;
  /** the tile the layer it came from is drawn at */
  tile: number;
}

export interface StageManifest {
  assets: Record<string, StageAsset>;
  /** the layers found, lowest first (the fallback is always present) */
  sources: StageSource[];
  /** Whether a vendor manifest was found beside the fallback. */
  vendor: boolean;
  /** the set the layers were loaded for */
  set: StageSetId;
  /** the tile the set's map and ground sheets are built at */
  tile: number;
}
