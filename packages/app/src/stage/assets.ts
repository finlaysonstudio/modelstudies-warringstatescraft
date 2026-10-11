import { NotFoundError } from "@jaypie/errors";

import type { StageArchetype } from "../lib/types";
import { ARCHETYPE_SPRITES } from "./catalog";
import {
  STAGE_SOURCES,
  type StageAsset,
  type StageManifest,
  type StageManifestFile,
  type StageSource,
} from "./manifest";
import {
  BASE_TILE,
  DEFAULT_STAGE_SET,
  stageSet,
  type StageSet,
  type StageSetId,
} from "./sets";

export const STAGE_BASE = "/stage";

const resolveFile = (
  file: StageManifestFile,
  source: StageSource,
): Record<string, StageAsset> =>
  Object.fromEntries(
    Object.entries(file.assets).map(([id, entry]) => [
      id,
      {
        ...entry,
        id,
        source,
        tile: file.tile ?? BASE_TILE,
        url: `${STAGE_BASE}/${source}/${entry.file}`,
      },
    ]),
  );

const fetchManifest = async (
  source: StageSource,
  fetcher: typeof fetch,
): Promise<StageManifestFile | null> => {
  const response = await fetcher(`${STAGE_BASE}/${source}/${source}.json`);
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return null;
  return (await response.json()) as StageManifestFile;
};

/**
 * Loads a set's layers in order: the fallback (always present), then the
 * vendor step's output when it has run, then the period layers generated for
 * the project. A higher layer's asset replaces the lower asset of the same
 * id, and every id the fallback covers stays resolvable.
 */
export const loadStageManifest = async (
  options: { set?: StageSetId | StageSet; fetcher?: typeof fetch } = {},
): Promise<StageManifest> => {
  const set =
    typeof options.set === "object"
      ? options.set
      : stageSet(options.set ?? DEFAULT_STAGE_SET);
  const fetcher = options.fetcher ?? fetch;
  const assets: Record<string, StageAsset> = {};
  const sources: StageSource[] = [];
  for (const source of set.sources) {
    const file = await fetchManifest(source, fetcher);
    if (!file) {
      if (source === "fallback") {
        throw new NotFoundError(
          "stage: the fallback manifest is missing (run `npm run stage:fallback`)",
        );
      }
      continue;
    }
    sources.push(source);
    Object.assign(assets, resolveFile(file, source));
  }
  return {
    assets,
    sources,
    vendor: sources.includes("vendor"),
    set: set.id,
    tile: set.tile,
  };
};

/**
 * The sprite for an archetype: of the candidates the catalog lists, the one
 * from the highest art layer (a period sprite over a vendor stand-in over the
 * fallback), and among equals the first listed (the archetype's own id).
 */
export const spriteFor = (
  manifest: StageManifest,
  archetype: StageArchetype,
): StageAsset | undefined => {
  let best: StageAsset | undefined;
  let bestRank = -1;
  for (const id of ARCHETYPE_SPRITES[archetype]) {
    const asset = manifest.assets[id];
    if (asset?.kind !== "sprite") continue;
    const rank = STAGE_SOURCES.indexOf(asset.source);
    if (rank > bestRank) {
      best = asset;
      bestRank = rank;
    }
  }
  return best;
};

/** One still frame of a sprite sheet: where it sits and the sheet it is cut from. */
export interface StageAvatar {
  url: string;
  /** the frame's corner on the sheet, in the sheet's own pixels */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The portrait of a figure: the first frame of its walk toward the viewer,
 * off the same sheet the scene walks. The sprite is chosen the way the scene
 * chooses it — a register's variant where the set draws one, else the
 * archetype's own — so the face on a page is the one on the map.
 */
export const avatarOf = (
  manifest: StageManifest,
  archetype: StageArchetype,
  variant?: string,
): StageAvatar | undefined => {
  const own = variant ? manifest.assets[`sprite.${variant}`] : undefined;
  const asset = own?.sprite ? own : spriteFor(manifest, archetype);
  const meta = asset?.sprite;
  const frame = meta?.walk.down[0];
  if (!asset || !meta || frame === undefined) return undefined;
  return {
    url: asset.url,
    x: (frame % meta.columns) * meta.frameWidth,
    y: Math.floor(frame / meta.columns) * meta.frameHeight,
    width: meta.frameWidth,
    height: meta.frameHeight,
  };
};
