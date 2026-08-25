/** Browser mirror of `art/vendor/manifest.ts` (the stage reads, never writes). */
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
  source: "vendor" | "fallback";
  assets: Record<string, StageAssetEntry>;
}

/** One resolved asset: the manifest entry plus the URL it loads from. */
export interface StageAsset extends StageAssetEntry {
  id: string;
  source: "vendor" | "fallback";
  url: string;
}

export interface StageManifest {
  assets: Record<string, StageAsset>;
  /** Whether a vendor manifest was found beside the fallback. */
  vendor: boolean;
}
