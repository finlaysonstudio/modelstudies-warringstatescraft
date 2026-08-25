/** Browser mirror of `art/vendor/manifest.ts` (the stage reads, never writes). */
/** the layers a stage asset can come from, lowest first */
export type StageSource = "fallback" | "vendor" | "period";
export const STAGE_SOURCES: StageSource[] = ["fallback", "vendor", "period"];

export type StageAssetKind = "blob" | "water" | "sprite" | "image" | "effect";

export type StageFacing = "down" | "left" | "right" | "up";

export interface StageSpriteMeta {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  walk: Record<StageFacing, number[]>;
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
  pack: string;
}

export interface StageManifestFile {
  version: 1;
  source: StageSource;
  assets: Record<string, StageAssetEntry>;
}

/** One resolved asset: the manifest entry plus the URL it loads from. */
export interface StageAsset extends StageAssetEntry {
  id: string;
  source: StageSource;
  url: string;
}

export interface StageManifest {
  assets: Record<string, StageAsset>;
  /** the layers found, lowest first (the fallback is always present) */
  sources: StageSource[];
  /** Whether a vendor manifest was found beside the fallback. */
  vendor: boolean;
}
